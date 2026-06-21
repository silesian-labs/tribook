/**
 * Shared NAV poller singleton.
 *
 * Imported by:
 *  - instrumentation.ts  → starts at Next.js server boot
 *  - app/api/nav-history/route.ts → reads snapshots + ensures poller is running
 *
 * Module-level state persists for the lifetime of the Node.js process.
 */

import { SuiClient } from "@mysten/sui/client";

const RPC_URL = "https://fullnode.testnet.sui.io:443";
const VAULT_ID = "0x6351c896d9881fa9a04dedb00d37af0983a836d1d04063088825620bb121b3e1";
const POLL_INTERVAL_MS = 15_000;
const MAX_SNAPSHOTS = 240; // 60 minutes at 15s cadence

export interface Snapshot {
  t: number;
  nav: number;
  tvl: number;
  label: string;
}

// Shared ring buffer — the route handler reads this directly
export const snapshots: Snapshot[] = [];
let pollerStarted = false;

function fmtLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

async function poll() {
  try {
    const client = new SuiClient({ url: RPC_URL });
    const obj = await client.getObject({
      id: VAULT_ID,
      options: { showContent: true },
    });

    if (!obj.data?.content || obj.data.content.dataType !== "moveObject") return;

    const fields = (obj.data.content as any).fields;
    const totalShares    = Number(fields.total_shares    || 0) / 1_000_000;
    const spotAllocated  = Number(fields.spot_allocated  || 0) / 1_000_000;
    const marginAlloc    = Number(fields.margin_allocated|| 0) / 1_000_000;
    const marginDebt     = Number(fields.margin_debt     || 0) / 1_000_000;
    const predictAlloc   = Number(fields.predict_allocated || 0) / 1_000_000;
    const rawIdle        = fields.usdc_balance?.fields?.value ?? fields.usdc_balance ?? 0;
    const idleUsdc       = Number(rawIdle) / 1_000_000;

    const tvl = Math.max(0, spotAllocated + marginAlloc + predictAlloc + idleUsdc - marginDebt);
    const nav = totalShares > 0 ? tvl / totalShares : 1.0;
    const t   = Date.now();

    snapshots.push({ t, nav, tvl, label: fmtLabel(t) });
    if (snapshots.length > MAX_SNAPSHOTS) snapshots.splice(0, snapshots.length - MAX_SNAPSHOTS);

    console.log(
      `[nav-indexer] NAV=${nav.toFixed(4)}  TVL=${tvl.toFixed(2)}  snapshots=${snapshots.length}`,
    );
  } catch (err) {
    console.warn("[nav-indexer] poll error:", (err as Error).message);
  }
}

/** Idempotent — safe to call multiple times, only starts once. */
export function startNavPoller() {
  if (pollerStarted) return;
  pollerStarted = true;
  poll(); // immediate first sample
  setInterval(poll, POLL_INTERVAL_MS);
  console.log("[nav-indexer] started — polling every", POLL_INTERVAL_MS / 1000, "s");
}
