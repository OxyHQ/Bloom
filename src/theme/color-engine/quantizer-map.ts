/**
 * Bloom colour engine — exact colour histogram.
 *
 * Faithful port of Material Color Utilities' `QuantizerMap` (Apache-2.0). Counts
 * how many opaque pixels are each exact colour — the input to Wu quantization.
 */
import { alphaFromArgb } from './color-utils';

/** Count opaque pixels by exact ARGB. Fully-transparent pixels are dropped. */
export function countByColor(pixels: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const pixel of pixels) {
    if (alphaFromArgb(pixel) < 255) continue;
    counts.set(pixel, (counts.get(pixel) ?? 0) + 1);
  }
  return counts;
}
