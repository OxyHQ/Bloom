import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Item } from '../item';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Item', () => {
  it('renders title and subtitle', () => {
    const { getByText } = renderWithTheme(
      <Item title="Profile" subtitle="Manage your details" />,
    );
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Manage your details')).toBeTruthy();
  });

  it('renders custom children in place of the text column', () => {
    const { getByText, queryByText } = renderWithTheme(
      <Item title="ignored">
        <Text>Custom body</Text>
      </Item>,
    );
    expect(getByText('Custom body')).toBeTruthy();
    expect(queryByText('ignored')).toBeNull();
  });

  it('is pressable when onPress is provided and fires the handler', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <Item title="Tap me" onPress={onPress} />,
    );
    fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('marks the disabled state for accessibility and strips the press handler', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <Item title="Disabled" onPress={onPress} disabled accessibilityLabel="Disabled" />,
    );
    const node = getByLabelText('Disabled');
    expect(node.props.accessibilityState).toEqual({ disabled: true, selected: false });
    // The Pressable receives no press handler while disabled.
    expect(node.props.onPress).toBeUndefined();
  });

  it('uses button role by default when pressable', () => {
    const { getByLabelText } = renderWithTheme(
      <Item title="Row" onPress={() => {}} accessibilityLabel="Row" />,
    );
    expect(getByLabelText('Row').props.accessibilityRole).toBe('button');
  });

  it('renders leading and trailing slots', () => {
    const { getByText } = renderWithTheme(
      <Item
        title="With slots"
        leading={<Text>L</Text>}
        trailing={<Text>R</Text>}
      />,
    );
    expect(getByText('L')).toBeTruthy();
    expect(getByText('R')).toBeTruthy();
  });
});
