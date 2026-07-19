/**
 * Golden parity test for the Bloom colour engine.
 *
 * The engine is a dependency-free reimplementation of the Material Color
 * Utilities algorithm. These fixtures were generated ONCE from the reference
 * library and frozen; this test asserts Bloom's engine reproduces every role,
 * for 5 seeds × 4 variants × light/dark, byte-for-byte. If the engine ever
 * drifts from the reference algorithm, this fails — no runtime dependency on the
 * reference is needed to keep the port honest.
 */
import golden from './fixtures/color-engine-golden.json';
import {
  argbFromHex,
  generateRoleColors,
  seedHexFromImagePixels,
  type RoleName,
  type SchemeVariant,
} from '../color-engine';

const SEED_HEX: Record<string, string> = {
  oxy: '#C46EDE',
  blue: '#1D9BF0',
  green: '#10B981',
  pink: '#EC4899',
  faircoin: '#9FFB50',
};

/** `rgb(r g b)` (the engine's output form) → `#rrggbb` (the fixture form). */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+) (\d+) (\d+)\)/);
  if (!match) {
    throw new Error(`Expected an "rgb(r g b)" string, got: ${rgb}`);
  }
  return `#${[1, 2, 3].map((i) => Number(match[i]).toString(16).padStart(2, '0')).join('')}`;
}

const fixtures = golden as Record<string, Record<string, string>>;

describe('Bloom colour engine — golden parity with Material Color Utilities', () => {
  for (const [combo, roles] of Object.entries(fixtures)) {
    it(`reproduces every role for ${combo}`, () => {
      const [seed, variant, mode] = combo.split('|');
      if (seed === undefined || variant === undefined || mode === undefined) {
        throw new Error(`malformed golden combo: ${combo}`);
      }
      const seedHex = SEED_HEX[seed];
      if (seedHex === undefined) throw new Error(`no seed hex for preset "${seed}"`);
      const generated = generateRoleColors({
        seed: seedHex,
        variant: variant as SchemeVariant,
        isDark: mode === 'dark',
      });
      for (const [role, expectedHex] of Object.entries(roles)) {
        expect(rgbToHex(generated[role as RoleName])).toBe(expectedHex);
      }
    });
  }
});

/** Build a flat ARGB pixel array from `[hex, count]` pairs. */
function image(colors: Array<[string, number]>): number[] {
  const pixels: number[] = [];
  for (const [hex, count] of colors) {
    const argb = argbFromHex(hex);
    for (let i = 0; i < count; i++) pixels.push(argb);
  }
  return pixels;
}

describe('seed extraction from an image (deterministic)', () => {
  const cases: Array<[string, Array<[string, number]>, string]> = [
    ['a purple-dominant photo', [['#C46EDE', 900], ['#1D9BF0', 80], ['#ffffff', 400], ['#101014', 300]], '#c46ede'],
    ['a pink/green photo', [['#EC6094', 600], ['#10B981', 500], ['#F59E0B', 200], ['#000000', 700]], '#ec6094'],
    ['a teal photo', [['#005c67', 1000], ['#14b8a6', 300], ['#eeeeee', 600]], '#005c67'],
  ];
  for (const [label, colors, expectedSeed] of cases) {
    it(`picks the dominant chromatic colour from ${label}`, () => {
      expect(seedHexFromImagePixels(image(colors))).toBe(expectedSeed);
    });
  }
});
