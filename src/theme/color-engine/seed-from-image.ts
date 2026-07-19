/**
 * Bloom colour engine — a seed colour from an image.
 *
 * The "theme from your photo/wallpaper" entry point. Wu-quantizes the pixels to
 * a small representative palette, tallies each pixel to its nearest
 * representative (a deterministic single assignment in L*a*b* — Bloom's stand-in
 * for the reference's stochastic k-means, so results are reproducible), then
 * scores the palette for theme suitability. Feed the top result straight into
 * `generateRoleColors({ seed })`.
 */
import { hexFromArgb } from './index';
import { labDistance, labFromInt, type LabPoint } from './lab-point-provider';
import { quantizeWu } from './quantizer-wu';
import { countByColor } from './quantizer-map';
import { score, type ScoreOptions } from './score';

/**
 * Quantize `pixels` to a representative palette with its populations. Uses Wu
 * (deterministic) for the palette, then assigns every pixel to its nearest
 * representative in L*a*b* — no randomness, so the same image always yields the
 * same result.
 */
export function quantizeImage(pixels: number[], maxColors = 128): Map<number, number> {
  const representatives = quantizeWu(pixels, maxColors);
  if (representatives.length === 0) return new Map();
  const repPoints: LabPoint[] = representatives.map(labFromInt);

  const populations = new Array<number>(representatives.length).fill(0);
  for (const [pixel, count] of countByColor(pixels).entries()) {
    const point = labFromInt(pixel);
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < repPoints.length; i++) {
      const repPoint = repPoints[i];
      if (repPoint === undefined) continue;
      const d = labDistance(point, repPoint);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    populations[best] = (populations[best] ?? 0) + count;
  }

  const result = new Map<number, number>();
  for (let i = 0; i < representatives.length; i++) {
    const representative = representatives[i];
    const population = populations[i] ?? 0;
    if (representative !== undefined && population > 0) result.set(representative, population);
  }
  return result;
}

/**
 * Ranked seed candidates (best first) extracted from an image's pixels (ARGB).
 *
 * The top result (`seeds[0]`) is the primary seed for `generateRoleColors({ seed })`.
 * To derive a richer, brand-accurate theme from artwork, a caller can additionally
 * pin distinct accents from the ranked list: pass `hexFromArgb(seeds[1])` as
 * `secondarySeed` and `hexFromArgb(seeds[2])` as `tertiarySeed` to
 * `generateRoleColors` / `buildSeedScopeVars` / `buildThemeFromSeed` so the
 * secondary and tertiary families reflect the artwork's real supporting colours
 * instead of hue-rotations of the primary.
 */
export function seedsFromImagePixels(pixels: number[], options?: ScoreOptions): number[] {
  return score(quantizeImage(pixels), options);
}

/** The single best seed colour from an image, as `#rrggbb`. */
export function seedHexFromImagePixels(pixels: number[]): string {
  const [top] = seedsFromImagePixels(pixels, { desired: 1 });
  if (top === undefined) throw new Error('no seed colour could be extracted');
  return hexFromArgb(top);
}
