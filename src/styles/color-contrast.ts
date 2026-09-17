/**
 * WCAG relative luminance and contrast ratio — ONE copy for every family that
 * picks a readable text colour over a computed surface (artwork tints, energy
 * labels, generated covers). Seven families had grown their own copy.
 */
import { parseRgba } from '../theme/color-utils';

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance (0..1) of an opaque colour; `null` if it does not parse. */
export function relativeLuminance(color: string): number | null {
  const c = parseRgba(color);
  if (!c) return null;
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** WCAG contrast ratio between two opaque colours (1..21); `1` if either does not parse. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return 1;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
