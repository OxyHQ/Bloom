/**
 * @jest-environment node
 */

import normalizeColor from '@react-native/normalize-colors';

import { buildTheme } from '../build-theme';
import { getPresetVars } from '../preset-vars';
import { APP_COLOR_NAMES, type AppColorName } from '../color-presets';
import type { ThemeColors } from '../types';

// Phase 5 rebased the palette from hand-authored HSL triples to the colour
// engine. The pre-0.8.0 `theme.colors` parity oracles (which froze
// `secondary === primary` and `card === surface`) are intentionally OBSOLETE —
// those two aliases are the very bugs this phase fixes. This suite now guards the
// NEW engine-backed contract: every value parses, and the two fixes hold for
// every preset in both modes.

type Rgb = { r: number; g: number; b: number };

function parse(color: string): Rgb {
  const n = normalizeColor(color);
  if (n === null || n === undefined) {
    throw new Error(`unparseable color: ${color}`);
  }
  // normalizeColor returns 0xRRGGBBAA.
  return { r: (n >>> 24) & 0xff, g: (n >>> 16) & 0xff, b: (n >>> 8) & 0xff };
}

const lightness = ({ r, g, b }: Rgb): number => r + g + b;

describe.each(APP_COLOR_NAMES)('engine-backed theme.colors (%s)', (preset: AppColorName) => {
  it.each(['light', 'dark'] as const)('%s: every color value parses', (mode) => {
    const { colors } = buildTheme(preset, mode);
    for (const value of Object.values(colors)) {
      expect(normalizeColor(value)).not.toBeNull();
    }
  });

  it('secondary is a real contrast color, not a mirror of primary', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { colors } = buildTheme(preset, mode);
      expect(colors.secondary).not.toBe(colors.primary);
    }
  });

  // Deliberately inverted from what this asserted before. M3's
  // `surfaceContainerLowest` is the RECESSED step: in dark it sits at tone 4
  // against a tone-6 background, so every card, sheet and chat bubble SANK into
  // the page instead of lifting off it — measured identically on all thirteen
  // presets, so it was the mapping and not any one seed. A card lifts in both
  // modes now, and this is the assertion that would catch a silent revert.
  it('card lifts off the background in BOTH modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { colors } = buildTheme(preset, mode);
      expect(lightness(parse(colors.card))).toBeGreaterThan(lightness(parse(colors.background)));
    }
  });

  it('token-backed fields read straight from the resolved token map', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { colors } = buildTheme(preset, mode);
      const t = getPresetVars(preset, mode);
      const field: Array<[keyof ThemeColors, string]> = [
        ['primary', '--primary'],
        ['secondary', '--secondary'],
        ['card', '--card'],
        ['background', '--background'],
        ['border', '--border'],
      ];
      for (const [colorKey, tokenKey] of field) {
        expect(colors[colorKey]).toBe(t[tokenKey]);
      }
    }
  });
});
