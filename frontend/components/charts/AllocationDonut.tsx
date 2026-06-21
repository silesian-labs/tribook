"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useVault } from "@/components/app/vault-state";
import { fmtUsd } from "@/lib/format";

export function AllocationDonut({ size = 220 }: { size?: number }) {
  const { allocation } = useVault();
  return (
    <div className="relative" style={{ height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={allocation}
            dataKey="pct"
            nameKey="label"
            innerRadius={size * 0.32}
            outerRadius={size * 0.46}
            paddingAngle={3}
            cornerRadius={6}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive
            animationDuration={1100}
            animationEasing="ease-out"
          >
            {allocation.map((a) => (
              <Cell key={a.book} fill={a.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-eyebrow text-white/40">Deployed</span>
        <span className="mt-1 tnum font-display text-2xl font-semibold text-white">
          {fmtUsd(
            allocation.filter((a) => a.book !== "idle").reduce((s, a) => s + a.usd, 0),
            { compact: true },
          )}
        </span>
        <span className="mt-0.5 text-[11px] text-white/40">across 3 books</span>
      </div>
    </div>
  );
}
