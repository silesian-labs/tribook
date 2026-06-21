"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, ArrowSquareOut, X } from "@phosphor-icons/react";
import { useVault } from "./vault-state";

const toneColor = {
  default: "#2DD4BF",
  up: "#34D399",
  down: "#FB7185",
};

export function Toaster() {
  const { toasts, dismissToast } = useVault();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
            className="pointer-events-auto overflow-hidden rounded-2xl glass p-3.5 shadow-ambient"
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${toneColor[t.tone ?? "default"]}1f` }}
              >
                <CheckCircle weight="fill" className="h-4 w-4" style={{ color: toneColor[t.tone ?? "default"] }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white">{t.title}</p>
                {t.body && <p className="mt-0.5 text-[12px] text-white/55">{t.body}</p>}
                {t.digest && (
                  <a
                    href="https://suiscan.xyz/testnet"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] text-white/40 transition-colors hover:text-spot"
                  >
                    {t.digest}
                    <ArrowSquareOut className="h-3 w-3" />
                  </a>
                )}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-white/30 transition-colors hover:text-white/70"
                aria-label="Dismiss"
              >
                <X weight="bold" className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
