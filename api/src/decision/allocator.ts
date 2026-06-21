import { config } from "../config.js";
import type { AgentDecision, PriceContext, VaultSnapshot } from "../domain.js";

export function decideAllocation(
  vault: VaultSnapshot,
  price: PriceContext,
): AgentDecision {
  const base = {
    confidence: 1,
    market: price.asset,
    signalPrice: price.latestPrice,
  };

  if (
    price.latestPrice === null ||
    price.referencePrice === null ||
    price.referencePrice === 0
  ) {
    return {
      ...base,
      action: "hold",
      side: null,
      amountUsdc: 0,
      spotAmountUsdc: 0,
      marginAmountUsdc: 0,
      thesis: "Brak ceny referencyjnej — czekam na feed.",
    };
  }

  const deviationBps =
    ((price.latestPrice - price.referencePrice) / price.referencePrice) *
    10_000;

  const idleBuffer = (vault.totalUsdc * config.MIN_IDLE_BUFFER_BPS) / 10_000;
  const deployBudget = Math.max(0, vault.idleUsdc - idleBuffer);
  const recallBudget = vault.spotAllocatedUsdc + vault.marginAllocatedUsdc;
  const move = formatPrice(price.referencePrice, price.latestPrice, deviationBps);

  if (deviationBps <= -config.DROP_TRIGGER_BPS && deployBudget > 0) {
    const amount = round(Math.min(config.MAX_ACTION_USDC, deployBudget));
    const marginAmount = round((amount * config.MARGIN_SPLIT_BPS) / 10_000);
    const spotAmount = round(amount - marginAmount);
    return {
      ...base,
      action: "rebalance_idle",
      side: "buy",
      amountUsdc: amount,
      spotAmountUsdc: spotAmount,
      marginAmountUsdc: marginAmount,
      thesis: `${price.asset} ${move}. Spadek poniżej progu ${config.DROP_TRIGGER_BPS / 100}% — deploy ${amount} USDC (spot: ${spotAmount}, margin: ${marginAmount}).`,
    };
  }

  if (deviationBps >= config.RISE_TRIGGER_BPS && recallBudget > 0) {
    // end_rebalance requires margin_allocated == 0, so always recall ALL margin first.
    // Then recall as much spot as possible up to MAX_ACTION_USDC total.
    const marginAmount = vault.marginAllocatedUsdc;
    const spotAmount = round(Math.min(
      vault.spotAllocatedUsdc,
      Math.max(0, config.MAX_ACTION_USDC - marginAmount),
    ));
    const amount = round(marginAmount + spotAmount);
    return {
      ...base,
      action: "rebalance_idle",
      side: "sell",
      amountUsdc: amount,
      spotAmountUsdc: spotAmount,
      marginAmountUsdc: marginAmount,
      thesis: `${price.asset} ${move}. Wzrost powyżej progu ${config.RISE_TRIGGER_BPS / 100}% — recall ${amount} USDC (spot: ${spotAmount}, margin: ${marginAmount}).`,
    };
  }

  return {
    ...base,
    action: "hold",
    side: null,
    amountUsdc: 0,
    spotAmountUsdc: 0,
    marginAmountUsdc: 0,
    thesis: `${price.asset} ${move}. W paśmie neutralnym — trzymam alokację.`,
  };
}

function formatPrice(ref: number, latest: number, bps: number): string {
  const pct = (bps / 100).toFixed(2);
  const sign = bps >= 0 ? "+" : "";
  return `${ref} → ${latest} (${sign}${pct}%)`;
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
