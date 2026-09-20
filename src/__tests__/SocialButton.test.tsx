import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { resolveButtonPalette } from '../button/shared';
import { SocialButton, SOCIAL_PROVIDERS, type SocialProvider } from '../social-button';
import { SOCIAL_COLOR_LOGOS } from '../social-button/color-logos';
import {
  brandGradientBottom,
  resolveSocialButtonPaint,
} from '../social-button/SocialButton';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

describe('SocialButton — colour recipe', () => {
  it("matches Chrome's oklch(from … l-0.04 c+0.01 h) for the brand fills", () => {
    // Measured: Chrome's canvas pixel for each `oklch(from <brand> …)`; Amazon's
    // orange pins the gamut clip. Microsoft's grey is the powerless-hue case: the
    // spec resolves it to 0 (what this does), Chrome paints rgb(88 81 80) — its own
    // float noise lands the hue near 30°. A 3/255 blue difference in one stop.
    expect(brandGradientBottom('#181717')).toBe('rgb(19 13 13)');
    expect(brandGradientBottom('#F24E1E')).toBe('rgb(231 56 0)');
    expect(brandGradientBottom('#5E5E5E')).toBe('rgb(88 81 83)');
    expect(brandGradientBottom('#FF9900')).toBe('rgb(245 138 0)');
    expect(brandGradientBottom('#000000')).toBe('rgb(0 0 0)');
    expect(brandGradientBottom('var(--x)')).toBeNull();
  });

  it('paints Google colorful as the primary button, gradients included', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = themeFor(mode);
      const paint = resolveSocialButtonPaint('google', 'colorful', theme);
      const primary = resolveButtonPalette('solid', theme, 'accent');
      expect(paint.rest.gradient).toEqual(primary.rest.gradient);
      expect(paint.hover.gradient).toEqual(primary.hover.gradient);
      expect(paint.active.gradient).toEqual(primary.active.gradient);
      expect(paint.brightness).toBe(false);
    }
  });

  it('paints white as the secondary button and black as neutral-950/800/900', () => {
    const theme = themeFor('light');
    const white = resolveSocialButtonPaint('github', 'white', theme);
    const secondary = resolveButtonPalette('outline', theme, 'neutral');
    expect(white.rest.background).toBe(secondary.rest.background);
    expect(white.hover.border).toBe(secondary.hover.border);
    expect(white.borderWidth).toBe(1);
    const black = resolveSocialButtonPaint('github', 'black', theme);
    expect(new Set([black.rest.background, black.hover.background, black.active.background]).size).toBe(3);
    expect(black.foreground).toBe('#FFFFFF');
  });

  it('derives brand fills by brightness, 1.06 hover and 0.95 active', () => {
    const paint = resolveSocialButtonPaint('figma', 'colorful', themeFor('light'));
    expect(paint.brightness).toBe(true);
    expect(paint.rest.gradient?.[0]).toBe('#F24E1E');
    // 0xF2 × 1.06 clamps to 255; 0x4E × 0.95 = 74.
    expect(paint.hover.gradient?.[0]).toBe('rgb(255 83 32)');
    expect(paint.active.gradient?.[0]).toBe('rgb(230 74 29)');
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

  it('paints Oxy like Google: the primary button on colorful, the secondary on white', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = themeFor(mode);
      const oxy = resolveSocialButtonPaint('oxy', 'colorful', theme);
      const google = resolveSocialButtonPaint('google', 'colorful', theme);
      expect(oxy).toEqual(google);
      expect(resolveSocialButtonPaint('oxy', 'white', theme)).toEqual(
        resolveSocialButtonPaint('google', 'white', theme),
      );
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

  it('disabled dims to 60% and ignores presses', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <SocialButton testID="b" brand="github" disabled onPress={onPress} />,
    );
    fireEvent.press(getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
    expect(flat(getByTestId('b').props.style).opacity).toBe(0.6);
  });
});
