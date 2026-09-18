/**
 * The gate on WHAT a surface publishes to the subtree it paints.
 *
 * `useSurfaceFill()` existed and was always right about one thing and wrong
 * about another: right that nothing published means the page, wrong that a
 * container which paints a colour off the ladder could not say so. The bug it
 * now has to prevent is a MATCH failure — chrome that is supposed to disappear
 * into the surface behind it painting a near-miss instead — and a near-miss is
 * invisible to a structural assertion: `bg-card` and rung 1 are both perfectly
 * valid colours and the panel renders either without complaint.
 *
 * So every assertion here is about the exact colour, and each one is written so
 * that the WRONG answer is a different value rather than a missing one:
 *
 *  - the dark-mode discriminator (`theme.colors.card` is NOT rung 1) is asserted
 *    FIRST, so "the panel published the rung" can never pass by coincidence;
 *  - a panel that had its surface repainted publishes the weaker answer rather
 *    than a confident wrong one;
 *  - an overlay that paints the page colour RESETS what it publishes, which is
 *    what keeps a dialog opened from inside a panel from claiming the panel's
 *    fill;
 *  - and on web the CSS variable is asserted on the SAME node as the fill,
 *    because the DOM inherits it whether or not React context agrees.
 */
import React, { createRef } from 'react';
import { Platform, Text, View } from 'react-native';
import { act, render } from '@testing-library/react-native';

import BottomSheet, { type BottomSheetRef } from '../bottom-sheet';
import { ContentPanel } from '../content-panel/ContentPanel';
import { ContentPanel as ContentPanelWeb } from '../content-panel/ContentPanel.web';
import { Dialog } from '../dialog';
import {
  SURFACE_FILL_CSS,
  SURFACE_FILL_VAR,
  SurfaceLevelProvider,
  resolveSurfaceLevel,
  surfaceFillOn,
  surfaceFillVars,
  useSurfaceFill,
  useSurfaceLevel,
  useSurfaceLevelValue,
} from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { BloomColorScope } from '../theme/color-scope/ColorScope';
import { findHost, resolvedStyle } from './support/rendered-style';

const PRESET = 'teal';
/** The scoped preset the last suite switches to. */
const SCOPED_PRESET = 'purple';

/**
 * Derived ONCE, at module scope. `buildTheme` runs the whole colour engine, and
 * a suite that re-derives per assertion is what pushes a jest worker into the
 * `Context::GetNumberOfEmbedderDataFields` crash `AGENTS.md` records — this file
 * hit it before the themes were hoisted.
 */
const THEMES = {
  light: buildTheme(PRESET, 'light'),
  dark: buildTheme(PRESET, 'dark'),
  scoped: buildTheme(SCOPED_PRESET, 'dark'),
} as const;

/** Reports the ambient fill as a testID, so a wrong colour fails by VALUE. */
function FillProbe() {
  const fill = useSurfaceFill();
  return <View testID={`fill:${fill}`} />;
}

/** The whole ambient paint, for the derived members. */
function PaintProbe({ delta = 0 }: { delta?: number }) {
  const paint = useSurfaceLevel(delta);
  return <View testID={`paint:${paint.level}:${paint.background}:${paint.raised}`} />;
}

function LevelProbe() {
  const level = useSurfaceLevelValue();
  return <View testID={`level:${level}`} />;
}

function renderIn(mode: 'light' | 'dark', ui: React.ReactNode) {
  return render(
    <BloomThemeProvider mode={mode} colorPreset={PRESET}>
      {ui}
    </BloomThemeProvider>,
  );
}

/** The one testID a probe rendered, so an assertion reads the value it got. */
function probed(tree: unknown, prefix: string): string {
  const ids = idsIn(tree).filter((id) => id.startsWith(`${prefix}:`));
  const only = ids.length === 1 ? ids[0] : undefined;
  if (only === undefined) throw new Error(`expected one "${prefix}" probe, got ${ids.length}`);
  return only.slice(prefix.length + 1);
}

function idsIn(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const child of node) idsIn(child, out);
    return out;
  }
  if (typeof node !== 'object' || node === null) return out;
  const el = node as { props?: Record<string, unknown>; children?: unknown };
  const testID = el.props?.testID;
  if (typeof testID === 'string') out.push(testID);
  return idsIn(el.children, out);
}

