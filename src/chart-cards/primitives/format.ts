import type { ChartDeltaTone } from '../geometry';

import {
  formatCompactNumber,
  formatInteger,
  formatNumber as formatLocaleNumber,
  formatPercent,
  formatSignedPercent,
} from '../../locale/format-number';

/**
 * Number formatting shared by the chart cards, in the reader's locale
 * (`locale` is what the card resolved; `undefined` is the runtime's). They go
 * through `locale/format-number.ts`, which uses the engine's
 * `Intl.NumberFormat` — Hermes has it — and falls back to English grouping.
 */

/** `1234567.8` → `"1,234,568"` (en), `"1.234.568"` (de) — a whole number with grouping. */
export function groupThousands(value: number, locale?: string): string {
  return formatInteger(value, locale);
}

/**
 * Grouping that keeps up to three fraction digits (`48.8` → `"48.8"`,
 * `12500` → `"12,500"`, `"12.500"` in German). A value that rounds to zero
 * reads `0`, never `-0`.
 */
export function formatNumber(value: number, locale?: string): string {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 1000) / 1000;
  return formatLocaleNumber(rounded === 0 ? 0 : rounded, locale);
}

/** Compact axis-tick format: `4.5K`, `13K` (en), `4,5 mil` (es); the rounded number under a thousand. */
export function compactNumber(value: number, locale?: string): string {
  return formatCompactNumber(value, locale);
}

/** `0.25` → `"25%"` (en), `"25 %"` (fr), `"%25"` (tr) — the 100% chart's axis. */
export function percentTick(value: number, locale?: string): string {
  return formatPercent(value, locale);
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
export function describeDeltaRatio(delta: number, locale?: string): ChartDelta {
  // Rounded to the tenth of a percent it is shown at, so the sign and the tone
  // agree with the number on screen.
  const rounded = Math.round(delta * 1000) / 1000;
  // Zero keeps its tenth ("0.0%"); anything else shows a tenth only when it has one ("+5.2%", "-5%").
  if (rounded === 0) return { label: formatPercent(0, locale, 1), tone: 'neutral' };
  return {
    label: formatSignedPercent(rounded, locale, { minimum: 0, maximum: 1 }),
    tone: rounded > 0 ? 'positive' : 'negative',
  };
}

/** Decimal places a value carries, capped at 2 — what the count-up must preserve. */
export function decimalsOf(value: number): number {
  if (Number.isInteger(value)) return 0;
  return Math.abs(value * 10 - Math.round(value * 10)) < 1e-6 ? 1 : 2;
}
