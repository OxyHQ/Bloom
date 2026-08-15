import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { FrostedIconButton } from '../frosted-icon-button';
import { buildTheme } from '../theme/build-theme';
import { parseRgb } from '../theme/color-utils';
import { resolveFrostedPalette, resolveFrostedSize } from '../frosted-icon-button/shared';
import { borderRadius } from '../styles/tokens';
import { pressHost } from './support/press-host';
import {
  classNamesOn,
  renderedChildren,
  resolvedStyle,
} from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="dark" colorPreset="blue">
      {ui}
    </BloomThemeProvider>,
  );
}

function findGeometry(style: unknown): ViewStyle | undefined {
  const arr = Array.isArray(style) ? style : [style];
  return arr.find(
    (s): s is ViewStyle => typeof s === 'object' && s !== null && 'width' in s,
  );
}

/** A minimal icon element that accepts a `fill` prop (like a Bloom icon). */
function MockIcon({ fill, testID }: { fill?: string; testID?: string }) {
  return React.createElement('MockIcon', { fill, testID });
}

describe('FrostedIconButton (native)', () => {
  it('renders its icon content', () => {
    const { getByText } = renderWithTheme(
      <FrostedIconButton accessibilityLabel="Back" icon={<Text>x</Text>} />,
    );
    expect(getByText('x')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton testID="btn" accessibilityLabel="Back" onPress={onPress} icon={<Text>x</Text>} />,
    );
    // Through `pressHost`: a bare `fireEvent.press` walks up past the button to
    // `<FrostedIconButton onPress={…}>` in this file's own JSX, so the call it
    // reports says nothing about what the component wired.
    pressHost(getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('marks the disabled a11y state and drops the press handler', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton testID="btn" disabled accessibilityLabel="Back" onPress={onPress} icon={<Text>x</Text>} />,
    );
    const btn = getByTestId('btn');
    expect(btn.props.accessibilityState).toEqual({ disabled: true, selected: false });
    expect(btn.props.onPress).toBeUndefined();
  });

  it('reports the selected a11y state when active', () => {
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton testID="btn" active accessibilityLabel="Mute" icon={<Text>x</Text>} />,
    );
    expect(getByTestId('btn').props.accessibilityState).toEqual({ disabled: false, selected: true });
  });

  it('injects the theme icon color as a fallback fill on a bare icon', () => {
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton accessibilityLabel="Back" icon={<MockIcon testID="ic" />} />,
    );
    // Frosted (rest) icon color === foreground token.
    expect(getByTestId('ic').props.fill).toMatch(/^rgb/);
  });

  it('never overrides an explicit fill on the icon', () => {
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton accessibilityLabel="Back" icon={<MockIcon testID="ic" fill="rgb(1, 2, 3)" />} />,
    );
    expect(getByTestId('ic').props.fill).toBe('rgb(1, 2, 3)');
  });

  it('resolves preset sizes to concrete geometry (md=36, sm=32)', () => {
    const { getByTestId, rerender } = renderWithTheme(
      <FrostedIconButton testID="btn" size="md" accessibilityLabel="Back" icon={<Text>x</Text>} />,
    );
    expect(findGeometry(getByTestId('btn').props.style)?.width).toBe(36);
    rerender(
      <BloomThemeProvider mode="dark" colorPreset="blue">
        <FrostedIconButton testID="btn" size="sm" accessibilityLabel="Back" icon={<Text>x</Text>} />
      </BloomThemeProvider>,
    );
    expect(findGeometry(getByTestId('btn').props.style)?.width).toBe(32);
  });

  it('accepts children as an icon alias', () => {
    const { getByText } = renderWithTheme(
      <FrostedIconButton accessibilityLabel="Back">
        <Text>★</Text>
      </FrostedIconButton>,
    );
    expect(getByText('★')).toBeTruthy();
  });
});

// Browser-independent proof of the visual contract: the frosted surface is a
// LIGHT translucent tint on a dark theme (never a dark card fill), so it reads on
// a solid dark page. Pure token math — no renderer / platform involved.
describe('FrostedIconButton palette math', () => {
  it('dark surface is a light low-opacity tint that composites lighter than the page', () => {
    const theme = buildTheme('blue', 'dark');
    const palette = resolveFrostedPalette(theme.colors, true);

    const base = parseRgb(palette.surface);
    expect(base).not.toBeNull();
    if (!base) throw new Error('unreachable');
    // Light base (foreground), not a dark card.
    expect(base.r).toBeGreaterThanOrEqual(200);

    // Low opacity → composited over rgb(11,11,15) it is clearly lighter.
    expect(palette.surface).toMatch(/, 0\.14\)$/);
    const a = 0.14;
    const page = 11;
    const composite = Math.round(page * (1 - a) + base.r * a);
    expect(composite - page).toBeGreaterThanOrEqual(15);
  });

  it('active surface is the opaque primary token (solid on-state, no alpha)', () => {
    const theme = buildTheme('blue', 'dark');
    const palette = resolveFrostedPalette(theme.colors, true);
    expect(palette.activeSurface).toBe(theme.colors.primary);
    expect(palette.activeSurface).toMatch(/^rgb\(/);
  });

  it('scales a numeric size to a concrete diameter + icon box', () => {
    const geo = resolveFrostedSize(44);
    expect(geo.diameter).toBe(44);
    expect(geo.iconBox).toBe(Math.round(44 * 0.56));
  });
});

// Regression: the same two-node shape `Button` and `Fab` carried — an unstyled
// `Animated.View` holding the press transform and the caller's `style`, wrapping
// the `Pressable` that held `className` and the chrome. `style` and `className`
// therefore landed on different nodes and layout classes applied inside a box
// the parent had already laid out. The `.web.tsx` fork renders one `<button>`.
describe('layout: the button IS the node its parent lays out', () => {
  it('renders the pressable as its outermost node — no wrapper in between', () => {
    const { toJSON } = renderWithTheme(
      <View testID="host">
        <FrostedIconButton testID="fib" accessibilityLabel="Back" icon={<Text>x</Text>} />
      </View>,
    );
    const rendered = renderedChildren(toJSON(), 'host');
    expect(rendered).toHaveLength(1);
    expect(rendered[0]?.props.testID).toBe('fib');
    expect(rendered[0]?.props.accessibilityRole).toBe('button');
  });

  it('lands className, the caller style and the chrome on that one node', () => {
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton
        testID="fib"
        className="flex-1"
        style={{ marginTop: 7 }}
        accessibilityLabel="Back"
        icon={<Text>x</Text>}
      />,
    );
    const style = getByTestId('fib').props.style;
    expect(classNamesOn(style)).toContain('flex-1');
    const resolved = resolvedStyle(style);
    expect(resolved.borderRadius).toBe(borderRadius.full);
    expect(resolved.marginTop).toBe(7);
    expect(resolved.transform).toBeDefined();
  });
});
