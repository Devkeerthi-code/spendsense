"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/@.";
const DURATION_MS = 160;

function scrambled(text: string, revealed: number): string {
  let out = text.slice(0, revealed);
  for (let i = revealed; i < text.length; i++) {
    out += text[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return out;
}

/**
 * Resolves `text` from random glyphs, left to right, in 160ms (after `delayMs`). Re-runs whenever `runKey`
 * changes. Screen readers get the final text through the caller's aria-label, never the noise.
 */
export function useScramble(text: string, runKey: number, delayMs = 0): string {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState<{ key: string; value: string } | null>(null);
  const id = `${text}:${runKey}`;

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + delayMs;
      const p = Math.max(0, Math.min(1, (now - start) / DURATION_MS));
      setFrame({ key: id, value: p >= 1 ? text : scrambled(text, Math.floor(p * text.length)) });
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [id, text, delayMs, reduced]);

  if (reduced) return text;
  return frame?.key === id ? frame.value : text;
}
