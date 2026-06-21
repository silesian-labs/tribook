import { ChainObserver } from "./chain/observer.js";
import { config } from "./config.js";
import { decideAllocation } from "./decision/allocator.js";
import { narrate } from "./decision/narrator.js";
import { applyRiskGates } from "./decision/risk.js";
import { oraclePrice } from "./prices/oracle.js";
import { execute } from "./execution/executor.js";
import { recordDecision, recordPrice } from "./history.js";

const observer = new ChainObserver();

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
    const latest = await oraclePrice(config.PRICE_ASSET);
    if (latest !== null) recordPrice(config.PRICE_ASSET, latest);

    const reference = inMemoryReference ?? latest;

    const turnover = getInMemoryTurnover();

    const vault = await observer.vault();

    const proposed = decideAllocation(vault, {
      asset: config.PRICE_ASSET,
      latestPrice: latest,
      referencePrice: reference,
    });
    const gate = applyRiskGates(proposed, vault, turnover);
    const decision = gate.normalized;
    decision.thesis = await narrate(decision, vault);

    const execution = await execute(decision);

    recordDecision(decision, execution.status, execution.txDigest);

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
