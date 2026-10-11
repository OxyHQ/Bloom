/** @jest-environment jsdom */
import React from 'react';
import { Platform, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { withTiming } from 'react-native-reanimated';
import { Backdrop } from '../overlay';
import type { BackdropGradient } from '../overlay';
import { backdropDimStyle, clampBackdropNumber } from '../overlay/backdrop-paint';
import { resolveSurfaceTransition } from '../motion/surface-transition';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { Dialog } from '../dialog/Dialog';
import { Dialog as DialogWeb } from '../dialog/Dialog.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { hostNodes, resolvedStyle } from './support/rendered-style';

jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: jest.fn(() => false),
}));
jest.mock('../portal/index.web', () => ({
  Portal: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  return { ...base, __esModule: true, withTiming: jest.fn(base.withTiming) };
});
const gradient: BackdropGradient = {
  direction: 'start-to-end',
  stops: [
    { offset: 0, color: 'transparent' },
    { offset: 0.6975, color: 'rgba(0,0,0,.36)' },
  ],
};
const backdrop = { blurIntensity: 0, dimOpacity: 1, dimGradient: gradient };
const transition = { duration: 300, easing: [0, 0, 0.58, 1] as const };
const reduced = jest.mocked(usePrefersReducedMotion);
const timing = jest.mocked(withTiming);
const originalOS = Platform.OS;
afterEach(() => {
  (Platform as { OS: string }).OS = originalOS;
  reduced.mockReturnValue(false);
  jest.clearAllMocks();
});
function withinTheme(element: React.ReactNode) {
  return (
    <BloomThemeProvider mode="light">
      <PortalProvider>
        {element}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

it('normalizes timing and paint without accepting non-finite or invalid curves', () => {
  expect(resolveSurfaceTransition({ duration: -5 }).duration).toBe(0);
  expect(resolveSurfaceTransition({ duration: NaN, easing: [2, 0, 0.5, 1] })).toEqual({
    duration: 300,
    easing: [0.25, 0.1, 0.25, 1],
    cssEasing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  });
  expect(resolveSurfaceTransition(transition).cssEasing).toBe('cubic-bezier(0, 0, 0.58, 1)');
  expect(clampBackdropNumber(-4, 0.5, 1)).toBe(0);
  expect(clampBackdropNumber(12, 0.5, 1)).toBe(1);
  expect(clampBackdropNumber(Infinity, 0.5, 1)).toBe(0.5);
  expect(
    backdropDimStyle('red', { ...gradient, stops: [{ offset: NaN, color: 'red' }] }, false),
  ).toEqual({ backgroundColor: 'red' });
});
it.each(['ios', 'web'])('paints logical gradient stops on %s without a solid backing', (os) => {
  (Platform as { OS: string }).OS = os;
  const key = os === 'web' ? 'backgroundImage' : 'experimental_backgroundImage';
  expect(backdropDimStyle('red', gradient, false)).toEqual({
    [key]: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,.36) 69.75%)',
  });
  expect(backdropDimStyle('red', gradient, true)).toEqual({
    [key]: 'linear-gradient(270deg, transparent 0%, rgba(0,0,0,.36) 69.75%)',
  });
  expect(
    backdropDimStyle(
      'red',
      {
        ...gradient,
        stops: [
          { offset: -1, color: 'red' },
          { offset: 2, color: 'blue' },
          { offset: 0.2, color: 'green' },
        ],
      },
      false,
    )[key],
  ).toBe('linear-gradient(90deg, red 0%, blue 100%, green 100%)');
});
it('keeps blur disabled and dims only the paint layer, retaining the dismiss hit target', () => {
  (Platform as { OS: string }).OS = 'ios';
  const dismiss = jest.fn();
  const view = render(withinTheme(<Backdrop {...backdrop} onPress={dismiss} testID="scrim" />));
  const nodes = hostNodes(view.toJSON());
  expect(nodes.some((n) => String(n.type).includes('BlurView'))).toBe(false);
  const paint = nodes.find((n) => resolvedStyle(n.props.style).experimental_backgroundImage);
  expect(resolvedStyle(paint?.props.style).opacity).toBe(1);
  expect(resolvedStyle(paint?.props.style).backgroundColor).toBeUndefined();
  act(() => view.getByTestId('scrim').props.onPress());
  expect(dismiss).toHaveBeenCalledTimes(1);
});
it.each(['center', 'end', 'bottom'] as const)(
  'forwards paint and timed motion through native Dialog %s',
  (placement) => {
    (Platform as { OS: string }).OS = 'ios';
    const ui = (open = true) =>
      withinTheme(
        <Dialog
          open={open}
          placement={placement}
          backdrop={backdrop}
          transition={transition}
          testID="native-panel"
        >
          <Text>Body</Text>
        </Dialog>,
      );
    const view = render(ui());
    expect(
      hostNodes(view.toJSON()).some((n) =>
        resolvedStyle(n.props.style)
          .experimental_backgroundImage?.toString()
          .startsWith('linear-gradient(90deg'),
      ),
    ).toBe(true);
    expect(timing.mock.calls.some((call) => call[1]?.duration === 300)).toBe(true);
    timing.mockClear();
    reduced.mockReturnValue(true);
    view.rerender(ui());
    expect(timing.mock.calls.some((call) => call[1]?.duration === 0)).toBe(true);
  },
);
it('preserves omitted web transition timing and replaces it only when requested', () => {
  (Platform as { OS: string }).OS = 'web';
  const ui = (custom: boolean) =>
    withinTheme(
      <DialogWeb
        open
        placement="end"
        transition={custom ? transition : undefined}
        backdrop={custom ? backdrop : undefined}
        testID="panel"
      >
        <Text>Body</Text>
      </DialogWeb>,
    );
  const view = render(ui(false));
  expect(resolvedStyle(view.getByTestId('panel').props.style).transitionDuration).toBe('280ms');
  view.rerender(ui(true));
  expect(resolvedStyle(view.getByTestId('panel').props.style).transitionDuration).toBe('300ms');
  expect(resolvedStyle(view.getByTestId('panel').props.style).transitionTimingFunction).toBe(
    'cubic-bezier(0, 0, 0.58, 1)',
  );
  reduced.mockReturnValue(true);
  view.rerender(ui(true));
  expect(resolvedStyle(view.getByTestId('panel').props.style).transitionDuration).toBe('0ms');
});
