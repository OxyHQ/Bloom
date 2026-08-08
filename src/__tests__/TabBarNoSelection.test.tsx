import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { act, render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { withSpring } from 'react-native-reanimated';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TabBar, TabBarButton } from '../tab-bar';
import { BAR_MARGIN, ROW_PAD_H } from '../tab-bar/shared';
import type { TabBarItem } from '../tab-bar/types';

/**
 * The bar with NO SELECTION: a controlled `activeIndex` that names no tab.
 *
 * Every consumer whose route set is larger than its tab set produces one — an
 * index derived from `usePathname()` is -1 on every screen that is not a tab.
 * The capsule used to slide one full item-width to the LEFT of the first tab and
 * poke out of the pill, because the bar guarded only `activeIndex === undefined`
 * and `highlightStyle` carried no opacity at all: an out-of-range index is a
 * real POSITION, not an absence.
 *
 * The distinction this file exists to protect: `activeIndex === undefined` is
 * NOT "no selection". It is the focus-driven path, where the router adapter
 * leaves the prop unset and each button supplies `isFocused` instead — that path
 * must keep highlighting exactly as it always has, which is what the last
 * describe block pins down.
 *
 * Two mocks are replaced here, both deliberately:
 *
 *  - `react-native-gesture-handler`, with a RECORDING mock (same technique as
 *    `TabBarLongPress.test.tsx`), because the shared mock discards every
 *    registered callback and the scrub worklets are the only way to reach the
 *    arming path a finger takes.
 *  - `react-native-reanimated`, wrapping the shared mock so `withSpring` is a
 *    spy. Under that mock `withSpring(x)` and a bare assignment of `x` both
 *    settle to `x` instantly, so the RESULT cannot distinguish "appeared at the
 *    target" from "slid to it" — whether a spring was started is the only
 *    observable difference left in jest. The motion itself is verified in a
 *    browser.
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
 * Where the capsule sits for a given tab, from the same geometry the bar uses
 * (window width as the react-native mock reports it, expanded — progress 0 — so
 * no minimize inset applies).
 */
const ITEM_WIDTH =
  (Dimensions.get('window').width - BAR_MARGIN * 2 - ROW_PAD_H * 2) / ITEMS.length;
const translateXFor = (index: number) => ROW_PAD_H + ITEM_WIDTH * index;

/** Touch x positions inside the bar, named by the tab they land on. */
const NEAR_LEFT_EDGE = 8;
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

/** Every node painted with the bar's highlight color — the sliding capsule. */
function highlights(root: ReactTestInstance): Record<string, unknown>[] {
  return root
    .findAll((node) => hostName(node) !== null)
    .map((node) => flattenStyle(node.props?.style))
    .filter((style) => style.backgroundColor === HIGHLIGHT);
}

