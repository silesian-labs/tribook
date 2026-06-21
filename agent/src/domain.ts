export interface VaultSnapshot {
  observedAt: string;
  objectVersion: string;
  idleUsdc: number;
  spotAllocatedUsdc: number;
  marginAllocatedUsdc: number;
  totalUsdc: number;
  raw: Record<string, unknown>;
}

export interface PositionSnapshot {
  venue: "deepbook_spot";
  market: string;
  positionId: string;
  side: "bid" | "ask" | "flat";
  quantity: number;
  entryPrice: number | null;
  openedAt: string | null;
  raw: Record<string, unknown>;
}

export interface PriceContext {
  asset: string;
  latestPrice: number | null;
  referencePrice: number | null;
}

export const actions = ["hold", "rebalance_idle"] as const;
export type Action = (typeof actions)[number];

export interface AgentDecision {
  action: Action;
  side: "buy" | "sell" | null;
  confidence: number;
  amountUsdc: number;
  spotAmountUsdc: number;
  marginAmountUsdc: number;
  market: string | null;
  signalPrice: number | null;
  thesis: string;
}
