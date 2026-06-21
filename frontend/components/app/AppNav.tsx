"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { WalletButton } from "@/components/ui/WalletButton";
import { useVault } from "./vault-state";
import { cn } from "@/lib/cn";
import { Plus } from "@phosphor-icons/react";

const links = [
  { label: "Vault", href: "/app" },
  { label: "Risk", href: "/app/risk" },
];

export function AppNav() {
  const pathname = usePathname();
  const { setDepositOpen } = useVault();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4">
      <nav className="mt-4 flex w-full max-w-6xl items-center justify-between gap-3 rounded-full glass px-3 py-2 pl-5 shadow-ambient">
        <div className="flex items-center gap-5">
          <Link href="/">
            <Logo />
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-[14px] transition-colors duration-200",
                    active ? "text-white" : "text-white/55 hover:text-white",
                  )}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full bg-white/[0.07] ring-1 ring-white/10" />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDepositOpen(true)}
            className="group hidden items-center gap-1.5 rounded-full bg-white py-2 pl-4 pr-2 text-[14px] font-medium text-black transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] sm:flex"
          >
            Deposit
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 group-hover:rotate-90">
              <Plus weight="bold" className="h-3.5 w-3.5" />
            </span>
          </button>
          <WalletButton />
        </div>
      </nav>
    </header>
  );
}