describe('the ambient surface answers with the fill, not the rung', () => {
  it('is the page when nothing published one', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = THEMES[mode];
      const { toJSON } = renderIn(mode, <FillProbe />);
      expect([mode, probed(toJSON(), 'fill')]).toEqual([mode, theme.colors.background]);
    }
  });

  it('is the rung when a container published only a rung', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = THEMES[mode];
      const { toJSON } = renderIn(
        mode,
        <SurfaceLevelProvider level={1}>
          <FillProbe />
        </SurfaceLevelProvider>,
      );
      expect([mode, probed(toJSON(), 'fill')]).toEqual([
        mode,
        resolveSurfaceLevel(theme, 1).background,
      ]);
    }
  });

  it('is the published colour verbatim, even where the rung disagrees', () => {
    const theme = THEMES.dark;
    // The discriminator this whole feature exists for: in dark mode the card is
    // NOT rung 1 (the rung is a computed step off the page). If these two were
    // ever the same colour, every assertion below would pass without measuring
    // anything.
    expect(theme.colors.card).not.toBe(resolveSurfaceLevel(theme, 1).background);

    const { toJSON } = render(
      <BloomThemeProvider mode="dark" colorPreset={PRESET}>
        <SurfaceLevelProvider level={1} fill={theme.colors.card}>
          <FillProbe />
        </SurfaceLevelProvider>
      </BloomThemeProvider>,
    );
    expect(probed(toJSON(), 'fill')).toBe(theme.colors.card);
  });

  it('keeps the rung a container published alongside an exact fill', () => {
    const theme = THEMES.dark;
    const { toJSON } = renderIn(
      'dark',
      <SurfaceLevelProvider level={1} fill={theme.colors.card}>
        <LevelProbe />
      </SurfaceLevelProvider>,
    );
    expect(probed(toJSON(), 'level')).toBe('1');
  });

  it('derives the hairline, the raised fill and the text rungs off the REAL parent', () => {
    const theme = THEMES.dark;
    const { toJSON } = renderIn(
      'dark',
      <SurfaceLevelProvider level={1} fill={theme.colors.card}>
        <PaintProbe />
      </SurfaceLevelProvider>,
    );
    const [, background, raised] = probed(toJSON(), 'paint').split(':');
    expect(background).toBe(theme.colors.card);
    expect(raised).toBe(surfaceFillOn(theme, theme.colors.card));
  });

  it('steps a requested delta off the published fill, not off the ladder', () => {
    const theme = THEMES.dark;
    const { toJSON } = renderIn(
      'dark',
      <SurfaceLevelProvider level={1} fill={theme.colors.card}>
        <PaintProbe delta={1} />
      </SurfaceLevelProvider>,
    );
    const [level, background] = probed(toJSON(), 'paint').split(':');
    expect(level).toBe('2');
    expect(background).toBe(surfaceFillOn(theme, theme.colors.card));
    // …and that is NOT rung 2, which assumed a parent this panel never had.
    expect(background).not.toBe(resolveSurfaceLevel(theme, 2).background);
  });

  it('counts the steps the CLAMPED rung costs, not the delta asked for', () => {
    // Rung 1 + 3 lands on rung 3, which is TWO steps up — a third step would
    // paint a colour above the top of the ladder.
    const theme = THEMES.dark;
    const { toJSON } = renderIn(
      'dark',
      <SurfaceLevelProvider level={1} fill={theme.colors.card}>
        <PaintProbe delta={3} />
      </SurfaceLevelProvider>,
    );
    const [level, background] = probed(toJSON(), 'paint').split(':');
    expect(level).toBe('3');
    expect(background).toBe(surfaceFillOn(theme, surfaceFillOn(theme, theme.colors.card)));
  });

  it('answers a step DOWN from the ladder — a fill says nothing about below it', () => {
    // "The surface under the one I am on" is the page, not the panel's card
    // labelled rung 0.
    const theme = THEMES.dark;
    const { toJSON } = renderIn(
      'dark',
      <SurfaceLevelProvider level={1} fill={theme.colors.card}>
        <PaintProbe delta={-1} />
      </SurfaceLevelProvider>,
    );
    const [level, background] = probed(toJSON(), 'paint').split(':');
    expect(level).toBe('0');
    expect(background).toBe(resolveSurfaceLevel(theme, 0).background);
    expect(background).not.toBe(theme.colors.card);
  });
});

