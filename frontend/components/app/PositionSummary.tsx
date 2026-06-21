"use client";

import { useVault } from "./vault-state";
import { fmtUsd, fmtNum } from "@/lib/format";
import { ArrowUp } from "@phosphor-icons/react";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";

export function PositionSummary() {
  const { shares, nav, vaultData, setDepositOpen, setWithdrawOpen } = useVault();
  const value = shares * nav;
  const hasPosition = shares > 0;
  // NAV starts at 1.0 on deploy, so gain = shares × (nav - 1.0)
  const earned = shares * (nav - 1.0);

  const animValue = useAnimatedNumber(value);
  const animEarned = useAnimatedNumber(earned);
  const animShares = useAnimatedNumber(shares);
  const animNav = useAnimatedNumber(nav);
  const animTvl = useAnimatedNumber(vaultData.tvl);
  const animTotalShares = useAnimatedNumber(vaultData.totalShares);
  const animSinceInceptionPct = useAnimatedNumber(vaultData.sinceInceptionPct);

  return (
    <div className="bezel shadow-ambient">
      <div className="bezel-core grid gap-6 p-6 sm:grid-cols-[1.4fr_1fr] sm:p-7">
        <div>
          <p className="text-[11px] uppercase tracking-eyebrow text-white/40">Your position</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="font-display text-4xl font-semibold text-white tnum sm:text-5xl">
              {fmtUsd(animValue)}
            </span>
            {hasPosition && earned > 0.000001 && (
              <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-up/10 px-2 py-1 text-[12px] font-medium text-up">
                <ArrowUp weight="bold" className="h-3 w-3" />
                {fmtUsd(animEarned)}
              </span>
            )}
          </div>
          <p className="mt-2 text-[13px] text-white/45 tnum">
            {hasPosition
              ? `${fmtNum(animShares)} tbUSDC · 1 share = ${animNav.toFixed(4)} USDC`
              : "Deposit USDC to start earning across all three books."}
          </p>

          <div className="mt-5 flex gap-2.5">
            <button
              onClick={() => setDepositOpen(true)}
              className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-black transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
            >
              Deposit
            </button>
            <button
              onClick={() => setWithdrawOpen(true)}
              disabled={!hasPosition}
              className="rounded-full glass px-5 py-2.5 text-[14px] font-medium text-white transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:opacity-40"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Vault summary panel — real data only */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
          <div>
            <p className="text-[12px] text-white/45">Vault summary</p>
          </div>
          <div className="mt-4 space-y-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-white/50">TVL</span>
              <span className="tnum text-white">{fmtUsd(animTvl, { compact: true })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">NAV / share</span>
              <span className="tnum text-white">{animNav.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">Since deploy</span>
              <span className={`tnum font-medium ${animSinceInceptionPct >= 0 ? "text-up" : "text-down"}`}>
                {animSinceInceptionPct >= 0 ? "+" : ""}
                {animSinceInceptionPct.toFixed(4)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">Shares issued</span>
              <span className="tnum text-white">{fmtNum(animTotalShares)}</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-white/20">
            APY requires multi-day history · not available on testnet
          </p>
        </div>
      </div>
    </div>
  );
}
