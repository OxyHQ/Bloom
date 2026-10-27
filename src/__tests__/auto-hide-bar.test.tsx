import { act, renderHook } from '@testing-library/react-native';
import {
  AUTO_HIDE_BAR_HIDE,
  AUTO_HIDE_BAR_SHOW,
  autoHideBarGeometry,
  autoHideBarMode,
  composedCss,
  CONTROLS_OPACITY,
  interpolateStops,
  SUMMARY_OPACITY,
} from '../layout/auto-hide-bar-motion';
import { useAutoHideBarMode, type AutoHideBarModeOptions } from '../layout/use-auto-hide-bar';
import { motionProgressAt } from '../motion/spec';

const options = (overrides: Partial<AutoHideBarModeOptions> = {}): AutoHideBarModeOptions => ({
  collapsed: true,
  peek: true,
  peekDelay: 150,
  unpeekDelay: 250,
  ...overrides,
});

describe('AutoHideBar modes', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('follows the owner: shown unless collapsed, and only a collapsed bar peeks', () => {
    expect(autoHideBarMode(false, false)).toBe('shown');
    expect(autoHideBarMode(false, true)).toBe('shown');
    expect(autoHideBarMode(true, false)).toBe('collapsed');
    expect(autoHideBarMode(true, true)).toBe('peek');
  });

  it('peeks after the pointer rests on the strip, not before', () => {
    const { result } = renderHook(() => useAutoHideBarMode(options()));
    expect(result.current.mode).toBe('collapsed');
    act(() => result.current.stripHoverIn());
    act(() => jest.advanceTimersByTime(149));
    expect(result.current.mode).toBe('collapsed');
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.mode).toBe('peek');
  });

  it('a pass over the strip shorter than the delay does nothing', () => {
    const { result } = renderHook(() => useAutoHideBarMode(options()));
    act(() => result.current.stripHoverIn());
    act(() => jest.advanceTimersByTime(100));
    act(() => result.current.stripHoverOut());
    act(() => jest.advanceTimersByTime(500));
    expect(result.current.mode).toBe('collapsed');
  });

  it('the peeked bar stays while the pointer is on it and collapses after it leaves', () => {
    const { result } = renderHook(() => useAutoHideBarMode(options()));
    act(() => result.current.stripHoverIn());
    act(() => jest.advanceTimersByTime(150));
    act(() => result.current.stripHoverOut());
    act(() => result.current.barHoverIn());
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.mode).toBe('peek');
    act(() => result.current.barHoverOut());
    act(() => jest.advanceTimersByTime(249));
    expect(result.current.mode).toBe('peek');
    act(() => result.current.barHoverIn());
    act(() => jest.advanceTimersByTime(500));
    expect(result.current.mode).toBe('peek');
    act(() => result.current.barHoverOut());
    act(() => jest.advanceTimersByTime(250));
    expect(result.current.mode).toBe('collapsed');
  });

  it('pressing the strip drops the peek and asks the owner to reveal', () => {
    const onReveal = jest.fn();
    const { result, rerender } = renderHook(
      (props: AutoHideBarModeOptions) => useAutoHideBarMode(props),
      { initialProps: options({ onReveal }) },
    );
    act(() => result.current.stripHoverIn());
    act(() => result.current.reveal());
    act(() => jest.advanceTimersByTime(1000));
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(result.current.mode).toBe('collapsed');
    rerender(options({ onReveal, collapsed: false }));
    expect(result.current.mode).toBe('shown');
  });

  it('a bar shown by its owner forgets its peek, and peek off never peeks', () => {
    const { result, rerender } = renderHook(
      (props: AutoHideBarModeOptions) => useAutoHideBarMode(props),
      { initialProps: options() },
    );
    act(() => result.current.stripHoverIn());
    act(() => jest.advanceTimersByTime(150));
    expect(result.current.mode).toBe('peek');
    rerender(options({ collapsed: false }));
    expect(result.current.mode).toBe('shown');
    rerender(options());
    expect(result.current.mode).toBe('collapsed');
    rerender(options({ peek: false }));
    act(() => result.current.stripHoverIn());
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.mode).toBe('collapsed');
  });

  it('cancels a pending peek when the owner shows the bar', () => {
    const { result, rerender } = renderHook(
      (props: AutoHideBarModeOptions) => useAutoHideBarMode(props),
      { initialProps: options() },
    );
    act(() => result.current.stripHoverIn());
    rerender(options({ collapsed: false }));
    act(() => jest.advanceTimersByTime(200));
    rerender(options());
    expect(result.current.mode).toBe('collapsed');
  });
});

describe('AutoHideBar motion', () => {
  it('fades the controls early and the summary late', () => {
    expect(interpolateStops(CONTROLS_OPACITY, 0)).toBe(1);
    expect(interpolateStops(CONTROLS_OPACITY, 0.2)).toBeCloseTo(0.45);
    expect(interpolateStops(CONTROLS_OPACITY, 0.4)).toBeCloseTo(0.15);
    expect(interpolateStops(CONTROLS_OPACITY, 0.6)).toBe(0);
    expect(interpolateStops(SUMMARY_OPACITY, 0.5)).toBe(0);
    expect(interpolateStops(SUMMARY_OPACITY, 0.75)).toBeCloseTo(0.5);
    expect(interpolateStops(SUMMARY_OPACITY, 1)).toBe(1);
  });

  it('recedes the bar to 0.94 and shrinks its band onto the strip', () => {
    const rest = autoHideBarGeometry(0, 41, 20);
    expect(rest).toEqual({
      bandTranslateY: -0,
      bandScaleY: 1,
      controlsTranslateY: -0,
      controlsScale: 1,
    });
    const done = autoHideBarGeometry(1, 41, 20);
    expect(done.controlsScale).toBeCloseTo(0.94);
    expect(done.controlsTranslateY).toBeCloseTo(-((0.06 * 41) / 2) - 3);
    // A centre-origin scale lifted by half the room puts the band on the strip.
    const bandTop = 41 / 2 - (41 * done.bandScaleY) / 2 + done.bandTranslateY;
    expect(bandTop).toBeCloseTo(0);
    expect(41 * done.bandScaleY).toBeCloseTo(20);
  });

  it('composes the opacity curve onto the CSS timing function', () => {
    const css = composedCss(AUTO_HIDE_BAR_HIDE, CONTROLS_OPACITY, 0, 1);
    expect(css.duration).toBe('150ms');
    const stops = css.easing
      .replace(/^linear\(|\)$/g, '')
      .split(',')
      .map(Number);
    // Opacity goes 1 → 0, so the browser draws 1 − easing; compare with the
    // piecewise opacity of the eased progress at each sample.
    stops.forEach((stop, index) => {
      const progress = motionProgressAt(AUTO_HIDE_BAR_HIDE, (150 * index) / (stops.length - 1));
      expect(1 - stop).toBeCloseTo(interpolateStops(CONTROLS_OPACITY, progress), 3);
    });
    const back = composedCss(AUTO_HIDE_BAR_SHOW, SUMMARY_OPACITY, 1, 0);
    expect(back.duration).toBe('200ms');
    expect(composedCss(AUTO_HIDE_BAR_SHOW, SUMMARY_OPACITY, 0, 0).easing).toMatch(/^cubic-bezier/);
  });
});
