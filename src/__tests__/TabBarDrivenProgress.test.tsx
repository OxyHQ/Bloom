import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { act, render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { makeMutable, withSpring } from 'react-native-reanimated';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TabBar, TabBarButton } from '../tab-bar';
import { BAR_MARGIN, ROW_PAD_H } from '../tab-bar/shared';
import type { TabBarItem } from '../tab-bar/types';

/**
 * The DRIVEN path: `activeProgress`, a shared value a pager writes every frame
 * so the highlight tracks the finger instead of springing to a settled index
 * after the navigation commits.
 *
 * What this file is FOR is the precedence, not the motion. A shared value with
 * more than one writer is a race, and this path adds a fifth writer to
 * `slideIndex` — the controlled effect, the focus effect, a button's press, the
 * bar's own tap and now the driver. The rule is that the driver wins over every
 * DISCRETE writer and loses to the SCRUB, and each assertion below names one of
 * them standing down.
 *
 * WHAT JEST CANNOT SEE HERE, stated plainly: the transport. Under the shared
 * reanimated mock a mapper (and this repo's `useAnimatedReaction`) is
 * render-driven — there is no UI thread, so a `.value` written by a gesture
 * worklet with no accompanying render is invisible. So "the highlight follows
 * the finger at 60fps" is not asserted anywhere; it is a device and a browser
 * question. What IS asserted is that the driver's value REACHES `slideIndex`,
 * and that nothing else overwrites it.
 *
 * Two mocks are replaced, both for the same reasons as
 * `TabBarNoSelection.test.tsx`:
 *
 *  - `react-native-gesture-handler`, with a RECORDING mock, because the shared
 *    mock discards every registered callback and the scrub worklets are the
 *    only way to reach a real finger's path.
 *  - `react-native-reanimated`, wrapping the shared mock so `withSpring` is a
 *    spy. Under that mock `withSpring(x)` and a bare assignment of `x` both
 *    settle to `x` instantly, so the RESULT cannot distinguish "was sprung" from
 *    "was assigned" — whether a spring was STARTED is the only observable
 *    difference left, and "no spring was started" is exactly what a writer
 *    standing down looks like.
 */

interface MockGestureEvent {
  x: number;
}

interface MockGesture {
  kind: string;
  start?: (event: MockGestureEvent) => void;
  update?: (event: MockGestureEvent) => void;
  end?: (event: MockGestureEvent, success: boolean) => void;
  finalize?: () => void;
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

// Must be `mock`-prefixed so the hoisted `jest.mock` factory may reference it.
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

jest.mock('react-native-reanimated', () => {
  const actual =
    jest.requireActual<typeof import('react-native-reanimated')>('react-native-reanimated');
  // `__esModule` is non-enumerable on the module object, so a spread drops it —
  // without it the default export (`Animated.View`) would arrive wrapped.
  return { __esModule: true, ...actual, withSpring: jest.fn(actual.withSpring) };
});

const springs = jest.mocked(withSpring);

const HIGHLIGHT = 'rgb(9 9 9)';
const ACTIVE = 'rgb(1 1 1)';
const INACTIVE = 'rgb(2 2 2)';

const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: null },
  { name: 'search', label: 'Search', icon: null },
  { name: 'you', label: 'You', icon: null },
];

/**
 * Where the capsule sits for a given position in TAB UNITS, from the same
 * geometry the bar uses (window width as the react-native mock reports it,
 * expanded — progress 0 — so no minimize inset applies). Fractional on purpose:
 * a driven position between two tabs is the whole point of the path.
 */
const ITEM_WIDTH =
  (Dimensions.get('window').width - BAR_MARGIN * 2 - ROW_PAD_H * 2) / ITEMS.length;
const translateXFor = (position: number) => ROW_PAD_H + ITEM_WIDTH * position;

/** A touch x that lands on the last tab — used to drive the scrub worklets. */
const NEAR_RIGHT_EDGE = 340;

function withTheme(ui: React.ReactElement) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>
  );
}

function hostName(node: ReactTestInstance): string | null {
  const { type } = node;
  return typeof type === 'string' ? type : null;
}

function flattenStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (s: unknown): void => {
    if (Array.isArray(s)) s.forEach(visit);
    else if (s && typeof s === 'object') Object.assign(out, s);
  };
  visit(style);
  return out;
}

