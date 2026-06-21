"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { useVault } from "./vault-state";
import { type Book } from "@/lib/mock";

const bookColor: Record<Book, string> = {
  spot: "#2DD4BF",
  margin: "#8B5CF6",
  predict: "#F5A524",
};

function ago(sec: number) {
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-[18px] w-48 rounded-full bg-white/[0.06]"/>
          <div className="mt-2 flex gap-1.5">
            <div className="h-[26px] w-36 rounded-full bg-white/[0.04]"/>
          </div>
        </div>
        <div className="shrink-0 text-right space-y-1.5">
          <div className="h-[20px] w-10 rounded-full bg-white/[0.04] ml-auto"/>
          <div className="h-[15px] w-12 rounded-full bg-white/[0.03] ml-auto"/>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
        <div className="h-[15px] w-24 rounded-full bg-white/[0.04]"/>
        <div className="h-[15px] w-20 rounded-full bg-white/[0.03]"/>
      </div>
    </div>
  );
}

export function RebalanceFeed() {
  const { feed } = useVault();

  return (
    <div className="bezel">
      <div className="bezel-core p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-medium text-white">Rebalance feed</h3>
            <p className="mt-0.5 text-[12px] text-white/40">Every page turn is one atomic PTB</p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {feed.length === 0 ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <AnimatePresence initial={false}>
              {feed.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: "spring", duration: 0.45, bounce: 0.12 }}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-white">{r.trigger}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.ops.map((op, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] py-1 pl-2 pr-2.5 text-[11px] text-white/65"
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: bookColor[op.book] }}
                            />
                            {op.text}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="rounded-full bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-white/45">
                        {r.ops.length} ops
                      </span>
                      <p className="mt-1.5 tnum text-[11px] text-white/35">{ago(r.agoSec)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
                    <span className="tnum text-[11px] text-up">settled · {r.latencyMs}ms</span>
                    <a
                      href="https://suiscan.xyz/testnet"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-white/40 transition-colors hover:text-spot"
                    >
                      {r.digest}
                      <ArrowSquareOut className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
