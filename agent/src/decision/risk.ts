import { config } from "../config.js";
import type { AgentDecision, VaultSnapshot } from "../domain.js";

export interface GateResult {
  allowed: boolean;
  reasons: string[];
  normalized: AgentDecision;
}

export function applyRiskGates(
  decision: AgentDecision,
  vault: VaultSnapshot,
  dailyTurnover: number,
): GateResult {
  if (decision.action === "hold") {
    return { allowed: false, reasons: ["model_hold"], normalized: decision };
  }

  const reasons: string[] = [];
  const maxByDaily = Math.max(0, config.MAX_DAILY_TURNOVER_USDC - dailyTurnover);
  const idleBuffer = (vault.totalUsdc * config.MIN_IDLE_BUFFER_BPS) / 10_000;
  let amount: number;
  let spotAmount: number;
  let marginAmount: number;

  if (decision.side === "sell") {
    marginAmount = round(Math.min(
      decision.marginAmountUsdc,
      vault.marginAllocatedUsdc,
    ));
    const spotBudget = Math.max(
      0,
      Math.min(config.MAX_ACTION_USDC, maxByDaily) - marginAmount,
    );
    spotAmount = round(Math.min(
      decision.spotAmountUsdc,
      vault.spotAllocatedUsdc,
      spotBudget,
    ));
    amount = round(marginAmount + spotAmount);
  } else {
    amount = Math.min(
      decision.amountUsdc,
      config.MAX_ACTION_USDC,
      maxByDaily,
      Math.max(0, vault.idleUsdc - idleBuffer),
    );
    const ratio = decision.amountUsdc > 0 ? amount / decision.amountUsdc : 0;
    spotAmount = round(decision.spotAmountUsdc * ratio);
    marginAmount = round(decision.marginAmountUsdc * ratio);
  }

  if (decision.confidence < config.MIN_CONFIDENCE)
    reasons.push("confidence_below_threshold");
  if (amount <= 0) reasons.push("no_risk_budget");
  if (config.EXECUTION_MODE === "observe") reasons.push("observe_mode");

  const normalized = {
    ...decision,
    amountUsdc: amount,
    spotAmountUsdc: spotAmount,
    marginAmountUsdc: marginAmount,
  };
  if (reasons.length)
    return {
      allowed: false,
      reasons,
      normalized: { ...normalized, action: "hold", side: null, amountUsdc: 0, spotAmountUsdc: 0, marginAmountUsdc: 0 },
    };
  return { allowed: true, reasons: [], normalized };
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
