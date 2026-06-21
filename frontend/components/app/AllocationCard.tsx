"use client";

import { AllocationDonut } from "@/components/charts/AllocationDonut";
import { useVault } from "./vault-state";
import { fmtUsd } from "@/lib/format";

export function AllocationCard() {
  const { allocation } = useVault();
  return (
    <div className="bezel">
      <div className="bezel-core p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-white">Allocation</h3>
          <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45">
            risk-parity
          </span>
        </div>

        <AllocationDonut size={200} />

        <div className="mt-2 space-y-2.5">
          {allocation.map((a) => (
            <div key={a.book} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ backgroundColor: a.color }} />
              <span className="flex-1 truncate text-[13px] text-white/70">{a.label}</span>
              <span className="tnum text-[13px] text-white/45">{a.pct.toFixed(1)}%</span>
              <span className="w-16 text-right tnum text-[13px] text-white/80">
                {fmtUsd(a.usd, { compact: true })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
