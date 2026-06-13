import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomColorScope } from '../theme/color-scope';
import { useBloomTheme } from '../theme/use-theme';

function CurrentPreset() {
  const { colorPreset } = useBloomTheme();
  return <Text testID="preset">{colorPreset}</Text>;
}

describe('BloomColorScope', () => {
  it('overrides the colorPreset of its subtree without affecting the parent', () => {
    const { getAllByTestId } = render(
      <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
        <CurrentPreset />
        <BloomColorScope colorPreset="green">
          <CurrentPreset />
        </BloomColorScope>
      </BloomThemeProvider>,
    );

    const presets = getAllByTestId('preset').map((node) => node.props.children);
    expect(presets[0]).toBe('blue');
    expect(presets[1]).toBe('green');
  });

  it('renders children directly with asChild (no wrapper element)', () => {
    const { getByTestId } = render(
      <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
        <BloomColorScope colorPreset="purple" asChild>
          <CurrentPreset />
        </BloomColorScope>
      </BloomThemeProvider>,
    );

    expect(getByTestId('preset').props.children).toBe('purple');
  });

  it('throws when used outside BloomThemeProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <BloomColorScope colorPreset="red">
          <CurrentPreset />
        </BloomColorScope>,
      ),
    ).toThrow('BloomColorScope must be used within a <BloomThemeProvider>');
    consoleError.mockRestore();
  });
});
