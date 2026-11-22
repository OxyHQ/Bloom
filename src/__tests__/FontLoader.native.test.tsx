import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

type UseFontsResult = readonly [boolean, Error | null];

let mockUseFontsResult: UseFontsResult = [true, null];

jest.mock('expo-font', () => ({
  useFonts: () => mockUseFontsResult,
}));

import { FontLoader } from '../fonts/FontLoader.native';

function setUseFontsResult(result: UseFontsResult): void {
  mockUseFontsResult = result;
}

describe('FontLoader (native)', () => {
  afterEach(() => {
    setUseFontsResult([true, null]);
  });

  it('renders children when fonts are loaded and enabled', () => {
    setUseFontsResult([true, null]);
    const { getByText, queryByText } = render(
      <FontLoader enabled fallback={<Text>fallback</Text>}>
        <Text>content</Text>
      </FontLoader>,
    );
    expect(getByText('content')).toBeTruthy();
    expect(queryByText('fallback')).toBeNull();
  });

  it('renders fallback while fonts are loading and enabled', () => {
    setUseFontsResult([false, null]);
    const { getByText, queryByText } = render(
      <FontLoader enabled fallback={<Text>fallback</Text>}>
        <Text>content</Text>
      </FontLoader>,
    );
    expect(getByText('fallback')).toBeTruthy();
    expect(queryByText('content')).toBeNull();
  });

  it('renders null fallback by default while loading', () => {
    setUseFontsResult([false, null]);
    const { queryByText } = render(
      <FontLoader enabled>
        <Text>content</Text>
      </FontLoader>,
    );
    expect(queryByText('content')).toBeNull();
  });

  it('renders children in the system font when a font fails to load', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    setUseFontsResult([false, new Error('Inter: file not found')]);
    const { getByText, queryByText } = render(
      <FontLoader enabled fallback={<Text>fallback</Text>}>
        <Text>content</Text>
      </FontLoader>,
    );
    expect(getByText('content')).toBeTruthy();
    expect(queryByText('fallback')).toBeNull();
    // Reported once (the renderer's own deprecation notice may also log).
    const reports = error.mock.calls.filter((call) => String(call[0]).startsWith('[bloom]'));
    expect(reports).toHaveLength(1);
    expect(String(reports[0]?.[0])).toContain('Inter: file not found');
    error.mockRestore();
  });

  it('renders children when disabled, regardless of load state', () => {
    setUseFontsResult([false, null]);
    const { getByText } = render(
      <FontLoader enabled={false} fallback={<Text>fallback</Text>}>
        <Text>content</Text>
      </FontLoader>,
    );
    expect(getByText('content')).toBeTruthy();
  });

  it('renders children when disabled even with a loaded result', () => {
    setUseFontsResult([true, null]);
    const { getByText } = render(
      <FontLoader enabled={false}>
        <Text>content</Text>
      </FontLoader>,
    );
    expect(getByText('content')).toBeTruthy();
  });

  // The loader sets no default family: React 19 ignores `defaultProps` on a
  // function component such as `Text`, so the family a text draws is named by
  // the text (Bloom's `Text`) or by the app's `react-native` module.
  it('leaves Text.defaultProps alone', () => {
    setUseFontsResult([true, null]);
    render(
      <FontLoader enabled>
        <Text>content</Text>
      </FontLoader>,
    );
    expect((Text as { defaultProps?: unknown }).defaultProps).toBeUndefined();
  });
});
