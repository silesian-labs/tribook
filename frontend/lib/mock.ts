
export type Book = "spot" | "margin" | "predict";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface NavPoint {
  t: number;
  label: string;
  nav: number;
  tvl: number;
}

const DAY = 86_400_000;
const ANCHOR = Date.UTC(2026, 5, 17);

function buildNavSeries(): NavPoint[] {
  const rng = mulberry32(20260517);
  const days = 90;
  const points: NavPoint[] = [];
  let nav = 1.0;
  let tvl = 1_250_000;
  for (let i = days - 1; i >= 0; i--) {
    const t = ANCHOR - i * DAY;
    const recent = i < 7;
    const drift = 0.00032;
    const vol = i === 0 ? 0.00013 : (rng() - 0.5) * (recent ? 0.0006 : 0.0022);
    const shock = recent ? 0 : i === 61 || i === 60 ? -0.009 : i === 28 ? -0.006 : 0;
    nav = Math.max(0.985, nav * (1 + drift + vol + shock));
    tvl = tvl * (1 + 0.012 + (rng() - 0.5) * 0.02) * (1 + (shock < 0 ? -0.03 : 0));
    const d = new Date(t);
    points.push({
      t,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      nav: Number(nav.toFixed(4)),
      tvl: Math.round(tvl),
    });
  }
  return points;
}

export const navSeries = buildNavSeries();
const last = navSeries[navSeries.length - 1];
const prev = navSeries[navSeries.length - 2];
const weekAgo = navSeries[navSeries.length - 8];
const monthAgo = navSeries[navSeries.length - 31];

export const vault = {
  navPerShare: last.nav,
  tvl: last.tvl,
  change24hPct: ((last.nav - prev.nav) / prev.nav) * 100,
  apy7d: (Math.pow(last.nav / weekAgo.nav, 365 / 7) - 1) * 100,
  apy30d: (Math.pow(last.nav / monthAgo.nav, 365 / 30) - 1) * 100,
  depositors: 1287,
  sharePrice: last.nav,
  totalShares: Math.round(last.tvl / last.nav),
  sinceInceptionPct: (last.nav - 1) * 100,
  managementFee: 1,
  performanceFee: 10,
  highWaterMark: last.nav,
};

export interface Allocation {
  book: Book | "idle";
  label: string;
  pct: number;
  usd: number;
  color: string;
}

const alloc = [
  { book: "spot" as const, label: "Spot · Market Making", pct: 48.2, color: "#2DD4BF" },
  { book: "margin" as const, label: "Margin · Funding Arb", pct: 33.6, color: "#8B5CF6" },
  { book: "predict" as const, label: "Predict · Mispricing", pct: 13.1, color: "#F5A524" },
  { book: "idle" as const, label: "Idle USDC · Buffer", pct: 5.1, color: "#3a3f4d" },
];

export const allocation: Allocation[] = alloc.map((a) => ({
  ...a,
  usd: Math.round((a.pct / 100) * vault.tvl),
}));

export const risk = {
  netDelta: 0.021, // fraction of NAV
  vega: 0.18, // normalized 0..1 exposure
  leverage: 1.31,
  gamma: 0.04,
  maxDrawdown30d: -1.84, // pct
  sharpe30d: 2.41,
  hitRate: 0.63,
  withinCharter: true,
  limits: {
    leverage: 2.0,
    delta: 0.3,
    singlePosition: 0.2,
  },
};

export interface Position {
  id: string;
  book: Book;
  market: string;
  side: string;
  size: number;
  entry: number | null;
  mark: number | null;
  pnl: number | null;
  pnlPct: number | null;
}

export const positions: Position[] = [
  { id: "p1", book: "spot", market: "SUI/USDC", side: "LP · ±0.35%", size: 612_400, entry: 4.182, mark: 4.207, pnl: 3_640, pnlPct: 0.59 },
  { id: "p2", book: "spot", market: "DEEP/USDC", side: "LP · ±0.50%", size: 388_100, entry: 0.0421, mark: 0.0419, pnl: 1_220, pnlPct: 0.31 },
  { id: "p3", book: "spot", market: "WBTC/USDC", side: "LP · ±0.20%", size: 261_900, entry: 98_420, mark: 98_960, pnl: 980, pnlPct: 0.37 },
  { id: "p4", book: "margin", market: "SUI-PERP", side: "Short 1.4x", size: 540_200, entry: 4.205, mark: 4.207, pnl: 4_410, pnlPct: 0.82 },
  { id: "p5", book: "margin", market: "USDC", side: "Borrow", size: 372_600, entry: 1, mark: 1, pnl: 2_180, pnlPct: 0.58 },
  { id: "p6", book: "predict", market: "SUI 30d · 4.0–4.4", side: "Vertical · Long", size: 198_700, entry: 0.41, mark: 0.46, pnl: 9_120, pnlPct: 4.59 },
  { id: "p7", book: "predict", market: "SUI 14d · ≥4.2", side: "Binary · Short", size: 96_400, entry: 0.58, mark: 0.55, pnl: 2_870, pnlPct: 2.98 },
];

