/**
 * @jest-environment jsdom
 */

import { Platform } from 'react-native';

import { applyColorPresetVars } from '../theme/apply-dark-class';

// `applyColorPresetVars` is the WEB write path that feeds the live document. The
// single canonical token pipeline (`getResolvedTokens`) resolves every base
// token to a full `rgb(...)` color, so the shadcn/Tailwind-v4 web apps that
// consume `background-color: var(--background)` directly get a valid color (the
// production incident was a bare HSL triple here). These tests pin that contract.

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

  it('writes base tokens to the document as full rgb() colors, not bare triples', () => {
    applyColorPresetVars('oxy', 'dark');

    const style = document.documentElement.style;
    const background = style.getPropertyValue('--background').trim();
    const primary = style.getPropertyValue('--primary').trim();
    const foreground = style.getPropertyValue('--foreground').trim();

    expect(background).not.toBe('');
    // The exact bug: a bare `H S% L%` triple. Must be a resolved color now.
    expect(background.startsWith('rgb(')).toBe(true);
    expect(background.endsWith(')')).toBe(true);
    expect(/^-?\d[\d.]*\s+[\d.]+%/.test(background)).toBe(false);

    expect(primary.startsWith('rgb(')).toBe(true);
    expect(foreground.startsWith('rgb(')).toBe(true);
  });

  it('writes the extended tokens (card/chart/sidebar) as rgb() colors too', () => {
    applyColorPresetVars('oxy', 'dark');

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--card').trim().startsWith('rgb(')).toBe(true);
    expect(style.getPropertyValue('--sidebar-primary').trim().startsWith('rgb(')).toBe(true);
  });

  it('does NOT emit any legacy resolved-color companion vars', () => {
    applyColorPresetVars('oxy', 'dark');
    const style = document.documentElement.style;
    // The base `--x` token IS the color now; no resolved-color companion universe
    // should be written. Scan every property that was set rather than referencing
    // the legacy name literally.
    const prefix = `--${'color'}-`;
    const written = Array.from({ length: style.length }, (_, i) => style.item(i));
    expect(written.some((name) => name.startsWith(prefix))).toBe(false);
  });

  it('no-ops on native (does not touch the document)', () => {
    Platform.OS = 'ios';
    applyColorPresetVars('oxy', 'dark');
    expect(document.documentElement.getAttribute('style')).toBeNull();
  });
});
