"use client";

import { Bezel } from "@/components/ui/Bezel";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { motion } from "framer-motion";
import { CheckCircle, Lightning, Stack, ShieldCheck } from "@phosphor-icons/react";

const ops = [
  { book: "spot", color: "#2DD4BF", text: "Cancel 2 stale bids on SUI/USDC, requote ±0.35%" },
  { book: "spot", color: "#2DD4BF", text: "Refresh DEEP/USDC quotes to new volatility band" },
  { book: "margin", color: "#8B5CF6", text: "Trim SUI-PERP short to 1.4× leverage" },
  { book: "predict", color: "#F5A524", text: "Mint 4.0–4.4 vertical as delta hedge" },
];

const pillars = [
  {
    icon: Stack,
    title: "Atomic composition",
    body: "A single PTB executes the whole plan — cancel, requote, hedge, mint — with all-or-nothing settlement. No partial fills, no sequencing risk.",
  },
  {
    icon: Lightning,
    title: "Shared liquidity",
    body: "All three primitives settle against the same DeepBook liquidity in sub-400ms. The same capital works three books at once.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent risk",
    body: "Delta, vega and leverage are computed on-chain before every page turn. Every share shows its exposures in real time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="px-4 py-24 sm:py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
        {/* left: pillars */}
        <div>
          <Reveal>
            <Eyebrow dotColor="#8B5CF6">Impossible anywhere else</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              One transaction.
              <br />
              <span className="text-white/45">All three books.</span>
            </h2>
          </Reveal>

          <div className="mt-10 space-y-7">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="flex gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <p.icon className="h-5 w-5 text-white/80" weight="light" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-white">{p.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-white/50">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* right: animated PTB bundle */}
        <Reveal delay={0.1}>
          <Bezel glow="margin" className="shadow-ambient">
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightning weight="fill" className="h-4 w-4 text-margin" />
                  <span className="text-[13px] font-medium text-white">atomic_rebalance(plan)</span>
                </div>
                <span className="rounded-full bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-white/45">
                  1 PTB
                </span>
              </div>

              <div className="space-y-2.5">
                {ops.map((op, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.18, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: op.color, boxShadow: `0 0 10px ${op.color}` }}
                    />
                    <span className="flex-1 text-[13px] text-white/70">{op.text}</span>
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.55 + i * 0.18, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <CheckCircle weight="fill" className="h-4 w-4 text-up" />
                    </motion.span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.25, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="mt-5 flex items-center justify-between rounded-2xl border border-up/20 bg-up/[0.06] px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle weight="fill" className="h-4 w-4 text-up" />
                  <span className="text-[13px] font-medium text-up">Settled · all-or-nothing</span>
                </div>
                <span className="tnum font-mono text-[12px] text-up/80">380 ms</span>
              </motion.div>
            </div>
          </Bezel>
        </Reveal>
      </div>
    </section>
  );
}
