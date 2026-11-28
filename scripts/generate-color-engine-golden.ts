/**
 * The colour engine's conformance golden: what the TypeScript engine (src/theme/color-engine)
 * computes for a fixed set of seeds, which every port of the engine must reproduce exactly (Bloom's
 * native runtime: `so.oxy.bloom.color`, checked by `ColorEngineConformance.kt`). One line per seed:
 * the seed, its CAM16 hue and chroma, its L*, the tones of its palette, the key colour of a
 * chroma-48 palette at its hue, and the most chromatic colour at three tones. Numbers are written
 * as JavaScript writes them (shortest round trip); a port compares their doubles bit for bit.
 *
 * Rewritten on purpose only, after an approved change to the engine (like the theme golden).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Cam16 } from '../src/theme/color-engine/cam16';
import { hexFromArgb, lstarFromArgb } from '../src/theme/color-engine/color-utils';
import { Hct } from '../src/theme/color-engine/hct';
import { TonalPalette } from '../src/theme/color-engine/tonal-palette';

export const GOLDEN_TONES = [
  0, 4, 5, 6, 10, 12, 15, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96,
  98, 99, 100,
];

/** The seeds: primaries, greys, and a fixed spread over the cube. */
export function goldenSeeds(): number[] {
  const named = [
    0xff000000, 0xffffffff, 0xffff0000, 0xff00ff00, 0xff0000ff, 0xff808080, 0xff6750a4, 0xffe8336a,
  ];
  const seeds = [...named];
  let state = 0x2545f491;
  while (seeds.length < 64) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    seeds.push((0xff000000 | (state & 0xffffff)) >>> 0);
  }
  return seeds;
}

export function goldenLine(seed: number): string {
  const cam = Cam16.fromInt(seed);
  const palette = TonalPalette.fromInt(seed);
  const tones = GOLDEN_TONES.map((t) => hexFromArgb(palette.tone(t)));
  const key = TonalPalette.fromHueAndChroma(cam.hue, 48).keyColor;
  const vivid = [30, 50, 80].map((t) => hexFromArgb(Hct.from(cam.hue, 200, t).toInt()));
  return [
    hexFromArgb(seed),
    String(cam.hue),
    String(cam.chroma),
    String(lstarFromArgb(seed)),
    ...tones,
    hexFromArgb(key.toInt()),
    ...vivid,
  ].join(' ');
}

if (import.meta.main) {
  const here = dirname(fileURLToPath(import.meta.url));
  const out = join(
    here,
    '..',
    'src',
    'theme',
    '__tests__',
    '__fixtures__',
    'golden-color-engine.txt',
  );
  const text = `${goldenSeeds().map(goldenLine).join('\n')}\n`;
  writeFileSync(out, text);
  console.log(
    `[generate-color-engine-golden] wrote ${relative(join(here, '..'), out)} (${text.length} bytes)`,
  );
}
