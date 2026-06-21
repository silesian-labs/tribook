"use client";

import { useEffect, useState } from "react";

interface LiveValueProps {
  base: number;
  // per-tick drift as a fraction of base, applied with small noise
  driftPerTick?: number;
  jitter?: number;
  intervalMs?: number;
  format: (n: number) => string;
  className?: string;
}

// Simulates a slowly-ticking live metric. Starts from the deterministic `base`
// (matches SSR), then drifts on the client only.
export function LiveValue({
  base,
  driftPerTick = 0.000004,
  jitter = 0.000015,
  intervalMs = 2400,
  format,
  className,
}: LiveValueProps) {
  const [val, setVal] = useState(base);

  useEffect(() => {
    const id = setInterval(() => {
      setVal((v) => {
        const noise = (Math.random() - 0.4) * jitter * base;
        return v + driftPerTick * base + noise;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [base, driftPerTick, jitter, intervalMs]);

  return (
    <span className={`tnum tabular-nums ${className ?? ""}`}>{format(val)}</span>
  );
}
