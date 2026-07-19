/**
 * Bloom colour engine — seed scoring.
 *
 * Faithful port of Material Color Utilities' `Score` (Apache-2.0). Given a map
 * of quantized colours → population, ranks them for theme suitability — favouring
 * colours whose hue is well-represented in the image AND chromatic enough to make
 * a good accent — and de-duplicates by hue. Returns the best seed candidates.
 */
import { Hct } from './hct';
import { differenceDegrees, sanitizeDegreesInt } from './math-utils';

const TARGET_CHROMA = 48.0;
const WEIGHT_PROPORTION = 0.7;
const WEIGHT_CHROMA_ABOVE = 0.3;
const WEIGHT_CHROMA_BELOW = 0.1;
const CUTOFF_CHROMA = 5.0;
const CUTOFF_EXCITED_PROPORTION = 0.01;

export interface ScoreOptions {
  desired?: number;
  fallbackColorARGB?: number;
  filter?: boolean;
}

/** Rank quantized colours as theme seeds. Best first. */
export function score(colorsToPopulation: Map<number, number>, options: ScoreOptions = {}): number[] {
  const desired = options.desired ?? 4;
  const fallbackColorARGB = options.fallbackColorARGB ?? 0xff4285f4;
  const filter = options.filter ?? true;

  const colorsHct: Hct[] = [];
  const huePopulation = new Array<number>(360).fill(0);
  let populationSum = 0;
  for (const [argb, population] of colorsToPopulation.entries()) {
    const hct = Hct.fromInt(argb);
    colorsHct.push(hct);
    const hueIndex = Math.floor(hct.hue);
    huePopulation[hueIndex] = (huePopulation[hueIndex] ?? 0) + population;
    populationSum += population;
  }

  const hueExcitedProportions = new Array<number>(360).fill(0.0);
  for (let hue = 0; hue < 360; hue++) {
    const proportion = (huePopulation[hue] ?? 0) / populationSum;
    for (let i = hue - 14; i < hue + 16; i++) {
      const index = sanitizeDegreesInt(i);
      hueExcitedProportions[index] = (hueExcitedProportions[index] ?? 0) + proportion;
    }
  }

  const scoredHct: Array<{ hct: Hct; score: number }> = [];
  for (const hct of colorsHct) {
    const hue = sanitizeDegreesInt(Math.round(hct.hue));
    const proportion = hueExcitedProportions[hue] ?? 0;
    if (filter && (hct.chroma < CUTOFF_CHROMA || proportion <= CUTOFF_EXCITED_PROPORTION)) {
      continue;
    }
    const proportionScore = proportion * 100.0 * WEIGHT_PROPORTION;
    const chromaWeight = hct.chroma < TARGET_CHROMA ? WEIGHT_CHROMA_BELOW : WEIGHT_CHROMA_ABOVE;
    const chromaScore = (hct.chroma - TARGET_CHROMA) * chromaWeight;
    scoredHct.push({ hct, score: proportionScore + chromaScore });
  }
  scoredHct.sort((a, b) => (a.score > b.score ? -1 : a.score < b.score ? 1 : 0));

  const chosenColors: Hct[] = [];
  for (let differenceLimit = 90; differenceLimit >= 15; differenceLimit--) {
    chosenColors.length = 0;
    for (const { hct } of scoredHct) {
      const duplicateHue = chosenColors.find(
        (chosen) => differenceDegrees(hct.hue, chosen.hue) < differenceLimit,
      );
      if (!duplicateHue) chosenColors.push(hct);
      if (chosenColors.length >= desired) break;
    }
    if (chosenColors.length >= desired) break;
  }

  const colors: number[] = [];
  if (chosenColors.length === 0) colors.push(fallbackColorARGB);
  for (const chosen of chosenColors) colors.push(chosen.toInt());
  return colors;
}
