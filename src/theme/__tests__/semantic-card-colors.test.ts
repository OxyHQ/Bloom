import { buildTheme } from '../build-theme';
import { APP_COLOR_NAMES } from '../color-presets';
import { getResolvedTokens } from '../token-registry';
import { parseRgba } from '../color-utils';
import { contrastRatio, mixColors } from '../../styles/color-contrast';
import { resolveChartCardPalette } from '../../chart-cards/palette';
import { resolveNotificationPaint } from '../../notification/shared';
import { resolveMenuPalette } from '../../floating/menu-palette';
import { resolveTextFieldPalette } from '../../text-field/shared';

function painted(background: string, surface: string): string {
  const rgba = parseRgba(background);
  if (!rgba) throw new Error(`Unparseable colour: ${background}`);
  return rgba.a < 1 ? mixColors(surface, background, rgba.a) : background;
}

it('keeps card text and status pairs readable on the surface actually painted', () => {
  const failures: unknown[] = [];
  for (const preset of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      const theme = buildTheme(preset, mode);
      const chart = resolveChartCardPalette(theme);
      const notification = resolveNotificationPaint(theme);
      const menu = resolveMenuPalette(theme);
      const field = resolveTextFieldPalette(theme);
      // CSS text-tertiary has always named muted-foreground. JS must not
      // substitute the outline/border role, which fails on a dark card.
      expect(theme.colors.textTertiary).toBe(getResolvedTokens(preset, mode)['--muted-foreground']);
      const pairs: Array<[string, string, string]> = [
        ['menu label', menu.surface, menu.textSecondary],
        ['menu destructive', menu.surface, menu.destructive],
        ['menu destructive hover', menu.rowHighlight, menu.destructive],
        ['select label', menu.trigger.background, menu.text],
        ['field placeholder', field.background, field.placeholder],
        ['field invalid', painted(field.backgroundInvalid, theme.colors.background), field.placeholderInvalid],
        ['chart label', chart.surface, chart.textSecondary],
        ['chart tick', chart.surface, chart.textTertiary],
        ['chart comparison', chart.surface, chart.neutralSeries],
        ['chart tile', chart.inner, chart.textSecondary],
        ['notification timestamp', notification.surface, notification.timestamp],
        ['notification description', notification.surface, notification.description],
        ...(['positive', 'negative', 'neutral'] as const).map(key => [
          `chart ${key}`, painted(chart[key].background, chart.surface), chart[key].foreground,
        ] as [string, string, string]),
        ...Object.entries(notification.status).map(([key, value]) => [
          `notification ${key}`, painted(value.background, notification.surface), value.foreground,
        ] as [string, string, string]),
      ];
      for (const [role, background, foreground] of pairs) {
        const ratio = contrastRatio(foreground, background);
        if (ratio < 4.5) failures.push({ preset, mode, role, ratio });
      }
    }
  }
  expect(failures).toEqual([]);
});
