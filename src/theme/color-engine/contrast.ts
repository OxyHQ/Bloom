/**
 * Bloom colour engine — contrast in tone space.
 *
 * Faithful port of Material Color Utilities' `Contrast` (Apache-2.0). Because
 * HCT tone maps to L*, contrast ratios can be computed and *targeted* directly
 * in tone: given a tone and a desired WCAG ratio, find the lighter/darker tone
 * that hits it. Drives every role's on-colour and container legibility.
 */
import { clampDouble } from './math-utils';
import { lstarFromY, yFromLstar } from './color-utils';

/** WCAG contrast ratio between two tones (L*). */
export function ratioOfTones(toneA: number, toneB: number): number {
  toneA = clampDouble(0.0, 100.0, toneA);
  toneB = clampDouble(0.0, 100.0, toneB);
  return ratioOfYs(yFromLstar(toneA), yFromLstar(toneB));
}

export function ratioOfYs(y1: number, y2: number): number {
  const lighter = y1 > y2 ? y1 : y2;
  const darker = lighter === y2 ? y1 : y2;
  return (lighter + 5.0) / (darker + 5.0);
}

/** Lightest tone that hits `ratio` against `tone`, or -1 if impossible. */
export function lighter(tone: number, ratio: number): number {
  if (tone < 0.0 || tone > 100.0) return -1.0;
  const darkY = yFromLstar(tone);
  const lightY = ratio * (darkY + 5.0) - 5.0;
  const realContrast = ratioOfYs(lightY, darkY);
  const delta = Math.abs(realContrast - ratio);
  if (realContrast < ratio && delta > 0.04) return -1;
  const returnValue = lstarFromY(lightY) + 0.4;
  return returnValue < 0 || returnValue > 100 ? -1 : returnValue;
}

/** Darkest tone that hits `ratio` against `tone`, or -1 if impossible. */
export function darker(tone: number, ratio: number): number {
  if (tone < 0.0 || tone > 100.0) return -1.0;
  const lightY = yFromLstar(tone);
  const darkY = (lightY + 5.0) / ratio - 5.0;
  const realContrast = ratioOfYs(lightY, darkY);
  const delta = Math.abs(realContrast - ratio);
  if (realContrast < ratio && delta > 0.04) return -1;
  const returnValue = lstarFromY(darkY) - 0.4;
  return returnValue < 0 || returnValue > 100 ? -1 : returnValue;
}

/** Like {@link lighter} but returns 100 instead of -1 when unattainable. */
export function lighterUnsafe(tone: number, ratio: number): number {
  const lighterSafe = lighter(tone, ratio);
  return lighterSafe < 0.0 ? 100.0 : lighterSafe;
}

/** Like {@link darker} but returns 0 instead of -1 when unattainable. */
export function darkerUnsafe(tone: number, ratio: number): number {
  const darkerSafe = darker(tone, ratio);
  return darkerSafe < 0.0 ? 0.0 : darkerSafe;
}
