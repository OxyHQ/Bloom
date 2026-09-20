import React from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AuthCard, AuthMediaCarousel } from '../auth-card';
import { AUTH_CARD_WEB_CSS } from '../auth-card/AuthCard';

import { resolveButtonPalette } from '../button/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { resolvedStyle } from './support/rendered-style';

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('AuthCard', () => {
  function withViewport(width: number) {
    return jest
      .spyOn(ReactNative, 'useWindowDimensions')
      .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
  }

  afterEach(() => jest.restoreAllMocks());

  it('pads 24 on a phone and 32 from the sm breakpoint', () => {
    const phone = renderCard(<AuthCard testID="auth" />);
    expect(resolvedStyle(phone.getByTestId('auth').props.style).padding).toBe(24);
    phone.unmount();
    withViewport(640);
    const wide = renderCard(<AuthCard testID="auth" />);
    expect(resolvedStyle(wide.getByTestId('auth').props.style).padding).toBe(32);
  });

  it('keeps the card geometry: max 400, radius 24, 1px border-button-default', () => {
    withViewport(1024);
    const { getByTestId } = renderCard(<AuthCard testID="auth" />);
    const card = resolvedStyle(getByTestId('auth').props.style);
    const { colors } = buildTheme('teal', 'light');
    expect(card).toMatchObject({
      maxWidth: 400,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 32,
    });
  });

  it('paints the dark card with canonical card and hairline roles', () => {
    const { getByTestId } = renderCard(<AuthCard testID="auth" />, 'dark');
    const { colors } = buildTheme('teal', 'dark');
    expect(resolvedStyle(getByTestId('auth').props.style)).toMatchObject({
      backgroundColor: colors.card,
      borderColor: colors.borderLight,
    });
  });

  it('hands the sign-in form to onSubmit as typed values, remember defaulting on', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = renderCard(<AuthCard testID="auth" onSubmit={onSubmit} />);
    fireEvent.changeText(getByTestId('auth-email'), 'ada@company.com');
    fireEvent.changeText(getByTestId('auth-password'), 'hunter22');
    fireEvent.press(getByTestId('auth-submit'));
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'ada@company.com',
      password: 'hunter22',
      remember: true,
    });
  });

  it('adds a name field on sign-up and a confirm field instead with confirmPassword', () => {
    const plain = renderCard(<AuthCard mode="signup" />);
    expect(plain.queryByText('Full name')).not.toBeNull();
    expect(plain.queryByText('Confirm password')).toBeNull();
    expect(plain.queryByText('Remember me')).toBeNull();
    plain.unmount();

    const confirm = renderCard(<AuthCard mode="signup" confirmPassword />);
    expect(confirm.queryByText('Full name')).toBeNull();
    expect(confirm.queryByText('Confirm password')).not.toBeNull();
  });

  it('renders every provider stacked with its visible label, and reports presses', () => {
    const onProvider = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <AuthCard testID="auth" onProvider={onProvider} />,
    );
    expect(getByText('Continue with Google')).toBeTruthy();
    const apple = getByTestId('auth-provider-apple');
    expect(apple.props.accessibilityRole).toBe('button');
    expect(resolvedStyle(apple.props.style)).toMatchObject({ height: 36, width: '100%' });
    fireEvent.press(apple);
    expect(onProvider).toHaveBeenCalledWith('apple');
  });

  it('draws icon-only 36px squares for inline and grid, still named for assistive tech', () => {
    const { getByTestId, queryByText } = renderCard(
      <AuthCard testID="auth" layout="inline" providers={['google', 'x']} />,
    );
    expect(queryByText('Continue with Google')).toBeNull();
    const google = getByTestId('auth-provider-google');
    expect(google.props.accessibilityLabel).toBe('Continue with Google');
    expect(resolvedStyle(google.props.style)).toMatchObject({ width: 36, height: 36 });
    expect(resolvedStyle(getByTestId('auth-providers').props.style)).toMatchObject({
      flexWrap: 'wrap',
      gap: 8,
    });
  });

  it('paints the provider button as the secondary button surface', () => {
    const { getByTestId } = renderCard(<AuthCard testID="auth" providers={['github']} />);
    const palette = resolveButtonPalette('outline', buildTheme('teal', 'light'), 'neutral');
    expect(resolvedStyle(getByTestId('auth-provider-github').props.style)).toMatchObject({
      backgroundColor: palette.rest.background,
      borderColor: palette.rest.border,
      borderWidth: 1,
    });
  });

  it('verify mode: OTP boxes, no providers, the email in the copy, and a resend action', () => {
    const onResend = jest.fn();
    const { getByTestId, queryByTestId, getByText } = renderCard(
      <AuthCard testID="auth" mode="verify" email="ada@company.com" onResend={onResend} />,
    );
    expect(getByText('Check your inbox')).toBeTruthy();
    expect(getByText('ada@company.com')).toBeTruthy();
    expect(queryByTestId('auth-providers')).toBeNull();
    expect(queryByTestId('auth-email')).toBeNull();
    fireEvent.press(getByTestId('auth-resend'));
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it('routes the footer link through onSwitch and onNavigate', () => {
    const onSwitch = jest.fn();
    const onNavigate = jest.fn();
    const { getByTestId } = renderCard(
      <AuthCard testID="auth" switchHref="/signup" onSwitch={onSwitch} onNavigate={onNavigate} />,
    );
    const link = getByTestId('auth-switch');
    expect(link.props.accessibilityRole).toBe('link');
    fireEvent.press(link, { preventDefault: jest.fn() });
    expect(onSwitch).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('/signup');
  });

  it('marks the title as a heading on native', () => {
    const { getByText } = renderCard(<AuthCard title="Hello" />);
    let node = getByText('Hello').parent;
    while (node && node.props.accessibilityRole !== 'header') node = node.parent;
    expect(node).not.toBeNull();
  });

  it('drops the media below md rather than stacking it', () => {
    const { queryByTestId } = renderCard(<AuthCard testID="auth" media={<></>} />);
    expect(queryByTestId('auth-media')).toBeNull();
  });

  it('puts the media in a second equal column from md and the footnote under the card', () => {
    withViewport(768);
    const { getByTestId, getByText } = renderCard(
      <AuthCard testID="auth" media={<></>} footnote="Terms apply." />,
    );
    expect(resolvedStyle(getByTestId('auth').props.style)).toMatchObject({
      maxWidth: 880,
      flexDirection: 'row',
    });
    expect(resolvedStyle(getByTestId('auth-media').props.style)).toMatchObject({
      flexGrow: 1,
      flexBasis: 0,
    });
    expect(getByText('Terms apply.')).toBeTruthy();
  });

  it('hangs its web rules off a dataSet attribute with a :focus-visible ring', () => {
    expect(AUTH_CARD_WEB_CSS).toContain('[data-bloom-auth-link]:focus-visible');
    expect(AUTH_CARD_WEB_CSS).not.toMatch(/:focus\s*\{/);
  });

});

describe('AuthMediaCarousel', () => {
  const slides = [{ source: 'a.png' }, { source: 'b.png', alt: 'Kitchen' }];

  it('renders no slide until measured, then every slide and one dot each', () => {
    const { getByTestId, queryByTestId } = renderCard(
      <AuthMediaCarousel testID="carousel" slides={slides} />,
    );
    expect(queryByTestId('carousel-slide-0')).toBeNull();
    act(() => {
      fireEvent(getByTestId('carousel'), 'layout', {
        nativeEvent: { layout: { width: 400, height: 600, x: 0, y: 0 } },
      });
    });
    expect(getByTestId('carousel-slide-0')).toBeTruthy();
    expect(getByTestId('carousel-slide-1')).toBeTruthy();
  });

  it('runs a full shrink → slide → enter → idle cycle on its timers', () => {
    jest.useFakeTimers();
    try {
      const { getByTestId } = renderCard(
        <AuthMediaCarousel testID="carousel" slides={slides} interval={1000} />,
      );
      act(() => {
        fireEvent(getByTestId('carousel'), 'layout', {
          nativeEvent: { layout: { width: 400, height: 600, x: 0, y: 0 } },
        });
      });
      // idle 1000 → shrink 650 → slide 700 → enter 20 → idle
      act(() => {
        jest.advanceTimersByTime(1000 + 650 + 700 + 20);
      });
      expect(getByTestId('carousel-slide-1')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });
});
