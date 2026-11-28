/**
 * The image-seed golden: what the TypeScript engine (src/theme/color-engine) extracts from fixed
 * images, step by step, for every port of the engine to reproduce exactly (the Bloom engine,
 * packages/bloom-theme-engine, on each backend). One line per image, tab-separated fields:
 *
 *   <name> counts=<argb hex:count,…> wu=<argb hex,…> quantized=<argb hex:population,…>
 *   score=<argb hex,…> score1=<…> unfiltered=<…>
 *
 * `counts` is `countByColor(pixels)` (first-seen order), `wu` is `quantizeWu(pixels, 128)`,
 * `quantized` is `quantizeImage(pixels)`, and the three scores are `score(quantized)` with the
 * default options, `{ desired: 1 }` and `{ filter: false }`. Rewritten on purpose only, after an
 * approved change to the engine.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argbFromHex, argbFromRgb } from '../src/theme/color-engine/color-utils';
import { countByColor } from '../src/theme/color-engine/quantizer-map';
import { quantizeWu } from '../src/theme/color-engine/quantizer-wu';
import { score } from '../src/theme/color-engine/score';
import { quantizeImage } from '../src/theme/color-engine/seed-from-image';

const hex = (argb: number): string => argb.toString(16).padStart(8, '0');

/** `[hex, count]` pairs as pixels (the engine's own test images). */
function image(colors: Array<[string, number]>): number[] {
  return colors.flatMap(([h, count]) => Array.from({ length: count }, () => argbFromHex(h)));
}

/** A photo-like image: a few base colours, each pixel jittered a little, from a fixed LCG. */
function jittered(seed: number, bases: number, pixels: number, jitter: number): number[] {
  let state = seed >>> 0;
  const next = (): number => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state >>> 8;
  };
  const palette = Array.from(
    { length: bases },
    () => [next() & 255, next() & 255, next() & 255] as const,
  );
  const out: number[] = [];
  for (let i = 0; i < pixels; i++) {
    const [r, g, b] = palette[next() % bases] as readonly [number, number, number];
    const d = (): number => (next() % (2 * jitter + 1)) - jitter;
    const clamp = (v: number): number => Math.max(0, Math.min(255, v));
    // Every 50th pixel is transparent, which the histogram drops.
    const argb = argbFromRgb(clamp(r + d()), clamp(g + d()), clamp(b + d()));
    out.push(i % 50 === 49 ? argb & 0x00ffffff : argb);
  }
  return out;
}

export function imageCases(): Array<[string, number[]]> {
  return [
    [
      'purple-photo',
      image([
        ['#C46EDE', 900],
        ['#1D9BF0', 80],
        ['#ffffff', 400],
        ['#101014', 300],
      ]),
    ],
    [
      'pink-green-photo',
      image([
        ['#EC6094', 600],
        ['#10B981', 500],
        ['#F59E0B', 200],
        ['#000000', 700],
      ]),
    ],
    [
      'teal-photo',
      image([
        ['#005c67', 1000],
        ['#14b8a6', 300],
        ['#eeeeee', 600],
      ]),
    ],
    [
      'greys',
      image([
        ['#000000', 300],
        ['#808080', 300],
        ['#ffffff', 300],
      ]),
    ],
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n): [string, number[]] => [
      `jittered-${n}`,
      jittered(0x9e3779b9 * n, 3 + n * 2, 4000, 2 + n),
    ]),
  ];
}

export function imageLine(name: string, pixels: number[]): string {
  const counts = countByColor(pixels);
  const quantized = quantizeImage(pixels);
  const pairs = (m: Map<number, number>): string =>
    [...m.entries()].map(([k, v]) => `${hex(k)}:${v}`).join(',');
  return [
    name,
    `counts=${pairs(counts)}`,
    `wu=${quantizeWu(pixels, 128).map(hex).join(',')}`,
    `quantized=${pairs(quantized)}`,
    `score=${score(quantized).map(hex).join(',')}`,
    `score1=${score(quantized, { desired: 1 }).map(hex).join(',')}`,
    `unfiltered=${score(quantized, { filter: false }).map(hex).join(',')}`,
  ].join('\t');
}

if (import.meta.main) {
  const here = dirname(fileURLToPath(import.meta.url));
  const out = join(here, '..', 'src', 'theme', '__tests__', 'fixtures', 'image-seed-golden.txt');
  const text = `${imageCases()
    .map(([name, pixels]) => imageLine(name, pixels))
    .join('\n')}\n`;
  writeFileSync(out, text);
  console.log(
    `[generate-image-seed-golden] wrote ${relative(join(here, '..'), out)} (${text.length} bytes)`,
  );
}
