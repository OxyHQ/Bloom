/**
 * @jest-environment node
 */

import normalizeColor from '@react-native/normalize-colors';

import { buildTheme } from '../build-theme';
import type { AppColorName } from '../color-presets';
import type { ThemeColors } from '../types';

// Parity guard for the 0.8.1 restoration of the pre-0.8.0 `theme.colors`
// derived/alias values. 0.8.0 changed several derived/alias mappings, visibly
// altering dark (and light) mode for consuming components. 0.8.1 restores the
// EXACT pre-0.8.0 colors while keeping the single rgb pipeline (the old logic
// emitted `hsl(h,s%,l%)` strings; the new logic emits the `rgb(...)` of the same
// color). These oracles are the VERBATIM pre-0.8.0 outputs (commit 00a4cf3:
// `git show 00a4cf3:src/theme/build-theme.ts`). We assert visual equality via
// ΔE on the parsed sRGB — `hsl(...)` and the matching `rgb(...)` parse to the
// same bytes under the RN/RNW/browser `normalizeColor`, so ΔE is 0.

type Rgb = { r: number; g: number; b: number };

function parse(color: string): Rgb {
  const n = normalizeColor(color);
  if (n === null || n === undefined) {
    throw new Error(`unparseable color: ${color}`);
  }
  // normalizeColor returns 0xRRGGBBAA.
  return { r: (n >>> 24) & 0xff, g: (n >>> 16) & 0xff, b: (n >>> 8) & 0xff };
}

function deltaE(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) / Math.sqrt(3);
}

/**
 * The pre-0.8.0 `theme.colors` for a (preset, mode) pair, expressed in the EXACT
 * source forms commit 00a4cf3 produced — token-backed values as `hsl(H, S%, L%)`
 * (from the preset's raw triples) and computed tints via `hsl(hue, s%, l%)`.
 *
 * We only assert the fields the restoration touches plus the load-bearing
 * aliases (primaryLight/primaryDark/secondary/card). Status colors and
 * shadow/overlay were never changed, so they are intentionally omitted.
 */
type Oracle = Partial<Record<keyof ThemeColors, string>>;

const ORACLES: Array<{ preset: AppColorName; mode: 'light' | 'dark'; old: Oracle }> = [
  {
    // blue: primary 205 87% 53%, surface dark 205 20% 18%, background dark 205 50% 5%, destructive hue 0.
    preset: 'blue',
    mode: 'dark',
    old: {
      secondary: 'hsl(205, 87%, 53%)', // == primary
      primary: 'hsl(205, 87%, 53%)',
      card: 'hsl(205, 20%, 18%)', // == surface
      primaryLight: 'hsl(205, 20%, 18%)', // == surface
      primaryDark: 'hsl(205, 50%, 5%)', // == background
      primarySubtle: 'hsl(205, 50%, 10%)',
      primarySubtleForeground: 'hsl(205, 70%, 65%)',
      negative: 'hsl(0, 84%, 45%)',
      negativeForeground: '#FFFFFF',
      negativeSubtle: 'hsl(0, 50%, 10%)',
      negativeSubtleForeground: 'hsl(0, 70%, 65%)',
      contrast50: 'hsl(205, 15%, 12%)',
    },
  },
  {
    // oxy: primary 277 66% 56%, surface dark 277 20% 18%, background dark 277 50% 5%, destructive hue 0.
    preset: 'oxy',
    mode: 'dark',
    old: {
      secondary: 'hsl(277, 66%, 56%)',
      primary: 'hsl(277, 66%, 56%)',
      card: 'hsl(277, 20%, 18%)',
      primaryLight: 'hsl(277, 20%, 18%)',
      primaryDark: 'hsl(277, 50%, 5%)',
      primarySubtle: 'hsl(277, 50%, 10%)',
      primarySubtleForeground: 'hsl(277, 70%, 65%)',
      negative: 'hsl(0, 84%, 45%)',
      negativeForeground: '#FFFFFF',
      negativeSubtle: 'hsl(0, 50%, 10%)',
      negativeSubtleForeground: 'hsl(0, 70%, 65%)',
      contrast50: 'hsl(277, 15%, 12%)',
    },
  },
  {
    // blue light: surface 205 58% 94%, background 205 55% 96%.
    preset: 'blue',
    mode: 'light',
    old: {
      secondary: 'hsl(205, 87%, 53%)',
      primary: 'hsl(205, 87%, 53%)',
      card: 'hsl(205, 58%, 94%)',
      primaryLight: 'hsl(205, 58%, 94%)',
      primaryDark: 'hsl(205, 55%, 96%)',
      primarySubtle: 'hsl(205, 70%, 93%)',
      primarySubtleForeground: 'hsl(205, 90%, 25%)',
      negative: 'hsl(0, 84%, 45%)',
      negativeForeground: '#FFFFFF',
      negativeSubtle: 'hsl(0, 90%, 95%)',
      negativeSubtleForeground: 'hsl(0, 80%, 40%)',
      contrast50: 'hsl(205, 10%, 93%)',
    },
  },
];

describe.each(ORACLES)('theme.colors parity with pre-0.8.0 ($preset/$mode)', ({ preset, mode, old }) => {
  const { colors } = buildTheme(preset, mode);

  it.each(Object.entries(old))('%s matches the pre-0.8.0 color (ΔE ≤ 1)', (key, oldColor) => {
    const newColor = colors[key as keyof ThemeColors];
    const dE = deltaE(parse(oldColor), parse(newColor));
    expect(dE).toBeLessThanOrEqual(1);
  });
});
