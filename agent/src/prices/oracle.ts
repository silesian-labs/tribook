
const ORACLE_URL = process.env.SANDBOX_ORACLE_URL ?? "http://localhost:9010/";

const SIMULATE = process.env.SIMULATE_PRICES === "1";
const configuredPeriod = Number(process.env.SIMULATOR_PERIOD_S ?? 180);
const configuredAmplitude = Number(process.env.SIMULATOR_AMP_PCT ?? 4);
const configuredBasePrice = Number(process.env.SIMULATOR_BASE_PRICE);
const SIM_PERIOD_MS =
  (Number.isFinite(configuredPeriod) && configuredPeriod > 0
    ? configuredPeriod
    : 180) * 1000;
const SIM_AMP =
  (Number.isFinite(configuredAmplitude) && configuredAmplitude >= 0
    ? configuredAmplitude
    : 4) / 100;
const SIM_BASE_PRICE =
  Number.isFinite(configuredBasePrice) && configuredBasePrice > 0
    ? configuredBasePrice
    : null;
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
  if (SIMULATE && SIM_BASE_PRICE !== null) {
    return simulatedPrice(SIM_BASE_PRICE);
  }

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

  return simulatedPrice(base);
}

function simulatedPrice(base: number): number {
  const mult = simMultiplier();
  const driftPct = ((mult - 1) * 100).toFixed(2);
  const sign = mult >= 1 ? "+" : "";
  process.stdout.write(`[sim] drift=${sign}${driftPct}%  price=${(base * mult).toFixed(4)}\r`);
  return base * mult;
}
