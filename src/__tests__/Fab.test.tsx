import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Fab } from '../fab';
import { borderRadius } from '../styles/tokens';
import {
  classNamesOn,
  renderedChildren,
  resolvedStyle,
} from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Fab (native)', () => {
  it('renders its icon content', () => {
    const { getByText } = renderWithTheme(
      <Fab accessibilityLabel="Add" icon={<Text>+</Text>} />,
    );
    expect(getByText('+')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Fab testID="fab" accessibilityLabel="Add" onPress={onPress} icon={<Text>+</Text>} />,
    );
    fireEvent.press(getByTestId('fab'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes accessibilityRole button and the label', () => {
    const { getByTestId } = renderWithTheme(
      <Fab testID="fab" accessibilityLabel="Compose" icon={<Text>+</Text>} />,
    );
    const fab = getByTestId('fab');
    expect(fab.props.accessibilityRole).toBe('button');
    expect(fab.props.accessibilityLabel).toBe('Compose');
  });

  it('renders an extended label', () => {
    const { getByText } = renderWithTheme(
      <Fab label="Compose" icon={<Text>+</Text>} />,
    );
    expect(getByText('Compose')).toBeTruthy();
  });

  it('falls back to the label for accessibilityLabel when none is given', () => {
    const { getByTestId } = renderWithTheme(
      <Fab testID="fab" label="Compose" icon={<Text>+</Text>} />,
    );
    expect(getByTestId('fab').props.accessibilityLabel).toBe('Compose');
  });

  it('marks the disabled accessibility state and removes the press handler', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Fab testID="fab" disabled accessibilityLabel="Add" onPress={onPress} icon={<Text>+</Text>} />,
    );
    const fab = getByTestId('fab');
    expect(fab.props.accessibilityState).toEqual({ disabled: true });
    expect(fab.props.disabled).toBe(true);
    // When disabled the Pressable receives no onPress handler at all.
    expect(fab.props.onPress).toBeUndefined();
  });

  it('accepts children as an icon alias', () => {
    const { getByText } = renderWithTheme(
      <Fab accessibilityLabel="Add">
        <Text>★</Text>
      </Fab>,
    );
    expect(getByText('★')).toBeTruthy();
  });

  it('accepts a numeric size as a raw pixel diameter', () => {
    const { getByTestId } = renderWithTheme(
      <Fab testID="fab" size={48} accessibilityLabel="Add" icon={<Text>+</Text>} />,
    );
    // The Pressable's style is a flat-able array; the container object (first
    // entry) carries the resolved geometry.
    const style = getByTestId('fab').props.style as Array<
      { width?: number; height?: number } | false
    >;
    const container = style.find(
      (s): s is { width?: number; height?: number } =>
        typeof s === 'object' && s !== null && 'width' in s,
    );
    expect(container?.width).toBe(48);
    expect(container?.height).toBe(48);
  });
});

// Regression: the FAB used to render its `Pressable` inside an `Animated.View`
// that held the placement, the `zIndex`, the press transform AND the caller's
// `style`, while the pressable held `className` and the FAB's own chrome. So a
// caller's `style` and their `className` landed on DIFFERENT nodes, and every
// layout class applied inside a box the wrapper had already positioned and
// sized. `Fab.web.tsx` renders one real `<button>` and has always behaved.
describe('layout: the FAB IS the node its parent lays out', () => {
  it('renders the pressable as its outermost node — no wrapper in between', () => {
    const { toJSON } = renderWithTheme(
      <View testID="host">
        <Fab testID="fab" placement="static" accessibilityLabel="Add" icon={<Text>+</Text>} />
      </View>,
    );
    const rendered = renderedChildren(toJSON(), 'host');
    expect(rendered).toHaveLength(1);
    expect(rendered[0]?.props.testID).toBe('fab');
    expect(rendered[0]?.props.accessibilityRole).toBe('button');
  });

  it('lands className, the caller style, the placement and the chrome on that one node', () => {
    const { getByTestId } = renderWithTheme(
      <Fab
        testID="fab"
        className="flex-1"
        style={{ marginTop: 7 }}
        accessibilityLabel="Add"
        icon={<Text>+</Text>}
      />,
    );
    const style = getByTestId('fab').props.style;
    expect(classNamesOn(style)).toContain('flex-1');
    const resolved = resolvedStyle(style);
    // All four used to be split across two nodes: chrome and class here,
    // placement and the caller's style on the wrapper.
    expect(resolved.borderRadius).toBe(borderRadius.full);
    expect(resolved.position).toBe('absolute');
    expect(resolved.marginTop).toBe(7);
  });

  it('applies the press-scale transform to that node too, not to a wrapper', () => {
    const { getByTestId } = renderWithTheme(
      <Fab testID="fab" accessibilityLabel="Add" icon={<Text>+</Text>} />,
    );
    expect(resolvedStyle(getByTestId('fab').props.style).transform).toBeDefined();
  });
});
