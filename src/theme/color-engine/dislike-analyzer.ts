/**
 * Bloom colour engine — dislike analyzer.
 *
 * Faithful port of Material Color Utilities' `DislikeAnalyzer` (Apache-2.0).
 * Certain dark-yellow-green HCT colours read as "bile"; this nudges their tone
 * up to 70 so generated palettes never land on a universally-disliked colour.
 */
import { Hct } from './hct';

export function isDisliked(hct: Hct): boolean {
  const huePasses = Math.round(hct.hue) >= 90.0 && Math.round(hct.hue) <= 111.0;
  const chromaPasses = Math.round(hct.chroma) > 16.0;
  const tonePasses = Math.round(hct.tone) < 65.0;
  return huePasses && chromaPasses && tonePasses;
}

export function fixIfDisliked(hct: Hct): Hct {
  return isDisliked(hct) ? Hct.from(hct.hue, hct.chroma, 70.0) : hct;
}
