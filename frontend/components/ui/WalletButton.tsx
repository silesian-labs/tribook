"use client";

import { useState } from "react";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { AnimatePresence, motion } from "framer-motion";
import { Wallet, SignOut, Copy, ArrowSquareOut, CaretDown } from "@phosphor-icons/react";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/cn";

export function WalletButton({ className }: { className?: string }) {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  if (!account) {
    return (
      <ConnectModal
        open={open}
        onOpenChange={setOpen}
        trigger={
          <button
            className={cn(
              "group inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-[14px] font-medium text-white",
              "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] hover:bg-white/[0.08]",
              className,
            )}
          >
            <Wallet weight="bold" className="h-4 w-4 text-spot" />
            Connect wallet
          </button>
        }
      />
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenu((m) => !m)}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full glass px-3.5 py-2 text-[14px] font-medium text-white",
          "transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] hover:bg-white/[0.08]",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-up shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]" />
        <span className="tnum">{shortAddr(account.address)}</span>
        <CaretDown
          weight="bold"
          className={cn("h-3.5 w-3.5 text-white/50 transition-transform duration-200", menu && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {menu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: "top right" }}
              className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl glass p-1.5 shadow-ambient"
            >
              <div className="px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-eyebrow text-white/40">Connected · Testnet</p>
                <p className="mt-1 break-all font-mono text-[12px] text-white/80">{account.address}</p>
              </div>
              <div className="hairline-x mx-2 my-1" />
              <MenuItem
                icon={<Copy className="h-4 w-4" />}
                label="Copy address"
                onClick={() => {
                  navigator.clipboard?.writeText(account.address);
                  setMenu(false);
                }}
              />
              <MenuItem
                icon={<ArrowSquareOut className="h-4 w-4" />}
                label="View on Sui Explorer"
                onClick={() => {
                  window.open(
                    `https://suiscan.xyz/testnet/account/${account.address}`,
                    "_blank",
                  );
                  setMenu(false);
                }}
              />
              <MenuItem
                icon={<SignOut className="h-4 w-4" />}
                label="Disconnect"
                tone="down"
                onClick={() => {
                  disconnect();
                  setMenu(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "down";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors duration-150 hover:bg-white/[0.06]",
        tone === "down" ? "text-down" : "text-white/80",
      )}
    >
      <span className={tone === "down" ? "text-down/80" : "text-white/50"}>{icon}</span>
      {label}
    </button>
  );
}
