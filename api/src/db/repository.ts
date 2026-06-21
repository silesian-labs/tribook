import type { AgentDecision } from "../domain.js";
import { sql } from "./client.js";

export async function latestPrice(asset: string): Promise<number | null> {
  const [row] = await sql<{ price: string }[]>`
    SELECT price FROM price_feed WHERE asset = ${asset}
    ORDER BY published_at DESC LIMIT 1`;
  return row ? Number(row.price) : null;
}

export async function recentPrices(asset: string, limit = 60) {
  const rows = await sql<{ price: string; publishedAt: string }[]>`
    SELECT price, published_at FROM price_feed WHERE asset = ${asset}
    ORDER BY published_at DESC LIMIT ${limit}`;
  return rows
    .map((r) => ({ price: Number(r.price), publishedAt: r.publishedAt }))
    .reverse();
}

export async function referencePrice(asset: string): Promise<number | null> {
  const [acted] = await sql<{ signalPrice: string | null }[]>`
    SELECT signal_price FROM decisions
    WHERE action <> 'hold' AND signal_price IS NOT NULL
    ORDER BY created_at DESC LIMIT 1`;
  if (acted?.signalPrice != null) return Number(acted.signalPrice);

  const [baseline] = await sql<{ price: string }[]>`
    SELECT price FROM price_feed WHERE asset = ${asset}
    ORDER BY published_at ASC LIMIT 1`;
  return baseline ? Number(baseline.price) : null;
}

export async function dailyTurnover(): Promise<number> {
  const [row] = await sql<{ amount: number }[]>`
    SELECT COALESCE(sum(amount_usdc), 0)::float AS amount FROM decisions
    WHERE created_at >= date_trunc('day', now()) AND execution_status = 'submitted'`;
  return row?.amount ?? 0;
}

export async function saveDecision(
  decision: AgentDecision,
  executionStatus: string,
  txDigest?: string,
): Promise<void> {
  await sql`INSERT INTO decisions ${sql({
    action: decision.action,
    side: decision.side,
    confidence: decision.confidence,
    amountUsdc: decision.amountUsdc,
    market: decision.market,
    signalPrice: decision.signalPrice,
    thesis: decision.thesis,
    txDigest: txDigest ?? null,
    executionStatus,
  })}`;
}

export async function recentDecisions(limit = 50) {
  return sql`SELECT * FROM decisions ORDER BY created_at DESC LIMIT ${limit}`;
}
