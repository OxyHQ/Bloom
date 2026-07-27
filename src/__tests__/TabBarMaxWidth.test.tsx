import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TabBar, TabBarButton, TabBarMinimizeProvider, useMinimizeState } from '../tab-bar';
import type { MinimizeState } from '../tab-bar/minimize-context';
import { BAR_MARGIN, MINIMIZED_INSET, ROW_PAD_H } from '../tab-bar/shared';
import type { TabBarItem } from '../tab-bar/types';

/**
 * `maxWidth` — constraining the pill on a tablet, and keeping every piece of
 * geometry on the SAME width while doing it.
 *
 * Unconstrained, the bar spans the window: 810pt at iPad 11" portrait, 1342pt
 * in landscape, 21pt glyphs adrift in cells hundreds of points wide. A consumer
 * cannot fix that from the outside, and the reason is what this file is really
 * about: narrowing the bar with a `style` override moves the PIXELS only, while
 * the highlight's width, its `translateX` and the tap/scrub hit-testing all keep
 * dividing the WINDOW width by the tab count. The highlight then sits under one
 * tab and a tap at the same point selects another.
 *
 * So the load-bearing test here is not "the bar got narrower" — it is that a tap
 * at the centre of the slot the RENDERED highlight occupies selects that slot's
 * tab, with the item width read back out of the rendered highlight rather than
 * recomputed by the test. Layout and hit-testing are asserted against each
 * other; nothing but agreement between the two can make it pass.
 *
 * Two pieces of the environment are replaced to get there:
 *
 *  1. `useWindowDimensions`, so the window is a tablet's rather than the 375pt
 *     the react-native mock reports — with a 375pt window every plausible
 *     `maxWidth` is inert and the prop could never be exercised.
 *  2. `react-native-gesture-handler`, with the same RECORDING mock
 *     `TabBarLongPress.test.tsx` uses: the shared mock discards every registered
 *     callback, and the bar's gesture detector is the only path a real tap takes
 *     (it consumes the touches, which is what makes scrubbing possible).
 */

/** iPad 11" portrait, the window that produced the report. */
const TABLET_WIDTH = 1024;
/** Must be `mock`-prefixed to be readable from the hoisted factory below. */
let mockWindowWidth = TABLET_WIDTH;

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    useWindowDimensions: () => ({
      width: mockWindowWidth,
      height: 1366,
      scale: 2,
      fontScale: 1,
    }),
  };
});

interface MockGestureEvent {
  x: number;
}

interface MockGesture {
  kind: string;
  start?: (event: MockGestureEvent) => void;
  update?: (event: MockGestureEvent) => void;
  end?: (event: MockGestureEvent, success: boolean) => void;
  finalize?: () => void;
  /** Members of a composed `Gesture.Race(…)`; empty for a leaf gesture. */
  members: MockGesture[];
  activeOffsetX: (range: number[]) => MockGesture;
  failOffsetY: (range: number[]) => MockGesture;
  maxDistance: (px: number) => MockGesture;
  maxDuration: (ms: number) => MockGesture;
  minDuration: (ms: number) => MockGesture;
  onStart: (worklet: (event: MockGestureEvent) => void) => MockGesture;
  onUpdate: (worklet: (event: MockGestureEvent) => void) => MockGesture;
  onEnd: (worklet: (event: MockGestureEvent, success: boolean) => void) => MockGesture;
  onFinalize: (worklet: () => void) => MockGesture;
}

const mockGestures: MockGesture[] = [];

jest.mock('react-native-gesture-handler', () => {
  const build = (kind: string): MockGesture => {
    const gesture: MockGesture = {
      kind,
      members: [],
      activeOffsetX: () => gesture,
      failOffsetY: () => gesture,
      maxDistance: () => gesture,
      maxDuration: () => gesture,
      minDuration: () => gesture,
      onStart: (worklet) => {
        gesture.start = worklet;
        return gesture;
      },
      onUpdate: (worklet) => {
        gesture.update = worklet;
        return gesture;
      },
      onEnd: (worklet) => {
        gesture.end = worklet;
        return gesture;
      },
      onFinalize: (worklet) => {
        gesture.finalize = worklet;
        return gesture;
      },
    };
    mockGestures.push(gesture);
    return gesture;
  };

  return {
    Gesture: {
      Pan: () => build('Pan'),
      Tap: () => build('Tap'),
      LongPress: () => build('LongPress'),
      Race: (...members: MockGesture[]) => {
        const race = build('Race');
        race.members.push(...members);
        return race;
      },
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
  };
});

const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: null },
  { name: 'search', label: 'Search', icon: null },
  { name: 'you', label: 'You', icon: null },
];

/** Comfortably narrower than the tablet window, so the constraint binds. */
const MAX_WIDTH = 480;

/** Captures the shared minimize progress so a test can drive the bar minimized. */
function MinimizeProbe({ onState }: { onState: (state: MinimizeState) => void }) {
  onState(useMinimizeState());
  return null;
}

