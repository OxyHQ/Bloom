import { APP_COLOR_NAMES } from '../theme/color-presets';
import { buildTheme } from '../theme/build-theme';
import { contrastRatio } from '../styles/color-contrast';
import { resolveSurfaceLevel, surfaceFillOn } from '../styles/surface-levels';
import { resolveCreatorStudioPaint } from '../creator-studio/shared';
import { resolveInsightPalette, resolveEnergyTones } from '../property-insights/shared';
import { resolveMediaHeaderPaint } from '../media-header/shared';
import { resolveMediaControlsPaint } from '../media-controls/shared';
import { resolveCoverTint } from '../media-card/shared';
import { resolveMusicLibraryPaint } from '../music-library/shared';
import { resolveQueuePanelPaint } from '../queue-panel/shared';
import { resolveTrackListPaint } from '../track-list/shared';

it('keeps semantic media/creator surfaces and their labels paired for every preset and mode', () => {
  for (const preset of APP_COLOR_NAMES) for (const mode of ['light', 'dark'] as const) {
    const theme = buildTheme(preset, mode);
    const creator = resolveCreatorStudioPaint(theme);
    const insight = resolveInsightPalette(theme);
    const header = resolveMediaHeaderPaint(theme);
    const controls = resolveMediaControlsPaint(theme);
    const library = resolveMusicLibraryPaint(theme);
    const queue = resolveQueuePanelPaint(theme);
    const tracks = resolveTrackListPaint(theme);
    expect(creator.surface).toBe(resolveSurfaceLevel(theme, 1).background);
    expect(insight.card).toBe(creator.surface);
    expect(header.bandTop).toBe(surfaceFillOn(theme, theme.colors.background));
    for (const [fill, ink] of [
      [creator.surface, creator.textSecondary], [creator.surface, creator.textTertiary],
      [insight.card, insight.muted], [theme.colors.background, insight.muted],
      [header.card, header.textMuted], [theme.colors.background, controls.textMuted],
      [library.surface, library.textMuted], [queue.surface, queue.textSecondary],
      [theme.colors.background, tracks.textMuted],
    ] as const) expect(contrastRatio(fill, ink)).toBeGreaterThanOrEqual(4.5);
    // Artwork and energy categories are data encodings, with independent pairs.
    for (const color of [undefined, '#ff5fa2', '#00ffee', '#fff']) {
      const cover = resolveCoverTint(theme, color);
      for (const fill of [cover.top, cover.bottom]) for (const ink of [cover.text, cover.textMuted]) {
        expect(contrastRatio(fill, ink)).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const energy of resolveEnergyTones(theme)) {
      expect(contrastRatio(energy.fill, energy.foreground)).toBeGreaterThanOrEqual(4.5);
    }
  }
});
