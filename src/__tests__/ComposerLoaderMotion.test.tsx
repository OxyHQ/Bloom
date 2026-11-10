import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

let mockDashProps: () => { strokeDashoffset: number };
const mockTiming = jest.fn((value: number) => value);
const mockClock = { setActive: jest.fn(), isActive: false, callbackId: 0 };
let mockFrame: (frame: {
  timeSincePreviousFrame: number | null;
  timeSinceFirstFrame: number;
}) => void;
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('../../__mocks__/react-native-reanimated'),
  __esModule: true,
  withTiming: (...args: Parameters<typeof mockTiming>) => mockTiming(...args),
  useAnimatedProps: (mapper: () => Record<string, unknown>) => {
    const props = mapper();
    if ('strokeDashoffset' in props) mockDashProps = mapper as typeof mockDashProps;
    return props;
  },
  useFrameCallback: (callback: typeof mockFrame) => {
    mockFrame = callback;
    return mockClock;
  },
}));
jest.mock('react-native-svg', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-svg');
  return {
    ...actual,
    __esModule: true,
    default: actual.Svg,
    Filter: 'Filter',
    FeGaussianBlur: 'FeGaussianBlur',
  };
});
jest.mock('../composer-loader/AndroidLight', () => ({
  AndroidLight: ({
    onUnsupported,
    children,
  }: {
    onUnsupported: () => void;
    children: React.ReactNode;
  }) => require('react').createElement('AndroidLightMock', { onUnsupported }, children),
}));
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: jest.fn(() => false),
}));
jest.mock('../screen/use-screen-visible', () => ({ useScreenVisible: jest.fn(() => true) }));
jest.mock('../viewport/use-in-view.web', () => ({
  useInView: () => ({ inView: true, targetProps: { ref: () => {} } }),
}));

import { ComposerLoader as NativeLoader } from '../composer-loader/ComposerLoader';
import { ComposerLoader as WebLoader } from '../composer-loader/ComposerLoader.web';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useScreenVisible } from '../screen/use-screen-visible';
import { COMPOSER_LOADER_FADE_MS } from '../composer-loader/shared';
import type { ComposerLoaderPhase } from '../composer-loader/types';
import { resolvedStyle } from './support/rendered-style';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const HIDDEN = { includeHiddenElements: true } as const;
const layout = (width: number, height: number) => ({ nativeEvent: { layout: { width, height } } });
const wrap = (element: React.ReactElement) => (
  <BloomThemeProvider mode="light">{element}</BloomThemeProvider>
);
beforeEach(() => {
  jest.useFakeTimers();
  mockClock.setActive.mockClear();
  mockTiming.mockClear();
  jest.mocked(usePrefersReducedMotion).mockReturnValue(false);
  jest.mocked(useScreenVisible).mockReturnValue(true);
});
afterEach(() => jest.useRealTimers());

