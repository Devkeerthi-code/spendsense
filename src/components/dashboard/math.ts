/** Share of `part` in `whole` as a percentage clamped to 0-100, for bar widths. */
export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, (part * 100) / whole));
}
