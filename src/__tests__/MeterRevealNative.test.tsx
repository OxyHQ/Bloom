/** @jest-environment jsdom */
import React from 'react';
import { act, render, cleanup } from '@testing-library/react-native/pure';

// Exercise the native Meter fork with the real JS Animated value/timing engine.
// Host views remain the native test renderer's nodes; no CSS transition is involved.
jest.mock('react-native', () => {
  const base = jest.requireActual('../../__mocks__/react-native');
  const real = jest.requireActual('react-native-web');
  const engine = jest.requireActual(
    'react-native-web/dist/cjs/vendor/react-native/Animated/AnimatedImplementation',
  );
  return {
    ...base,
    Platform: { ...base.Platform, OS: 'ios' },
    Easing: real.Easing,
    Animated: { ...base.Animated, Value: engine.Value, timing: engine.timing },
  };
});
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: jest.fn(() => false),
}));

import { Meter } from '../stat-bar/Meter';
import { RatingBar } from '../rating/RatingBar';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const reduced = jest.mocked(usePrefersReducedMotion);
const reveal = {
  visible: false,
  once: true,
  duration: 1000,
  delay: 300,
  easing: [0.4, 0, 0.2, 1] as const,
};
beforeEach(() => {
  jest.useFakeTimers();
  reduced.mockReturnValue(false);
});
afterEach(async () => {
  jest.useRealTimers();
  await cleanup();
});
function Fixture({ visible = false, value = 75 }: { visible?: boolean; value?: number }) {
  return (
    <BloomThemeProvider mode="light">
      <Meter
        value={value}
        max={100}
        accessibilityLabel="Votes"
        testID="meter"
        reveal={{ ...reveal, visible }}
      />
    </BloomThemeProvider>
  );
}
it('animates native width after the delay while announcing the real value throughout', () => {
  const view = render(<Fixture />);
  const width = () => {
    const node = resolvedStyle(view.getByTestId('meter-fill').props.style).width as {
      __getValue(): string;
    };
    return parseFloat(node.__getValue());
  };
  expect(width()).toBe(0);
  expect(view.getByTestId('meter').props['aria-valuenow']).toBe(75);
  view.rerender(<Fixture visible />);
  act(() => jest.advanceTimersByTime(250));
  expect(width()).toBe(0);
  expect(view.getByTestId('meter').props['aria-valuenow']).toBe(75);
  act(() => jest.advanceTimersByTime(500));
  expect(width()).toBeGreaterThan(0);
  expect(width()).toBeLessThan(75);
  act(() => jest.advanceTimersByTime(700));
  expect(width()).toBe(75);
  view.rerender(<Fixture visible={false} />);
  expect(width()).toBe(75);
  view.rerender(<Fixture visible value={40} />);
  expect(view.getByTestId('meter').props['aria-valuenow']).toBe(40);
  act(() => jest.advanceTimersByTime(1400));
  expect(width()).toBe(40);
});
it('cancels pending delay and active native motion when reduced motion changes', () => {
  const view = render(<Fixture visible />);
  const width = () =>
    parseFloat(
      (
        resolvedStyle(view.getByTestId('meter-fill').props.style).width as { __getValue(): string }
      ).__getValue(),
    );
  act(() => jest.advanceTimersByTime(100));
  reduced.mockReturnValue(true);
  view.rerender(<Fixture visible />);
  expect(width()).toBe(75);
  act(() => jest.advanceTimersByTime(1600));
  expect(width()).toBe(75);
  reduced.mockReturnValue(false);
  view.rerender(<Fixture visible value={25} />);
  act(() => jest.advanceTimersByTime(600));
  expect(width()).toBeGreaterThan(25);
  reduced.mockReturnValue(true);
  view.rerender(<Fixture visible value={25} />);
  expect(width()).toBe(25);
  act(() => jest.advanceTimersByTime(1600));
  expect(width()).toBe(25);
});
it('RatingBar forwards reveal without replacing its value or accessible display', () => {
  const view = render(
    <BloomThemeProvider mode="light">
      <RatingBar
        label="Four stars"
        value={80}
        max={100}
        display="80%"
        reveal={reveal}
        testID="rating"
      />
    </BloomThemeProvider>,
  );
  expect(view.getByTestId('rating-bar').props['aria-valuenow']).toBe(80);
  expect(view.getByTestId('rating-bar').props['aria-valuetext']).toBe('80%');
  expect(
    parseFloat(
      (
        resolvedStyle(view.getByTestId('rating-fill').props.style).width as { __getValue(): string }
      ).__getValue(),
    ),
  ).toBe(0);
});