export const contributions: { book: Book; label: string; pct: number; color: string }[] = [
  { book: "spot", label: "Spot MM", pct: 0.34, color: "#2DD4BF" },
  { book: "margin", label: "Margin Arb", pct: 0.51, color: "#8B5CF6" },
  { book: "predict", label: "Predict", pct: 0.27, color: "#F5A524" },
];

export interface Rebalance {
  id: string;
  digest: string;
  agoSec: number;
  trigger: string;
  ops: { book: Book; text: string }[];
  latencyMs: number;
}

export const rebalances: Rebalance[] = [
  {
    id: "r1",
    digest: "9xQ2…aF7k",
    agoSec: 42,
    trigger: "SUI/USDC mid drifted −0.58%",
    latencyMs: 380,
    ops: [
      { book: "spot", text: "Cancelled 2 stale bids, requoted ±0.35%" },
      { book: "margin", text: "Trimmed SUI-PERP short to 1.4x" },
      { book: "predict", text: "Minted 4.0–4.4 vertical as delta hedge" },
    ],
  },
  {
    id: "r2",
    digest: "3bH8…02Lp",
    agoSec: 168,
    trigger: "Margin borrow rate ↑ 4.1% → 5.2%",
    latencyMs: 351,
    ops: [
      { book: "margin", text: "Reduced USDC borrow by $58k" },
      { book: "spot", text: "Widened DEEP/USDC ask to 0.50%" },
    ],
  },
  {
    id: "r3",
    digest: "7kP1…99Tz",
    agoSec: 405,
    trigger: "Predict IV gap vs Pyth +6.4 vol",
    latencyMs: 372,
    ops: [
      { book: "predict", text: "Sold rich 14d binary ≥4.2" },
      { book: "margin", text: "Opened 0.6x long hedge on SUI" },
    ],
  },
  {
    id: "r4",
    digest: "2mD5…c4Rw",
    agoSec: 902,
    trigger: "Inventory skew on WBTC/USDC",
    latencyMs: 366,
    ops: [
      { book: "spot", text: "Asymmetric requote to unwind +$31k inventory" },
    ],
  },
  {
    id: "r5",
    digest: "5tN0…7yQa",
    agoSec: 1455,
    trigger: "Scheduled page turn · 60s cadence",
    latencyMs: 359,
    ops: [
      { book: "spot", text: "Refreshed quotes across 3 pools" },
      { book: "margin", text: "Rolled funding accrual" },
      { book: "predict", text: "Repriced vertical ladder vs SVI surface" },
    ],
  },
];

export const books: {
  key: Book;
  name: string;
  tag: string;
  color: string;
  apy: string;
  risk: string;
  thesis: string;
}[] = [
  {
    key: "spot",
    name: "Spot",
    tag: "Market Making",
    color: "#2DD4BF",
    apy: "8–15%",
    risk: "Conservative",
    thesis:
      "DeepBook's CLOB runs thin books with spreads 2–5× a CEX. We quote both sides with volatility-scaled width and unwind inventory before it turns toxic.",
  },
  {
    key: "margin",
    name: "Margin",
    tag: "Funding Arbitrage",
    color: "#8B5CF6",
    apy: "5–20%",
    risk: "Balanced",
    thesis:
      "Borrow rates on Margin drift out of line with perp funding. We capture the spread delta-neutral, leverage capped at 2× with auto-deleverage above 60% LTV.",
  },
  {
    key: "predict",
    name: "Predict",
    tag: "Mispricing Capture",
    color: "#F5A524",
    apy: "Opportunistic",
    risk: "Aggressive",
    thesis:
      "Predict shipped weeks ago — makers are cold-starting and vertical ranges are mispriced vs the Block Scholes SVI surface. We mint the edge and hedge the delta.",
  },
];

export const partners = [
  "Sui",
  "DeepBook V3",
  "Predict",
  "Block Scholes",
  "Pyth",
  "Enoki",
];
