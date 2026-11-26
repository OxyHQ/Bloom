/**
 * A list of colours (an activity heatmap's scale, a composition bar's tints)
 * is painted from the theme's RGB colours (`useTheme().colors`), as Bloom's own
 * heatmap and an app's colour math read them. Before, it was painted from the
 * paint palette, which a web prepaint makes CSS variables
 * (`var(--bloom-paint-…)`, a role at an opacity a `color-mix()` of one). Under
 * every one of Bloom's preset palettes, light and dark, every role at every
 * named opacity resolves to the same colour, channel for channel, either way.
 */
import { createElement } from 'react';

import { buildTheme } from '../../../../src/theme/build-theme';
import { APP_COLOR_NAMES } from '../../../../src/theme/color-presets';
import { themePaintColors, themePaintVars } from '../../../../src/theme/paint';
import { parseRgba } from '../../../../src/theme/color-utils';
import { RgbContext, type ThemeColors } from './support/bloom-theme';
import { mount, only, quietRenderer } from './support/mount';
import { ActivityHeatmap } from '../entries/activity-heatmap';
import { CompositionBar } from '../entries/composition-bar';
import { COLORS, OPACITY } from '../generated/spec.generated';
import { toElement } from '../render';
import type { ColorName, ColorToken, OpacityName } from '../tokens';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'web', select: <T,>(spec: { web?: T; default?: T }) => spec.web ?? spec.default },
}));

quietRenderer();

/** The palette's roles (the surface fill is the surface's, `onSurface`). */
const ROLES = (Object.keys(COLORS) as ColorName[]).filter((role) => COLORS[role].web !== null);
const OPACITIES = Object.keys(OPACITY) as OpacityName[];
const TOKENS: ColorToken[] = ROLES.flatMap((role) => [
  role,
  ...OPACITIES.map((opacity) => `${role}/${opacity}` as ColorToken),
]);

/** What the paint palette painted on the web: the variable, or the browser's mix of it. */
function before(prepainted: ThemeColors, token: ColorToken): string {
  const [role, opacity] = token.split('/') as [ColorName, OpacityName?];
  const color = prepainted[COLORS[role].paint] as string;
  return opacity === undefined
    ? color
    : `color-mix(in srgb, ${color} ${OPACITY[opacity] * 100}%, transparent)`;
}

/** The colour a browser computes for a paint: its variables substituted, a mix with transparent applied. */
function resolve(value: string, vars: Record<string, string>): string {
  const substituted = value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    const found = vars[name];
    if (found === undefined) throw new Error(`no ${name}`);
    return found;
  });
  const mix = /^color-mix\(in srgb, (.+) ([\d.]+)%, transparent\)$/.exec(substituted);
  if (mix === null) return substituted;
  const [, color, percent] = mix as unknown as [string, string, string];
  const channels = parseRgba(color);
  if (channels === null) return color === 'transparent' ? 'transparent' : substituted;
  return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${channels.a * (Number(percent) / 100)})`;
}

function expectSameColour(after: string, was: string): void {
  const a = parseRgba(after);
  const b = parseRgba(was);
  if (a === null || b === null) {
    expect(after).toBe(was);
    return;
  }
  expect([a.r, a.g, a.b]).toEqual([b.r, b.g, b.b]);
  expect(a.a).toBeCloseTo(b.a, 10);
}

const PALETTES = APP_COLOR_NAMES.flatMap((preset) =>
  (['light', 'dark'] as const).map((mode) => [preset, mode] as const),
);

describe.each(PALETTES)('a list of colours under a web prepaint (%s, %s)', (preset, mode) => {
  const { colors } = buildTheme(preset, mode);
  const rgb = colors as unknown as ThemeColors;
  const vars = themePaintVars(colors);
  const prepainted = themePaintColors(colors) as unknown as ThemeColors;
  const inRgb = (node: Parameters<typeof toElement>[0]) =>
    mount(createElement(RgbContext.Provider, { value: rgb }, toElement(node)), prepainted);

  it('an activity heatmap’s colour scale: every role at every named opacity', () => {
    const r = inRgb(ActivityHeatmap([]).colorScale(TOKENS));
    const scale = only(r, 'ActivityHeatmap').props.colorScale as string[];
    expect(scale).toHaveLength(TOKENS.length);
    TOKENS.forEach((token, index) => {
      expectSameColour(scale[index] as string, resolve(before(prepainted, token), vars));
    });
  });

  it('a composition bar’s tints', () => {
    const segments = TOKENS.map((tint, index) => ({
      key: `s${index}`,
      name: tint,
      amount: 1,
      tint,
    }));
    const r = inRgb(CompositionBar(segments, [null, () => {}], 'hint'));
    const categories = only(r, 'CompositionBar').props.categories as { color: string }[];
    expect(categories).toHaveLength(TOKENS.length);
    TOKENS.forEach((token, index) => {
      expectSameColour(
        categories[index]?.color as string,
        resolve(before(prepainted, token), vars),
      );
    });
  });
});
