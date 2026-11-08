import { Platform } from 'react-native';
import { surfaceBodyBounds, quietTextOnBody, UNKNOWN_BACKING } from '../surface/body-backing';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { resolveTextFieldPalette } from '../text-field/shared';
import { buildTheme } from '../theme/build-theme';
import { APP_COLOR_NAMES } from '../theme/color-presets';
import { surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';

const themes = APP_COLOR_NAMES.flatMap((preset) =>
  (['light', 'dark'] as const).map((mode) => buildTheme(preset, mode)),
);
afterEach(() => jest.restoreAllMocks());

it('keeps native palettes and opaque/reduced material paint unchanged', () => {
  for (const theme of themes) {
    const fill = surfaceFillOn(theme, theme.colors.background);
    expect(resolveTextFieldPalette(theme).placeholder).toBe(
      surfaceTextOn(theme, fill).textTertiary,
    );
  }
  jest.replaceProperty(Platform, 'OS', 'web');
  const input = { fill: '#334455', parentFill: '#112233' };
  const before = resolveSurfaceMaterial(input);
  for (const reducedTransparency of [false, true]) {
    const next = resolveSurfaceMaterial({
      ...input,
      webOptics: { mode: 'dark', reducedTransparency },
    });
    expect(next.paintFill).toBe(before.paintFill);
    expect(next.solidFill).toBe(before.solidFill);
    expect(next.publishedFill).toBe(before.publishedFill);
    if (reducedTransparency) expect(next.bodyBounds?.min).toEqual(next.bodyBounds?.max);
  }
});

it('reports the exact presets whose primary cannot cover the full unknown sampler plus glow', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  const unsatisfied: string[] = [];
  for (const theme of themes) {
    const palette = resolveTextFieldPalette(theme);
    const bounds = resolveSurfaceMaterial({
      fill: palette.background,
      parentFill: theme.colors.background,
      webOptics: { mode: theme.isDark ? 'dark' : 'light', interiorInset: 4 },
    }).bodyBounds!;
    const result = quietTextOnBody(bounds, theme.colors.text, 4.5);
    if (!result.satisfied) {
      unsatisfied.push(`${APP_COLOR_NAMES[Math.floor(themes.indexOf(theme) / 2)]}/${theme.mode}`);
      expect(result.color).toBe(theme.colors.text);
      expect(result.ratio).toBeLessThan(4.5);
    } else expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    expect(palette.placeholder).toBe(result.color);
    expect(palette.count).toBe(surfaceTextOn(theme, palette.background).textTertiary);
    expect(palette.text).toBe(theme.colors.text);
    expect(palette.icon).toBe(theme.colors.textSecondary);
  }
  expect(unsatisfied).toEqual(['mono/dark', 'graphite/dark']);
});

it('does not certify an interval that contains the foreground luminance', () => {
  expect(quietTextOnBody(UNKNOWN_BACKING, '#777777', 4.5)).toMatchObject({
    ratio: 1,
    satisfied: false,
  });
});

it('does not invent paint for transparent/disabled paint hosts or lose explicit alpha', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  for (const input of [{ fill: 'transparent' }, { fill: '#334455', paint: false }]) {
    expect(
      resolveSurfaceMaterial({ ...input, parentFill: '#123456', webOptics: { mode: 'dark' } })
        .bodyBounds,
    ).toBeUndefined();
  }
  expect(surfaceBodyBounds('rgba(0,0,0,.5)', 'dark')!.max[0]).toBeGreaterThan(0.49);
});

it('includes the edge where a canonical small line box reaches the glow', () => {
  const body = surfaceBodyBounds('rgba(40,50,60,.72)', 'dark')!;
  const small = surfaceBodyBounds('rgba(40,50,60,.72)', 'dark', UNKNOWN_BACKING, 4)!;
  const edge = surfaceBodyBounds('rgba(40,50,60,.72)', 'dark', UNKNOWN_BACKING, 0)!;
  expect(small.max[0]).toBeGreaterThan(body.max[0]);
  expect(edge.max[0]).toBeGreaterThan(small.max[0]);
  expect(small.min).toEqual(body.min);
});
