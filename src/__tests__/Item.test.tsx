import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Item } from '../item';
import { pressHost } from './support/press-host';

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
    const { getByLabelText } = renderWithTheme(
      <Item title="Tap me" onPress={onPress} />,
    );
    // The row's own host node, found by the label `Item` derives from `title`.
    // Pressing the title `Text` instead would walk up past the row to
    // `<Item onPress={…}>` in this file's own JSX and report a call the
    // component had no part in.
    pressHost(getByLabelText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('marks the disabled state for accessibility and strips the press handler', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <Item title="Disabled" onPress={onPress} disabled accessibilityLabel="Disabled" />,
    );
    const node = getByLabelText('Disabled');
    // `selected` is absent, not `false`: a row that never mentions selection is
    // not a toggle. Defaulting it made every plain navigation row announce
    // itself as an unpressed toggle button once the state reached web as
    // `aria-pressed`. A caller passing `selected={false}` still gets `false`.
    expect(node.props.accessibilityState).toEqual({ disabled: true, selected: undefined });
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
