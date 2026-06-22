import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Fab } from '../fab';

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
