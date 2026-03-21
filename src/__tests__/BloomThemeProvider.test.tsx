import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme, useThemeColor, useBloomTheme } from '../theme/use-theme';
import type { AppColorName } from '../theme/color-presets';

function ThemeDisplay() {
  const theme = useTheme();
  return (
    <>
      <Text testID="mode">{theme.mode}</Text>
      <Text testID="isDark">{String(theme.isDark)}</Text>
      <Text testID="isLight">{String(theme.isLight)}</Text>
      <Text testID="primary">{theme.colors.primary}</Text>
      <Text testID="background">{theme.colors.background}</Text>
    </>
  );
}

function ColorDisplay({ colorKey }: { colorKey: 'primary' | 'error' | 'background' }) {
  const color = useThemeColor(colorKey);
  return <Text testID="color">{color}</Text>;
}

function BloomThemeDisplay() {
  const ctx = useBloomTheme();
  return (
    <>
      <Text testID="ctx-mode">{ctx.mode}</Text>
      <Text testID="ctx-preset">{ctx.colorPreset}</Text>
    </>
  );
}

describe('BloomThemeProvider', () => {
  it('provides a light theme by default', () => {
    const { getByTestId } = render(
      <BloomThemeProvider>
        <ThemeDisplay />
      </BloomThemeProvider>,
    );
    expect(getByTestId('mode').props.children).toBe('light');
    expect(getByTestId('isDark').props.children).toBe('false');
    expect(getByTestId('isLight').props.children).toBe('true');
  });

  it('provides a dark theme when mode is dark', () => {
    const { getByTestId } = render(
      <BloomThemeProvider mode="dark">
        <ThemeDisplay />
      </BloomThemeProvider>,
    );
    expect(getByTestId('mode').props.children).toBe('dark');
    expect(getByTestId('isDark').props.children).toBe('true');
    expect(getByTestId('isLight').props.children).toBe('false');
  });

  it('uses teal as default color preset', () => {
    const { getByTestId } = render(
      <BloomThemeProvider>
        <BloomThemeDisplay />
      </BloomThemeProvider>,
    );
    expect(getByTestId('ctx-preset').props.children).toBe('teal');
  });

  it('applies the specified color preset', () => {
    const { getByTestId } = render(
      <BloomThemeProvider colorPreset="blue">
        <ThemeDisplay />
      </BloomThemeProvider>,
    );
    // Blue preset hex is #1d9bf0 (case may vary)
    expect(getByTestId('primary').props.children.toLowerCase()).toBe('#1d9bf0');
  });

  it('generates different background colors for light and dark modes', () => {
    const { getByTestId: getLight } = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ThemeDisplay />
      </BloomThemeProvider>,
    );
    const { getByTestId: getDark } = render(
      <BloomThemeProvider mode="dark" colorPreset="teal">
        <ThemeDisplay />
      </BloomThemeProvider>,
    );

    const lightBg = getLight('background').props.children;
    const darkBg = getDark('background').props.children;
    expect(lightBg).not.toBe(darkBg);
  });

  it('renders all color presets without crashing', () => {
    const presets: AppColorName[] = [
      'teal', 'blue', 'green', 'amber', 'red',
      'purple', 'pink', 'sky', 'orange', 'mint',
    ];

    for (const preset of presets) {
      const { unmount } = render(
        <BloomThemeProvider colorPreset={preset} mode="light">
          <ThemeDisplay />
        </BloomThemeProvider>,
      );
      unmount();

      const { unmount: unmountDark } = render(
        <BloomThemeProvider colorPreset={preset} mode="dark">
          <ThemeDisplay />
        </BloomThemeProvider>,
      );
      unmountDark();
    }
  });
});

describe('useTheme', () => {
  it('throws when used outside BloomThemeProvider', () => {
    // Suppress error boundary logging
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeDisplay />)).toThrow(
      'useTheme must be used within a <BloomThemeProvider>',
    );
    spy.mockRestore();
  });
});

describe('useThemeColor', () => {
  it('returns the correct color value', () => {
    const { getByTestId } = render(
      <BloomThemeProvider colorPreset="teal">
        <ColorDisplay colorKey="primary" />
      </BloomThemeProvider>,
    );
    expect(getByTestId('color').props.children).toBe('#005c67');
  });
});

describe('useBloomTheme', () => {
  it('exposes mode and color preset', () => {
    const { getByTestId } = render(
      <BloomThemeProvider mode="dark" colorPreset="purple">
        <BloomThemeDisplay />
      </BloomThemeProvider>,
    );
    expect(getByTestId('ctx-mode').props.children).toBe('dark');
    expect(getByTestId('ctx-preset').props.children).toBe('purple');
  });

  it('throws when used outside BloomThemeProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BloomThemeDisplay />)).toThrow(
      'useBloomTheme must be used within a <BloomThemeProvider>',
    );
    spy.mockRestore();
  });
});
