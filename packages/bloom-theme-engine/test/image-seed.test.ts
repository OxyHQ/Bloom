// The image seed's Bloom part (the assignment of colours to the Wu representatives, and the
// scoring) compiled to TypeScript by bloomc, held to src/theme/__tests__/fixtures/image-seed-golden.txt
// (scripts/generate-image-seed-golden.ts). The Wu quantizer itself is the TypeScript's: its inputs
// (`counts`, `wu`) come from the golden.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assignToRepresentatives, score } from '../Sources/ColorEngine/ImageSeed.bloom';

const GOLDEN = join(
  __dirname,
  '..',
  '..',
  '..',
  'src',
  'theme',
  '__tests__',
  'fixtures',
  'image-seed-golden.txt',
);

const argb = (h: string): number => Number.parseInt(h, 16);
const hex = (n: number): string => n.toString(16).padStart(8, '0');

export function imageGolden() {
  return readFileSync(GOLDEN, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [name, ...fields] = line.split('\t');
      const f = Object.fromEntries(
        fields.map((x) => [x.slice(0, x.indexOf('=')), x.slice(x.indexOf('=') + 1)]),
      );
      const pairs = (s: string): Map<number, number> =>
        new Map(
          s === ''
            ? []
            : s.split(',').map((p) => [argb(p.split(':')[0] as string), Number(p.split(':')[1])]),
        );
      return {
        name: name as string,
        counts: pairs(f.counts as string),
        wu: (f.wu as string) === '' ? [] : (f.wu as string).split(',').map(argb),
        quantized: f.quantized as string,
        score: f.score as string,
        score1: f.score1 as string,
        unfiltered: f.unfiltered as string,
      };
    });
}

describe('the image seed in Bloom on the TypeScript backend', () => {
  test('every image of the image-seed golden', () => {
    const cases = imageGolden();
    let checked = 0;
    for (const c of cases) {
      const quantized = assignToRepresentatives(c.wu, c.counts);
      expect([...quantized.entries()].map(([k, v]) => `${hex(k)}:${v}`).join(',')).toBe(
        c.quantized,
      );
      expect(score(quantized).map(hex).join(',')).toBe(c.score);
      expect(
        score(quantized, { desired: 1, fallbackColorARGB: 0xff4285f4, filter: true })
          .map(hex)
          .join(','),
      ).toBe(c.score1);
      expect(
        score(quantized, { desired: 4, fallbackColorARGB: 0xff4285f4, filter: false })
          .map(hex)
          .join(','),
      ).toBe(c.unfiltered);
      checked += quantized.size + 3;
    }
    console.log(
      `image seed (TS backend): ${cases.length} images, ${checked} of ${checked} populations and rankings identical`,
    );
  });
});
