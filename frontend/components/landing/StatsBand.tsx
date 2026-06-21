"use client";

import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { vault } from "@/lib/mock";
import { fmtCompact } from "@/lib/format";

const stats = [
  { label: "Total value locked", render: () => <Counter value={vault.tvl / 1_000_000} format={(n) => `$${n.toFixed(2)}M`} /> },
  { label: "NAV per share", render: () => <Counter value={vault.navPerShare} format={(n) => n.toFixed(4)} /> },
  { label: "Depositors", render: () => <Counter value={vault.depositors} format={(n) => fmtCompact(n)} /> },
  { label: "Avg rebalance", render: () => <Counter value={372} format={(n) => `${Math.round(n)}ms`} /> },
];

export function StatsBand() {
  return (
    <section className="px-4 py-8">
      <Reveal>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-void/40 px-6 py-8 text-center">
              <div className="font-display text-3xl font-semibold text-white sm:text-4xl">
                {s.render()}
              </div>
              <p className="mt-2 text-[12px] uppercase tracking-eyebrow text-white/40">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
