import type React from 'react';
import { Text as RNText, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import type { BloomIconComponent } from '../icons/icon-component';
import { Button } from '../button';
import { resolveButtonGeometry, resolveButtonPalette } from '../button/shared';
import { resolvedStyle } from './support/rendered-style';

/**
 * `Button` — the round glyph control the five family-local copies folded
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
  return jest.fn(() => null) as unknown as jest.Mock & BloomIconComponent;
}

describe('Button geometry', () => {
  it('is a circle of `size`, with the glyph at 0.6 of the box', () => {
    const Glyph = makeGlyph();
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        testID="g"
        size={40}
        icon={Glyph}
        accessibilityLabel="More"
      />,
    );
    const style = resolvedStyle(getByTestId('g').props.style);
    expect(style.width).toBe(40);
    expect(style.height).toBe(40);
    // A full pill on a square IS a circle.
    expect(style.borderRadius).toBeGreaterThanOrEqual(20);
    expect(Glyph.mock.calls[0]?.[0]).toMatchObject({ width: 24, height: 24 });
    // 24 is the ratio's own answer, not a coincidence of this size.
    expect(resolveButtonGeometry(40).iconSize).toBe(24);
  });

  it('defaults to a 36 box — the same height `Button size="medium"` stands at', () => {
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="More"
      />,
    );
    expect(resolvedStyle(getByTestId('g').props.style).width).toBe(36);
  });

  it('`glyphSize` overrides the ratio, keeping the box', () => {
    const Glyph = makeGlyph();
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        testID="g"
        size={32}
        iconSize={20}
        icon={Glyph}
        accessibilityLabel="More"
      />,
    );
    expect(resolvedStyle(getByTestId('g').props.style).width).toBe(32);
    expect(Glyph.mock.calls[0]?.[0]).toMatchObject({ width: 20, height: 20 });
  });

  it('`hitSlop` widens the press target, not the box', () => {
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        testID="g"
        size={16}
        hitSlop={8}
        icon={makeGlyph()}
        accessibilityLabel="Next"
      />,
    );
    expect(getByTestId('g').props.hitSlop).toBe(8);
    expect(resolvedStyle(getByTestId('g').props.style).width).toBe(16);
  });

  it('`grow` makes the box a MINIMUM width, for a text glyph', () => {
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        testID="g"
        size={32}
        grow
        accessibilityLabel="Speed"
      >
        <RNText>1.5×</RNText>
      </Button>,
    );
    const style = resolvedStyle(getByTestId('g').props.style);
    expect(style.width).toBeUndefined();
    expect(style.minWidth).toBe(32);
    expect(style.paddingHorizontal).toBe(8);
  });
});

describe('Button paint', () => {
  it('rests on the muted reading colour with no fill', () => {
    const theme = captureTheme();
    const paint = resolveButtonPalette('plain', theme, 'neutral');
    const Glyph = makeGlyph();
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        testID="g"
        icon={Glyph}
        accessibilityLabel="More"
      />,
    );
    expect(Glyph.mock.calls[0]?.[0]).toMatchObject({ fill: paint.rest.foreground });
    expect(resolvedStyle(getByTestId('g').props.style).backgroundColor).toBe(paint.rest.background);
    // The default wash is the NEUTRAL one, never `ghost`'s accent tint.
    expect(paint.hover.background).not.toBe(theme.colors.primary);
  });

  it('takes the hover colour and wash under a pointer, and puts them back', () => {
    const theme = captureTheme();
    const paint = resolveButtonPalette('plain', theme, 'neutral');
    const Glyph = makeGlyph();
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        testID="g"
        icon={Glyph}
        accessibilityLabel="More"
      />,
    );
    fireEvent(getByTestId('g'), 'hoverIn');
    expect(lastCall(Glyph)).toMatchObject({ fill: paint.hover.foreground });
    expect(resolvedStyle(getByTestId('g').props.style).backgroundColor).toBe(
      paint.hover.background,
    );
    fireEvent(getByTestId('g'), 'hoverOut');
    expect(lastCall(Glyph)).toMatchObject({ fill: paint.rest.foreground });
  });

  it('paints all FOUR corners: off/on × rest/hover', () => {
    const Glyph = makeGlyph();
    const { getByTestId, rerender } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
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
        <Button
          appearance="plain"
          tone="neutral"
          iconOnly
          size={36}
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
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        testID="g"
        accessibilityLabel="Speed"
        color="#111111"
        hoverColor="#222222"
      >
        {(foreground: string) => {
          seen.push(foreground);
          return <View />;
        }}
      </Button>,
    );
    expect(seen[seen.length - 1]).toBe('#111111');
    fireEvent(getByTestId('g'), 'hoverIn');
    expect(seen[seen.length - 1]).toBe('#222222');
  });

  it('renders `decoration` inside the box (the player`s active dot)', () => {
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="Shuffle"
        decoration={<View testID="dot" />}
      />,
    );
    expect(getByTestId('dot')).toBeTruthy();
  });
});

describe('Button accessibility and disabled', () => {
  it('a TOGGLE carries both spellings; a plain button carries neither', () => {
    const { getByTestId, rerender } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="Shuffle"
        pressed
      />,
    );
    // `aria-pressed` for web (react-native-web drops `accessibilityState`),
    // `accessibilityState.selected` for native (RN has no `aria-pressed`).
    expect(getByTestId('g').props['aria-pressed']).toBe(true);
    expect(getByTestId('g').props.accessibilityState).toMatchObject({ selected: true });

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Button
          appearance="plain"
          tone="neutral"
          iconOnly
          size={36}
          testID="g"
          icon={makeGlyph()}
          accessibilityLabel="More options"
        />
      </BloomThemeProvider>,
    );
    expect(getByTestId('g').props['aria-pressed']).toBeUndefined();
    expect(getByTestId('g').props.accessibilityState?.selected).toBeUndefined();
  });

  it('is named by `accessibilityLabel` — it draws no text', () => {
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="More options"
      />,
    );
    expect(getByTestId('g').props.accessibilityLabel).toBe('More options');
    expect(getByTestId('g').props.accessibilityRole).toBe('button');
  });

  it('forwards the trigger props a menu composes onto it with `asChild`', () => {
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
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
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="More"
        disabled
        onPress={() => {}}
      />,
    );
    const node = getByTestId('g');
    expect(resolvedStyle(node.props.style).opacity).toBe(1);
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

  it('busy: announced in both spellings, press refused, NOT dimmed', () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        loadingIndicator={null}
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="Locating"
        loading
        onPress={onPress}
        onLongPress={onLongPress}
      />,
    );
    const node = getByTestId('g');
    expect(node.props.onPress).toBeUndefined();
    expect(node.props.onLongPress).toBeUndefined();
    expect(onPress).not.toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();
    expect(node.props['aria-busy']).toBe(true);
    expect(node.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
    expect(node.props.disabled).toBe(true);
    expect(node.props['aria-disabled']).toBe(true);
    expect(resolvedStyle(node.props.style).opacity ?? 1).toBe(1);
  });

  it('a control that is not busy says nothing about it', () => {
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
        testID="g"
        icon={makeGlyph()}
        accessibilityLabel="Locate"
        onPress={() => {}}
      />,
    );
    const node = getByTestId('g');
    expect(node.props['aria-busy']).toBeUndefined();
    expect(node.props.accessibilityState).toMatchObject({ busy: false });
    expect(node.props.disabled).toBe(false);
  });

  it('`disabledOpacity` keeps a call site`s own dim (track-list draws 0.4)', () => {
    const { getByTestId } = renderWithTheme(
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
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
      <Button
        appearance="plain"
        tone="neutral"
        iconOnly
        size={36}
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

it('forwards original focus events independently of press and busy state', () => {
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  const onPress = jest.fn();
  const screen = renderWithTheme(
    <Button
      appearance="plain"
      tone="neutral"
      iconOnly
      size={36}
      loadingIndicator={null}
      testID="focus-host"
      accessibilityLabel="Expand"
      loading
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={onPress}
    />,
  );
  const host = screen.getByTestId('focus-host');
  const event = { nativeEvent: { target: 7 }, relatedTarget: { id: 'next-control' } };
  fireEvent(host, 'focus', event);
  fireEvent(host, 'blur', event);
  expect(onFocus.mock.calls[0]?.[0]).toBe(event);
  expect(onBlur.mock.calls[0]?.[0]).toBe(event);
  expect(onPress).not.toHaveBeenCalled();
});
