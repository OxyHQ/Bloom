import { APP_COLOR_NAMES } from '../theme/color-presets';
import { buildTheme } from '../theme/build-theme';
import { contrastRatio } from '../styles/color-contrast';
import { resolveSurfaceLevel, surfaceFillOn } from '../styles/surface-levels';
import { resolveInsightPalette, resolveEnergyTones } from '../property-insights/shared';
import { resolveMediaHeaderPaint } from '../media-header/shared';
import { resolveMediaControlsPaint } from '../media-controls/shared';

it('keeps semantic media surfaces and their labels paired for every preset and mode', () => {
  for (const preset of APP_COLOR_NAMES)
    for (const mode of ['light', 'dark'] as const) {
      const theme = buildTheme(preset, mode);
      const insight = resolveInsightPalette(theme);
      const header = resolveMediaHeaderPaint(theme);
      const controls = resolveMediaControlsPaint(theme);
      expect(insight.card).toBe(resolveSurfaceLevel(theme, 1).background);
      expect(header.bandTop).toBe(surfaceFillOn(theme, theme.colors.background));
      for (const [fill, ink] of [
        [insight.card, insight.muted],
        [theme.colors.background, insight.muted],
        [header.card, header.textMuted],
        [theme.colors.background, controls.textMuted],
      ] as const)
        expect(contrastRatio(fill, ink)).toBeGreaterThanOrEqual(4.5);
      // Energy categories are a data encoding, with independent pairs.
      for (const energy of resolveEnergyTones(theme)) {
        expect(contrastRatio(energy.fill, energy.foreground)).toBeGreaterThanOrEqual(4.5);
      }
    }
});
