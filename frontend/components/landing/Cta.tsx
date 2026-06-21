"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function Cta() {
  return (
    <section className="px-4 py-24 sm:py-32">
      <Reveal>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] px-6 py-20 text-center">
          {/* orbs */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 left-[20%] h-60 w-60 rounded-full bg-spot/25 blur-[110px]" />
            <div className="absolute -bottom-24 right-[18%] h-64 w-64 rounded-full bg-margin/25 blur-[120px]" />
          </div>
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              Put your USDC
              <br />
              <span className="bg-gradient-to-r from-spot via-margin to-predict bg-clip-text text-transparent">
                to work across all three.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-[16px] text-white/55">
              One deposit. One token. Three books working in a single transaction.
              Non-custodial — withdraw to your wallet anytime.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/app">
                <Button trailingIcon>Launch app</Button>
              </Link>
              <Link href="#books">
                <Button variant="glass">Explore the books</Button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
