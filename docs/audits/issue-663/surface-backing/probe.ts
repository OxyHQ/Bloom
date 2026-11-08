import { filterColor, filterColorBounds, parseLook, type RGB } from '../../../../src/surface/filter-color';
import { SURFACE_LOOKS, materialFilter } from '../../../../src/surface/optics';
const inputs = [
  { name: 'all-srgb', min: [0, 0, 0], max: [1, 1, 1] },
  { name: 'mixed-saturated', min: [.05, .3, .15], max: [.45, .7, .9] },
] as const;
const results = [];
for (const mode of ['light', 'dark'] as const) for (const input of inputs) {
  const look = parseLook(materialFilter(SURFACE_LOOKS[mode]))!;
  const bounds = filterColorBounds(input, look);
  let count = 0;
  for (let r = 0; r <= 32; r++) for (let g = 0; g <= 32; g++) for (let b = 0; b <= 32; b++) {
    const rgb = [r,g,b].map((v,c) => input.min[c]! + v / 32 * (input.max[c]! - input.min[c]!)) as unknown as RGB;
    const out = filterColor(rgb, look);
    out.forEach((v,c) => { if (v < bounds.min[c]! - 1e-12 || v > bounds.max[c]! + 1e-12) throw new Error('Escaped bound'); });
    count++;
  }
  const diagonal = [filterColor(input.min, look), filterColor(input.max, look)];
  const counterexample = filterColor([input.max[0],input.min[1],input.min[2]], look);
  results.push({ mode, input, bounds, diagonal, counterexample, gridSamples: count, escaped: 0 });
}
console.log(JSON.stringify(results, null, 2));
