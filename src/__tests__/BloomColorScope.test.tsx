import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomColorScope } from '../theme/color-scope';
import { BloomColorScope as BloomColorScopeWeb } from '../theme/color-scope/index.web';
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

  it('is a no-op when colorPreset is undefined (children inherit parent scope)', () => {
    const { getByTestId } = render(
      <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
        <BloomColorScope colorPreset={undefined}>
          <CurrentPreset />
        </BloomColorScope>
      </BloomThemeProvider>,
    );

    expect(getByTestId('preset').props.children).toBe('blue');
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

  // Regression: a Rules-of-Hooks violation (caught at runtime on a real Android
  // device) where an early return between `useContext` and the `useMemo` calls
  // changed the hook count/order when `colorPreset` toggled undefined <-> set:
  //   "React has detected a change in the order of Hooks called by
  //    BloomColorScope. Previous render: 1. useContext 2. undefined.
  //    Next render: 1. useContext 2. useMemo".
  // All hooks must now run unconditionally on every render, so toggling the
  // preset must neither warn about hook order nor throw.
  it.each([
    ['native variant (index)', BloomColorScope] as const,
    ['web variant (index.web)', BloomColorScopeWeb] as const,
  ])(
    'does not change hook order when colorPreset toggles undefined <-> set (%s)',
    (_label, Scope) => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      // First render: no preset -> the bug ran only `useContext` (1 hook).
      const { rerender, getByTestId } = render(
        <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
          <Scope colorPreset={undefined}>
            <CurrentPreset />
          </Scope>
        </BloomThemeProvider>,
      );
      expect(getByTestId('preset').props.children).toBe('blue');

      // Re-render with a preset -> the bug now ran `useContext` + 2x `useMemo`,
      // changing the hook order between renders. Must not throw or warn.
      expect(() =>
        rerender(
          <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
            <Scope colorPreset="green">
              <CurrentPreset />
            </Scope>
          </BloomThemeProvider>,
        ),
      ).not.toThrow();
      expect(getByTestId('preset').props.children).toBe('green');

      // Toggle back to undefined to exercise the reverse transition.
      expect(() =>
        rerender(
          <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
            <Scope colorPreset={undefined}>
              <CurrentPreset />
            </Scope>
          </BloomThemeProvider>,
        ),
      ).not.toThrow();
      expect(getByTestId('preset').props.children).toBe('blue');

      const hookOrderWarning = consoleError.mock.calls.some((args) =>
        args.some(
          (arg) =>
            typeof arg === 'string' &&
            (arg.includes('order of Hooks') ||
              arg.includes('Rendered more hooks') ||
              arg.includes('Rendered fewer hooks')),
        ),
      );
      expect(hookOrderWarning).toBe(false);

      consoleError.mockRestore();
    },
  );

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

  // Web variant: regression for the production crash on mention.earth profile
  // screens. On web the `asChild` child is frequently an RNW component whose
  // `style` is a React Native style ARRAY. The web variant must merge styles as
  // an array (RNW flattens it) and must NOT spread the array into an object
  // literal — that copies the array's numeric indices as keys and makes RNW
  // throw `Failed to set an indexed property [0] on 'CSSStyleDeclaration'`.
  describe('web variant (index.web)', () => {
    it('merges an array-valued child style without producing numeric index keys (asChild)', () => {
      const { getByTestId } = render(
        <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
          <BloomColorScopeWeb colorPreset="purple" asChild>
            <StyledChild style={[{ padding: 8 }, { margin: 4 }]} />
          </BloomColorScopeWeb>
        </BloomThemeProvider>,
      );

      expect(getByTestId('preset').props.children).toBe('purple');

      const mergedStyle = getByTestId('styled-child').props.style;
      // The merge must be an array (the RNW-safe form), never an object literal
      // with the array's numeric indices spread in as keys.
      expect(Array.isArray(mergedStyle)).toBe(true);

      // No numeric index keys must appear anywhere in the merged style. If the
      // child array had been spread into an object literal, we'd see '0', '1'.
      const collectKeys = (value: unknown): string[] => {
        if (Array.isArray(value)) return value.flatMap(collectKeys);
        if (value && typeof value === 'object') return Object.keys(value);
        return [];
      };
      const keys = collectKeys(mergedStyle);
      expect(keys).not.toContain('0');
      expect(keys).not.toContain('1');

      // The child's own array styles must be preserved (and win over scope vars).
      const flat = (Array.isArray(mergedStyle) ? mergedStyle : [mergedStyle])
        .flat(Infinity)
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object');
      expect(flat).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ padding: 8 }),
          expect.objectContaining({ margin: 4 }),
        ]),
      );
    });

    it('clones the single child and merges scope vars into its style array (asChild)', () => {
      const { getByTestId } = render(
        <BloomThemeProvider defaultColorPreset="blue" fonts={false}>
          <BloomColorScopeWeb colorPreset="purple" asChild>
            <StyledChild style={{ padding: 8 }} />
          </BloomColorScopeWeb>
        </BloomThemeProvider>,
      );

      const mergedStyle = getByTestId('styled-child').props.style;
      expect(Array.isArray(mergedStyle)).toBe(true);
      const flat = (Array.isArray(mergedStyle) ? mergedStyle : [mergedStyle])
        .flat(Infinity)
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object');
      expect(flat).toEqual(
        expect.arrayContaining([expect.objectContaining({ padding: 8 })]),
      );

      // Web var contract: the scoped base tokens (`--background`, `--primary`)
      // must be full `rgb(...)` colors from the single canonical pipeline, and
      // the scoped Tailwind v4 aliases (`--color-primary`) must be generated
      // from those same values so NativeWind utilities resolve inside the
      // subtree instead of inheriting the app-wide preset.
      const vars = Object.assign(
        {},
        ...flat.filter(
          (entry) =>
            '--background' in entry ||
            '--primary' in entry ||
            '--color-primary' in entry,
        ),
      ) as Record<string, unknown>;
      const background = String(vars['--background'] ?? '');
      const primary = String(vars['--primary'] ?? '');
      const colorPrimary = String(vars['--color-primary'] ?? '');
      expect(background.startsWith('rgb(')).toBe(true);
      expect(primary.startsWith('rgb(')).toBe(true);
      expect(colorPrimary).toBe(primary);
      expect(/^-?\d[\d.]*\s+[\d.]+%/.test(background)).toBe(false);
    });
  });
});
