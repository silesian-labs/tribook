"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HeroPreview } from "./HeroPreview";
import { PlayCircle } from "@phosphor-icons/react";

const ease = [0.23, 1, 0.32, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 26, filter: "blur(10px)" },
    animate: reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, delay, ease },
  });

  return (
    <section className="relative overflow-hidden px-4 pt-36 pb-16 sm:pt-44">
      {/* localized drifting orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-[12%] h-72 w-72 rounded-full bg-spot/20 blur-[120px] animate-drift-a" />
        <div className="absolute top-10 right-[10%] h-80 w-80 rounded-full bg-margin/20 blur-[130px] animate-drift-b" />
        <div className="absolute top-[40%] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-predict/10 blur-[120px] animate-drift-a" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <motion.div {...rise(0)} className="flex justify-center">
          <Eyebrow>DeepBook Predict · live on testnet</Eyebrow>
        </motion.div>

        <motion.h1
          {...rise(0.08)}
          className="mt-7 font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl"
        >
          <span className="text-sheen">Three books,</span>
          <br />
          <span className="bg-gradient-to-r from-spot via-margin to-predict bg-clip-text text-transparent">
            one strategy.
          </span>
        </motion.h1>

        <motion.p
          {...rise(0.16)}
          className="mx-auto mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-white/55"
        >
          The first vault on Sui that composes all three DeepBook primitives —
          Spot, Margin and Predict — into one capital-efficient strategy.
          Deposit USDC. We read all three books at once.
        </motion.p>

        <motion.div
          {...rise(0.24)}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/app">
            <Button trailingIcon>Launch app</Button>
          </Link>
          <Link href="#how">
            <Button variant="glass" icon={<PlayCircle weight="fill" className="h-4 w-4" />}>
              Watch how it works
            </Button>
          </Link>
        </motion.div>

        <motion.p {...rise(0.32)} className="mt-5 text-[12px] text-white/35">
          Non-custodial · Atomic PTBs · Sui Testnet
        </motion.p>
      </div>

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60, filter: "blur(14px)" }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.1, delay: 0.36, ease }}
        className="mx-auto mt-16 max-w-5xl"
      >
        <HeroPreview />
      </motion.div>
    </section>
  );
}