function Tree({
  maxWidth,
  onIndexChange,
  onState,
}: {
  maxWidth?: number;
  onIndexChange?: (index: number) => void;
  onState?: (state: MinimizeState) => void;
}) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <TabBarMinimizeProvider>
        {onState ? <MinimizeProbe onState={onState} /> : null}
        <TabBar activeIndex={0} maxWidth={maxWidth} onIndexChange={onIndexChange}>
          {ITEMS.map((item, index) => (
            <TabBarButton key={item.name} item={item} index={index} />
          ))}
        </TabBar>
      </TabBarMinimizeProvider>
    </BloomThemeProvider>
  );
}

function renderBar(props: {
  maxWidth?: number;
  onIndexChange?: (index: number) => void;
  onState?: (state: MinimizeState) => void;
}) {
  const utils = render(<Tree {...props} />);
  return { ...utils, resettle: () => utils.rerender(<Tree {...props} />) };
}

function flattenStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.assign(out, value);
  };
  visit(style);
  return out;
}

/** Flattened style of the one node matching `match`, which must be unique. */
function styleOf(
  root: ReactTestInstance,
  match: (style: Record<string, unknown>) => boolean,
  what: string,
): Record<string, unknown> {
  const found = root
    .findAll((node) => typeof node.type === 'string')
    .map((node) => flattenStyle(node.props.style))
    .filter(match);
  if (found.length !== 1) throw new Error(`Expected exactly one ${what}, found ${found.length}`);
  return found[0] as Record<string, unknown>;
}

/** `styles.barWrap` — the box the pill's animated margins are applied inside. */
function wrapStyle(root: ReactTestInstance): Record<string, unknown> {
  return styleOf(root, (style) => style.marginHorizontal === BAR_MARGIN, 'bar wrap');
}

/**
 * The sliding highlight. The capsule surface also carries
 * `borderCurve: 'continuous'`, but it is an `absoluteFill` with no width of its
 * own — the width IS the highlight's geometry, which is what this reads.
 */
function highlightStyle(root: ReactTestInstance): Record<string, unknown> {
  return styleOf(
    root,
    (style) => style.borderCurve === 'continuous' && typeof style.width === 'number',
    'highlight',
  );
}

/** The item width the bar ACTUALLY rendered, read back off the highlight. */
function renderedItemWidth(root: ReactTestInstance): number {
  const width = highlightStyle(root).width;
  if (typeof width !== 'number') throw new Error('The highlight rendered no numeric width');
  return width;
}

/** Centre of tab `index`, in the pill's own coordinates (what `event.x` uses). */
function centreOf(index: number, itemWidth: number): number {
  return ROW_PAD_H + (index + 0.5) * itemWidth;
}

/** The gesture the detector was given — the last race constructed. */
function member(kind: string): MockGesture {
  const race = mockGestures.filter((gesture) => gesture.kind === 'Race').pop();
  if (!race) throw new Error('The bar composed no gesture race');
  const found = race.members.find((gesture) => gesture.kind === kind);
  if (!found) throw new Error(`No ${kind} gesture in the bar's race`);
  return found;
}

/** A tap that succeeded at `x`, measured from the pill's left edge. */
function tapAt(x: number) {
  act(() => {
    member('Tap').end?.({ x }, true);
  });
}

/** Scrub to `x` and release there — the other path through `indexAtX`. */
function scrubTo(x: number) {
  act(() => {
    member('Pan').start?.({ x });
    member('Pan').update?.({ x });
    member('Pan').finalize?.();
  });
}

beforeEach(() => {
  mockGestures.length = 0;
  mockWindowWidth = TABLET_WIDTH;
});

