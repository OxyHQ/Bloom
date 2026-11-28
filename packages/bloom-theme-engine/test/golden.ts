// The colour engine's golden, shared by the backends' gates: one line per seed of
// src/theme/__tests__/__fixtures__/golden-color-engine.txt (scripts/generate-color-engine-golden.ts),
// and the rule every port is held to: every colour exactly, every raw number (CAM16 hue and chroma,
// L*) within RELATIVE_BOUND of the TypeScript's (fdlibm's `pow` and V8's or JavaScriptCore's may
// round an ulp apart, which an ill-conditioned hue widens to about 1e-14). On the TypeScript backend
// the numbers are also compared bit for bit, since both engines run on the same JavaScript engine.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const RELATIVE_BOUND = 1e-12;

export const GOLDEN_TONES = [
  0, 4, 5, 6, 10, 12, 15, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96,
  98, 99, 100,
];

/** Fields 1–3 of a line are raw numbers; every other field is a colour. */
export const NUMBER_FIELDS = new Set([1, 2, 3]);

export const GOLDEN_FILE = join(
  __dirname,
  '..',
  '..',
  '..',
  'src',
  'theme',
  '__tests__',
  '__fixtures__',
  'golden-color-engine.txt',
);

export function goldenLines(): string[][] {
  return readFileSync(GOLDEN_FILE, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => line.split(' '));
}

/** Whether `got` passes the golden's rule for field `index` (the TS engine wrote `want`). */
export function sameField(index: number, got: string, want: string): boolean {
  if (!NUMBER_FIELDS.has(index)) return got === want;
  const g = Number(got);
  const w = Number(want);
  return Math.abs(g - w) / Math.max(1, Math.abs(w)) <= RELATIVE_BOUND;
}
