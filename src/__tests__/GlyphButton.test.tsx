import React from 'react';
import { Text as RNText, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { GlyphButton } from '../button';
import {
  GLYPH_BUTTON_GLYPH_RATIO,
  glyphButtonGlyphSize,
  resolveGlyphButtonPaint,
} from '../button/shared';
import { resolvedStyle } from './support/rendered-style';

/**
 * `GlyphButton` — the round glyph control the five family-local copies folded
 * into. What is asserted here is what those five relied on: the box geometry,
 * the FOUR colour corners (off/on × rest/hover), the fills, the toggle's two
 * accessibility spellings, and the disabled convention.
 */

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function captureTheme(): Theme {
  let captured: Theme | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  renderWithTheme(<Probe />);
  if (!captured) throw new Error('theme not captured');
  return captured;
}

/** The props of the most recent render — `Array.prototype.at` is past this tsconfig's lib. */
function lastCall(Glyph: jest.Mock): { fill?: string; width?: number; height?: number } {
  return Glyph.mock.calls[Glyph.mock.calls.length - 1]?.[0] ?? {};
}

/** A glyph that records the props the button hands it. */
function makeGlyph() {
  return jest.fn(() => null) as unknown as jest.Mock & React.ComponentType<{
    width?: number;
    height?: number;
    fill?: string;
  }>;
}

describe('GlyphButton geometry', () => {
  it('is a circle of `size`, with the glyph at 0.6 of the box', () => {
    const Glyph = makeGlyph();
    const { getByTestId } = renderWithTheme(
      <GlyphButton testID="g" size={40} icon={Glyph} accessibilityLabel="More" />,
    );
    const style = resolvedStyle(getByTestId('g').props.style);
    expect(style.width).toBe(40);
    expect(style.height).toBe(40);
    // A full pill on a square IS a circle.
    expect(style.borderRadius).toBeGreaterThanOrEqual(20);
    expect(Glyph.mock.calls[0]?.[0]).toMatchObject({ width: 24, height: 24 });
    // 24 is the ratio's own answer, not a coincidence of this size.
    expect(glyphButtonGlyphSize(40)).toBe(24);
    expect(GLYPH_BUTTON_GLYPH_RATIO).toBe(0.6);
  });

  it('defaults to a 36 box — the same height `Button size="medium"` stands at', () => {
    const { getByTestId } = renderWithTheme(
      <GlyphButton testID="g" icon={makeGlyph()} accessibilityLabel="More" />,
    );
    expect(resolvedStyle(getByTestId('g').props.style).width).toBe(36);
  });

  it('`glyphSize` overrides the ratio, keeping the box', () => {
    const Glyph = makeGlyph();
    const { getByTestId } = renderWithTheme(
      <GlyphButton testID="g" size={32} glyphSize={20} icon={Glyph} accessibilityLabel="More" />,
    );
    expect(resolvedStyle(getByTestId('g').props.style).width).toBe(32);
    expect(Glyph.mock.calls[0]?.[0]).toMatchObject({ width: 20, height: 20 });
  });

  it('`grow` makes the box a MINIMUM width, for a text glyph', () => {
    const { getByTestId } = renderWithTheme(
      <GlyphButton testID="g" size={32} grow accessibilityLabel="Speed">
        <RNText>1.5×</RNText>
      </GlyphButton>,
    );
    const style = resolvedStyle(getByTestId('g').props.style);
    expect(style.width).toBeUndefined();
    expect(style.minWidth).toBe(32);
    expect(style.paddingLeft).toBe(6);
    expect(style.paddingRight).toBe(6);
  });
});

describe('GlyphButton paint', () => {
  it('rests on the muted reading colour with no fill', () => {
    const theme = captureTheme();
    const paint = resolveGlyphButtonPaint(theme);
    const Glyph = makeGlyph();
    const { getByTestId } = renderWithTheme(
      <GlyphButton testID="g" icon={Glyph} accessibilityLabel="More" />,
    );
    expect(Glyph.mock.calls[0]?.[0]).toMatchObject({ fill: paint.color });
    expect(resolvedStyle(getByTestId('g').props.style).backgroundColor).toBe(paint.fill);
    // The default wash is the NEUTRAL one, never `ghost`'s accent tint.
    expect(paint.hoverFill).not.toBe(theme.colors.primary);
  });

  it('takes the hover colour and wash under a pointer, and puts them back', () => {
    const theme = captureTheme();
    const paint = resolveGlyphButtonPaint(theme);
    const Glyph = makeGlyph();
    const { getByTestId } = renderWithTheme(
      <GlyphButton testID="g" icon={Glyph} accessibilityLabel="More" />,
    );
    fireEvent(getByTestId('g'), 'hoverIn');
    expect(lastCall(Glyph)).toMatchObject({ fill: paint.hoverColor });
    expect(resolvedStyle(getByTestId('g').props.style).backgroundColor).toBe(paint.hoverFill);
    fireEvent(getByTestId('g'), 'hoverOut');
    expect(lastCall(Glyph)).toMatchObject({ fill: paint.color });
  });

  it('paints all FOUR corners: off/on × rest/hover', () => {
    const Glyph = makeGlyph();
    const { getByTestId, rerender } = renderWithTheme(
      <GlyphButton
        testID="g"
        icon={Glyph}
        accessibilityLabel="Shuffle"
        pressed={false}
        color="#111111"
        hoverColor="#222222"
        activeColor="#333333"
        activeHoverColor="#444444"
      />,
    );
    expect(lastCall(Glyph)).toMatchObject({ fill: '#111111' });
    fireEvent(getByTestId('g'), 'hoverIn');
    expect(lastCall(Glyph)).toMatchObject({ fill: '#222222' });
    fireEvent(getByTestId('g'), 'hoverOut');

    const on = (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <GlyphButton
          testID="g"
          icon={Glyph}
          accessibilityLabel="Shuffle"
          pressed
          color="#111111"
          hoverColor="#222222"
          activeColor="#333333"
          activeHoverColor="#444444"
        />
      </BloomThemeProvider>
    );
    rerender(on);
    expect(lastCall(Glyph)).toMatchObject({ fill: '#333333' });
    fireEvent(getByTestId('g'), 'hoverIn');
    expect(lastCall(Glyph)).toMatchObject({ fill: '#444444' });
  });

  it('hands a FUNCTION child the resolved foreground, so a painted glyph follows the state', () => {
    const seen: string[] = [];
    const { getByTestId } = renderWithTheme(
      <GlyphButton testID="g" accessibilityLabel="Speed" color="#111111" hoverColor="#222222">
        {(foreground: string) => {
          seen.push(foreground);
          return <View />;
        }}
      </GlyphButton>,
    );
    expect(seen[seen.length - 1]).toBe('#111111');
    fireEvent(getByTestId('g'), 'hoverIn');
    expect(seen[seen.length - 1]).toBe('#222222');
  });

  it('renders `decoration` inside the box (the player`s active dot)', () => {
    const { getByTestId } = renderWithTheme(
      <GlyphButton
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="Shuffle"
        decoration={<View testID="dot" />}
      />,
    );
    expect(getByTestId('dot')).toBeTruthy();
  });
});

describe('GlyphButton accessibility and disabled', () => {
  it('a TOGGLE carries both spellings; a plain button carries neither', () => {
    const { getByTestId, rerender } = renderWithTheme(
      <GlyphButton testID="g" icon={makeGlyph()} accessibilityLabel="Shuffle" pressed />,
    );
    // `aria-pressed` for web (react-native-web drops `accessibilityState`),
    // `accessibilityState.selected` for native (RN has no `aria-pressed`).
    expect(getByTestId('g').props['aria-pressed']).toBe(true);
    expect(getByTestId('g').props.accessibilityState).toMatchObject({ selected: true });

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <GlyphButton testID="g" icon={makeGlyph()} accessibilityLabel="More options" />
      </BloomThemeProvider>,
    );
    expect(getByTestId('g').props['aria-pressed']).toBeUndefined();
    expect(getByTestId('g').props.accessibilityState?.selected).toBeUndefined();
  });

  it('is named by `accessibilityLabel` — it draws no text', () => {
    const { getByTestId } = renderWithTheme(
      <GlyphButton testID="g" icon={makeGlyph()} accessibilityLabel="More options" />,
    );
    expect(getByTestId('g').props.accessibilityLabel).toBe('More options');
    expect(getByTestId('g').props.role).toBe('button');
  });

  it('forwards the trigger props a menu composes onto it with `asChild`', () => {
    const { getByTestId } = renderWithTheme(
      <GlyphButton
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="More options"
        aria-expanded
        aria-haspopup="menu"
      />,
    );
    expect(getByTestId('g').props['aria-expanded']).toBe(true);
    expect(getByTestId('g').props['aria-haspopup']).toBe('menu');
  });

  it('disabled: dimmed, and all three disabled spellings', () => {
    const { getByTestId } = renderWithTheme(
      <GlyphButton
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="More"
        disabled
        onPress={() => {}}
      />,
    );
    const node = getByTestId('g');
    expect(resolvedStyle(node.props.style).opacity).toBe(0.5);
    // `disabled` is the PROP (the only spelling `Pressable` honours, since it
    // appends its own `aria-disabled` after the caller's), `aria-disabled` is
    // what web reads, `accessibilityState` what native reads.
    expect(node.props.disabled).toBe(true);
    expect(node.props['aria-disabled']).toBe(true);
    expect(node.props.accessibilityState).toMatchObject({ disabled: true });
    // The press itself is NOT assertable here: the repo-wide `react-native`
    // mock renders a host element that ignores `disabled`, so a `fireEvent.press`
    // fires whatever the component does. Real RN and react-native-web both
    // swallow it.
  });

  it('`disabledOpacity` keeps a call site`s own dim (track-list draws 0.4)', () => {
    const { getByTestId } = renderWithTheme(
      <GlyphButton
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="More"
        disabled
        disabledOpacity={0.4}
      />,
    );
    expect(resolvedStyle(getByTestId('g').props.style).opacity).toBe(0.4);
  });

  it('a disabled control does not take the hover paint', () => {
    const Glyph = makeGlyph();
    const { getByTestId } = renderWithTheme(
      <GlyphButton
        testID="g"
        icon={Glyph}
        accessibilityLabel="More"
        disabled
        color="#111111"
        hoverColor="#222222"
      />,
    );
    fireEvent(getByTestId('g'), 'hoverIn');
    expect(lastCall(Glyph)).toMatchObject({ fill: '#111111' });
  });
});