describe('TabBar maxWidth', () => {
  describe('layout', () => {
    it('leaves the wrap unconstrained when the prop is omitted', () => {
      // No default: an existing consumer's bar must be the same bar, so the wrap
      // keeps stretching to the full window rather than acquiring a width.
      const style = wrapStyle(renderBar({}).UNSAFE_root);
      expect(style.width).toBeUndefined();
      expect(style.alignSelf).toBeUndefined();
    });

    it('constrains the wrap and centres it', () => {
      const style = wrapStyle(renderBar({ maxWidth: MAX_WIDTH }).UNSAFE_root);
      expect(style.width).toBe(MAX_WIDTH);
      // Centring is static and belongs to the WRAP; the minimize inset stays an
      // animated pair of equal margins on the pill inside it.
      expect(style.alignSelf).toBe('center');
    });

    it('is a ceiling, never a floor', () => {
      // A phone narrower than the value keeps the full-bleed bar, so one value
      // can be passed unconditionally from a shared tab layout.
      mockWindowWidth = 375;
      const style = wrapStyle(renderBar({ maxWidth: MAX_WIDTH }).UNSAFE_root);
      expect(style.width).toBe(375 - BAR_MARGIN * 2);
    });

    it('never lets the bar exceed the window', () => {
      mockWindowWidth = 900;
      const style = wrapStyle(renderBar({ maxWidth: 4000 }).UNSAFE_root);
      expect(style.width).toBe(900 - BAR_MARGIN * 2);
    });
  });

  describe('geometry', () => {
    it('sizes the highlight from the constrained width, not the window', () => {
      const { UNSAFE_root } = renderBar({ maxWidth: MAX_WIDTH });
      expect(renderedItemWidth(UNSAFE_root)).toBeCloseTo((MAX_WIDTH - ROW_PAD_H * 2) / 3, 5);
    });

    it('sizes it from the window when the prop is omitted', () => {
      const { UNSAFE_root } = renderBar({});
      const available = TABLET_WIDTH - BAR_MARGIN * 2;
      expect(renderedItemWidth(UNSAFE_root)).toBeCloseTo((available - ROW_PAD_H * 2) / 3, 5);
    });

    it('a tap lands on the tab it is visibly over', () => {
      // THE test this prop exists for. The item width comes from the highlight
      // the bar actually rendered, so this asserts layout and hit-testing
      // against each other: derive either one from a different width and the
      // centre of a rendered slot resolves to a different tab.
      const onIndexChange = jest.fn();
      const { UNSAFE_root } = renderBar({ maxWidth: MAX_WIDTH, onIndexChange });
      const itemWidth = renderedItemWidth(UNSAFE_root);

      for (const index of ITEMS.map((_item, i) => i)) tapAt(centreOf(index, itemWidth));

      expect(onIndexChange.mock.calls).toEqual([[0], [1], [2]]);
    });

    it('resolves the far right of the constrained pill to the LAST tab', () => {
      // The same failure stated as a single number, so what regresses is legible
      // in the diff: at 1024pt the unconstrained geometry makes each tab 330.7pt
      // wide, and 479 is only 1.4 of those from the left — the middle tab.
      const onIndexChange = jest.fn();
      renderBar({ maxWidth: MAX_WIDTH, onIndexChange });

      tapAt(MAX_WIDTH - 1);

      expect(onIndexChange).toHaveBeenCalledWith(ITEMS.length - 1);
    });

    it('resolves the far left to the FIRST tab', () => {
      const onIndexChange = jest.fn();
      renderBar({ maxWidth: MAX_WIDTH, onIndexChange });

      tapAt(1);

      expect(onIndexChange).toHaveBeenCalledWith(0);
    });

    it('scrubs to the same tabs a tap would', () => {
      // Pan, tap and long press share one `indexAtX` worklet; the scrub is the
      // path that would drag the highlight visibly past the end of a
      // window-width bar.
      const onIndexChange = jest.fn();
      const { UNSAFE_root } = renderBar({ maxWidth: MAX_WIDTH, onIndexChange });
      const itemWidth = renderedItemWidth(UNSAFE_root);

      for (const index of ITEMS.map((_item, i) => i)) scrubTo(centreOf(index, itemWidth));

      expect(onIndexChange.mock.calls).toEqual([[0], [1], [2]]);
    });
  });

  describe('composed with the minimize inset', () => {
    /** Render constrained, drive the bar fully minimized, settle the mappers. */
    function renderMinimized() {
      let state: MinimizeState | undefined;
      const onIndexChange = jest.fn();
      const utils = renderBar({
        maxWidth: MAX_WIDTH,
        onIndexChange,
        onState: (value) => {
          state = value;
        },
      });
      if (!state) throw new Error('MinimizeProbe never ran');
      // The reanimated mock's shared values are plain boxes: a write is only
      // visible to `useAnimatedStyle` on the NEXT render.
      const progress = state.progress;
      act(() => {
        progress.value = 1;
      });
      utils.resettle();
      return { ...utils, onIndexChange };
    }

    it('shrinks the pill by the inset on BOTH sides of the constrained width', () => {
      const { UNSAFE_root } = renderMinimized();
      const barWidth = MAX_WIDTH - MINIMIZED_INSET * 2;
      expect(renderedItemWidth(UNSAFE_root)).toBeCloseTo((barWidth - ROW_PAD_H * 2) / 3, 5);
    });

    it('still lands a tap on the tab it is visibly over', () => {
      // Centring (static, on the wrap) and the inset (animated, on the pill)
      // compose: equal margins keep the pill centred inside the constrained
      // wrap, and `event.x` stays relative to the pill, so the same geometry
      // holds at both ends of the minimize animation.
      const { UNSAFE_root, onIndexChange } = renderMinimized();
      const itemWidth = renderedItemWidth(UNSAFE_root);

      for (const index of ITEMS.map((_item, i) => i)) tapAt(centreOf(index, itemWidth));

      expect(onIndexChange.mock.calls).toEqual([[0], [1], [2]]);
    });
  });

  it('leaves the blur band full-bleed', () => {
    // The band is the screen-edge scrim content dissolves into, not part of the
    // pill — constraining it would leave a floating blurred rectangle.
    const { UNSAFE_root } = renderBar({ maxWidth: MAX_WIDTH });
    // The band's own root, not one of the ten layers inside it: only the root
    // is the `pointerEvents: 'none'` box that the bar sizes.
    const band = styleOf(
      UNSAFE_root,
      (style) => style.pointerEvents === 'none' && typeof style.height === 'number',
      'blur band',
    );
    expect(band.left).toBe(0);
    expect(band.right).toBe(0);
    expect(band.width).toBeUndefined();
  });
});
