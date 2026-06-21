"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { ReactNode, useEffect } from "react";

export function Modal({
  open,
  onClose,
  children,
  title,
  accent = "#2DD4BF",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  accent?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 backdrop-blur-md"
            style={{ background: "rgba(5,5,7,0.7)" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.18 }}
            className="bezel relative z-10 w-full max-w-[420px] shadow-ambient"
          >
            <div
              className="pointer-events-none absolute inset-x-8 -top-px h-px opacity-80"
              style={{ background: `linear-gradient(90deg,transparent,${accent},transparent)` }}
            />
            <div className="bezel-core p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors duration-150 hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <X weight="bold" className="h-4 w-4" />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
