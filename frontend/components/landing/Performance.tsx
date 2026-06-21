"use client";

import { useState } from "react";
import { Bezel } from "@/components/ui/Bezel";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { NavChart } from "@/components/charts/NavChart";
import { contributions, risk, vault, navSeries } from "@/lib/mock";
import { fmtPct } from "@/lib/format";
import { motion } from "framer-motion";

const ranges = [
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export function Performance() {
  const [days, setDays] = useState(90);

  return (
    <section id="performance" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Eyebrow dotColor="#F5A524">Performance · since inception</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Risk is on-chain.
              <br />
              <span className="text-white/45">Returns are transparent.</span>
            </h2>
          </div>
          <div className="flex gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {ranges.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                  days === r.days ? "bg-white text-black" : "text-white/55 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <Bezel className="h-full">
              <div className="p-6">
                <div className="mb-2 flex items-baseline gap-3">
                  <span className="font-display text-3xl font-semibold text-white tnum">
                    {vault.navPerShare.toFixed(4)}
                  </span>
                  <span className="text-[13px] text-white/40">NAV / share</span>
                  <span className="ml-auto rounded-full bg-up/10 px-2.5 py-1 tnum text-[12px] font-medium text-up">
                    {fmtPct(vault.sinceInceptionPct)} all-time
                  </span>
                </div>
                <NavChart data={navSeries.slice(-days)} metric="nav" height={280} />
              </div>
            </Bezel>
          </Reveal>

          <Reveal delay={0.08}>
            <Bezel className="h-full">
              <div className="flex h-full flex-col p-6">
                <p className="text-[11px] uppercase tracking-eyebrow text-white/40">
                  Strategy contribution · 7d
                </p>
                <div className="mt-5 space-y-4">
                  {contributions.map((c, i) => {
                    const max = Math.max(...contributions.map((x) => x.pct));
                    return (
                      <div key={c.book}>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-white/70">{c.label}</span>
                          <span className="tnum font-medium text-up">{fmtPct(c.pct)}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(c.pct / max) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: c.color, boxShadow: `0 0 12px ${c.color}88` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-white/5 pt-5">
                  <Metric label="30d Sharpe" value={risk.sharpe30d.toFixed(2)} />
                  <Metric label="Max drawdown" value={fmtPct(risk.maxDrawdown30d)} tone="down" />
                  <Metric label="Hit rate" value={`${Math.round(risk.hitRate * 100)}%`} />
                  <Metric label="Leverage" value={`${risk.leverage.toFixed(2)}×`} />
                </div>
              </div>
            </Bezel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "down" }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-eyebrow text-white/35">{label}</p>
      <p className={`mt-1 tnum text-[15px] font-medium ${tone === "down" ? "text-down" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
