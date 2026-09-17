import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { Notification } from '../notification';
import { NOTIFICATION_GEOMETRY, resolveNotificationPaint } from '../notification/shared';
import type { NotificationProps } from '../notification';

const renderNotification = (props: Partial<NotificationProps> = {}, mode: 'light' | 'dark' = 'light') =>
  render(
    <BloomThemeProvider mode={mode} colorPreset="blue">
      <Notification title="Deploy failed" {...props} />
    </BloomThemeProvider>,
  );

const hostName = (node: { type: unknown }): string => (typeof node.type === 'string' ? node.type : '');

/** Flatten a host's `style` prop (arrays nest) into one object. */
function flat(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return style && typeof style === 'object' ? (style as Record<string, unknown>) : {};
}

const cardOf = (utils: ReturnType<typeof renderNotification>) =>
  utils.UNSAFE_root.findAll((n) => hostName(n) === 'Animated.View' && n.props.role !== undefined)[0];

describe('Notification', () => {
  it('paints the card geometry', () => {
    const card = cardOf(renderNotification({ description: 'Exit code 1.' }));
    expect(card).toBeDefined();
    const style = flat(card?.props.style);
    expect(style).toMatchObject({
      borderRadius: 16,
      borderWidth: 1,
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      paddingRight: 44,
      gap: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
    });
  });

  it('uses the theme surface and dropdown shadow, light and dark', () => {
    for (const mode of ['light', 'dark'] as const) {
      const paint = resolveNotificationPaint(buildTheme('blue', mode));
      const style = flat(cardOf(renderNotification({}, mode))?.props.style);
      expect({ mode, bg: style.backgroundColor, border: style.borderColor, shadow: style.boxShadow }).toEqual({
        mode,
        bg: paint.surface,
        border: paint.border,
        shadow: paint.shadow,
      });
    }
  });

  it('defaults the live-region role from the status, and honours an override', () => {
    expect(cardOf(renderNotification())?.props.role).toBe('status');
    expect(cardOf(renderNotification({ status: 'error' }))?.props.role).toBe('alert');
    expect(cardOf(renderNotification({ status: 'error', role: 'status' }))?.props.role).toBe('status');
  });

  it('renders a 40px tinted disc for each status, each a distinct colour', () => {
    const paint = resolveNotificationPaint(buildTheme('blue', 'light'));
    const discs = (['neutral', 'information', 'success', 'warning', 'error'] as const).map((status) => {
      const disc = renderNotification({ status }).UNSAFE_root.findAll(
        (n) => hostName(n) === 'View' && flat(n.props.style).width === NOTIFICATION_GEOMETRY.visual,
      )[0];
      const style = flat(disc?.props.style);
      expect(style.backgroundColor).toBe(paint.status[status].background);
      expect(style.borderRadius).toBe(20);
      return style.backgroundColor;
    });
    expect(new Set(discs).size).toBe(5);
  });

  it('renders title, timestamp and description on the type ramp', () => {
    const { getByText } = renderNotification({ timestamp: '2m ago', description: 'Exit code 1.' });
    expect(flat(getByText('Deploy failed').props.style)).toMatchObject({ fontSize: 14, lineHeight: 20, fontWeight: '500' });
    expect(flat(getByText('2m ago').props.style)).toMatchObject({ fontSize: 14, fontWeight: '400' });
    expect(flat(getByText('Exit code 1.').props.style)).toMatchObject({ fontSize: 14, fontWeight: '400' });
  });

  it('centres a title-only card and its close button on the 40px visual', () => {
    const utils = renderNotification({ closeLabel: 'Close it' });
    expect(flat(cardOf(utils)?.props.style)).toMatchObject({ alignItems: 'center' });
    const close = utils.UNSAFE_root.findAll(
      (n) => hostName(n) === 'Pressable' && n.props.accessibilityLabel === 'Close it',
    )[0];
    // padding 16 + (visual 40 − close 20) / 2
    expect(flat(close?.props.style)).toMatchObject({ top: 26, right: 12 });
  });

  it('names the close button and dismisses through it', () => {
    const onDismiss = jest.fn();
    const utils = renderNotification({ onDismiss, closeLabel: 'Close it', description: 'Exit code 1.' });
    const close = utils.UNSAFE_root.findAll(
      (n) => hostName(n) === 'Pressable' && n.props.accessibilityLabel === 'Close it',
    )[0];
    expect(close).toBeDefined();
    expect(flat(close?.props.style)).toMatchObject({ position: 'absolute', top: 12, right: 12, width: 20 });
    act(() => {
      if (close) fireEvent.press(close);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(cardOf(utils)).toBeUndefined();
  });

  it('has no close button when not dismissible', () => {
    const utils = renderNotification({ dismissible: false });
    expect(utils.UNSAFE_root.findAll((n) => hostName(n) === 'Pressable')).toHaveLength(0);
  });

  it('renders actions as small Buttons, secondary then primary', () => {
    const first = jest.fn();
    const { getByText } = renderNotification({
      actions: [
        { label: 'View logs', onPress: first },
        { label: 'Retry', onPress: jest.fn() },
      ],
    });
    fireEvent.press(getByText('View logs'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(getByText('Retry')).toBeTruthy();
  });

  it('auto-dismisses after the duration and draws the accent countdown bar', () => {
    jest.useFakeTimers();
    try {
      const onDismiss = jest.fn();
      const utils = renderNotification({ autoDismissDuration: 5000, onDismiss });
      const paint = resolveNotificationPaint(buildTheme('blue', 'light'));
      const bar = utils.UNSAFE_root.findAll(
        (n) => hostName(n) === 'Animated.View' && flat(n.props.style).height === 3,
      )[0];
      expect(flat(bar?.props.style)).toMatchObject({ position: 'absolute', bottom: 0, backgroundColor: paint.countdown });
      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(onDismiss).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows an avatar with a presence dot instead of the status disc', () => {
    const utils = renderNotification({ avatar: { name: 'Mia Chen', presence: 'online' } });
    const paint = resolveNotificationPaint(buildTheme('blue', 'light'));
    const dot = utils.UNSAFE_root.findAll(
      (n) => hostName(n) === 'View' && flat(n.props.style).width === 12,
    )[0];
    expect(flat(dot?.props.style)).toMatchObject({
      borderWidth: 2,
      borderColor: paint.surface,
      backgroundColor: paint.presence.online,
    });
  });
});

describe('resolveNotificationPaint', () => {
  it('never reaches for a brand token in a status disc', () => {
    for (const mode of ['light', 'dark'] as const) {
      const theme = buildTheme('blue', mode);
      const brand = [theme.colors.primary, theme.colors.primarySubtle, theme.colors.negative];
      const paint = resolveNotificationPaint(theme);
      for (const [status, tone] of Object.entries(paint.status)) {
        expect({ mode, status, leaks: [tone.background, tone.foreground].filter((c) => brand.includes(c)) }).toEqual({
          mode,
          status,
          leaks: [],
        });
      }
    }
  });
});