/** The sliding capsule — the only node painted with the bar's highlight color. */
function highlight(root: ReactTestInstance): Record<string, unknown> {
  const found = root
    .findAll((node) => hostName(node) !== null)
    .map((node) => flattenStyle(node.props?.style))
    .filter((style) => style.backgroundColor === HIGHLIGHT);
  if (found.length !== 1) throw new Error(`Expected one highlight, found ${found.length}`);
  return found[0] as Record<string, unknown>;
}

function translateXOf(style: Record<string, unknown>): number {
  const transform = style.transform;
  if (!Array.isArray(transform)) throw new Error('The highlight carries no transform');
  const entry = transform.find(
    (item): item is { translateX: number } =>
      typeof item === 'object' && item !== null && 'translateX' in item,
  );
  if (!entry) throw new Error('The highlight transform has no translateX');
  return entry.translateX;
}

/** The gesture the detector was actually given — the last race constructed. */
function member(kind: string): MockGesture {
  const races = mockGestures.filter((gesture) => gesture.kind === 'Race');
  const last = races[races.length - 1];
  if (!last) throw new Error('The bar composed no gesture race');
  const found = last.members.find((gesture) => gesture.kind === kind);
  if (!found) throw new Error(`No ${kind} gesture in the bar's race`);
  return found;
}

type BarProps = {
  activeIndex?: number;
  activeProgress?: { value: number };
  onIndexChange?: (index: number) => void;
  /** When set, drives the FOCUS path (`isFocused`) instead of `activeIndex`. */
  focusedIndex?: number;
};

function Bar({ activeIndex, activeProgress, onIndexChange, focusedIndex }: BarProps) {
  return (
    <TabBar
      activeIndex={activeIndex}
      // The prop's type is reanimated's `SharedValue`; the mock's box is
      // structurally the `.value` half of it, which is all the bar touches.
      activeProgress={activeProgress as never}
      onIndexChange={onIndexChange}
      theme={{ highlight: HIGHLIGHT, activeTint: ACTIVE, inactiveTint: INACTIVE }}
    >
      {ITEMS.map((item, index) => (
        <TabBarButton
          key={item.name}
          item={item}
          index={index}
          isFocused={focusedIndex === undefined ? undefined : focusedIndex === index}
        />
      ))}
    </TabBar>
  );
}

/**
 * Mount the bar and drive its props.
 *
 * The reanimated mock's shared values are plain boxes and both
 * `useAnimatedStyle` and `useAnimatedReaction` run during render, so a mapper
 * reading a value an EFFECT, a GESTURE or a driver wrote reflects it only on the
 * NEXT render — every change is therefore followed by a repaint. React bails out
 * of a referentially identical element, so each pass builds a fresh one. Same
 * helper, for the same reason, as `TabBarNoSelection.test.tsx`.
 */
function mountBar(props: BarProps = {}) {
  let current = props;
  const utils = render(withTheme(<Bar {...current} />));
  const paint = () => utils.rerender(withTheme(<Bar {...current} />));
  paint();
  return {
    root: utils.UNSAFE_root,
    paint,
    set(next: BarProps) {
      current = { ...current, ...next };
      utils.rerender(withTheme(<Bar {...current} />));
      paint();
    },
  };
}

beforeEach(() => {
  mockGestures.length = 0;
  springs.mockClear();
});

describe('the driven path places the highlight', () => {
  it('finds exactly one highlight to assert on (guards against a vacuous pass)', () => {
    const bar = mountBar({ activeIndex: 0, activeProgress: makeMutable(0) });
    expect(() => highlight(bar.root)).not.toThrow();
  });

  it('seeds the capsule from the driver on the very first frame', () => {
    const bar = mountBar({ activeIndex: 2, activeProgress: makeMutable(2) });

    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(2));
  });

  it('sits BETWEEN two tabs at a fractional position', () => {
    // The position an in-flight page swipe produces, and the one the controlled
    // path cannot express: there a fractional `activeIndex` means NO SELECTION
    // (see `TabBarNoSelection.test.tsx`), so the capsule would be gone rather
    // than halfway.
    const bar = mountBar({ activeIndex: 0, activeProgress: makeMutable(0.5) });

    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(0.5));
    expect(highlight(bar.root).opacity).toBe(1);
  });

  it('follows the driver when its value moves', () => {
    const progress = makeMutable(0);
    const bar = mountBar({ activeIndex: 0, activeProgress: progress });
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(0));

    // The pager's own write. On a device this alone moves the pixels, with no
    // React involved; the repaint is how this mock is made to observe it (see
    // the header) and is NOT part of the contract.
    act(() => {
      progress.value = 1.25;
    });
    bar.paint();

    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(1.25));
  });
});

