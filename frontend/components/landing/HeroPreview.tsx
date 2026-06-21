"use client";

import { Bezel } from "@/components/ui/Bezel";
import { Sparkline } from "@/components/ui/Sparkline";
import { LiveValue } from "@/components/ui/LiveValue";
import { allocation, navSeries, vault } from "@/lib/mock";
import { fmtUsd, fmtPct } from "@/lib/format";
import { motion } from "framer-motion";

const navData = navSeries.slice(-40).map((p) => p.nav);

export function HeroPreview() {
  return (
    <Bezel className="shadow-ambient" innerClassName="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <span className="hidden text-[12px] text-white/30 sm:inline">tribook.xyz/app</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-up/10 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
          <span className="text-[11px] font-medium text-up">the trader · live</span>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1.3fr_1fr] sm:p-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-eyebrow text-white/40">NAV / share</p>
              <p className="mt-1.5 font-display text-3xl font-semibold text-white">
                <LiveValue base={vault.navPerShare} format={(n) => n.toFixed(4)} />
              </p>
            </div>
            <span className="rounded-full bg-up/10 px-2.5 py-1 tnum text-[12px] font-medium text-up">
              {fmtPct(vault.change24hPct)}
            </span>
          </div>
          <div className="mt-4">
            <Sparkline data={navData} width={360} height={64} color="#2DD4BF" className="w-full" strokeWidth={2} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
            <Stat label="TVL" value={fmtUsd(vault.tvl, { compact: true })} />
            <Stat label="7d APY" value={fmtPct(vault.apy7d, 1)} tone="up" />
            <Stat label="Leverage" value="1.31×" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-5">
          <p className="text-[11px] uppercase tracking-eyebrow text-white/40">Allocation</p>
          <div className="mt-4 space-y-3.5">
            {allocation.map((a, i) => (
              <div key={a.book}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-white/70">{a.label.split(" · ")[0]}</span>
                  <span className="tnum text-white/45">{a.pct.toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${a.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: a.color, boxShadow: `0 0 12px ${a.color}66` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-spot" />
            <span className="truncate text-[11px] text-white/45">
              Atomic rebalance · 3 ops · 380ms
            </span>
          </div>
        </div>
      </div>
    </Bezel>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-eyebrow text-white/35">{label}</p>
      <p className={`mt-1 tnum text-[14px] font-medium ${tone === "up" ? "text-up" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
