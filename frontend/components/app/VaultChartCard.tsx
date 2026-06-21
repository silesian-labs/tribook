"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { NavChart } from "@/components/charts/NavChart";
import { useVault } from "./vault-state";
import { fmtUsd } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Snapshot } from "@/lib/nav-poller";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";

type Metric = "nav" | "tvl";

const FETCH_INTERVAL_MS = 15_000;

export function VaultChartCard() {
  const [metric, setMetric] = useState<Metric>("nav");
  const { vaultData } = useVault();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/nav-history");
      if (!res.ok) return;
      const json = await res.json();
      setSnapshots(json.snapshots ?? []);
      setLastFetched(Date.now());
    } catch {
      // silently ignore network errors
    }
  }, []);

  // Fetch immediately + poll every 15 s
  useEffect(() => {
    fetchHistory();
    const id = setInterval(fetchHistory, FETCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchHistory]);

  // Append a live point using vaultData (updated every 8s by useSuiClientQuery)
  // so the chart always ends at the actual current value, not the last 15s snapshot.
  const chartData = useMemo<Snapshot[]>(() => {
    if (snapshots.length === 0) return [];
    const liveLabel = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    const livePoint: Snapshot = {
      t: Date.now(),
      nav: vaultData.navPerShare,
      tvl: vaultData.tvl,
      label: liveLabel,
    };
    // Only append if live value differs meaningfully from last snapshot
    const last = snapshots[snapshots.length - 1];
    const navDiff = Math.abs(livePoint.nav - last.nav);
    const tvlDiff = Math.abs(livePoint.tvl - last.tvl);
    if (navDiff > 0.000001 || tvlDiff > 0.001) {
      return [...snapshots, livePoint];
    }
    return snapshots;
  }, [snapshots, vaultData.navPerShare, vaultData.tvl]);

  const currentValue =
    metric === "nav" ? vaultData.navPerShare : vaultData.tvl;

  const animCurrentValue = useAnimatedNumber(currentValue);
  const animNav = useAnimatedNumber(vaultData.navPerShare);
  const animTvl = useAnimatedNumber(vaultData.tvl);
  const animTotalShares = useAnimatedNumber(vaultData.totalShares);
  const animSinceInceptionPct = useAnimatedNumber(vaultData.sinceInceptionPct);

  const change =
    chartData.length >= 2
      ? metric === "nav"
        ? ((chartData[chartData.length - 1].nav - chartData[0].nav) /
            Math.max(1e-9, chartData[0].nav)) *
          100
        : ((chartData[chartData.length - 1].tvl - chartData[0].tvl) /
            Math.max(1, chartData[0].tvl)) *
          100
      : null;

  return (
    <div className="bezel">
      <div className="bezel-core p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {/* Metric toggle */}
            <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
              {(["nav", "tvl"] as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium transition-colors duration-200",
                    metric === m
                      ? "bg-white text-black"
                      : "text-white/55 hover:text-white",
                  )}
                >
                  {m === "nav" ? "NAV / share" : "TVL"}
                </button>
              ))}
            </div>

            {/* Current value */}
            <p className="mt-3 font-display text-3xl font-semibold text-white tnum">
              {metric === "nav"
                ? animCurrentValue.toFixed(4)
                : fmtUsd(animCurrentValue, { compact: true })}
            </p>

            {/* Change over visible window */}
            {change !== null ? (
              <p
                className={cn(
                  "mt-1 text-[12px] tnum",
                  change >= 0 ? "text-up" : "text-down",
                )}
              >
                {change >= 0 ? "+" : ""}
                {change.toFixed(4)}%{" "}
                <span className="text-white/30">
                  over {chartData.length} snapshots
                </span>
              </p>
            ) : (
              <p className="mt-1 text-[12px] text-white/30">
                {snapshots.length === 0
                  ? "Indexer starting…"
                  : "Collecting history…"}
              </p>
            )}
          </div>

          {/* Snapshot count badge */}
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/40">
              <span
                className="h-1.5 w-1.5 rounded-full bg-up"
                style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }}
              />
              live indexer
            </span>
            {lastFetched && (
              <p className="text-[10px] text-white/20">
                {snapshots.length} snapshots · every 15s
              </p>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="mt-4">
          <NavChart
            data={chartData}
            metric={metric}
            height={220}
            color={metric === "nav" ? "#2DD4BF" : "#8B5CF6"}
          />
        </div>

        {/* Stat row */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 text-[12px] sm:grid-cols-4">
          <div>
            <p className="text-white/40">NAV / share</p>
            <p className="mt-0.5 tnum font-medium text-white">
              {animNav.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-white/40">TVL</p>
            <p className="mt-0.5 tnum font-medium text-white">
              {fmtUsd(animTvl, { compact: true })}
            </p>
          </div>
          <div>
            <p className="text-white/40">Shares issued</p>
            <p className="mt-0.5 tnum font-medium text-white">
              {animTotalShares.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-white/40">Since deploy</p>
            <p
              className={cn(
                "mt-0.5 tnum font-medium",
                vaultData.sinceInceptionPct >= 0 ? "text-up" : "text-down",
              )}
            >
              {vaultData.sinceInceptionPct >= 0 ? "+" : ""}
              {animSinceInceptionPct.toFixed(4)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
