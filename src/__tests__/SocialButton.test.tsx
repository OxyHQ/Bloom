import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { resolveButtonPalette } from '../button/shared';
import { SocialButton, SOCIAL_PROVIDERS, type SocialProvider } from '../social-button';
import { SOCIAL_COLOR_LOGOS } from '../social-button/color-logos';
import { parseRgba } from '../theme/color-utils';

// biome-ignore lint/suspicious/noExplicitAny: test helper reads arbitrary style shapes (carried over from the former eslint-disable)
function flat(style: any): Record<string, any> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return style ?? {};
}

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="blue">
      {ui}
    </BloomThemeProvider>,
  );
}

function themeFor(mode: 'light' | 'dark'): Theme {
  let captured: Theme | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  renderWithTheme(<Probe />, mode);
  return captured!;
}

const BRANDS = Object.keys(SOCIAL_PROVIDERS) as SocialProvider[];

describe('SocialButton — data', () => {
  it('ships all 25 providers, each with a label, viewBox and glyph', () => {
    expect(BRANDS).toHaveLength(25);
    for (const brand of BRANDS) {
      const meta = SOCIAL_PROVIDERS[brand];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.viewBox).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
      expect(meta.path.length).toBeGreaterThan(20);
    }
  });

  it('has a colour mark for every provider but Amazon (absent upstream) and Oxy (drawn two-tone)', () => {
    const missing = BRANDS.filter((b) => !SOCIAL_COLOR_LOGOS[b]);
    expect(missing.sort()).toEqual(['amazon', 'oxy']);
  });

  it('resolves every url(#id) fill to a gradient of the same logo', () => {
    for (const [brand, logo] of Object.entries(SOCIAL_COLOR_LOGOS)) {
      const ids = new Set(logo!.gradients.map((g) => g.id));
      for (const node of logo!.nodes) {
        const ref = /^url\(#(.+)\)$/.exec(node.fill)?.[1];
        if (ref) expect([brand, ids.has(ref)]).toEqual([brand, true]);
      }
    }
  });
});

describe('SocialButton — shared material', () => {
  it('passes brand color pairs into the real Button', () => {
    const { toJSON } = renderWithTheme(<SocialButton brand="figma" />);
    expect(JSON.stringify(toJSON())).toContain('rgb(242, 78, 30)');
    expect(JSON.stringify(toJSON())).toContain('\"fillOpacity\":0.9');
  });
  it('keeps surface paint and the supplied foreground for branded enabled states', () => {
    const palette = resolveButtonPalette('solid', themeFor('light'), 'accent', {
      background: '#F24E1E', foreground: '#FFFFFF',
    });
    expect(palette.rest.background).toBe('rgba(242, 78, 30, 0.9)');
    for (const state of [palette.rest, palette.hover, palette.active]) {
      expect(state.foreground).toBe('#FFFFFF');
      expect(state.surface).toBe(true);
    }
    expect(palette.disabled.surface).toBe(true);
  });
});

describe('SocialButton — render', () => {
  it('defaults to "Continue with <Brand>" at medium 300 × 36, a full pill', () => {
    const { getByText, getByTestId } = renderWithTheme(<SocialButton testID="b" brand="google" />);
    expect(getByText('Continue with Google')).toBeTruthy();
    expect(flat(getByTestId('b').props.style)).toMatchObject({
      height: 36,
      width: 300,
      paddingLeft: 12,
      paddingRight: 12,
      gap: 8,
      borderRadius: 9999,
    });
    expect(flat(getByText('Continue with Google').props.style)).toMatchObject({
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
    });
  });

  it('small is 250 × 32 with 10px padding; fullWidth fills', () => {
    const small = renderWithTheme(<SocialButton testID="b" brand="slack" size="sm" />);
    expect(flat(small.getByTestId('b').props.style)).toMatchObject({ height: 32, width: 250, paddingLeft: 10 });
    const full = renderWithTheme(<SocialButton testID="b" brand="slack" fullWidth />);
    expect(flat(full.getByTestId('b').props.style).width).toBe('100%');
  });

  it('icon-only is square, hides the label and names itself', () => {
    const { getByTestId, queryByText } = renderWithTheme(<SocialButton testID="b" brand="apple" iconOnly />);
    const button = getByTestId('b');
    expect(flat(button.props.style)).toMatchObject({ width: 36, height: 36, paddingLeft: 0 });
    expect(queryByText('Continue with Apple')).toBeNull();
    expect(button.props.accessibilityLabel).toBe('Continue with Apple');
  });

  it('words the default label and the icon-only name by action', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <>
        <SocialButton brand="oxy" action="signIn" />
        <SocialButton brand="google" action="signUp" />
        <SocialButton brand="github" action="continue" />
        <SocialButton testID="icon" brand="oxy" action="signIn" iconOnly />
      </>,
    );
    expect(getByText('Sign in with Oxy')).toBeTruthy();
    expect(getByText('Sign up with Google')).toBeTruthy();
    expect(getByText('Continue with GitHub')).toBeTruthy();
    expect(getByTestId('icon').props.accessibilityLabel).toBe('Sign in with Oxy');
  });

  it('uses primary for Oxy and Google, secondary for white', () => {
    for (const brand of ['oxy', 'google'] as const) {
      const primary = renderWithTheme(<SocialButton brand={brand} />);
      const fill = parseRgba(resolveButtonPalette('solid', themeFor('light'), 'accent').rest.background)!;
      expect(JSON.stringify(primary.toJSON())).toContain(`rgb(${fill.r}, ${fill.g}, ${fill.b})`);
      expect(JSON.stringify(primary.toJSON())).toContain('\"fillOpacity\":0.9');
      primary.unmount();
      const white = renderWithTheme(<SocialButton brand={brand} appearance="white" />);
      expect(JSON.stringify(white.toJSON())).toContain('\"fillOpacity\":0.9');
      white.unmount();
    }
  });

  it('uses the custom config label and a caller label', () => {
    const { getByText } = renderWithTheme(
      <>
        <SocialButton brand="custom" config={{ icon: null, label: 'Acme' }} />
        <SocialButton brand="discord">Sign up with Discord</SocialButton>
      </>,
    );
    expect(getByText('Continue with Acme')).toBeTruthy();
    expect(getByText('Sign up with Discord')).toBeTruthy();
  });

  it('presses, and opens href on native after onPress', () => {
    const onPress = jest.fn();
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByTestId } = renderWithTheme(
      <SocialButton testID="b" brand="github" href="https://example.com/auth" onPress={onPress} />,
    );
    fireEvent.press(getByTestId('b'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('https://example.com/auth');
    expect(getByTestId('b').props.accessibilityRole).toBe('link');
    open.mockRestore();
  });

  it('disabled uses Button state and ignores presses', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <SocialButton testID="b" brand="github" disabled onPress={onPress} />,
    );
    fireEvent.press(getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
    expect(getByTestId('b').props.disabled).toBe(true);
  });
});
