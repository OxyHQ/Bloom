import type { ChartDeltaTone } from '../geometry';

/**
 * Number formatting shared by the chart cards. Pure and `Intl`-free, so it
 * formats identically on Hermes, JSC and every browser.
 */

/** `1234567.8` → `"1,234,568"` — en-US grouping (`toLocaleString("en-US")`-equivalent) for whole numbers. */
export function groupThousands(value: number): string {
  const rounded = Math.round(value);
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return rounded < 0 ? `-${digits}` : digits;
}

/**
 * En-US grouping that keeps up to three fraction
 * digits (`48.8` → `"48.8"`, `12500` → `"12,500"`).
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const fixed = (Math.round(Math.abs(value) * 1000) / 1000).toString();
  const [int = '0', frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = value < 0 && Number(fixed) !== 0 ? '-' : '';
  return frac ? `${sign}${grouped}.${frac}` : `${sign}${grouped}`;
}

/** Compact axis-tick format: `4.5K`, `13K`, or the rounded number under a thousand. */
export function compactNumber(value: number): string {
  return value >= 1000 ? `${Math.round(value / 100) / 10}K`.replace('.0K', 'K') : String(Math.round(value));
}

/** `0.25` → `"25%"` — the 100% chart's axis. */
export function percentTick(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export interface ChartDelta {
  label: string;
  tone: ChartDeltaTone;
}

/**
 * Formats a delta RATIO (`0.052`) to
 * `"+5.2%"` with a lime / rose / neutral chip for the chart cards. Zero reads `"0.0%"`.
 *
 * (The dashboard revenue / orders cards compare two totals instead — that is
 * `describeDelta(current, previous)` in `geometry.ts`.)
 */
export function describeDeltaRatio(delta: number): ChartDelta {
  const pct = Math.round(Math.abs(delta) * 1000) / 10;
  if (pct === 0) return { label: '0.0%', tone: 'neutral' };
  return { label: `${delta > 0 ? '+' : '-'}${pct}%`, tone: delta > 0 ? 'positive' : 'negative' };
}

/** Decimal places a value carries, capped at 2 — what the count-up must preserve. */
export function decimalsOf(value: number): number {
  if (Number.isInteger(value)) return 0;
  return Math.abs(value * 10 - Math.round(value * 10)) < 1e-6 ? 1 : 2;
}
