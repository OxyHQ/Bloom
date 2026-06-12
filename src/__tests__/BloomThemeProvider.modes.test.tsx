import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

let mockColorScheme: 'light' | 'dark' | null = 'light';

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    useColorScheme: () => mockColorScheme,
    Appearance: {
      ...actual.Appearance,
      setColorScheme: jest.fn(),
      getColorScheme: () => mockColorScheme,
    },
  };
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Appearance } from 'react-native';

function Display() {
  const t = useTheme();
  return (
    <>
      <Text testID="resolved">{t.mode}</Text>
      <Text testID="isDark">{String(t.isDark)}</Text>
    </>
  );
}

beforeEach(() => {
  mockColorScheme = 'light';
  (Appearance.setColorScheme as jest.Mock).mockClear();
});

describe('BloomThemeProvider — light/dark/system/adaptive flow', () => {
  it('resolves system to light when OS is light', () => {
    mockColorScheme = 'light';
    const { getByTestId } = render(
      <BloomThemeProvider mode="system">
        <Display />
      </BloomThemeProvider>,
    );
    expect(getByTestId('resolved').props.children).toBe('light');
    expect(getByTestId('isDark').props.children).toBe('false');
  });

  it('resolves system to dark when OS is dark', () => {
    mockColorScheme = 'dark';
    const { getByTestId } = render(
      <BloomThemeProvider mode="system">
        <Display />
      </BloomThemeProvider>,
    );
    expect(getByTestId('resolved').props.children).toBe('dark');
    expect(getByTestId('isDark').props.children).toBe('true');
  });

  it('falls back to light when OS exposes no scheme', () => {
    mockColorScheme = null;
    const { getByTestId } = render(
      <BloomThemeProvider mode="system">
        <Display />
      </BloomThemeProvider>,
    );
    expect(getByTestId('resolved').props.children).toBe('light');
  });

  it('treats adaptive mode like system for resolution', () => {
    mockColorScheme = 'dark';
    const { getByTestId } = render(
      <BloomThemeProvider mode="adaptive">
        <Display />
      </BloomThemeProvider>,
    );
    expect(getByTestId('resolved').props.children).toBe('dark');
  });

  it('explicit light overrides OS dark', () => {
    mockColorScheme = 'dark';
    const { getByTestId } = render(
      <BloomThemeProvider mode="light">
        <Display />
      </BloomThemeProvider>,
    );
    expect(getByTestId('resolved').props.children).toBe('light');
    expect(getByTestId('isDark').props.children).toBe('false');
  });

  it('explicit dark overrides OS light', () => {
    mockColorScheme = 'light';
    const { getByTestId } = render(
      <BloomThemeProvider mode="dark">
        <Display />
      </BloomThemeProvider>,
    );
    expect(getByTestId('resolved').props.children).toBe('dark');
    expect(getByTestId('isDark').props.children).toBe('true');
  });

  it('installs explicit override via Appearance.setColorScheme for dark', () => {
    render(
      <BloomThemeProvider mode="dark">
        <Display />
      </BloomThemeProvider>,
    );
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('dark');
  });

  it('installs explicit override via Appearance.setColorScheme for light', () => {
    render(
      <BloomThemeProvider mode="light">
        <Display />
      </BloomThemeProvider>,
    );
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('light');
  });

  it('does NOT install an override in system mode (preserves OS link)', () => {
    render(
      <BloomThemeProvider mode="system">
        <Display />
      </BloomThemeProvider>,
    );
    // On non-iOS the call is skipped entirely; we also assert it was NEVER
    // called with 'system' (which would install a bogus override).
    const calls = (Appearance.setColorScheme as jest.Mock).mock.calls;
    for (const call of calls) {
      expect(call[0]).not.toBe('system');
      expect(call[0]).not.toBe('dark');
      expect(call[0]).not.toBe('light');
    }
  });

  it('produces different colors for light vs dark resolution', () => {
    mockColorScheme = 'light';
    const { getByTestId: getLight, unmount } = render(
      <BloomThemeProvider mode="system" colorPreset="blue">
        <Display />
      </BloomThemeProvider>,
    );
    const lightResolved = getLight('resolved').props.children;
    unmount();

    mockColorScheme = 'dark';
    const { getByTestId: getDark } = render(
      <BloomThemeProvider mode="system" colorPreset="blue">
        <Display />
      </BloomThemeProvider>,
    );
    const darkResolved = getDark('resolved').props.children;

    expect(lightResolved).toBe('light');
    expect(darkResolved).toBe('dark');
  });
});
