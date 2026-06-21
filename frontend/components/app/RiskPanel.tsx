"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldWarning } from "@phosphor-icons/react";
import { useVault } from "./vault-state";
import { cn } from "@/lib/cn";

export function RiskPanel() {
  const { risk } = useVault();

  const leverageFill = Math.min(1, risk.leverage / risk.limits.leverage);
  const leverageColor = leverageFill > 0.8 ? "warn" : "ok";

  return (
    <div className="bezel">
      <div className="bezel-core p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-white">Risk · live</h3>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
              risk.withinCharter
                ? "bg-up/10 text-up"
                : "bg-predict/10 text-predict",
            )}
          >
            {risk.withinCharter ? (
              <ShieldCheck weight="fill" className="h-3.5 w-3.5" />
            ) : (
              <ShieldWarning weight="fill" className="h-3.5 w-3.5" />
            )}
            {risk.withinCharter ? "Within charter" : "Over leverage cap"}
          </span>
        </div>

        {/* Leverage — real, from chain */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-white/70">Leverage</span>
            <span className="tnum text-[14px] font-medium text-white">
              {risk.leverage.toFixed(2)}×
            </span>
          </div>
          <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, leverageFill * 100)}%` }}
              transition={{ duration: 1, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className={cn("h-full rounded-full", leverageColor === "ok" ? "bg-up" : "bg-predict")}
              style={{
                boxShadow: leverageColor === "ok"
                  ? "0 0 12px rgba(52,211,153,0.6)"
                  : "0 0 12px rgba(245,165,36,0.6)",
              }}
            />
            <span className="absolute right-0 top-0 h-full w-px bg-white/20" />
          </div>
          <p className="mt-1 text-[11px] text-white/35">cap {risk.limits.leverage.toFixed(1)}×</p>
        </div>

        {/* Metrics requiring off-chain analytics — shown as N/A */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/5 pt-5 text-[12px]">
          <div>
            <p className="text-white/40">Net delta</p>
            <p className="mt-0.5 tnum font-medium text-white/25">— n/a</p>
          </div>
          <div>
            <p className="text-white/40">Vega exposure</p>
            <p className="mt-0.5 tnum font-medium text-white/25">— n/a</p>
          </div>
          <div>
            <p className="text-white/40">30d Sharpe</p>
            <p className="mt-0.5 tnum font-medium text-white/25">— n/a</p>
          </div>
          <div>
            <p className="text-white/40">Hit rate</p>
            <p className="mt-0.5 tnum font-medium text-white/25">— n/a</p>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-white/20">
          Advanced risk metrics require off-chain analytics not available on testnet.
        </p>

        <Link
          href="/app/risk"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-white/55 transition-colors hover:text-white"
        >
          Full risk breakdown
        </Link>
      </div>
    </div>
  );
}
