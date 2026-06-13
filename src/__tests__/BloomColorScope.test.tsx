import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomColorScope } from '../theme/color-scope';
import { useBloomTheme } from '../theme/use-theme';

function CurrentPreset() {
  const { colorPreset } = useBloomTheme();
  return <Text testID="preset">{colorPreset}</Text>;
}

function StyledChild({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View testID="styled-child" style={style}><CurrentPreset /></View>;
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

  it('clones the single child and merges scope vars into its style (asChild)', () => {
    const { getByTestId } = render(
      <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
        <BloomColorScope colorPreset="purple" asChild>
          <StyledChild style={{ padding: 8 }} />
        </BloomColorScope>
      </BloomThemeProvider>,
    );

    expect(getByTestId('preset').props.children).toBe('purple');
    const mergedStyle = getByTestId('styled-child').props.style;
    expect(Array.isArray(mergedStyle)).toBe(true);
    expect(mergedStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ padding: 8 })]),
    );
  });

  it('throws when asChild has multiple children', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
          <BloomColorScope colorPreset="purple" asChild>
            <CurrentPreset />
            <CurrentPreset />
          </BloomColorScope>
        </BloomThemeProvider>,
      ),
    ).toThrow();
    consoleError.mockRestore();
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
