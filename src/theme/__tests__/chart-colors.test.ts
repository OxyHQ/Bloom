import { buildTheme } from '../build-theme';
import { buildThemeFromSeed } from '../build-theme-from-seed';
import { APP_COLOR_NAMES } from '../color-presets';
import { getResolvedTokens } from '../token-registry';
import { createChartColors, resolveThemeChartColors } from '../chart-colors';
import { resolveChartTones, resolveTone } from '../../chart-cards/palette';
import golden from './__fixtures__/golden-resolved-tokens.json';

const oracle = golden as Record<string, Record<string, string>>;

it('shares nine distinct rest/active pairs between CSS and JS for every preset and mode', () => {
  for (const preset of APP_COLOR_NAMES) for (const mode of ['light', 'dark'] as const) {
    const theme = buildTheme(preset, mode);
    const tokens = getResolvedTokens(preset, mode);
    const tones = resolveChartTones(theme);
    expect(tones).toHaveLength(9);
    expect(new Set(tones.map(tone => tone.color)).size).toBe(9);
    expect(new Set(tones.map(tone => tone.activeColor)).size).toBe(9);
    tones.forEach((tone, index) => {
      expect(tone.color).toBe(tokens[`--chart-${index + 1}`]);
      expect(tone.activeColor).toBe(tokens[`--chart-${index + 1}-active`]);
      expect(tone.activeColor).not.toBe(tone.color);
      if (index < 5) expect(tone.color).toBe(oracle[`${preset}/${mode}`]![`--chart-${index + 1}`]);
    });
  }
});

it('keeps nine grayscale steps in monochrome themes and their fallback', () => {
  for (const mode of ['light', 'dark'] as const) {
    const theme = { ...buildTheme('oxy', mode), chartColors: undefined };
    theme.colors = { ...theme.colors, primary: 'rgb(128 128 128)' };
    expect(resolveThemeChartColors(theme)).toEqual(createChartColors(0, mode === 'dark', true));
    expect(new Set(resolveThemeChartColors(theme).map(tone => tone.color)).size).toBe(9);
  }
});

it('builds a complete arbitrary-seed palette and honors explicit series pairs', () => {
  const tones = resolveChartTones(buildThemeFromSeed('#a1378b', 'dark'));
  expect(tones).toHaveLength(9);
  expect(resolveTone(tones, 0, '#112233', '#445566')).toEqual({ color: '#112233', activeColor: '#445566' });
  expect(resolveTone(tones, 10)).toEqual(tones[1]);
});
