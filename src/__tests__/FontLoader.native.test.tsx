import React from 'react';
import { Text, type TextProps } from 'react-native';
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

type TextWithDefaults = typeof Text & {
  defaultProps?: Partial<TextProps>;
};

function resetTextDefaults(): void {
  (Text as TextWithDefaults).defaultProps = undefined;
}

describe('FontLoader (native)', () => {
  beforeEach(() => {
    resetTextDefaults();
  });

  afterEach(() => {
    setUseFontsResult([true, null]);
    resetTextDefaults();
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

  it('prepends Inter to Text.defaultProps.style once fonts are loaded', () => {
    setUseFontsResult([true, null]);
    render(
      <FontLoader enabled>
        <Text>content</Text>
      </FontLoader>,
    );
    const defaults = (Text as TextWithDefaults).defaultProps;
    expect(defaults?.style).toEqual({ fontFamily: 'Inter' });
  });

  it('does not touch Text.defaultProps until fonts are loaded', () => {
    setUseFontsResult([false, null]);
    render(
      <FontLoader enabled>
        <Text>content</Text>
      </FontLoader>,
    );
    expect((Text as TextWithDefaults).defaultProps?.style).toBeUndefined();
  });

  it('preserves a pre-existing default style by appending it after Inter', () => {
    const preExisting = { color: '#abcdef' } as const;
    (Text as TextWithDefaults).defaultProps = { style: preExisting };
    setUseFontsResult([true, null]);
    render(
      <FontLoader enabled>
        <Text>content</Text>
      </FontLoader>,
    );
    const style = (Text as TextWithDefaults).defaultProps?.style;
    expect(Array.isArray(style)).toBe(true);
    if (Array.isArray(style)) {
      expect(style[0]).toEqual({ fontFamily: 'Inter' });
      expect(style[1]).toBe(preExisting);
    }
  });

  it('is idempotent across multiple FontLoader mounts', () => {
    setUseFontsResult([true, null]);
    const first = render(
      <FontLoader enabled>
        <Text>first</Text>
      </FontLoader>,
    );
    first.unmount();
    const second = render(
      <FontLoader enabled>
        <Text>second</Text>
      </FontLoader>,
    );
    second.unmount();
    const style = (Text as TextWithDefaults).defaultProps?.style;
    // Should still be the single, plain Inter object — not nested arrays
    // or duplicated entries.
    expect(style).toEqual({ fontFamily: 'Inter' });
  });
});