function highlight(root: ReactTestInstance): Record<string, unknown> {
  const found = highlights(root);
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

/**
 * The opacity of each tab's ACTIVE crossfade layer, in bar order — the layer
 * `activeGlyphStyle` drives. Identified by the shape of its style: the only
 * absolutely-positioned, centering, opacity-carrying animated view in the tree.
 */
function activeGlyphOpacities(root: ReactTestInstance): number[] {
  return root
    .findAll((node) => hostName(node) === 'Animated.View')
    .map((node) => flattenStyle(node.props?.style))
    .filter(
      (style) =>
        style.position === 'absolute' &&
        style.alignItems === 'center' &&
        style.justifyContent === 'center' &&
        typeof style.opacity === 'number',
    )
    .map((style) => style.opacity as number);
}

/** The color of every tab label, in bar order. */
function labelColors(root: ReactTestInstance): unknown[] {
  return root
    .findAll((node) => hostName(node) === 'Animated.Text')
    .map((node) => flattenStyle(node.props?.style).color);
}

function selectedFlags(root: ReactTestInstance): boolean[] {
  return root
    .findAll((node) => hostName(node) !== null && node.props?.accessibilityRole === 'tab')
    // `aria-selected` is the spelling both platforms read — see the same
    // helper in `TabBar.test.tsx`.
    .map((node) => node.props['aria-selected']);
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
  onIndexChange?: (index: number) => void;
  /** When set, drives the FOCUS path (`isFocused`) instead of `activeIndex`. */
  focusedIndex?: number;
};

function Bar({ activeIndex, onIndexChange, focusedIndex }: BarProps) {
  return (
    <TabBar
      activeIndex={activeIndex}
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
 * Mount the bar and drive its controlled index.
 *
 * The reanimated mock's shared values are plain boxes and `useAnimatedStyle`
 * runs during render, so a mapper reading a value an EFFECT wrote reflects it
 * only on the NEXT render — every state change is therefore followed by a
 * repaint. React bails out of a referentially identical element, so each pass
 * builds a fresh one.
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

describe('TabBar with no selection', () => {
  it('finds exactly one highlight to assert on (guards against a vacuous pass)', () => {
    expect(highlights(mountBar({ activeIndex: 0 }).root)).toHaveLength(1);
  });

  it.each([
    ['does not flash the highlight when it mounts with nothing selected', -1, 0],
    ['shows it on the very first frame when it mounts with a selection', 0, 1],
  ])('%s', (_case, activeIndex, opacity) => {
    // The FIRST render pass is the only place jest can see the value the
    // highlight is seeded with: the reanimated mock resolves `withTiming`
    // instantly and writing a shared value does not re-render, so any repaint
    // from here on reports what the mount effect wrote instead. Rendering once
    // is the point — do not add a repaint.
    const utils = render(withTheme(<Bar activeIndex={activeIndex} />));
    expect(highlight(utils.UNSAFE_root).opacity).toBe(opacity);
  });

  it('shows the highlight for every index that names a tab', () => {
    for (const activeIndex of [0, 1, 2]) {
      const bar = mountBar({ activeIndex });
      expect(highlight(bar.root).opacity).toBe(1);
      expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(activeIndex));
    }
  });

  it.each([
    ['negative', -1],
    ['past the last tab', 3],
    ['far past the last tab', 99],
    ['fractional', 1.5],
    ['not a number at all', Number.NaN],
  ])('hides the highlight when activeIndex is %s', (_case, activeIndex) => {
    expect(highlight(mountBar({ activeIndex }).root).opacity).toBe(0);
  });

  it('leaves no glyph and no label tinted active', () => {
    // A capsule that is gone but a tab still lit is the same bug wearing a
    // different hat: `activeGlyphStyle` derives from the distance to
    // `slideIndex`, so freezing the position alone would keep the last tab
    // looking selected.
    const bar = mountBar({ activeIndex: 2 });
    expect(activeGlyphOpacities(bar.root)).toEqual([0, 0, 1]);
    expect(labelColors(bar.root)).toEqual([INACTIVE, INACTIVE, ACTIVE]);

    bar.set({ activeIndex: -1 });

    expect(activeGlyphOpacities(bar.root)).toEqual([0, 0, 0]);
    expect(labelColors(bar.root)).toEqual([INACTIVE, INACTIVE, INACTIVE]);
  });

  it('marks no tab selected for accessibility', () => {
    expect(selectedFlags(mountBar({ activeIndex: -1 }).root)).toEqual([false, false, false]);
  });

  it('fades out in place, without moving the capsule', () => {
    // Animating the position to a sentinel instead would drag the capsule the
    // length of the bar on its way out, which reads as a glitch rather than as
    // a dismissal.
    const bar = mountBar({ activeIndex: 2 });
    const before = translateXOf(highlight(bar.root));

    bar.set({ activeIndex: -1 });

    expect(translateXOf(highlight(bar.root))).toBe(before);
    expect(highlight(bar.root).opacity).toBe(0);
  });

  it('appears at the new tab instead of sliding to it', () => {
    // Coming back from hidden there is no position the user has seen to slide
    // FROM, and a spring across the bar would light up every tab it passed.
    const bar = mountBar({ activeIndex: 2 });
    bar.set({ activeIndex: -1 });
    springs.mockClear();

    bar.set({ activeIndex: 0 });

    expect(springs).not.toHaveBeenCalled();
    expect(highlight(bar.root).opacity).toBe(1);
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(0));
  });

  it('still slides between two tabs that are both selected', () => {
    // The contrast that keeps the test above honest: a spring IS started when
    // the capsule was on screen the whole time.
    const bar = mountBar({ activeIndex: 2 });
    springs.mockClear();

    bar.set({ activeIndex: 0 });

    expect(springs).toHaveBeenCalledWith(0, expect.anything());
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(0));
  });

  it('arms the highlight under the finger when a scrub starts from nowhere', () => {
    const onIndexChange = jest.fn();
    const bar = mountBar({ activeIndex: -1, onIndexChange });
    expect(highlight(bar.root).opacity).toBe(0);

    act(() => {
      member('Pan').start?.({ x: NEAR_RIGHT_EDGE });
    });
    bar.paint();

    expect(highlight(bar.root).opacity).toBe(1);
    // Under the finger, not at the stale index it faded out on — which would
    // also fire the first boundary tick against a phantom position.
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(2));
  });

  it('selects on release from a scrub that started with nothing selected', () => {
    const onIndexChange = jest.fn();
    const bar = mountBar({ activeIndex: -1, onIndexChange });

    act(() => {
      member('Pan').start?.({ x: NEAR_RIGHT_EDGE });
      member('Pan').update?.({ x: NEAR_LEFT_EDGE });
      member('Pan').finalize?.();
    });

    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it('arms the highlight on a tap made with nothing selected', () => {
    const onIndexChange = jest.fn();
    const bar = mountBar({ activeIndex: -1, onIndexChange });

    act(() => {
      member('Tap').end?.({ x: NEAR_RIGHT_EDGE }, true);
    });
    bar.paint();

    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(highlight(bar.root).opacity).toBe(1);
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(2));
  });
});

describe('TabBar focus-driven path (no activeIndex at all)', () => {
  /**
   * The regression this whole change is most dangerous to. Omitting
   * `activeIndex` is the router adapter's contract, NOT an absent selection: the
   * bar is not the writer, each button drives the highlight from its own
   * `isFocused`. Treating it as "no selection" would leave every adapter
   * consumer with an invisible highlight — and nothing else in the suite would
   * notice, because the capsule would still be in the right PLACE.
   */
  it('still shows the highlight, on the focused tab', () => {
    const bar = mountBar({ focusedIndex: 2 });
    expect(highlight(bar.root).opacity).toBe(1);
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(2));
  });

  it('still tints the focused tab, and only that one', () => {
    const bar = mountBar({ focusedIndex: 1 });
    expect(activeGlyphOpacities(bar.root)).toEqual([0, 1, 0]);
    expect(labelColors(bar.root)).toEqual([INACTIVE, ACTIVE, INACTIVE]);
  });

  it('still follows focus as it moves', () => {
    const bar = mountBar({ focusedIndex: 0 });
    bar.set({ focusedIndex: 2 });
    expect(highlight(bar.root).opacity).toBe(1);
    expect(translateXOf(highlight(bar.root))).toBeCloseTo(translateXFor(2));
  });
});
