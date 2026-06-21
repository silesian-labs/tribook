import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { config } from "../config.js";
import type { AgentDecision } from "../domain.js";
import { refreshPythOracle } from "../prices/pyth-refresh.js";

const CLOCK = "0x0000000000000000000000000000000000000000000000000000000000000006";

export interface ExecutionResult {
  status: "held" | "dry-run" | "submitted";
  txDigest?: string;
  error?: string;
}

export async function execute(
  decision: AgentDecision,
): Promise<ExecutionResult> {
  if (decision.action === "hold") return { status: "held" };
  if (config.EXECUTION_MODE === "observe") return { status: "held" };

  const deploy = decision.side !== "sell";
  const tx = buildRebalance(decision, deploy);

  // Refresh Pyth oracle timestamps before any live margin deposit
  // (sandbox oracle posts prices with 24h-old publish_time; freshness check fails without this)
  if (config.EXECUTION_MODE === "live" && decision.marginAmountUsdc > 0) {
    const refreshed = await refreshPythOracle();
    // Give Sui validators ~2s to propagate the updated PriceInfoObject before
    // the buy TX reads it — avoids check_price_is_fresh race on the first attempt
    if (refreshed) await new Promise((r) => setTimeout(r, 2000));
  }

  if (config.EXECUTION_MODE === "dry-run") {
    const detail = deploy
      ? `spot=${decision.spotAmountUsdc} margin=${decision.marginAmountUsdc}`
      : `recall=${decision.spotAmountUsdc}`;
    console.log(`[executor] dry-run PTB built: ${decision.side} ${decision.amountUsdc} USDC (${detail})`);
    return { status: "dry-run" };
  }

  if (!config.SUI_PRIVATE_KEY) {
    console.warn("[executor] SUI_PRIVATE_KEY not set; cannot submit");
    return { status: "held", error: "missing_private_key" };
  }

  try {
    const client = new SuiJsonRpcClient({
      url: config.SUI_RPC_URL,
      network: config.SUI_NETWORK,
    });
    const signer = Ed25519Keypair.fromSecretKey(config.SUI_PRIVATE_KEY);
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer,
      options: { showEffects: true },
    });
    console.log(`[executor] submitted ${decision.side} digest=${result.digest}`);
    return { status: "submitted", txDigest: result.digest };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[executor] PTB submission failed:", message);
    return { status: "held", error: message };
  }
}

function toRaw(usdc: number): bigint {
  return BigInt(Math.floor(usdc * 10 ** config.USDC_DECIMALS));
}

function buildRebalance(decision: AgentDecision, deploy: boolean): Transaction {
  const tx = new Transaction();

  const ticket = tx.moveCall({
    target: `${config.PACKAGE_ID}::agent::start_rebalance`,
    typeArguments: [config.USDC_TYPE],
    arguments: [tx.object(config.VAULT_ID), tx.object(config.AGENT_CAP_ID)],
  });

  if (deploy) {
    return buildDeploy(tx, ticket, decision);
  } else {
    return buildRecall(tx, ticket, decision);
  }
}

