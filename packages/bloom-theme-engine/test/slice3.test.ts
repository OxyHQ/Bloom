// Slice 3 (the colour policy, chart colours, a seed's canonical tokens and the JS theme's colours)
// of the colour engine written in Bloom, compiled to TypeScript by bloomc, held to
// src/theme/__tests__/fixtures/seed-tokens-golden.txt (scripts/generate-seed-tokens-golden.ts),
// whose preset lines are golden-resolved-tokens.json's entries.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seedThemeColors, seedTokens } from '../Sources/ColorEngine/SeedTheme.bloom';
import { PRESET_LABELS_FILE, presetLabelsSource } from '../scripts/generate-preset-labels';

const THEME_TESTS = join(__dirname, '..', '..', '..', 'src', 'theme', '__tests__');

type Options = Parameters<typeof seedTokens>[0];

export function seedGolden() {
  const [tokenHeader, colorHeader, ...rest] = readFileSync(
    join(THEME_TESTS, 'fixtures', 'seed-tokens-golden.txt'),
    'utf8',
  )
    .split('\n')
    .filter((line) => line.trim() !== '');
  const tokenNames = (tokenHeader as string).split('\t').slice(1);
  const colorNames = (colorHeader as string).split('\t').slice(1);
  const lines = rest.map((line) => {
    const f = line.split('\t');
    const options = {
      seed: f[0],
      isDark: f[1] === 'dark',
      contrastLevel: Number(f[3]),
      ...(f[2] !== '-' ? { variant: f[2] } : {}),
      ...(f[4] !== '-' ? { secondarySeed: f[4] } : {}),
      ...(f[5] !== '-' ? { tertiarySeed: f[5] } : {}),
    } as unknown as Options;
    return {
      key: f.slice(0, 6).join(' '),
      options,
      tokens: f.slice(6, 6 + tokenNames.length),
      colors: f.slice(6 + tokenNames.length),
    };
  });
  return { tokenNames, colorNames, lines };
}

describe('the colour engine in Bloom, slice 3, on the TypeScript backend', () => {
  const { tokenNames, colorNames, lines } = seedGolden();

  test('every token and theme colour of the seed golden', () => {
    let checked = 0;
    const differences: string[] = [];
    for (const line of lines) {
      const tokens = seedTokens(line.options);
      expect(Object.keys(tokens)).toEqual(tokenNames);
      tokenNames.forEach((name, i) => {
        checked++;
        if (tokens[name] !== line.tokens[i])
          differences.push(`${line.key} ${name}: golden ${line.tokens[i]}, Bloom ${tokens[name]}`);
      });
      const colors = seedThemeColors(line.options);
      expect(colors.map(([name]) => name)).toEqual(colorNames);
      colors.forEach(([name, value], i) => {
        checked++;
        if (value !== line.colors[i])
          differences.push(`${line.key} colors.${name}: golden ${line.colors[i]}, Bloom ${value}`);
      });
    }
    console.log(
      `slice 3 (TS backend): ${lines.length} seeds, ${checked - differences.length} of ${checked} tokens and colours identical`,
    );
    expect(differences.slice(0, 20)).toEqual([]);
    expect(checked).toBe(lines.length * (tokenNames.length + colorNames.length));
  });

  test("a preset's seed gives its golden-resolved-tokens.json entry", () => {
    const resolved = JSON.parse(
      readFileSync(join(THEME_TESTS, '__fixtures__', 'golden-resolved-tokens.json'), 'utf8'),
    ) as Record<string, Record<string, string>>;
    const { APP_COLOR_NAMES, APP_COLOR_PRESETS } = require('../../../src/theme/color-presets');
    let checked = 0;
    for (const name of APP_COLOR_NAMES as string[]) {
      const preset = APP_COLOR_PRESETS[name];
      if (preset.tokens !== undefined) continue;
      for (const mode of ['light', 'dark']) {
        const want = resolved[`${name}/${mode}`] as Record<string, string>;
        const got = seedTokens({
          seed: preset.hex,
          isDark: mode === 'dark',
          contrastLevel: 0,
          variant: preset.variant,
          ...(preset.secondaryHex ? { secondarySeed: preset.secondaryHex } : {}),
          ...(preset.tertiaryHex ? { tertiarySeed: preset.tertiaryHex } : {}),
        } as unknown as Options);
        expect(got).toEqual(want);
        checked += Object.keys(want).length;
      }
    }
    console.log(
      `slice 3 (TS backend): ${checked} of golden-resolved-tokens.json's tokens identical`,
    );
  });

  test('PresetLabels.generated.bloom is fresh', () => {
    expect(readFileSync(PRESET_LABELS_FILE, 'utf8')).toBe(presetLabelsSource());
  });
});