for (const [platform, Loader, rectName] of [
  ['native', NativeLoader, 'Rect'],
  ['web', WebLoader, 'rect'],
] as const) {
  describe(`${platform} loader lifecycle`, () => {
    const setup = (active = true, paused = false) => {
      const ui = (on: boolean, pause = false, phase?: ComposerLoaderPhase) =>
        wrap(
          <Loader active={on} phase={phase} paused={pause} testID="loader">
            <Text>draft</Text>
          </Loader>,
        );
      const tree = render(ui(active, paused));
      const measure = (w = 320, h = 80) =>
        fireEvent(tree.getByTestId('loader-light', HIDDEN), 'layout', layout(w, h));
      const strokes = () =>
        tree.UNSAFE_root.findAll(
          (node) => (node.type as unknown) === rectName && !!node.props.stroke,
        );
      const moving = () =>
        platform === 'native'
          ? mockClock.setActive.mock.lastCall?.[0]
          : strokes()[0]?.props.style.animationPlayState === 'running';
      const phaseUi = (phase: ComposerLoaderPhase) => ui(false, false, phase);
      return { ...tree, ui, phaseUi, measure, strokes, moving };
    };

    it('waits for measured positive geometry and retains children across resize', () => {
      const t = setup();
      expect(t.strokes()).toHaveLength(0);
      const child = t.getByText('draft');
      t.measure();
      expect(t.strokes()).toHaveLength(3);
      expect(t.strokes()[0]!.props).toMatchObject({ width: 320, height: 80, rx: 40 });
      t.measure(180, 120);
      expect(t.strokes()[0]!.props).toMatchObject({ width: 180, height: 120, rx: 60 });
      expect(t.getByText('draft')).toBe(child);
      t.measure(0, 0);
      expect(t.strokes()).toHaveLength(0);
      expect(t.getByText('draft')).toBe(child);
    });

    it('never starts inactive, fades before stopping, and cancels a pending stop', () => {
      const timers = jest.spyOn(global, 'setTimeout');
      const t = setup(false);
      t.measure();
      expect(timers.mock.calls.some((call) => call[1] === COMPOSER_LOADER_FADE_MS)).toBe(false);
      timers.mockRestore();
      expect(t.moving()).toBe(false);
      t.rerender(t.ui(true));
      expect(t.moving()).toBe(true);
      t.rerender(t.ui(false));
      act(() => jest.advanceTimersByTime(COMPOSER_LOADER_FADE_MS - 1));
      expect(t.moving()).toBe(true);
      t.rerender(t.ui(true));
      act(() => jest.advanceTimersByTime(COMPOSER_LOADER_FADE_MS));
      expect(t.moving()).toBe(true);
      t.rerender(t.ui(false));
      act(() => jest.advanceTimersByTime(COMPOSER_LOADER_FADE_MS));
      expect(t.moving()).toBe(false);
    });

    it('keeps submit, streaming and stop on one lap, then fades on completion', () => {
      const t = setup(false);
      t.measure();
      t.rerender(t.phaseUi('submitting'));
      expect(t.moving()).toBe(true);
      const firstAnimation = t.strokes()[0]?.props.style;
      if (platform === 'native') {
        act(() => mockFrame({ timeSincePreviousFrame: 1000, timeSinceFirstFrame: 1000 }));
        const offset = mockDashProps().strokeDashoffset;
        t.rerender(t.phaseUi('streaming'));
        act(() => mockFrame({ timeSincePreviousFrame: 1000, timeSinceFirstFrame: 0 }));
        expect(mockDashProps().strokeDashoffset).not.toBe(offset);
      } else {
        t.rerender(t.phaseUi('streaming'));
        expect(t.strokes()[0]?.props.style).toEqual(firstAnimation);
      }
      expect(t.moving()).toBe(true);
      t.rerender(t.phaseUi('stopping'));
      expect(t.moving()).toBe(true);
      t.rerender(t.phaseUi('complete'));
      expect(t.moving()).toBe(true);
      act(() => jest.advanceTimersByTime(COMPOSER_LOADER_FADE_MS));
      expect(t.moving()).toBe(false);
      t.rerender(t.phaseUi('error'));
      expect(t.moving()).toBe(false);
      t.rerender(t.phaseUi('idle'));
      expect(t.moving()).toBe(false);
    });

    it('cancels the opacity transition when its screen hides during fade-out', () => {
      const t = setup();
      t.measure();
      t.rerender(t.ui(false));
      expect(t.moving()).toBe(true);
      act(() => jest.advanceTimersByTime(100));
      mockTiming.mockClear();
      jest.mocked(useScreenVisible).mockReturnValue(false);
      t.rerender(t.ui(false));
      expect(t.moving()).toBe(false);
      if (platform === 'native') {
        expect(mockTiming).not.toHaveBeenCalled();
      } else {
        expect(resolvedStyle(t.getByTestId('loader-light', HIDDEN).props.style)).toMatchObject({
          transitionDuration: '0ms',
          transitionProperty: 'none',
        });
      }
      t.unmount();
      act(() => jest.advanceTimersByTime(COMPOSER_LOADER_FADE_MS));
      if (platform === 'native') expect(mockClock.setActive).toHaveBeenLastCalledWith(false);
    });

    it('suspends immediately when paused, the screen is hidden, or motion is reduced', () => {
      const t = setup();
      t.measure();
      expect(t.moving()).toBe(true);
      t.rerender(t.ui(true, true));
      expect(t.moving()).toBe(false);
      t.rerender(t.ui(true));
      expect(t.moving()).toBe(true);
      jest.mocked(useScreenVisible).mockReturnValue(false);
      t.rerender(t.ui(false));
      expect(t.moving()).toBe(false);
      jest.mocked(useScreenVisible).mockReturnValue(true);
      jest.mocked(usePrefersReducedMotion).mockReturnValue(true);
      t.rerender(t.ui(true));
      expect(t.moving()).toBe(false);
      expect(t.strokes()).toHaveLength(3);
      expect(t.getByText('draft')).toBeTruthy();
    });
  });
}

it('freezes the native clock after software-host fallback returns to SVG', () => {
  const t = render(
    wrap(
      <NativeLoader testID="loader">
        <Text>draft</Text>
      </NativeLoader>,
    ),
  );
  fireEvent(t.getByTestId('loader-light', HIDDEN), 'layout', layout(320, 80));
  expect(mockClock.setActive).toHaveBeenLastCalledWith(true);
  const adapter = t.UNSAFE_root.findByType('AndroidLightMock' as never);
  act(() => adapter.props.onUnsupported());
  expect(mockClock.setActive).toHaveBeenLastCalledWith(false);
  expect(t.getByText('draft')).toBeTruthy();
});

it('preserves native phase when the frame clock resumes and cancels on unmount', () => {
  const ui = (paused = false) =>
    wrap(
      <NativeLoader testID="loader" paused={paused} bloom={0}>
        <Text>draft</Text>
      </NativeLoader>,
    );
  const t = render(ui());
  fireEvent(t.getByTestId('loader-light', HIDDEN), 'layout', layout(320, 80));
  act(() => mockFrame({ timeSincePreviousFrame: 1000, timeSinceFirstFrame: 1000 }));
  t.rerender(ui(true));
  const offset = () => mockDashProps().strokeDashoffset;
  const before = offset();
  expect(before).toBeLessThan(0);
  t.rerender(ui());
  act(() => mockFrame({ timeSincePreviousFrame: null, timeSinceFirstFrame: 0 }));
  t.rerender(ui(true));
  expect(offset()).toBe(before);
  t.unmount();
  expect(mockClock.setActive).toHaveBeenLastCalledWith(false);
});
