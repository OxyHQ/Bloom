import { useCallback, useRef, useSyncExternalStore } from 'react';
import { Dimensions, Platform, type LayoutChangeEvent } from 'react-native';
import { BREAKPOINTS, type Breakpoint } from '../styles/breakpoints';

/**
 * Widths that only decide something at thresholds, read so that a resize
 * re-renders nothing until a threshold is crossed.
 *
 * A layout whose sizes follow the room is native flex: Yoga lays it out again
 * in the same pass as the window's resize, and no JavaScript runs. What React
 * decides from a width is discrete (a sidebar becoming a drawer, a second
 * column showing, the compact actions of a header), so it reads the width
 * QUANTIZED to the thresholds it compares against: the largest threshold at or
 * below the width. Every `width >= t` and `width < t` for a threshold `t`
 * answers the same as with the real width, and the value changes only when the
 * width crosses one. `useWindowDimensions` and an `onLayout` → `setState` re-render
 * on every pixel of a live resize; these never do.
 */
export function quantizeWidth(width: number, thresholds: readonly number[]): number {
  let quantized = 0;
  for (const threshold of thresholds) {
    if (threshold <= width && threshold > quantized) quantized = threshold;
  }
  return quantized;
}

/** A width that changes, read through `useSyncExternalStore`. */
interface WidthSource {
  read(): number | null;
  subscribe(listener: () => void): () => void;
}

const windowWidth: WidthSource = {
  read: () => Dimensions.get('window').width,
  subscribe(listener) {
    const subscription = Dimensions.addEventListener('change', listener);
    return () => subscription.remove();
  },
};

/** No server viewport: the first hydration render lays out as the server did. */
const serverWidth = () => 0;
const serverSize = () => '0 0';

const BREAKPOINT_WIDTHS: readonly number[] = Object.values(BREAKPOINTS);

/**
 * The window's width quantized to `thresholds` (`quantizeWidth`): re-renders
 * only when the window's width crosses one of them.
 */
export function useWindowWidthClass(thresholds: readonly number[]): number {
  return useSyncExternalStore(
    windowWidth.subscribe,
    () => quantizeWidth(windowWidth.read() ?? 0, thresholds),
    Platform.OS === 'web' ? serverWidth : () => quantizeWidth(windowWidth.read() ?? 0, thresholds),
  );
}

/**
 * The window's breakpoint tier (`BREAKPOINTS`): the largest whose min-width the
 * window reaches, or `'base'` below `sm`. Re-renders only when the window
 * crosses a breakpoint, never on every pixel of a resize as
 * `useWindowDimensions` does. For what follows the room continuously, use flex.
 */
export function useWindowBreakpoint(): Breakpoint | 'base' {
  const width = useWindowWidthClass(BREAKPOINT_WIDTHS);
  let tier: Breakpoint | 'base' = 'base';
  for (const name of Object.keys(BREAKPOINTS) as Breakpoint[]) {
    if (width >= BREAKPOINTS[name]) tier = name;
  }
  return tier;
}

/**
 * A view's own measured size, each axis quantized to its thresholds, falling
 * back to the window's until its first layout (a shell spanning the page
 * renders right on frame one; an embedded one corrects once). `onLayout` goes
 * on the measured view; it records the size and re-renders only when a
 * quantized value changes. `read()` is the last measured size, for code that
 * needs the exact numbers when it acts (a gesture starting, a measurement),
 * never for rendering.
 */
export function useMeasuredSizeClass(
  widthThresholds: readonly number[],
  heightThresholds: readonly number[] = NONE,
): {
  width: number;
  height: number;
  onLayout: (event: LayoutChangeEvent) => void;
  read: () => { width: number; height: number } | null;
} {
  const store = useRef<MeasuredStore | null>(null);
  if (store.current === null) store.current = { size: null, listeners: new Set() };
  const own = store.current;
  const subscribe = useCallback(
    (listener: () => void) => {
      own.listeners.add(listener);
      const unsubscribeWindow = windowWidth.subscribe(listener);
      return () => {
        own.listeners.delete(listener);
        unsubscribeWindow();
      };
    },
    [own],
  );
  // Both axes' classes in one snapshot, compared by value.
  const snapshot = () => {
    const size = own.size ?? Dimensions.get('window');
    return `${quantizeWidth(size.width, widthThresholds)} ${quantizeWidth(size.height, heightThresholds)}`;
  };
  const classes = useSyncExternalStore(
    subscribe,
    snapshot,
    Platform.OS === 'web' ? serverSize : snapshot,
  );
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (own.size?.width === width && own.size.height === height) return;
      own.size = { width, height };
      for (const listener of own.listeners) listener();
    },
    [own],
  );
  const read = useCallback(() => own.size, [own]);
  const [width, height] = classes.split(' ').map(Number) as [number, number];
  return { width, height, onLayout, read };
}

const NONE: readonly number[] = [];
interface MeasuredStore {
  size: { width: number; height: number } | null;
  listeners: Set<() => void>;
}

const noSubscription = () => () => {};
let lastWindow = { width: 0, height: 0 };
/** The window's size as one value that keeps its identity while the size does. */
function windowSize() {
  const { width, height } = Dimensions.get('window');
  if (lastWindow.width !== width || lastWindow.height !== height) lastWindow = { width, height };
  return lastWindow;
}
const NO_SIZE = { width: 0, height: 0 };

/**
 * The window's exact size while `active` (a surface that is open and sizes
 * itself from the window), and none, with no subscription, while it is not: a
 * closed dialog or sheet re-renders nothing as the window resizes.
 */
export function useWindowSizeWhile(active: boolean): { width: number; height: number } {
  return useSyncExternalStore(
    active ? windowWidth.subscribe : noSubscription,
    active ? windowSize : () => NO_SIZE,
    active ? windowSize : () => NO_SIZE,
  );
}
