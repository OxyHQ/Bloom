/**
 * Bar geometry for the fully rounded bar cards (`ComboChartCard`,
 * `EarningsChartCard`) — recharts 3.10 `Rectangle` with a uniform
 * `[r, r, r, r]` radius and `Bar` `barCategoryGap` for a single series.
 */

const clean = (n: number) => Number(n.toFixed(4));

/**
 * recharts `getRectanglePath` for four equal corners: every radius clamped to
 * half the bar's width and height, arcs clockwise from the top-left.
 */
export function roundedBarPath(x: number, y: number, width: number, height: number, radius: number): string {
  if (width <= 0 || height <= 0) return '';
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const f = clean;
  return (
    `M${f(x)},${f(y + r)}` +
    `A${f(r)},${f(r)},0,0,1,${f(x + r)},${f(y)}` +
    `L${f(x + width - r)},${f(y)}` +
    `A${f(r)},${f(r)},0,0,1,${f(x + width)},${f(y + r)}` +
    `L${f(x + width)},${f(y + height - r)}` +
    `A${f(r)},${f(r)},0,0,1,${f(x + width - r)},${f(y + height)}` +
    `L${f(x + r)},${f(y + height)}` +
    `A${f(r)},${f(r)},0,0,1,${f(x)},${f(y + height - r)}Z`
  );
}

/**
 * recharts `getBarPositions` for one series: offset `band × categoryGap`, the
 * width left over rounded to whole pixels, then capped at `maxBarSize` — the
 * capped bar centred on where the uncapped one would have been.
 */
export function singleBarSlot(band: number, categoryGap: number, maxBarSize?: number): { offset: number; size: number } {
  const offset = band * categoryGap;
  let original = band - 2 * offset;
  if (original > 1) original = Math.round(original);
  const size = maxBarSize !== undefined ? Math.min(original, maxBarSize) : original;
  return { offset: offset + (original - size) / 2, size: Math.max(0, size) };
}
