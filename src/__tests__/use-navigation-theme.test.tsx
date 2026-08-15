import React, { useRef } from 'react';
import { Text, View } from 'react-native';
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
import { useNavigationTheme } from '../theme/use-navigation-theme';
import type { NavigationTheme } from '../theme/use-navigation-theme';

// Probe that captures both the navigation theme and the raw bloom theme
// into external refs so tests can inspect them after render.
function Probe({
  navRef,
  bloomRef,
}: {
  navRef: React.MutableRefObject<NavigationTheme | null>;
  bloomRef: React.MutableRefObject<ReturnType<typeof useTheme> | null>;
}) {
  const nav = useNavigationTheme();
  const bloom = useTheme();
  navRef.current = nav;
  bloomRef.current = bloom;
  return (
    <View>
      <Text testID="dark">{String(nav.dark)}</Text>
      <Text testID="primary">{nav.colors.primary}</Text>
      <Text testID="notification">{nav.colors.notification}</Text>
    </View>
  );
}

// Probe that captures the navigation theme reference twice across renders,
// storing it in an array so the test can assert referential stability.
function MemoProbe({
  capturesRef,
  triggerProp,
}: {
  capturesRef: React.MutableRefObject<NavigationTheme[]>;
  triggerProp: number;
}) {
  void triggerProp; // read the prop so React re-renders when it changes
  const nav = useNavigationTheme();
  capturesRef.current.push(nav);
  return null;
}

beforeEach(() => {
  mockColorScheme = 'light';
});