describe('the driven path owns the position and nothing else', () => {
  it('leaves selection with `activeIndex`: an index naming no tab still hides it', () => {
    // The division the prop's doc draws — this value says WHERE, `activeIndex`
    // says WHETHER. A screen that is not a tab passes -1 and must lose the
    // capsule even though the driver still reports a real position.
    const progress = makeMutable(1);
    const bar = mountBar({ activeIndex: 1, activeProgress: progress });
    expect(highlight(bar.root).opacity).toBe(1);

    bar.set({ activeIndex: -1 });

    expect(highlight(bar.root).opacity).toBe(0);
    // Faded out WHERE IT STANDS: the driver keeps reporting tab 1 and the
    // capsule must not travel anywhere on its way out.
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(1));
  });

  it('does not let the controlled effect spring the capsule', () => {
    const progress = makeMutable(0);
    const bar = mountBar({ activeIndex: 0, activeProgress: progress });
    springs.mockClear();

    // A commit the consumer has not yet reflected in its driver — the exact
    // interleaving a pager produces, since the route settles before the settle
    // animation finishes. The capsule must stay with the driver.
    bar.set({ activeIndex: 2 });

    expect(springs).not.toHaveBeenCalled();
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(0));
  });

  it('does not let a focused button spring the capsule', () => {
    const progress = makeMutable(0);
    const bar = mountBar({ focusedIndex: 0, activeProgress: progress });
    springs.mockClear();

    bar.set({ focusedIndex: 2 });

    expect(springs).not.toHaveBeenCalled();
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(0));
  });

  it("does not let the bar's own tap spring the capsule, but still selects", () => {
    const progress = makeMutable(0);
    const onIndexChange = jest.fn();
    const bar = mountBar({ activeIndex: 0, activeProgress: progress, onIndexChange });
    springs.mockClear();

    act(() => {
      member('Tap').end?.({ x: NEAR_RIGHT_EDGE }, true);
    });
    bar.paint();

    // The selection is reported — a tap on a driven bar is still a request for
    // that tab; it is the MOTION that belongs to the driver.
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(springs).not.toHaveBeenCalled();
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(0));
  });
});

describe('the scrub is the one writer the driver does not displace', () => {
  it('tracks the finger while dragging and springs on release', () => {
    const progress = makeMutable(0);
    const onIndexChange = jest.fn();
    const bar = mountBar({ activeIndex: 0, activeProgress: progress, onIndexChange });
    springs.mockClear();

    const pan = member('Pan');
    act(() => {
      pan.start?.({ x: NEAR_RIGHT_EDGE });
      pan.update?.({ x: NEAR_RIGHT_EDGE });
    });
    bar.paint();

    // A finger on the BAR is a direct manipulation of the bar, not a request
    // for a page, so it overwrites the driver's position while it is down —
    // and the repaint above, which re-runs the copier, must not take it back.
    expect(translateXOf(highlight(bar.root))).toBeGreaterThan(translateXFor(0));

    act(() => {
      pan.finalize?.();
    });

    expect(springs).toHaveBeenCalled();
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });
});

describe('without the prop nothing changes', () => {
  it('the controlled path still springs the capsule to a new index', () => {
    const bar = mountBar({ activeIndex: 0 });
    springs.mockClear();

    bar.set({ activeIndex: 2 });

    expect(springs).toHaveBeenCalledWith(2, expect.anything());
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(2));
  });

  it('the focus-driven path still springs the capsule to the focused tab', () => {
    const bar = mountBar({ focusedIndex: 0 });
    springs.mockClear();

    bar.set({ focusedIndex: 2 });

    expect(springs).toHaveBeenCalledWith(2, expect.anything());
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(2));
  });
});
