/**
 * `buildThemeFromSeed` solves a seed once per process: a second call (a second
 * `BloomColorScope` with that seed, or one re-rendering under a new parent theme)
 * returns the same frozen theme without running the colour policy again, and that
 * theme is deep-equal to one solved from a cold module. Every argument takes part
 * in the key.
 */
import * as charts from '../chart-colors';
import * as policy from '../color-policy';
import { buildColorsFromSeed, buildThemeFromSeed } from '../build-theme-from-seed';
import type { Theme } from '../types';

function coldTheme(...args: Parameters<typeof buildThemeFromSeed>): Theme {
  let theme: Theme | undefined;
  jest.isolateModules(() => {
    const fresh = jest.requireActual<typeof import('../build-theme-from-seed')>(
      '../build-theme-from-seed',
    );
    theme = fresh.buildThemeFromSeed(...args);
  });
  if (!theme) throw new Error('the isolated module did not build a theme');
  return theme;
}

describe('buildThemeFromSeed cache', () => {
  afterEach(() => jest.restoreAllMocks());

  it('solves a seed once and shares one frozen theme', () => {
    const solve = jest.spyOn(charts, 'chartColorsFromTokens');
    const first = buildThemeFromSeed('#4464ba', 'dark');
    const second = buildThemeFromSeed('#4464ba', 'dark');
    expect(second).toBe(first);
    expect(buildColorsFromSeed('#4464ba', 'dark')).toBe(first.colors);
    expect(solve).toHaveBeenCalledTimes(1);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.colors)).toBe(true);
    expect(Object.isFrozen(first.chartColors)).toBe(true);
  });

  it('gives the theme a cold solve gives', () => {
    const cases: Parameters<typeof buildThemeFromSeed>[] = [
      ['#4464ba', 'dark'],
      ['#4464ba', 'light'],
      ['#808080', 'dark'],
      ['#c2185b', 'light', 'tonalSpot', 0.5, { secondarySeed: '#ffb300' }],
      ['#00897b', 'dark', undefined, undefined, { tertiarySeed: '#ff7043' }],
    ];
    for (const args of cases) {
      buildThemeFromSeed(...args);
      expect(buildThemeFromSeed(...args)).toEqual(coldTheme(...args));
    }
  });

  it('keys on every argument', () => {
    const variants: Parameters<typeof buildThemeFromSeed>[] = [
      ['#6d4c41', 'light'],
      ['#6d4c41', 'dark'],
      ['#6D4C41', 'light'],
      ['#6d4c41', 'light', 'tonalSpot'],
      ['#6d4c41', 'light', undefined, 1],
      ['#6d4c41', 'light', undefined, undefined, { secondarySeed: '#ffb300' }],
      ['#6d4c41', 'light', undefined, undefined, { tertiarySeed: '#00897b' }],
    ];
    const solve = jest.spyOn(charts, 'chartColorsFromTokens');
    const themes = variants.map((args) => buildThemeFromSeed(...args));
    expect(solve).toHaveBeenCalledTimes(variants.length);
    expect(new Set(themes).size).toBe(variants.length);
  });

  it('runs the colour policy once for a seed however many scopes resolve it', () => {
    const tokens = jest.spyOn(policy, 'buildPolicyTokens');
    const theme = jest.spyOn(charts, 'chartColorsFromTokens');
    for (let scope = 0; scope < 3; scope++) buildThemeFromSeed('#5e35b1', 'dark');
    expect(tokens).toHaveBeenCalledTimes(1);
    expect(theme).toHaveBeenCalledTimes(1);
  });
});
