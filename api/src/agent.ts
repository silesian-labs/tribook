import { ChainObserver } from "./chain/observer.js";
import { config } from "./config.js";
import { decideAllocation } from "./decision/allocator.js";
import { narrate } from "./decision/narrator.js";
import { applyRiskGates } from "./decision/risk.js";
import { oraclePrice } from "./prices/oracle.js";
import { execute } from "./execution/executor.js";

// DB is optional — imported lazily so the agent starts without PostgreSQL.
let db: typeof import("./db/repository.js") | null = null;
async function tryLoadDb() {
  if (!process.env.DATABASE_URL) return null;
  if (db) return db;
  try {
    db = await import("./db/repository.js");
    return db;
  } catch {
    return null;
  }
}

const observer = new ChainObserver();

// Rolling reference price: the last price at which the agent acted (or the
// first price ever seen). Persisted in-memory so the agent can track drift
// without a database.
let inMemoryReference: number | null = null;
let dailyTurnoverAccum = 0;
let turnoverResetAt = startOfDay();

function startOfDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getInMemoryTurnover(): number {
  if (Date.now() - turnoverResetAt > 86_400_000) {
    dailyTurnoverAccum = 0;
    turnoverResetAt = startOfDay();
  }
  return dailyTurnoverAccum;
}

let running = false;

export async function runTick(): Promise<void> {
  if (running) {
    console.warn("[agent] previous tick is still running; skipped");
    return;
  }
  running = true;
  try {
    const repo = await tryLoadDb();

    // ── 1. Fetch latest price ──────────────────────────────────────────────
    let latest: number | null = null;
    if (repo) {
      try { latest = await repo.latestPrice(config.PRICE_ASSET); } catch { /* fall through */ }
    }
    if (latest === null) {
      latest = await oraclePrice(config.PRICE_ASSET);
    }

    // ── 2. Fetch reference price ───────────────────────────────────────────
    let reference: number | null = null;
    if (repo) {
      try { reference = await repo.referencePrice(config.PRICE_ASSET); } catch { /* fall through */ }
    }
    if (reference === null) {
      reference = inMemoryReference ?? latest;
    }

    // ── 3. Fetch daily turnover ────────────────────────────────────────────
    let turnover = 0;
    if (repo) {
      try { turnover = await repo.dailyTurnover(); } catch { /* fall through */ }
    } else {
      turnover = getInMemoryTurnover();
    }

    // ── 4. Read vault state ────────────────────────────────────────────────
    const vault = await observer.vault();

    // ── 5. Decide ─────────────────────────────────────────────────────────
    const proposed = decideAllocation(vault, {
      asset: config.PRICE_ASSET,
      latestPrice: latest,
      referencePrice: reference,
    });
    const gate = applyRiskGates(proposed, vault, turnover);
    const decision = gate.normalized;
    decision.thesis = await narrate(decision, vault);

    // ── 6. Execute ────────────────────────────────────────────────────────
    const execution = await execute(decision);

    // ── 7. Persist (DB optional) ──────────────────────────────────────────
    if (repo) {
      try { await repo.saveDecision(decision, execution.status, execution.txDigest); } catch { /* ignore */ }
    }

    // Update in-memory state
    if (execution.status === "submitted" && decision.amountUsdc > 0) {
      inMemoryReference = latest;
      dailyTurnoverAccum += decision.amountUsdc;
    }
    if (inMemoryReference === null && latest !== null) {
      inMemoryReference = latest;
    }

    console.log(
      `[agent] ${decision.action}${decision.side ? `/${decision.side}` : ""} ` +
        `amount=${decision.amountUsdc} status=${execution.status} price=${latest}` +
        (gate.reasons.length ? ` blocked=${gate.reasons.join(",")}` : ""),
    );
  } catch (error) {
    console.error(
      "[agent] tick failed",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    running = false;
  }
}
