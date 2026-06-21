/**
 * Refreshes the sandbox Pyth oracle with current timestamps so
 * margin_manager::deposit passes check_price_is_fresh().
 *
 * The sandbox oracle-service fetches price data from 24h ago (stable values),
 * but stores the historical publish_time, causing freshness checks to fail.
 * This script re-submits the same prices with timestamp = NOW.
 *
 * Run once before test-live.ts:
 *   env $(cat .env.localnet | grep -v '^#' | grep -v '^$' | xargs) \
 *     node_modules/.bin/tsx src/scripts/refresh-oracle.ts
 */
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";

const LOCALNET_RPC = process.env.SUI_RPC_URL ?? "http://127.0.0.1:9000";
const PRIVATE_KEY  = process.env.SUI_PRIVATE_KEY!;
const PYTH_PKG     = "0x2576463000ad2546dd7a64121f8b3702102f54bebeb30896df55b32f4f936498";

// PriceInfoObject IDs (from localnet.json)
const SUI_PRICE_INFO  = process.env.SUI_PRICE_INFO_OBJECT_ID!;
const USDC_PRICE_INFO = process.env.USDC_PRICE_INFO_OBJECT_ID!;

// Pyth feed IDs (no 0x prefix)
const SUI_FEED_ID  = "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744";
const USDC_FEED_ID = "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";

// Current prices from oracle status endpoint (hardcoded for simplicity — close enough for a demo)
// Update if needed: curl http://localhost:9010/
const PRICES = {
  sui:  { price: 71994965, conf: 100000, expo: 8 },  // ~$0.72 with expo -8
  usdc: { price: 99971498, conf:  50000, expo: 8 },  // ~$1.00 with expo -8
};

function buildPriceInfo(
  tx: Transaction,
  feedId: string,
  priceMag: number,
  conf: number,
  expoMag: number,
  nowSec: number,
) {
  const priceI64 = tx.moveCall({
    target: `${PYTH_PKG}::i64::new`,
    arguments: [tx.pure.u64(priceMag), tx.pure.bool(false)],
  });
  const expoI64 = tx.moveCall({
    target: `${PYTH_PKG}::i64::new`,
    arguments: [tx.pure.u64(expoMag), tx.pure.bool(true)], // expo always negative
  });
  const priceObj = tx.moveCall({
    target: `${PYTH_PKG}::price::new`,
    arguments: [priceI64, tx.pure.u64(conf), expoI64, tx.pure.u64(nowSec)],
  });

  // EMA price = same as spot for simplicity
  const emaI64 = tx.moveCall({
    target: `${PYTH_PKG}::i64::new`,
    arguments: [tx.pure.u64(priceMag), tx.pure.bool(false)],
  });
  const emaExpoI64 = tx.moveCall({
    target: `${PYTH_PKG}::i64::new`,
    arguments: [tx.pure.u64(expoMag), tx.pure.bool(true)],
  });
  const emaPriceObj = tx.moveCall({
    target: `${PYTH_PKG}::price::new`,
    arguments: [emaI64, tx.pure.u64(conf), emaExpoI64, tx.pure.u64(nowSec)],
  });

  const priceIdentifier = tx.moveCall({
    target: `${PYTH_PKG}::price_identifier::from_byte_vec`,
    arguments: [tx.pure.vector("u8", Array.from(fromHex(feedId)))],
  });

  const priceFeed = tx.moveCall({
    target: `${PYTH_PKG}::price_feed::new`,
    arguments: [priceIdentifier, priceObj, emaPriceObj],
  });

  return tx.moveCall({
    target: `${PYTH_PKG}::price_info::new_price_info`,
    arguments: [tx.pure.u64(nowSec), tx.pure.u64(nowSec), priceFeed],
  });
}

async function main() {
  const client = new SuiJsonRpcClient({ url: LOCALNET_RPC, network: "localnet" });
  const signer = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
  const nowSec = Math.floor(Date.now() / 1000);
  console.log(`Refreshing oracle prices with timestamp = ${nowSec} (now)`);

  const tx = new Transaction();
  tx.setGasBudget(100_000_000);

  const suiInfo = buildPriceInfo(tx, SUI_FEED_ID, PRICES.sui.price, PRICES.sui.conf, PRICES.sui.expo, nowSec);
  tx.moveCall({
    target: `${PYTH_PKG}::pyth::update_single_price_feed`,
    arguments: [suiInfo, tx.object(SUI_PRICE_INFO)],
  });

  const usdcInfo = buildPriceInfo(tx, USDC_FEED_ID, PRICES.usdc.price, PRICES.usdc.conf, PRICES.usdc.expo, nowSec);
  tx.moveCall({
    target: `${PYTH_PKG}::pyth::update_single_price_feed`,
    arguments: [usdcInfo, tx.object(USDC_PRICE_INFO)],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx, signer,
    options: { showEffects: true },
  });

  const ok = result.effects?.status?.status === "success";
  console.log(`${ok ? "✅" : "❌"} Oracle refreshed — digest: ${result.digest}`);
  if (!ok) { console.error(result.effects?.status); process.exit(1); }
}

main().catch(err => { console.error(err); process.exit(1); });