describe('ContentPanel publishes the colour it paints', () => {
  it('publishes `colors.card` — the fill behind `bg-card` — in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = THEMES[mode];
      const { toJSON } = renderIn(
        mode,
        <ContentPanel>
          <FillProbe />
        </ContentPanel>,
      );
      expect([mode, probed(toJSON(), 'fill')]).toEqual([mode, theme.colors.card]);
    }
  });

  it('publishes rung 1 to everything inside it', () => {
    const { toJSON } = renderIn(
      'light',
      <ContentPanel>
        <LevelProbe />
      </ContentPanel>,
    );
    expect(probed(toJSON(), 'level')).toBe('1');
  });

  it('stops claiming a colour when the caller repainted the surface', () => {
    const theme = THEMES.dark;
    const { toJSON } = renderIn(
      'dark',
      <ContentPanel surfaceClassName="bg-background">
        <FillProbe />
      </ContentPanel>,
    );
    // Not `colors.card` — the panel is not painting it any more, and a wrong
    // exact colour is worse than the rung it can still stand behind.
    expect(probed(toJSON(), 'fill')).not.toBe(theme.colors.card);
    expect(probed(toJSON(), 'fill')).toBe(resolveSurfaceLevel(theme, 1).background);
  });

  it('takes the caller at their word when they name the repainted colour', () => {
    const { toJSON } = renderIn(
      'dark',
      <ContentPanel surfaceClassName="bg-background" surfaceColor="rgb(1 2 3)">
        <FillProbe />
      </ContentPanel>,
    );
    expect(probed(toJSON(), 'fill')).toBe('rgb(1 2 3)');
  });

  it('stops claiming a colour when the repaint came through `surfaceStyle`', () => {
    // The same repaint by the other door. WHICH of the two paints is a platform
    // question — `styled()` appends the class descriptor after the style prop,
    // so the class wins the array on native while the inline style wins the
    // cascade on web — so the panel publishes neither exact colour.
    const theme = THEMES.dark;
    const { toJSON } = renderIn(
      'dark',
      <ContentPanel surfaceStyle={{ backgroundColor: 'rgb(4 5 6)' }}>
        <FillProbe />
      </ContentPanel>,
    );
    expect(probed(toJSON(), 'fill')).not.toBe(theme.colors.card);
    expect(probed(toJSON(), 'fill')).toBe(resolveSurfaceLevel(theme, 1).background);
  });

  it('still publishes `colors.card` for a `surfaceStyle` that paints nothing', () => {
    // A layout-only override is not a repaint: the panel is still `bg-card`.
    const theme = THEMES.dark;
    const { toJSON } = renderIn(
      'dark',
      <ContentPanel surfaceStyle={[{ marginTop: 8 }, null]}>
        <FillProbe />
      </ContentPanel>,
    );
    expect(probed(toJSON(), 'fill')).toBe(theme.colors.card);
  });

  it('takes `surfaceColor` over a `surfaceStyle` repaint too', () => {
    const { toJSON } = renderIn(
      'dark',
      <ContentPanel surfaceStyle={{ backgroundColor: 'rgb(4 5 6)' }} surfaceColor="rgb(4 5 6)">
        <FillProbe />
      </ContentPanel>,
    );
    expect(probed(toJSON(), 'fill')).toBe('rgb(4 5 6)');
  });
});