describe('useNavigationTheme', () => {
  describe('dark flag', () => {
    it('returns dark=false under explicit light mode', () => {
      const navRef = { current: null as NavigationTheme | null };
      const bloomRef = { current: null as ReturnType<typeof useTheme> | null };
      render(
        <BloomThemeProvider mode="light">
          <Probe navRef={navRef} bloomRef={bloomRef} />
        </BloomThemeProvider>,
      );
      expect(navRef.current?.dark).toBe(false);
    });

    it('returns dark=true under explicit dark mode', () => {
      const navRef = { current: null as NavigationTheme | null };
      const bloomRef = { current: null as ReturnType<typeof useTheme> | null };
      render(
        <BloomThemeProvider mode="dark">
          <Probe navRef={navRef} bloomRef={bloomRef} />
        </BloomThemeProvider>,
      );
      expect(navRef.current?.dark).toBe(true);
    });

    it('returns dark=false when system mode resolves to light', () => {
      mockColorScheme = 'light';
      const navRef = { current: null as NavigationTheme | null };
      const bloomRef = { current: null as ReturnType<typeof useTheme> | null };
      render(
        <BloomThemeProvider mode="system">
          <Probe navRef={navRef} bloomRef={bloomRef} />
        </BloomThemeProvider>,
      );
      expect(navRef.current?.dark).toBe(false);
    });

    it('returns dark=true when system mode resolves to dark', () => {
      mockColorScheme = 'dark';
      const navRef = { current: null as NavigationTheme | null };
      const bloomRef = { current: null as ReturnType<typeof useTheme> | null };
      render(
        <BloomThemeProvider mode="system">
          <Probe navRef={navRef} bloomRef={bloomRef} />
        </BloomThemeProvider>,
      );
      expect(navRef.current?.dark).toBe(true);
    });
  });

  describe('color mapping', () => {
    it('maps primary/background/card/text/border 1:1 from useTheme().colors', () => {
      const navRef = { current: null as NavigationTheme | null };
      const bloomRef = { current: null as ReturnType<typeof useTheme> | null };
      render(
        <BloomThemeProvider mode="light" colorPreset="blue">
          <Probe navRef={navRef} bloomRef={bloomRef} />
        </BloomThemeProvider>,
      );
      const nav = navRef.current;
      const bloom = bloomRef.current;
      expect(nav).not.toBeNull();
      expect(bloom).not.toBeNull();
      expect(nav!.colors.primary).toBe(bloom!.colors.primary);
      expect(nav!.colors.background).toBe(bloom!.colors.background);
      expect(nav!.colors.card).toBe(bloom!.colors.card);
      expect(nav!.colors.text).toBe(bloom!.colors.text);
      expect(nav!.colors.border).toBe(bloom!.colors.border);
    });

    it('maps notification to colors.error (not a direct key)', () => {
      const navRef = { current: null as NavigationTheme | null };
      const bloomRef = { current: null as ReturnType<typeof useTheme> | null };
      render(
        <BloomThemeProvider mode="light" colorPreset="blue">
          <Probe navRef={navRef} bloomRef={bloomRef} />
        </BloomThemeProvider>,
      );
      expect(navRef.current!.colors.notification).toBe(
        bloomRef.current!.colors.error,
      );
    });

    it('colors differ between light and dark presets (sanity check)', () => {
      const lightNavRef = { current: null as NavigationTheme | null };
      const lightBloomRef = { current: null as ReturnType<typeof useTheme> | null };
      const { unmount } = render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <Probe navRef={lightNavRef} bloomRef={lightBloomRef} />
        </BloomThemeProvider>,
      );
      const lightBg = lightNavRef.current!.colors.background;
      unmount();

      const darkNavRef = { current: null as NavigationTheme | null };
      const darkBloomRef = { current: null as ReturnType<typeof useTheme> | null };
      render(
        <BloomThemeProvider mode="dark" colorPreset="teal">
          <Probe navRef={darkNavRef} bloomRef={darkBloomRef} />
        </BloomThemeProvider>,
      );
      const darkBg = darkNavRef.current!.colors.background;

      expect(lightBg).not.toBe(darkBg);
    });
  });

  describe('fonts shape', () => {
    it('has all four font variants with System fontFamily', () => {
      const navRef = { current: null as NavigationTheme | null };
      const bloomRef = { current: null as ReturnType<typeof useTheme> | null };
      render(
        <BloomThemeProvider mode="light">
          <Probe navRef={navRef} bloomRef={bloomRef} />
        </BloomThemeProvider>,
      );
      const fonts = navRef.current!.fonts;
      for (const key of ['regular', 'medium', 'bold', 'heavy'] as const) {
        expect(fonts[key].fontFamily).toBe('System');
      }
    });

    it('has correct fontWeight values for each variant', () => {
      const navRef = { current: null as NavigationTheme | null };
      const bloomRef = { current: null as ReturnType<typeof useTheme> | null };
      render(
        <BloomThemeProvider mode="light">
          <Probe navRef={navRef} bloomRef={bloomRef} />
        </BloomThemeProvider>,
      );
      const fonts = navRef.current!.fonts;
      expect(fonts.regular.fontWeight).toBe('400');
      expect(fonts.medium.fontWeight).toBe('500');
      expect(fonts.bold.fontWeight).toBe('700');
      expect(fonts.heavy.fontWeight).toBe('900');
    });
  });

  describe('memo stability', () => {
    it('returns a referentially-equal object on re-render when theme is unchanged', () => {
      const capturesRef: React.MutableRefObject<NavigationTheme[]> = {
        current: [],
      };
      const { rerender } = render(
        <BloomThemeProvider mode="light">
          <MemoProbe capturesRef={capturesRef} triggerProp={0} />
        </BloomThemeProvider>,
      );

      // Re-render without changing mode or colorPreset — memo should hold.
      rerender(
        <BloomThemeProvider mode="light">
          <MemoProbe capturesRef={capturesRef} triggerProp={1} />
        </BloomThemeProvider>,
      );

      expect(capturesRef.current.length).toBeGreaterThanOrEqual(2);
      const first = capturesRef.current[0];
      const second = capturesRef.current[1];
      expect(Object.is(first, second)).toBe(true);
    });
  });
});
