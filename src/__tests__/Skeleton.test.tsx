import React from 'react';
import { Animated } from 'react-native';
import * as MotionPreference from '../hooks/use-prefers-reduced-motion';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import * as Skeleton from '../skeleton';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Skeleton.Box', () => {
  it('is exported from the Skeleton namespace', () => {
    expect(typeof Skeleton.Box).toBe('function');
    expect(Skeleton.Box.displayName).toBe('Skeleton.Box');
  });

  it('renders without crashing with numeric width/height', () => {
    const { UNSAFE_root } = renderWithTheme(<Skeleton.Box width={100} height={48} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders without crashing with percentage width', () => {
    const { UNSAFE_root } = renderWithTheme(<Skeleton.Box width="100%" height={200} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with sharp corners when borderRadius is 0', () => {
    const { UNSAFE_root } = renderWithTheme(
      <Skeleton.Box width={50} height={50} borderRadius={0} />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with a custom large borderRadius', () => {
    const { UNSAFE_root } = renderWithTheme(
      <Skeleton.Box width={50} height={50} borderRadius={24} />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders when blend prop is set', () => {
    const { UNSAFE_root } = renderWithTheme(<Skeleton.Box width={50} height={50} blend />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('still exposes existing primitives (Pill, Circle, Text, Row, Col)', () => {
    expect(typeof Skeleton.Pill).toBe('function');
    expect(typeof Skeleton.Circle).toBe('function');
    expect(typeof Skeleton.Text).toBe('function');
    expect(typeof Skeleton.Row).toBe('function');
    expect(typeof Skeleton.Col).toBe('function');
  });
});

describe('Skeleton.Region', () => {
  beforeEach(() => jest.spyOn(MotionPreference, 'usePrefersReducedMotion').mockReturnValue(false));
  afterEach(() => jest.restoreAllMocks());

  it('shares one non-interactive animation across shapes and nested regions', () => {
    const stop = jest.fn();
    const loop = jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(), stop, reset: jest.fn(),
    });
    const timing = jest.spyOn(Animated, 'timing');
    const screen = renderWithTheme(
      <Skeleton.Region label="Loading feed" testID="loading" style={{ gap: 12 }}>
        <Skeleton.Circle size={40} />
        <Skeleton.Region label="Nested loading" testID="nested">
          <Skeleton.Text /><Skeleton.Box width={100} height={48} />
        </Skeleton.Region>
      </Skeleton.Region>,
    );
    expect(loop).toHaveBeenCalledTimes(1);
    expect(timing).toHaveBeenCalledTimes(2);
    for (const call of timing.mock.calls) expect(call[1].isInteraction).toBe(false);
    expect(screen.getByTestId('loading').props.accessibilityState).toEqual({ busy: true });
    expect(screen.getByTestId('loading').props.accessibilityLabel).toBe('Loading feed');
    expect(screen.getByTestId('nested').props.accessibilityState).toBeUndefined();
    expect(screen.getByTestId('nested').props.accessibilityLabel).toBeUndefined();
    expect(screen.UNSAFE_getAllByProps({ importantForAccessibility: 'no-hide-descendants' }).length).toBeGreaterThanOrEqual(3);
    screen.unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('keeps reduced-motion placeholders static, including standalone shapes', () => {
    jest.spyOn(MotionPreference, 'usePrefersReducedMotion').mockReturnValue(true);
    const loop = jest.spyOn(Animated, 'loop');
    const screen = renderWithTheme(
      <Skeleton.Region testID="loading">
        <Skeleton.Box width={100} height={40} />
      </Skeleton.Region>,
    );
    expect(loop).not.toHaveBeenCalled();
    expect(screen.getByTestId('loading').props.accessibilityLabel).toBe('Loading');
    screen.unmount();
    renderWithTheme(<Skeleton.Pill size={20} />);
    expect(loop).not.toHaveBeenCalled();
  });
});
