/**
 * Live test: submits the multi-book PTB to localnet.
 * Deploys 3.5 USDC to Spot BM + 1.5 USDC to Margin MM in one atomic tx.
 *
 * Run:
 *   env $(cat .env.localnet | grep -v '^#' | grep -v '^$' | xargs) \
 *     node_modules/.bin/tsx src/scripts/test-live.ts
 */
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { ChainObserver } from "../chain/observer.js";

const CLOCK  = "0x0000000000000000000000000000000000000000000000000000000000000006";

// localnet IDs (same as .env.localnet)
const LOCALNET_RPC          = process.env.SUI_RPC_URL ?? "http://127.0.0.1:9000";
const PRIVATE_KEY           = process.env.SUI_PRIVATE_KEY!;
const PACKAGE_ID            = process.env.PACKAGE_ID!;
const VAULT_ID              = process.env.VAULT_ID!;
const AGENT_CAP_ID          = process.env.AGENT_CAP_ID!;
const BALANCE_MANAGER_ID    = process.env.BALANCE_MANAGER_ID!;
const MARGIN_MANAGER_ID     = process.env.MARGIN_MANAGER_ID!;
const MARGIN_REGISTRY_ID    = process.env.MARGIN_REGISTRY_ID!;
const USDC_MARGIN_POOL_ID   = process.env.USDC_MARGIN_POOL_ID!;
const SUI_PRICE_INFO        = process.env.SUI_PRICE_INFO_OBJECT_ID!;
const USDC_PRICE_INFO       = process.env.USDC_PRICE_INFO_OBJECT_ID!;
const USDC_TYPE             = process.env.USDC_TYPE!;
const SUI_TYPE              = process.env.SUI_TYPE ?? "0x2::sui::SUI";

const SPOT_RAW   = 3_500_000n;  // 3.5 USDC
const MARGIN_RAW = 1_500_000n;  // 1.5 USDC
const TOTAL_RAW  = 5_000_000n;  // 5.0 USDC

async function main() {
  const client  = new SuiJsonRpcClient({ url: LOCALNET_RPC, network: "localnet" });
  const signer  = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);

  const obs = new ChainObserver();
  const vaultBefore = await obs.vault();
  console.log("Vault BEFORE:", JSON.stringify({
    idle: vaultBefore.idleUsdc,
    spot: vaultBefore.spotAllocatedUsdc,
    margin: vaultBefore.marginAllocatedUsdc,
  }));

  if (vaultBefore.idleUsdc < 5) {
    console.error("Not enough idle USDC (need ≥5). Deposit first.");
    process.exit(1);
  }

  console.log("\nBuilding PTB: start → spot_deposit(3.5) → margin_deposit(1.5) → end_with_margin ...");

  const tx = new Transaction();

  // 1. start_rebalance → ticket (hot potato)
  const ticket = tx.moveCall({
    target: `${PACKAGE_ID}::agent::start_rebalance`,
    typeArguments: [USDC_TYPE],
    arguments: [tx.object(VAULT_ID), tx.object(AGENT_CAP_ID)],
  });

  // 2. rebalance_spot_deposit (3.5 USDC → BalanceManager)
  tx.moveCall({
    target: `${PACKAGE_ID}::agent::rebalance_spot_deposit`,
    typeArguments: [USDC_TYPE],
    arguments: [
      tx.object(VAULT_ID), tx.object(AGENT_CAP_ID), ticket,
      tx.object(BALANCE_MANAGER_ID), tx.pure.u64(SPOT_RAW),
    ],
  });

  // 3. rebalance_margin_deposit (1.5 USDC → MarginManager)
  tx.moveCall({
    target: `${PACKAGE_ID}::agent::rebalance_margin_deposit`,
    typeArguments: [USDC_TYPE, SUI_TYPE, USDC_TYPE],
    arguments: [
      tx.object(VAULT_ID), tx.object(AGENT_CAP_ID), ticket,
      tx.object(MARGIN_MANAGER_ID), tx.object(MARGIN_REGISTRY_ID),
      tx.object(SUI_PRICE_INFO), tx.object(USDC_PRICE_INFO),
      tx.object(CLOCK), tx.pure.u64(MARGIN_RAW),
    ],
  });

  // 4. end_rebalance_with_margin (consumes ticket, checks risk limits)
  tx.moveCall({
    target: `${PACKAGE_ID}::agent::end_rebalance_with_margin`,
    typeArguments: [USDC_TYPE, SUI_TYPE, USDC_TYPE],
    arguments: [
      tx.object(VAULT_ID), tx.object(AGENT_CAP_ID), ticket,
      tx.object(MARGIN_MANAGER_ID), tx.object(USDC_MARGIN_POOL_ID),
      tx.object(CLOCK), tx.pure.u64(TOTAL_RAW), tx.pure.bool(true),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx, signer,
    options: { showEffects: true },
  });

  const ok = result.effects?.status?.status === "success";
  console.log(`\n${ok ? "✅" : "❌"} ${result.digest}`);
  if (!ok) {
    console.error("Error:", result.effects?.status);
    process.exit(1);
  }

  // Small wait for RPC to sync
  await new Promise(r => setTimeout(r, 1500));

  const vaultAfter = await obs.vault();
  console.log("\nVault AFTER:", JSON.stringify({
    idle:   vaultAfter.idleUsdc,
    spot:   vaultAfter.spotAllocatedUsdc,
    margin: vaultAfter.marginAllocatedUsdc,
  }));
  console.log(`\n→ spot delta:   +${(vaultAfter.spotAllocatedUsdc   - vaultBefore.spotAllocatedUsdc  ).toFixed(6)} USDC`);
  console.log(`→ margin delta: +${(vaultAfter.marginAllocatedUsdc - vaultBefore.marginAllocatedUsdc).toFixed(6)} USDC`);
  console.log(`→ idle delta:    ${(vaultAfter.idleUsdc            - vaultBefore.idleUsdc           ).toFixed(6)} USDC`);
}

main().catch(err => { console.error(err); process.exit(1); });
