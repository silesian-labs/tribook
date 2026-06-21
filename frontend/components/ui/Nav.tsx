"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

interface NavLink {
  label: string;
  href: string;
}

export function Nav({
  links,
  cta,
  showWallet = false,
}: {
  links: NavLink[];
  cta?: { label: string; href: string };
  showWallet?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4">
        <nav
          className={cn(
            "mt-4 flex w-full max-w-5xl items-center justify-between gap-3 rounded-full px-3 py-2 pl-5 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
            scrolled
              ? "glass shadow-ambient"
              : "border border-transparent bg-transparent",
          )}
        >
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-[14px] text-white/65 transition-colors duration-200 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {showWallet && (
              <div className="hidden sm:block">
                <WalletButton />
              </div>
            )}
            {cta && (
              <Link href={cta.href} className="hidden sm:block">
                <Button trailingIcon className="!py-1.5">
                  {cta.label}
                </Button>
              </Link>
            )}

            {/* Hamburger → X morph */}
            <button
              aria-label="Menu"
              onClick={() => setOpen((o) => !o)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full glass md:hidden"
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={cn(
                    "absolute left-0 top-1 h-[1.5px] w-5 bg-white transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    open && "top-1/2 -translate-y-1/2 rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "absolute bottom-1 left-0 h-[1.5px] w-5 bg-white transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    open && "bottom-1/2 translate-y-1/2 -rotate-45",
                  )}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Full-screen mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-30 flex flex-col justify-center px-8 backdrop-blur-3xl md:hidden"
            style={{ background: "rgba(5,5,7,0.86)" }}
          >
            <div className="flex flex-col gap-2">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-4xl font-medium text-white/90"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + links.length * 0.06, duration: 0.5 }}
              className="mt-10 flex flex-col items-start gap-4"
            >
              {showWallet && <WalletButton />}
              {cta && (
                <Link href={cta.href} onClick={() => setOpen(false)}>
                  <Button trailingIcon>{cta.label}</Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
