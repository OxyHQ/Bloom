import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { FrostedIconButton } from '../frosted-icon-button';
import { resolveFrostedSize } from '../frosted-icon-button/shared';
import { pressHost } from './support/press-host';
import { classNamesOn, renderedChildren, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="dark" colorPreset="blue">
      {ui}
    </BloomThemeProvider>,
  );
}

/** A minimal icon element that accepts a `fill` prop (like a Bloom icon). */
function MockIcon({ fill, testID }: { fill?: string; testID?: string }) {
  return React.createElement('MockIcon', { fill, testID });
}

describe('FrostedIconButton (native)', () => {
  it('renders its icon content', () => {
    const { getByText } = renderWithTheme(
      <FrostedIconButton
        accessibilityLabel="Back"
        icon={(iconProps) => <Text {...iconProps}>x</Text>}
      />,
    );
    expect(getByText('x')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton
        testID="btn"
        accessibilityLabel="Back"
        onPress={onPress}
        icon={(iconProps) => <Text {...iconProps}>x</Text>}
      />,
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
      <FrostedIconButton
        testID="btn"
        disabled
        accessibilityLabel="Back"
        onPress={onPress}
        icon={(iconProps) => <Text {...iconProps}>x</Text>}
      />,
    );
    const btn = getByTestId('btn');
    expect(btn.props.accessibilityState).toMatchObject({ disabled: true, selected: false });
    expect(btn.props.onPress).toBeUndefined();
  });

  it('reports the selected a11y state when active', () => {
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton
        testID="btn"
        checked
        accessibilityLabel="Mute"
        icon={(iconProps) => <Text {...iconProps}>x</Text>}
      />,
    );
    expect(getByTestId('btn').props.accessibilityState).toMatchObject({
      disabled: false,
      selected: true,
    });
  });

  it('injects the theme icon color as a fallback fill on a bare icon', () => {
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton
        accessibilityLabel="Back"
        icon={(iconProps) => <MockIcon {...iconProps} testID="ic" />}
      />,
    );
    // Frosted (rest) icon color === foreground token.
    expect(getByTestId('ic').props.fill).toMatch(/^rgb/);
  });

  it('never overrides an explicit fill on the icon', () => {
    const { getByTestId } = renderWithTheme(
      <FrostedIconButton
        accessibilityLabel="Back"
        icon={(iconProps) => <MockIcon {...iconProps} testID="ic" fill="rgb(1, 2, 3)" />}
      />,
    );
    expect(getByTestId('ic').props.fill).toBe('rgb(1, 2, 3)');
  });

  it('resolves preset sizes to concrete geometry (md=36, sm=32)', () => {
    const { getByTestId, rerender } = renderWithTheme(
      <FrostedIconButton
        testID="btn"
        size="md"
        accessibilityLabel="Back"
        icon={(iconProps) => <Text {...iconProps}>x</Text>}
      />,
    );
    expect(resolvedStyle(getByTestId('btn').props.style).width).toBe(36);
    rerender(
      <BloomThemeProvider mode="dark" colorPreset="blue">
        <FrostedIconButton
          testID="btn"
          size="sm"
          accessibilityLabel="Back"
          icon={(iconProps) => <Text {...iconProps}>x</Text>}
        />
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(getByTestId('btn').props.style).width).toBe(32);
  });

  it('renders a supplied icon component', () => {
    const { getByText } = renderWithTheme(
      <FrostedIconButton accessibilityLabel="Back" icon={() => <Text>★</Text>} />,
    );
    expect(getByText('★')).toBeTruthy();
  });
});

it('preserves numeric diameter and icon sizing', () => {
  expect(resolveFrostedSize(44)).toEqual({ diameter: 44, iconBox: 25 });
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
        <FrostedIconButton
          testID="fib"
          accessibilityLabel="Back"
          icon={(iconProps) => <Text {...iconProps}>x</Text>}
        />
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
        icon={(iconProps) => <Text {...iconProps}>x</Text>}
      />,
    );
    const style = getByTestId('fib').props.style;
    expect(classNamesOn(style)).toContain('flex-1');
    const resolved = resolvedStyle(style);
    expect(resolved.borderRadius).toBe(18);
    expect(resolved.marginTop).toBe(7);
    expect(resolved.transform).toBeUndefined();
  });
});
