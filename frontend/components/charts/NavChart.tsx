"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtUsd } from "@/lib/format";
import type { Snapshot } from "@/app/api/nav-history/route";

type Metric = "nav" | "tvl";

export function NavChart({
  data,
  metric = "nav",
  height = 260,
  color = "#2DD4BF",
}: {
  data: Snapshot[];
  metric?: Metric;
  height?: number;
  color?: string;
}) {
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.01]"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-[13px] text-white/30">Collecting data…</p>
          <p className="mt-1 text-[11px] text-white/20">
            {data.length === 0
              ? "First snapshot incoming"
              : `${data.length} snapshot${data.length !== 1 ? "s" : ""} · need at least 2`}
          </p>
        </div>
      </div>
    );
  }

  const domainPadding = metric === "nav" ? 0.0001 : 0;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
            <stop offset="60%"  stopColor={color} stopOpacity={0.06} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={60}
          interval="preserveStartEnd"
        />
        <YAxis
          hide
          domain={[
            (min: number) => min - domainPadding,
            (max: number) => max + domainPadding,
          ]}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as Snapshot;
            return (
              <div className="rounded-xl glass px-3 py-2 shadow-ambient">
                <p className="text-[10px] uppercase tracking-eyebrow text-white/40">{p.label}</p>
                <p className="mt-0.5 tnum text-sm font-medium text-white">
                  {metric === "nav" ? p.nav.toFixed(4) : fmtUsd(p.tvl, { compact: true })}
                  {metric === "nav" && (
                    <span className="ml-1 text-[11px] text-white/40">/ share</span>
                  )}
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey={metric}
          stroke={color}
          strokeWidth={2}
          fill={`url(#fill-${metric})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: "#050507", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
