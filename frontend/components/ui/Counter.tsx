"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface CounterProps {
  value: number;
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
  from?: number;
}

export function Counter({
  value,
  format = (n) => n.toFixed(2),
  durationMs = 1400,
  className,
  from = 0,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(format(value));
  const started = useRef(false);

  useEffect(() => {
    if (reduce || started.current) return;
    setDisplay(format(from));
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (reduce) {
      setDisplay(format(value));
      return;
    }
    const controls = animate(from, value, {
      duration: durationMs / 1000,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [inView, value, from, durationMs, reduce, format]);

  return (
    <span ref={ref} className={`tnum ${className ?? ""}`}>
      {display}
    </span>
  );
}