describe('an overlay that paints the page RESETS what the subtree is told', () => {
  it('a dialog inside a panel publishes the dialog surface, not the panel card', () => {
    const theme = THEMES.dark;
    // The shape a portal produces on web: the overlay's content is a React
    // descendant of whatever opened it, so the panel's context reaches it.
    const { toJSON } = renderIn(
      'dark',
      <ContentPanel>
        <SurfaceLevelProvider level={0} fill={theme.colors.background}>
          <FillProbe />
        </SurfaceLevelProvider>
      </ContentPanel>,
    );
    expect(probed(toJSON(), 'fill')).toBe(theme.colors.background);
    expect(probed(toJSON(), 'fill')).not.toBe(theme.colors.card);
  });

  // …and the same thing asserted through the REAL surfaces, because the wrap
  // above only proves the mechanism. The reset is a line inside each overlay,
  // and a line that no test renders is a line the next edit can delete for
  // being decorative — which is exactly what it is not.
  it('a BottomSheet opened inside a panel publishes the SHEET colour', () => {
    const theme = THEMES.dark;
    const ref = createRef<BottomSheetRef>();
    const { toJSON } = renderIn(
      'dark',
      <ContentPanel>
        <BottomSheet ref={ref}>
          <FillProbe />
        </BottomSheet>
      </ContentPanel>,
    );
    act(() => ref.current?.present());
    expect(probed(toJSON(), 'fill')).toBe(theme.colors.background);
    expect(probed(toJSON(), 'fill')).not.toBe(theme.colors.card);
  });

  it('a side-sheet Dialog opened inside a panel publishes the DRAWER colour', () => {
    const theme = THEMES.dark;
    const { toJSON } = renderIn(
      'dark',
      <ContentPanel>
        <Dialog open placement="left">
          <FillProbe />
        </Dialog>
      </ContentPanel>,
    );
    expect(probed(toJSON(), 'fill')).toBe(theme.colors.background);
    expect(probed(toJSON(), 'fill')).not.toBe(theme.colors.card);
  });
});

describe('the web variable rides the element that carries the fill', () => {
  const realOS = Platform.OS;
  afterEach(() => {
    (Platform as { OS: string }).OS = realOS;
  });

  it('is written on the panel surface on web', () => {
    (Platform as { OS: string }).OS = 'web';
    const theme = THEMES.dark;
    const { toJSON } = render(
      <BloomThemeProvider mode="dark" colorPreset={PRESET}>
        <ContentPanelWeb framed>
          <Text>content</Text>
        </ContentPanelWeb>
      </BloomThemeProvider>,
    );
    const surface = findHost(toJSON(), 'content-panel-surface');
    expect(surface).not.toBeNull();
    expect(resolvedStyle(surface?.props.style)[SURFACE_FILL_VAR]).toBe(theme.colors.card);
  });

  it('is absent on native, where the hook is the answer', () => {
    (Platform as { OS: string }).OS = 'ios';
    expect(surfaceFillVars('rgb(1 2 3)')).toBeUndefined();
  });

  it('falls back to the page, so a subtree that owns no surface still resolves', () => {
    // Both halves substitute at the USING element, which is what keeps a
    // `BloomColorScope` subtree on its own `--background` instead of the
    // document root's.
    expect(SURFACE_FILL_CSS).toBe(`var(${SURFACE_FILL_VAR}, var(--background))`);
    expect(SURFACE_FILL_VAR.startsWith('--')).toBe(true);
  });
});

describe('the published fill follows a scoped colour preset', () => {
  /**
   * `BloomColorScope` builds a whole theme for the subtree and hands it down the
   * theme context, so a hook that reads the theme is scope-correct by
   * construction — and that is the reason the published fill is a hook and an
   * inline variable rather than anything resolved at `:root`. The property worth
   * pinning is that a panel inside a scope publishes the SCOPE's card: a
   * root-resolved answer fails exactly here.
   */
  it('publishes the scope preset card, not the app preset card', () => {
    const app = THEMES.dark;
    const scoped = THEMES.scoped;
    expect(app.colors.card).not.toBe(scoped.colors.card);

    const { toJSON } = render(
      <BloomThemeProvider mode="dark" colorPreset={PRESET}>
        <BloomColorScope colorPreset={SCOPED_PRESET}>
          <ContentPanel>
            <FillProbe />
          </ContentPanel>
        </BloomColorScope>
      </BloomThemeProvider>,
    );
    expect(probed(toJSON(), 'fill')).toBe(scoped.colors.card);
  });
});

describe('a theme-less panel still renders', () => {
  it('does not throw outside a BloomThemeProvider', () => {
    // The native panel has always rendered without a provider; publishing must
    // not be the thing that starts demanding one.
    const { getByText } = render(
      <ContentPanel>
        <Text>content</Text>
      </ContentPanel>,
    );
    expect(getByText('content')).toBeTruthy();
  });
});
