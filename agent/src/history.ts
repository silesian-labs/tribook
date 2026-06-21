import type { AgentDecision } from "./domain.js";

export interface DecisionRecord {
  createdAt: string;
  action: string;
  side: string | null;
  confidence: number;
  amountUsdc: number;
  spotAmountUsdc: number;
  marginAmountUsdc: number;
  market: string | null;
  signalPrice: number | null;
  thesis: string;
  executionStatus: string;
  txDigest: string | null;
}

export interface PriceRecord {
  asset: string;
  price: number;
  publishedAt: string;
}

const MAX_RECORDS = 500;
const decisionLog: DecisionRecord[] = [];
const priceLog: PriceRecord[] = [];

export function recordDecision(
  decision: AgentDecision,
  executionStatus: string,
  txDigest?: string,
): void {
  decisionLog.push({
    createdAt: new Date().toISOString(),
    action: decision.action,
    side: decision.side,
    confidence: decision.confidence,
    amountUsdc: decision.amountUsdc,
    spotAmountUsdc: decision.spotAmountUsdc,
    marginAmountUsdc: decision.marginAmountUsdc,
    market: decision.market,
    signalPrice: decision.signalPrice,
    thesis: decision.thesis,
    executionStatus,
    txDigest: txDigest ?? null,
  });
  if (decisionLog.length > MAX_RECORDS) decisionLog.shift();
}

export function recordPrice(asset: string, price: number): void {
  priceLog.push({ asset, price, publishedAt: new Date().toISOString() });
  if (priceLog.length > MAX_RECORDS) priceLog.shift();
}

export function recentDecisions(limit = 50): DecisionRecord[] {
  return decisionLog.slice(-limit).reverse();
}

export function recentPrices(asset: string, limit = 60): PriceRecord[] {
  return priceLog.filter((p) => p.asset === asset).slice(-limit);
}
