import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

// The shared mocks do not stub these two; the loader needs both.
jest.mock('react-native-svg', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-svg');
  const R = jest.requireActual('react');
  const stub = (name: string) => {
    const C = R.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      R.createElement(name, { ref, ...props }, props.children as React.ReactNode),
    );
    C.displayName = name;
    return C;
  };
  return { ...actual, __esModule: true, default: actual.Svg, Filter: stub('Filter'), FeGaussianBlur: stub('FeGaussianBlur') };
});
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    ...actual,
    __esModule: true,
    useFrameCallback: () => ({ setActive: jest.fn(), isActive: false, callbackId: 0 }),
  };
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ComposerLoader, resolveComposerLoaderColors } from '../composer-loader';
import {
  TAPER_STEPS,
  composerLoaderGeometry,
  dashOffsetAt,
  gradientMidColor,
} from '../composer-loader/shared';
import { COMPOSER_LOADER_WEB_CSS } from '../composer-loader/ComposerLoader.web';
import { BUTTON_SHADOW } from '../button/shared';
import { buildTheme } from '../theme/build-theme';
import { resolvedStyle } from './support/rendered-style';

function renderLoader(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The light and surface are `aria-hidden`; RNTL skips those by default. */
const HIDDEN = { includeHiddenElements: true } as const;

const BASE = {
  width: 640,
  height: 52,
  arc: 120,
  line: 2.5,
  bloom: 16,
  bloomStrength: 0.3,
  bloomOnly: false,
  taper: 0,
  reverse: false,
  offset: 0,
};

describe('composerLoaderGeometry', () => {
  it("measures the pill's perimeter as 2(w − h) + πh", () => {
    const g = composerLoaderGeometry(BASE);
    expect(g.rx).toBe(26);
    expect(g.perimeter).toBeCloseTo(2 * (640 - 52) + Math.PI * 52, 6);
  });

  it('draws three layers: bloom, glow, crisp line', () => {
    const { strokes, blurs } = composerLoaderGeometry(BASE);
    const band = (120 / 360) * 100;
    expect(strokes.map((s) => [s.key, s.strokeWidth, s.blur, s.opacity])).toEqual([
      ['bloom-0', 32, 14, 0.3],
      ['glow-0', 8, 6, 0.8],
      ['line-0', 2.5, 0.5, 1],
    ]);
    expect(strokes.map((s) => s.dash)).toEqual([band * 0.9, band * 0.95, band]);
    expect(blurs).toEqual([14, 6, 0.5]);
    // The crisp line leads (phase 0); soft heads trail by their pull-back.
    expect(strokes[2]!.phase).toBe(0);
    const units = (px: number) => (px * 100) / composerLoaderGeometry(BASE).perimeter;
    expect(strokes[0]!.phase).toBeCloseTo(band * 0.9 - band + units(32), 6);
    expect(strokes[1]!.phase).toBeCloseTo(band * 0.95 - band + units(10), 6);
  });

  it('drops layers for bloom 0 and bloomOnly', () => {
    expect(composerLoaderGeometry({ ...BASE, bloom: 0 }).strokes.map((s) => s.key)).toEqual(['glow-0', 'line-0']);
    expect(composerLoaderGeometry({ ...BASE, bloomOnly: true }).strokes.map((s) => s.key)).toEqual(['bloom-0']);
  });

  it('stacks 14 shorter centred copies per layer when tapering, sharing the opacity', () => {
    const { strokes, blurs } = composerLoaderGeometry({ ...BASE, taper: 0.5 });
    expect(strokes).toHaveLength(3 * TAPER_STEPS);
    const lines = strokes.filter((s) => s.key.startsWith('line-'));
    expect(lines[0]!.opacity).toBeCloseTo(1 / TAPER_STEPS, 9);
    // Each copy is shorter and moved forward by half the difference.
    expect(lines[1]!.dash).toBeLessThan(lines[0]!.dash);
    expect(lines[1]!.phase).toBeCloseTo(lines[0]!.phase - (lines[0]!.dash - lines[1]!.dash) / 2, 9);
    // The crisp blur grows with the line so the steps melt.
    expect(blurs[2]).toBe(2);
  });

  it('moves the band forward by `offset` and flips the phase for `reverse`', () => {
    expect(composerLoaderGeometry({ ...BASE, offset: 0.25 }).strokes[2]!.phase).toBeCloseTo(-25, 9);
    const rev = composerLoaderGeometry({ ...BASE, reverse: true }).strokes;
    expect(rev[2]!.phase).toBe(0);
    expect(rev[1]!.phase).toBeGreaterThan(0);
  });

  it('honours a corner radius', () => {
    const g = composerLoaderGeometry({ ...BASE, height: 120, radius: 16 });
    expect(g.rx).toBe(16);
    expect(g.perimeter).toBeCloseTo(2 * (640 + 120) - 8 * 16 + 2 * Math.PI * 16, 6);
  });
});

describe('dashOffsetAt (the CSS animation, as a function of time)', () => {
  it('laps 0 → -100 per `speed`, holding at 0 through a positive delay', () => {
    expect(dashOffsetAt(0, 0, 4, false)).toBe(-0);
    expect(dashOffsetAt(1, 0, 4, false)).toBeCloseTo(-25, 9);
    expect(dashOffsetAt(5, 0, 4, false)).toBeCloseTo(-25, 9);
    // phase 25 → delay 1s at speed 4
    expect(dashOffsetAt(0.5, 25, 4, false)).toBe(0);
    expect(dashOffsetAt(2, 25, 4, false)).toBeCloseTo(-25, 9);
    // a negative phase is a head start
    expect(dashOffsetAt(0, -25, 4, false)).toBeCloseTo(-25, 9);
  });

  it('runs backwards for reverse', () => {
    expect(dashOffsetAt(1, 0, 4, true)).toBeCloseTo(-75, 9);
  });
});

describe('gradientMidColor', () => {
  it('blends the two middle stops, never washing to white', () => {
    expect(gradientMidColor('rgb(0, 100, 200)', 'rgb(100, 200, 0)')).toBe(
      'rgb(50,150,100)',
    );
  });
});

describe('ComposerLoader (native)', () => {
  it('paints the pill surface with shadow-xs behind the light, and renders children on top', () => {
    const { getByTestId, getByText } = renderLoader(
      <ComposerLoader testID="cl">
        <Text>composer</Text>
      </ComposerLoader>,
    );
    const theme = buildTheme('teal', 'light');
    const surface = resolvedStyle(getByTestId('cl-surface', HIDDEN).props.style);
    expect(surface).toMatchObject({
      borderRadius: 9999,
      backgroundColor: theme.colors.card,
      boxShadow: BUTTON_SHADOW.light,
    });
    expect(getByText('composer')).toBeTruthy();
  });

  it('uses neutral-800 and the dark shadow in dark mode', () => {
    const { getByTestId } = renderLoader(
      <ComposerLoader testID="cl">
        <Text>x</Text>
      </ComposerLoader>,
      'dark',
    );
    const theme = buildTheme('teal', 'dark');
    expect(resolvedStyle(getByTestId('cl-surface', HIDDEN).props.style)).toMatchObject({
      backgroundColor: theme.colors.card,
      boxShadow: BUTTON_SHADOW.dark,
    });
  });

  it('omits the surface when `surface` is false and uses `radius` for the clip', () => {
    const { queryByTestId, getByTestId } = renderLoader(
      <ComposerLoader testID="cl" surface={false} radius={16}>
        <Text>x</Text>
      </ComposerLoader>,
    );
    expect(queryByTestId('cl-surface', HIDDEN)).toBeNull();
    expect(resolvedStyle(getByTestId('cl-light', HIDDEN).props.style)).toMatchObject({
      borderRadius: 16,
      overflow: 'hidden',
    });
  });

  it('fades the light by `active` and hides it from assistive tech', () => {
    const on = renderLoader(
      <ComposerLoader testID="cl">
        <Text>x</Text>
      </ComposerLoader>,
    );
    const light = on.getByTestId('cl-light', HIDDEN);
    expect(resolvedStyle(light.props.style).opacity).toBe(1);
    expect(light.props['aria-hidden']).toBe(true);
    on.unmount();
    const off = renderLoader(
      <ComposerLoader testID="cl" active={false}>
        <Text>x</Text>
      </ComposerLoader>,
    );
    expect(resolvedStyle(off.getByTestId('cl-light', HIDDEN).props.style).opacity).toBe(0);
  });

  it('draws one dash stroke per layer copy, dashes scaled to the perimeter in px', () => {
    const { UNSAFE_root } = renderLoader(
      <ComposerLoader taper={0.4}>
        <Text>x</Text>
      </ComposerLoader>,
    );
    const rects = UNSAFE_root.findAll(
      (n) => (n.type as unknown) === 'Rect' && n.props.stroke !== undefined,
    );
    expect(rects).toHaveLength(3 * TAPER_STEPS);
    const g = composerLoaderGeometry({ ...BASE, taper: 0.4 });
    const first = rects[0]!.props;
    expect(first.strokeDasharray[0]).toBeCloseTo((g.strokes[0]!.dash * g.perimeter) / 100, 6);
    expect(first.filter).toMatch(/^url\(#bloom-cl-.*-b14\)$/);
    expect(first.strokeLinecap).toBe('round');
  });
});

describe('ComposerLoader (web CSS)', () => {
  it('laps the dash offset 0 → -100 and stops under reduced motion', () => {
    expect(COMPOSER_LOADER_WEB_CSS).toMatch(/from \{ stroke-dashoffset: 0; \}/);
    expect(COMPOSER_LOADER_WEB_CSS).toMatch(/to \{ stroke-dashoffset: -100; \}/);
    expect(COMPOSER_LOADER_WEB_CSS).toMatch(
      /prefers-reduced-motion: reduce\)[^}]*\.bloom-composer-loader-rect \{ animation: none !important; \}/,
    );
  });
});

describe('loader theme palette', () => {
  it('follows the preset and mode through canonical roles', () => {
    const teal = buildTheme('teal', 'light');
    const blue = buildTheme('blue', 'light');
    const dark = buildTheme('teal', 'dark');
    for (const theme of [teal, blue, dark]) {
      expect(resolveComposerLoaderColors(theme)).toEqual([
        theme.colors.primarySubtleForeground,
        theme.colors.secondarySubtleForeground,
        theme.colors.tertiarySubtleForeground,
        theme.colors.primarySubtleForeground,
      ]);
    }
    expect(resolveComposerLoaderColors(teal)).not.toEqual(resolveComposerLoaderColors(blue));
    expect(resolveComposerLoaderColors(teal)).not.toEqual(resolveComposerLoaderColors(dark));
  });
});
