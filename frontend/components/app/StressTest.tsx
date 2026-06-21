"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { vault, risk } from "@/lib/mock";
import { fmtPct, fmtUsd } from "@/lib/format";
import { cn } from "@/lib/cn";

const shocks = [-20, -10, -5, 0, 5, 10, 20];

// Illustrative per-book sensitivity to a SUI spot shock (delta-neutral target).
function project(shockPct: number) {
  const s = shockPct / 100;
  // vault-level: net delta + a touch of positive gamma
  const navImpact = risk.netDelta * s + 0.5 * risk.gamma * s * s;
  const perBook = {
    spot: -0.18 * Math.abs(s), // inventory bleed in fast moves
    margin: -0.55 * s, // net short benefits when price falls
    predict: 0.12 * Math.abs(s) - 0.2 * s, // vega + residual delta
  };
  return { navImpact, perBook };
}

const bookColor = { spot: "#2DD4BF", margin: "#8B5CF6", predict: "#F5A524" };

export function StressTest() {
  const [shock, setShock] = useState(-10);
  const { navImpact, perBook } = project(shock);
  const newNav = vault.navPerShare * (1 + navImpact);
  const tvlDelta = vault.tvl * navImpact;

  return (
    <div className="bezel">
      <div className="bezel-core p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-white">Stress test</h3>
          <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45">
            delta-neutral target
          </span>
        </div>
        <p className="mt-1 text-[13px] text-white/45">
          Project vault NAV under an instantaneous SUI spot shock.
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {shocks.map((s) => (
            <button
              key={s}
              onClick={() => setShock(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-medium tnum transition-colors duration-200",
                shock === s
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/[0.02] text-white/55 hover:text-white",
              )}
            >
              {s > 0 ? `+${s}` : s}%
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-eyebrow text-white/40">Projected NAV</p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-white tnum">
              {newNav.toFixed(4)}
            </p>
            <p className={cn("mt-0.5 text-[12px] tnum", navImpact >= 0 ? "text-up" : "text-down")}>
              {fmtPct(navImpact * 100)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-eyebrow text-white/40">Vault P&amp;L</p>
            <p
              className={cn(
                "mt-1.5 font-display text-2xl font-semibold tnum",
                tvlDelta >= 0 ? "text-up" : "text-down",
              )}
            >
              {fmtUsd(tvlDelta, { compact: true })}
            </p>
            <p className="mt-0.5 text-[12px] text-white/40">on {fmtUsd(vault.tvl, { compact: true })} TVL</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-eyebrow text-white/40">Implied delta</p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-white tnum">
              {(risk.netDelta * 100).toFixed(1)}%
            </p>
            <p className="mt-0.5 text-[12px] text-white/40">of NAV · hedged</p>
          </div>
        </div>

        <div className="mt-5 space-y-3 border-t border-white/5 pt-5">
          <p className="text-[12px] text-white/45">Per-book contribution to the shock</p>
          {(["spot", "margin", "predict"] as const).map((b) => {
            const v = perBook[b];
            const width = Math.min(100, Math.abs(v) * 600);
            return (
              <div key={b} className="flex items-center gap-3">
                <span className="w-16 text-[13px] capitalize text-white/65">{b}</span>
                <div className="relative flex h-2 flex-1 items-center">
                  <span className="absolute left-1/2 h-full w-px bg-white/15" />
                  <motion.span
                    key={`${b}-${shock}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${width / 2}%` }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute h-2 rounded-full"
                    style={{
                      backgroundColor: v >= 0 ? "#34D399" : "#FB7185",
                      left: v >= 0 ? "50%" : undefined,
                      right: v < 0 ? "50%" : undefined,
                    }}
                  />
                </div>
                <span
                  className={cn("w-14 text-right tnum text-[12px]", v >= 0 ? "text-up" : "text-down")}
                >
                  {fmtPct(v * 100)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
