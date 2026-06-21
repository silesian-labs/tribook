"use client";

import { useVault } from "./vault-state";
import { fmtUsd, fmtCompact } from "@/lib/format";
import { ReactNode } from "react";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";

function Tile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-[11px] uppercase tracking-eyebrow text-white/40">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-white tnum">{value}</p>
      {sub && <p className="mt-1 text-[12px]">{sub}</p>}
    </div>
  );
}

export function StatTiles() {
  const { vaultData } = useVault();
  const animTvl = useAnimatedNumber(vaultData.tvl);
  const animNav = useAnimatedNumber(vaultData.navPerShare);
  const animSinceInceptionPct = useAnimatedNumber(vaultData.sinceInceptionPct);
  const animTotalShares = useAnimatedNumber(vaultData.totalShares);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        label="Total value locked"
        value={fmtUsd(animTvl, { compact: true })}
        sub={<span className="text-white/30">from vault on-chain</span>}
      />
      <Tile
        label="NAV / share"
        value={animNav.toFixed(4)}
        sub={
          vaultData.sinceInceptionPct !== 0 ? (
            <span className="text-up">+{animSinceInceptionPct.toFixed(4)}% since deploy</span>
          ) : (
            <span className="text-white/30">no change yet</span>
          )
        }
      />
      <Tile
        label="Total shares"
        value={fmtCompact(animTotalShares)}
        sub={<span className="text-white/30">tbUSDC in circulation</span>}
      />
      <Tile
        label="Fees"
        value={
          <span className="text-white/60 text-xl">
            {vaultData.performanceFee}% / {vaultData.managementFee}%
          </span>
        }
        sub={<span className="text-white/30">perf · mgmt</span>}
      />
    </div>
  );
}
