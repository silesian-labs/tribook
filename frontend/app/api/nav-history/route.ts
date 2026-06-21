export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { snapshots, startNavPoller } from "@/lib/nav-poller";

export type { Snapshot } from "@/lib/nav-poller";

export async function GET() {
  startNavPoller();
  return NextResponse.json({ snapshots });
}
