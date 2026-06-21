"use client";

import { PositionsTable } from "@/components/app/PositionsTable";
import { StressTest } from "@/components/app/StressTest";
import { risk } from "@/lib/mock";
import { fmtPct } from "@/lib/format";
import { ShieldCheck } from "@phosphor-icons/react";

const exposures = [
  { label: "Net delta", value: `${(risk.netDelta * 100).toFixed(1)}%`, sub: "of NAV" },
  { label: "Vega", value: "Low", sub: "predict book" },
  { label: "Gamma", value: risk.gamma.toFixed(2), sub: "convexity" },
  { label: "Leverage", value: `${risk.leverage.toFixed(2)}×`, sub: `cap ${risk.limits.leverage.toFixed(1)}×` },
  { label: "Max drawdown", value: fmtPct(risk.maxDrawdown30d), sub: "30d", tone: "down" as const },
];

const charter = [
  { rule: "Total leverage", value: "1.31×", limit: "≤ 2.0×", ok: true },
  { rule: "Net delta exposure", value: "2.1%", limit: "≤ 30% NAV", ok: true },
  { rule: "Max single position", value: "13.3%", limit: "≤ 20% NAV", ok: true },
  { rule: "Predict allocation", value: "13.1%", limit: "≤ 20%", ok: true },
  { rule: "Idle buffer", value: "5.1%", limit: "≥ 5%", ok: true },
];

export default function RiskPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
            Risk breakdown
          </h1>
          <p className="mt-1 text-[14px] text-white/45">
            Every exposure is computed on-chain before each rebalance.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-up/10 px-3.5 py-2 text-[13px] font-medium text-up">
          <ShieldCheck weight="fill" className="h-4 w-4" />
          All checks within charter
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {exposures.map((e) => (
          <div key={e.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-[11px] uppercase tracking-eyebrow text-white/40">{e.label}</p>
            <p
              className={`mt-2 font-display text-2xl font-semibold tnum ${
                e.tone === "down" ? "text-down" : "text-white"
              }`}
            >
              {e.value}
            </p>
            <p className="mt-1 text-[12px] text-white/40">{e.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="mb-4 text-[15px] font-medium text-white/80">Open positions</h2>
          <PositionsTable />
        </div>

        <div>
          <h2 className="mb-4 text-[15px] font-medium text-white/80">Charter limits</h2>
          <div className="bezel">
            <div className="bezel-core p-6">
              <div className="space-y-3">
                {charter.map((c) => (
                  <div
                    key={c.rule}
                    className="flex items-center justify-between border-b border-white/[0.04] pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-[13px] text-white/75">{c.rule}</p>
                      <p className="text-[11px] text-white/35">{c.limit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tnum text-[13px] font-medium text-white">{c.value}</span>
                      <span className="h-2 w-2 rounded-full bg-up shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
