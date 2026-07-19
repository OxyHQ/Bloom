/**
 * @jest-environment jsdom
 */

import normalizeColor from '@react-native/normalize-colors';
import { Platform } from 'react-native';

import { buildTheme } from '../build-theme';
import { applyColorPresetVars } from '../apply-dark-class';
import { getResolvedTokens } from '../token-registry';

// `@react-native/normalize-colors` is the exact parser React Native (native) and
// react-native-web use behind `StyleSheet`/`processColor`. If it returns `null`
// for a value, that color is UNPARSEABLE and the element renders nothing. These
// tests pin the runtime contract for the canonical rgb token pipeline: every
// JS `theme.colors` value must parse, the web document vars must be full colors
// (not bare HSL triples), and the historically mislabeled aliases must be fixed.

it('every theme.colors value parses via normalize-colors (native/RNW StyleSheet)', () => {
  const { colors } = buildTheme('oxy', 'dark');
  for (const v of Object.values(colors)) {
    expect(normalizeColor(v)).not.toBeNull(); // null = unparseable -> renders nothing
  }
});

describe('web var(--primary) resolves to a real color (not a bare triple)', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'web';
    document.documentElement.removeAttribute('style');
  });

  afterEach(() => {
    Platform.OS = originalOS;
    document.documentElement.removeAttribute('style');
  });

  it('writes --primary as a resolved rgb() color', () => {
    applyColorPresetVars('oxy', 'dark');
    const v = document.documentElement.style.getPropertyValue('--primary').trim();
    expect(v).toMatch(/^rgb\(/);
    expect(normalizeColor(v)).not.toBeNull();
  });
});

it('engine-backed alias invariants hold', () => {
  // Phase 5 contract: `secondary` is a REAL contrast color (engine secondary
  // role, no longer a mirror of primary), `card` is the lightest surface (engine
  // `surfaceContainerLowest`, surfaced as `--card`). The legacy `primaryLight`
  // (page surface tint) and `primaryDark` (page background) aliases are retained.
  for (const preset of ['oxy', 'blue'] as const) {
    for (const mode of ['light', 'dark'] as const) {
      const { colors } = buildTheme(preset, mode);
      const t = getResolvedTokens(preset, mode);
      expect(colors.secondary).not.toBe(colors.primary);
      expect(colors.secondary).toBe(t['--secondary']);
      expect(colors.card).toBe(t['--card']);
      expect(colors.primaryLight).toBe(t['--surface']);
      expect(colors.primaryDark).toBe(t['--background']);
    }
  }
});
