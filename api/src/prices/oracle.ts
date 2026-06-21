/**
 * Reads live prices from the DeepBook sandbox oracle service.
 * Used as a fallback (or primary source on localnet) when PostgreSQL is not available.
 *
 * Oracle endpoint: http://localhost:9010/
 * Response: { prices: { sui: "$0.71", deep: "$0.016", usdc: "$0.999" } }
 *
 * Price simulation (for localnet demo):
 *   SIMULATE_PRICES=1        enables sinusoidal drift
 *   SIMULATOR_PERIOD_S=180   full cycle length in seconds (default 180)
 *   SIMULATOR_AMP_PCT=4      amplitude percent (default 4)
 *
 * With defaults: DROP trigger ~22s in, RISE trigger ~112s in, cycle repeats at 180s.
 * Use SIMULATOR_PERIOD_S=60 for a 1-minute demo cycle.
 */

const ORACLE_URL = process.env.SANDBOX_ORACLE_URL ?? "http://localhost:9010/";

const SIMULATE = process.env.SIMULATE_PRICES === "1";
const SIM_PERIOD_MS = Number(process.env.SIMULATOR_PERIOD_S ?? 180) * 1000;
const SIM_AMP = Number(process.env.SIMULATOR_AMP_PCT ?? 4) / 100;
const simStart = Date.now();

function simMultiplier(): number {
  const phase = ((Date.now() - simStart) % SIM_PERIOD_MS) / SIM_PERIOD_MS;
  return 1 - SIM_AMP * Math.sin(2 * Math.PI * phase);
}

type OracleResponse = {
  status: string;
  prices: Record<string, string>;
};

let lastFetched: { prices: Record<string, number>; at: number } | null = null;
const TTL_MS = 5_000;

export async function oraclePrice(asset: string): Promise<number | null> {
  const now = Date.now();
  if (!lastFetched || now - lastFetched.at > TTL_MS) {
    try {
      const res = await fetch(ORACLE_URL, { signal: AbortSignal.timeout(3000) });
      const data = (await res.json()) as OracleResponse;
      if (data.status !== "ok") return null;

      const parsed: Record<string, number> = {};
      for (const [key, val] of Object.entries(data.prices)) {
        const num = Number(String(val).replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) parsed[key.toLowerCase()] = num;
      }
      lastFetched = { prices: parsed, at: now };
    } catch {
      return lastFetched?.prices[asset.toLowerCase()] ?? null;
    }
  }

  const base = lastFetched?.prices[asset.toLowerCase()] ?? null;
  if (base === null || !SIMULATE) return base;

  const mult = simMultiplier();
  const driftPct = ((mult - 1) * 100).toFixed(2);
  const sign = mult >= 1 ? "+" : "";
  process.stdout.write(`[sim] drift=${sign}${driftPct}%  price=${(base * mult).toFixed(4)}\r`);
  return base * mult;
}
