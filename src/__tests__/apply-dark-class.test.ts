/**
 * @jest-environment jsdom
 */

import { Platform } from 'react-native';

import { applyColorPresetVars, toWebColorValue } from '../theme/apply-dark-class';

// `applyColorPresetVars` is the WEB write path that feeds the live document. It
// regressed by writing the base `--x` tokens as bare HSL triples (`185 50% 5%`),
// which the shadcn/Tailwind-v4 web apps consume directly as
// `background-color: var(--background)` → invalid CSS → transparent → unstyled
// app. These tests pin the corrected contract: base tokens are full `hsl(...)`
// colors, `--color-*` companions stay `rgb(...)`.

describe('applyColorPresetVars — web document var contract', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'web';
    document.documentElement.removeAttribute('style');
  });

  afterEach(() => {
    Platform.OS = originalOS;
    document.documentElement.removeAttribute('style');
  });

  it('re-exports toWebColorValue (helper is consumed by the web write paths)', () => {
    expect(toWebColorValue('--background', '185 50% 5%')).toBe('hsl(185 50% 5%)');
  });

  it('writes base tokens to the document as full hsl() colors, not bare triples', () => {
    applyColorPresetVars('oxy', 'dark');

    const style = document.documentElement.style;
    const background = style.getPropertyValue('--background').trim();
    const primary = style.getPropertyValue('--primary').trim();
    const foreground = style.getPropertyValue('--foreground').trim();

    expect(background).not.toBe('');
    // The exact bug: a bare `H S% L%` triple. Must be a wrapped color now.
    expect(background.startsWith('hsl(')).toBe(true);
    expect(background.endsWith(')')).toBe(true);
    expect(/^-?\d[\d.]*\s+[\d.]+%/.test(background)).toBe(false);

    expect(primary.startsWith('hsl(')).toBe(true);
    expect(foreground.startsWith('hsl(')).toBe(true);
  });

  it('keeps the resolved --color-* vars as rgb() full colors', () => {
    applyColorPresetVars('oxy', 'dark');

    const colorPrimary = document.documentElement.style
      .getPropertyValue('--color-primary')
      .trim();
    expect(colorPrimary.startsWith('rgb(')).toBe(true);
  });

  it('no-ops on native (does not touch the document)', () => {
    Platform.OS = 'ios';
    applyColorPresetVars('oxy', 'dark');
    expect(document.documentElement.getAttribute('style')).toBeNull();
  });
});
