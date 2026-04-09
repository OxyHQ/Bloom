jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Path: 'Path',
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SettingsListItem } from '../settings-list/SettingsList';

let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('SettingsListItem', () => {
  it('renders title and description', () => {
    const { getByText } = renderWithTheme(
      <SettingsListItem title="Title" description="Description" />,
    );

    expect(getByText('Title')).toBeTruthy();
    expect(getByText('Description')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <SettingsListItem title="Press me" onPress={onPress} />,
    );

    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sets accessibility props when pressable', () => {
    const { getByLabelText } = renderWithTheme(
      <SettingsListItem
        title="Accessible"
        onPress={() => {}}
        accessibilityLabel="Custom label"
        accessibilityHint="Custom hint"
      />,
    );

    const node = getByLabelText('Custom label');
    expect(node.props.accessibilityRole).toBe('button');
    expect(node.props.accessibilityLabel).toBe('Custom label');
    expect(node.props.accessibilityHint).toBe('Custom hint');
  });

  it('respects left inset when provided', () => {
    const { getByTestId } = renderWithTheme(
      <SettingsListItem title="Inset" leftInset={32} />,
    );

    const content = getByTestId('settings-list-item-content');
    expect(content.props['data-left-inset']).toBe(32);
  });
});
