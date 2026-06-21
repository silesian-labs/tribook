"use client";

import { Bezel } from "@/components/ui/Bezel";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Sparkline } from "@/components/ui/Sparkline";
import { books, navSeries } from "@/lib/mock";

const shapes: Record<string, number[]> = {
  spot: navSeries.slice(-24).map((p, i) => p.nav + Math.sin(i / 2) * 0.002),
  margin: navSeries.slice(-24).map((p, i) => p.nav + Math.cos(i / 3) * 0.003),
  predict: navSeries.slice(-24).map((p, i) => p.nav + Math.sin(i / 1.5) * 0.005 * (i > 16 ? 1.6 : 1)),
};

export function ThreeBooks() {
  return (
    <section id="books" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal className="max-w-2xl">
          <Eyebrow>The three books</Eyebrow>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Three sources of alpha,
            <br />
            <span className="text-white/45">one share of the vault.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/50">
            Each book has its own edge and its own risk profile. The trader sizes
            them with risk-parity and rebalances across all three — atomically.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {books.map((b, i) => (
            <Reveal key={b.key} delay={i * 0.08}>
              <Bezel glow={b.key} className="group h-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1">
                <div className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <span
                      className="tnum text-[13px] font-medium"
                      style={{ color: b.color }}
                    >
                      0{i + 1}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                      {b.risk}
                    </span>
                  </div>

                  <div className="mt-8 flex items-baseline gap-2">
                    <h3 className="font-display text-3xl font-semibold text-white">{b.name}</h3>
                  </div>
                  <p className="mt-1 text-[13px]" style={{ color: b.color }}>
                    {b.tag}
                  </p>

                  <p className="mt-4 flex-1 text-[14px] leading-relaxed text-white/50">
                    {b.thesis}
                  </p>

                  <div className="mt-6 flex items-end justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-eyebrow text-white/35">Target APY</p>
                      <p className="mt-1 font-display text-xl font-semibold text-white">{b.apy}</p>
                    </div>
                    <Sparkline
                      data={shapes[b.key]}
                      color={b.color}
                      width={96}
                      height={40}
                    />
                  </div>
                </div>
              </Bezel>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
