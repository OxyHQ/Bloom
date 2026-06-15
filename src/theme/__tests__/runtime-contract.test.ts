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

it('restored legacy alias invariants hold', () => {
  // Pre-0.8.0 semantics, restored in 0.8.1: `secondary` mirrors `primary`,
  // `card` and `primaryLight` are the page surface, `primaryDark` is the page
  // background. All read straight from the same resolved rgb token map, so the
  // alias values are byte-identical to their source tokens.
  for (const preset of ['oxy', 'blue'] as const) {
    for (const mode of ['light', 'dark'] as const) {
      const { colors } = buildTheme(preset, mode);
      const t = getResolvedTokens(preset, mode);
      expect(colors.secondary).toBe(colors.primary);
      expect(colors.secondary).toBe(t['--primary']);
      expect(colors.card).toBe(t['--surface']);
      expect(colors.primaryLight).toBe(t['--surface']);
      expect(colors.primaryDark).toBe(t['--background']);
    }
  }
});
