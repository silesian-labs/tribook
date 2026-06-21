import { ChainObserver } from "../chain/observer.js";
import { decideAllocation } from "../decision/allocator.js";
import { applyRiskGates } from "../decision/risk.js";
import { execute } from "../execution/executor.js";
import { config } from "../config.js";

async function main() {
  const obs = new ChainObserver();
  const vault = await obs.vault();
  console.log("Vault:", JSON.stringify({ idleUsdc: vault.idleUsdc, spotAllocatedUsdc: vault.spotAllocatedUsdc, marginAllocatedUsdc: vault.marginAllocatedUsdc, totalUsdc: vault.totalUsdc }, null, 2));

  const priceCtx = {
    asset: "SUI",
    latestPrice: 3.70,
    referencePrice: 4.00,
  };

  console.log(`\nPrice context: ${priceCtx.referencePrice} → ${priceCtx.latestPrice} (${(((priceCtx.latestPrice - priceCtx.referencePrice) / priceCtx.referencePrice) * 10000).toFixed(0)} bps)`);

  const proposed = decideAllocation(vault, priceCtx);
  console.log("\nProposed decision:", JSON.stringify(proposed, null, 2));

  const gate = applyRiskGates(proposed, vault, 0);
  console.log("\nGate result:", { allowed: gate.allowed, reasons: gate.reasons });
  
  const decision = gate.normalized;
  console.log("\nFinal decision:", JSON.stringify({ action: decision.action, side: decision.side, amountUsdc: decision.amountUsdc, spotAmountUsdc: decision.spotAmountUsdc, marginAmountUsdc: decision.marginAmountUsdc, thesis: decision.thesis }, null, 2));

  console.log("\nMode:", config.EXECUTION_MODE);
  const result = await execute(decision);
  console.log("Execution result:", result);
}

main().catch(console.error);