function buildDeploy(tx: Transaction, ticket: ReturnType<Transaction["moveCall"]>, decision: AgentDecision): Transaction {
  const spotRaw = toRaw(decision.spotAmountUsdc);
  const marginRaw = toRaw(decision.marginAmountUsdc);
  const useMargin = marginRaw > 0n;

  if (spotRaw > 0n) {
    tx.moveCall({
      target: `${config.PACKAGE_ID}::agent::rebalance_spot_deposit`,
      typeArguments: [config.USDC_TYPE],
      arguments: [
        tx.object(config.VAULT_ID),
        tx.object(config.AGENT_CAP_ID),
        ticket,
        tx.object(config.BALANCE_MANAGER_ID),
        tx.pure.u64(spotRaw),
      ],
    });
  }

  if (useMargin) {
    tx.moveCall({
      target: `${config.PACKAGE_ID}::agent::rebalance_margin_deposit`,
      typeArguments: [config.USDC_TYPE, config.SUI_TYPE, config.USDC_TYPE],
      arguments: [
        tx.object(config.VAULT_ID),
        tx.object(config.AGENT_CAP_ID),
        ticket,
        tx.object(config.MARGIN_MANAGER_ID),
        tx.object(config.MARGIN_REGISTRY_ID),
        tx.object(config.SUI_PRICE_INFO_OBJECT_ID),
        tx.object(config.USDC_PRICE_INFO_OBJECT_ID),
        tx.object(CLOCK),
        tx.pure.u64(marginRaw),
      ],
    });

    tx.moveCall({
      target: `${config.PACKAGE_ID}::agent::end_rebalance_with_margin`,
      typeArguments: [config.USDC_TYPE, config.SUI_TYPE, config.USDC_TYPE],
      arguments: [
        tx.object(config.VAULT_ID),
        tx.object(config.AGENT_CAP_ID),
        ticket,
        tx.object(config.MARGIN_MANAGER_ID),
        tx.object(config.USDC_MARGIN_POOL_ID),
        tx.object(CLOCK),
        tx.pure.u64(toRaw(decision.amountUsdc)),
        tx.pure.bool(true),
      ],
    });
  } else {
    tx.moveCall({
      target: `${config.PACKAGE_ID}::agent::end_rebalance`,
      typeArguments: [config.USDC_TYPE],
      arguments: [
        tx.object(config.VAULT_ID),
        tx.object(config.AGENT_CAP_ID),
        ticket,
        tx.pure.u64(toRaw(decision.amountUsdc)),
        tx.pure.bool(true),
      ],
    });
  }

  return tx;
}

function buildRecall(tx: Transaction, ticket: ReturnType<Transaction["moveCall"]>, decision: AgentDecision): Transaction {
  const spotRaw = toRaw(decision.spotAmountUsdc);
  const marginRaw = toRaw(decision.marginAmountUsdc);

  if (marginRaw > 0n) {
    tx.moveCall({
      target: `${config.PACKAGE_ID}::agent::rebalance_margin_withdraw`,
      typeArguments: [config.USDC_TYPE, config.SUI_TYPE, config.USDC_TYPE],
      arguments: [
        tx.object(config.VAULT_ID),
        tx.object(config.AGENT_CAP_ID),
        ticket,
        tx.object(config.MARGIN_MANAGER_ID),
        tx.object(config.MARGIN_REGISTRY_ID),
        tx.object(config.SUI_MARGIN_POOL_ID),
        tx.object(config.USDC_MARGIN_POOL_ID),
        tx.object(config.SUI_PRICE_INFO_OBJECT_ID),
        tx.object(config.USDC_PRICE_INFO_OBJECT_ID),
        tx.object(config.SUI_USDC_POOL_ID),
        tx.pure.u64(marginRaw),
        tx.object(CLOCK),
      ],
    });
  }

  if (spotRaw > 0n) {
    tx.moveCall({
      target: `${config.PACKAGE_ID}::agent::rebalance_spot_withdraw`,
      typeArguments: [config.USDC_TYPE],
      arguments: [
        tx.object(config.VAULT_ID),
        tx.object(config.AGENT_CAP_ID),
        ticket,
        tx.object(config.BALANCE_MANAGER_ID),
        tx.pure.u64(spotRaw),
      ],
    });
  }

  tx.moveCall({
    target: `${config.PACKAGE_ID}::agent::end_rebalance`,
    typeArguments: [config.USDC_TYPE],
    arguments: [
      tx.object(config.VAULT_ID),
      tx.object(config.AGENT_CAP_ID),
      ticket,
      tx.pure.u64(toRaw(decision.amountUsdc)),
      tx.pure.bool(false),
    ],
  });

  return tx;
}
