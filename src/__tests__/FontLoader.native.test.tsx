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
});
