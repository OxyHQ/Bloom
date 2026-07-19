/**
 * Parity guard for the dynamic JS-theme seed path.
 *
 * A named preset is just a fixed seed, so `buildThemeFromSeed(preset.hex, mode)`
 * MUST produce the identical `theme.colors` as the preset path
 * `buildTheme(name, mode)`. If `buildColorsFromSeed` ever drifts from
 * `buildColorsFromPreset`, this fails.
 *
 * NOTE: `buildTheme` can apply an adaptive (Material You) override on native, but
 * this test runs under jsdom/node where `Platform.OS !== 'web'` is false and
 * `isAdaptive` defaults to false, so the comparison is against the preset-derived
 * palette (not adaptive), which is exactly what the seed path reproduces.
 */
import { APP_COLOR_NAMES, APP_COLOR_PRESETS, type AppColorName } from '../color-presets';
import { buildTheme } from '../build-theme';
import { buildThemeFromSeed } from '../build-theme-from-seed';

describe('buildThemeFromSeed parity with buildTheme (preset)', () => {
  const modes: Array<'light' | 'dark'> = ['light', 'dark'];

  for (const name of APP_COLOR_NAMES as readonly AppColorName[]) {
    for (const mode of modes) {
      it(`matches preset "${name}" colours in ${mode} mode`, () => {
        const preset = APP_COLOR_PRESETS[name];
        const fromPreset = buildTheme(name, mode);
        const fromSeed = buildThemeFromSeed(preset.hex, mode, preset.variant);
        expect(fromSeed.colors).toEqual(fromPreset.colors);
        expect(fromSeed.mode).toBe(fromPreset.mode);
        expect(fromSeed.isDark).toBe(fromPreset.isDark);
      });
    }
  }
});
