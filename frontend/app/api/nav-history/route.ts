/**
 * GET /api/nav-history
 *
 * Returns the in-memory NAV/TVL snapshot ring buffer collected by the poller
 * in lib/nav-poller.ts. The poller is started at server boot via
 * instrumentation.ts; this handler just reads the shared snapshots array
 * and ensures the poller is running if somehow instrumentation didn't fire.
 */
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { snapshots, startNavPoller } from "@/lib/nav-poller";

export type { Snapshot } from "@/lib/nav-poller";

export async function GET() {
  startNavPoller(); // idempotent — no-op if already started
  return NextResponse.json({ snapshots });
}
