"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

const DURATION_MS = 180;

/** Ticks a number up from 0 in 180ms, ease-out, like a till counting. Reduced motion shows the value directly. */
export function useCountUp(target: number): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / DURATION_MS);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  return reduced || value === null ? target : value;
}
