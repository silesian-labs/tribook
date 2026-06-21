/**
 * Refreshes sandbox Pyth oracle timestamps before margin deposits.
 *
 * The sandbox oracle service posts prices with publish_time from 24h ago.
 * margin_manager::deposit calls check_price_is_fresh(maxAge=70s) which fails
 * unless we re-submit the prices with timestamp = now.
 *
 * This module is called automatically by the executor when MARGIN_SPLIT_BPS > 0
 * and EXECUTION_MODE=live, so the agent loop works without manual intervention.
 */
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import { config } from "../config.js";
import { oraclePrice } from "./oracle.js";

const PYTH_PKG    = process.env.PYTH_PACKAGE_ID ?? "0xca9068df12236a14f6648e6aab1edb46f379bc2649e2c0bed5c202315c1453ed";
const SUI_FEED_ID  = "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744";
const USDC_FEED_ID = "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";

// Refresh no more than once every 60s to avoid spamming the chain
let lastRefreshAt = 0;
const REFRESH_INTERVAL_MS = 60_000;

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
    arguments: [tx.pure.u64(expoMag), tx.pure.bool(true)],
  });
  const priceObj = tx.moveCall({
    target: `${PYTH_PKG}::price::new`,
    arguments: [priceI64, tx.pure.u64(conf), expoI64, tx.pure.u64(nowSec)],
  });
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

export async function refreshPythOracle(): Promise<boolean> {
  const suiInfoId  = config.SUI_PRICE_INFO_OBJECT_ID;
  const usdcInfoId = config.USDC_PRICE_INFO_OBJECT_ID;

  if (!suiInfoId || !usdcInfoId || !config.SUI_PRIVATE_KEY) return false;
  if (Date.now() - lastRefreshAt < REFRESH_INTERVAL_MS) return false;

  const nowSec = Math.floor(Date.now() / 1000);

  // Pull current price from oracle to keep numbers realistic
  const suiUsd  = await oraclePrice("SUI")  ?? 0.72;
  const usdcUsd = await oraclePrice("USDC") ?? 1.00;

  // Convert to Pyth fixed-point: price * 10^8 as integer magnitude, expo = -8
  const suiMag  = Math.round(suiUsd  * 1e8);
  const usdcMag = Math.round(usdcUsd * 1e8);

  const client = new SuiJsonRpcClient({ url: config.SUI_RPC_URL, network: config.SUI_NETWORK });
  const signer = Ed25519Keypair.fromSecretKey(config.SUI_PRIVATE_KEY);

  const tx = new Transaction();
  tx.setGasBudget(100_000_000);

  const suiInfo = buildPriceInfo(tx, SUI_FEED_ID,  suiMag,  100_000, 8, nowSec);
  tx.moveCall({
    target: `${PYTH_PKG}::pyth::update_single_price_feed`,
    arguments: [suiInfo, tx.object(suiInfoId)],
  });

  const usdcInfo = buildPriceInfo(tx, USDC_FEED_ID, usdcMag, 50_000, 8, nowSec);
  tx.moveCall({
    target: `${PYTH_PKG}::pyth::update_single_price_feed`,
    arguments: [usdcInfo, tx.object(usdcInfoId)],
  });

  try {
    const result = await client.signAndExecuteTransaction({
      transaction: tx, signer,
      options: { showEffects: true },
    });
    const ok = result.effects?.status?.status === "success";
    if (ok) {
      lastRefreshAt = Date.now();
      console.log(`[pyth-refresh] oracle updated (SUI=$${suiUsd.toFixed(4)}) digest=${result.digest}`);
      return true;
    } else {
      console.warn("[pyth-refresh] oracle update failed:", result.effects?.status);
    }
  } catch (err) {
    console.warn("[pyth-refresh] oracle update error:", (err as Error).message);
  }
  return false;
}
