import React from 'react';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TabBar, TabBarButton } from '../tab-bar';
import type { TabBarItem } from '../tab-bar/types';

/**
 * `onIndexLongPress` — the bar's only reachable long press.
 *
 * `TabBarButtonProps extends PressableProps`, so a consumer's `onLongPress`
 * type-checks and silently does nothing: the bar's `GestureDetector` consumes
 * the touches (that is what makes scrubbing possible), so the inner `Pressable`
 * only ever fires for assistive technology and keyboard activation. A real held
 * finger fails the tap gesture at 400ms, never activates the pan, and dies in
 * `onFinalize`'s early return. The gesture below is the only path in.
 *
 * Like `BottomSheetGesture.test.tsx`, this file replaces the shared
 * gesture-handler mock (which discards every registered callback) with a
 * RECORDING one, so the gestures the bar builds can be inspected and their
 * worklets invoked directly. What that CAN prove: which gestures are composed
 * into the race, the duration windows they are configured with, and that the
 * long-press worklet resolves the same index from the same x as the tap
 * worklet. What it cannot prove is gesture-handler's own arbitration — that a
 * held finger really reaches this handler on a device. The 400ms/500ms split
 * asserted below is what makes that arbitration decidable rather than a race,
 * and the behaviour itself is verified on a real build.
 */

interface MockGestureEvent {
  x: number;
}

interface MockGesture {
  kind: string;
  /** Values captured from the builder chain. */
  minDurationMs?: number;
  maxDurationMs?: number;
  /** Worklets captured from the builder chain. */
  start?: (event: MockGestureEvent) => void;
  update?: (event: MockGestureEvent) => void;
  end?: (event: MockGestureEvent, success: boolean) => void;
  /** Members of a composed `Gesture.Race(…)`; empty for a leaf gesture. */
  members: MockGesture[];
  /** Builder chain — every method returns the same object. */
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

// Every gesture built since the last reset. Must be `mock`-prefixed so the
// hoisted `jest.mock` factory may reference it.
const mockGestures: MockGesture[] = [];

jest.mock('react-native-gesture-handler', () => {
  const build = (kind: string): MockGesture => {
    const gesture: MockGesture = {
      kind,
      members: [],
      activeOffsetX: () => gesture,
      failOffsetY: () => gesture,
      maxDistance: () => gesture,
      maxDuration: (ms) => {
        gesture.maxDurationMs = ms;
        return gesture;
      },
      minDuration: (ms) => {
        gesture.minDurationMs = ms;
        return gesture;
      },
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
      onFinalize: () => gesture,
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

/**
 * Touch x positions inside the bar, in the 375pt window the react-native mock
 * reports. Named by the tab they land on rather than by the geometry that puts
 * them there: an edge touch belongs to the first/last tab and a centered one to
 * the middle tab whatever the exact item width turns out to be.
 */
const NEAR_LEFT_EDGE = 8;
const WINDOW_CENTER = 187;
const NEAR_RIGHT_EDGE = 340;

function renderBar(props: {
  onIndexChange?: (index: number) => void;
  onIndexLongPress?: (index: number) => void;
}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <TabBar activeIndex={0} {...props}>
        {ITEMS.map((item, index) => (
          <TabBarButton key={item.name} item={item} index={index} />
        ))}
      </TabBar>
    </BloomThemeProvider>,
  );
}

const gesturesOfKind = (kind: string) => mockGestures.filter((gesture) => gesture.kind === kind);

/** The gesture the detector was actually given — the last race constructed. */
function race(): MockGesture {
  const races = gesturesOfKind('Race');
  const last = races[races.length - 1];
  if (!last) throw new Error('The bar composed no gesture race');
  return last;
}

function member(kind: string): MockGesture {
  const found = race().members.find((gesture) => gesture.kind === kind);
  if (!found) throw new Error(`No ${kind} gesture in the bar's race`);
  return found;
}

/** Hold a finger at `x` until the long press activates. */
function longPressAt(x: number) {
  act(() => {
    member('LongPress').start?.({ x });
  });
}

/** A tap that succeeded at `x`. */
function tapAt(x: number) {
  act(() => {
    member('Tap').end?.({ x }, true);
  });
}

describe('TabBar long press', () => {
  beforeEach(() => {
    mockGestures.length = 0;
  });

  it('composes no long-press gesture when no handler is given', () => {
    // An always-armed long press would cancel the pan for anyone who rests a
    // finger before scrubbing — a regression for every existing consumer.
    renderBar({});
    expect(gesturesOfKind('LongPress')).toHaveLength(0);
    expect(race().members.map((gesture) => gesture.kind)).toEqual(['Pan', 'Tap']);
  });

  it('adds one to the race, alongside the pan and the tap, when a handler is given', () => {
    renderBar({ onIndexLongPress: jest.fn() });
    expect(race().members.map((gesture) => gesture.kind)).toEqual(['Pan', 'Tap', 'LongPress']);
  });

  it('arms it after the tap gesture has already given up', () => {
    // The two windows must not overlap, or arming a long press would sometimes
    // cost the bar a tap. The tap gives up at 400ms; the long press activates
    // at 500ms, so at no instant are both candidates.
    renderBar({ onIndexLongPress: jest.fn() });
    expect(member('LongPress').minDurationMs).toBe(500);
    expect(member('Tap').maxDurationMs).toBe(400);
    expect(member('Tap').maxDurationMs ?? 0).toBeLessThan(member('LongPress').minDurationMs ?? 0);
  });

  it('reports the index of the tab under the finger', () => {
    const onIndexLongPress = jest.fn();
    renderBar({ onIndexLongPress });

    longPressAt(NEAR_LEFT_EDGE);
    longPressAt(WINDOW_CENTER);
    longPressAt(NEAR_RIGHT_EDGE);

    expect(onIndexLongPress.mock.calls).toEqual([[0], [1], [2]]);
  });

  it('resolves the same index a tap at the same point would', () => {
    // Long press, tap and scrub all share one `indexAtX` worklet; this is what
    // keeps a long press from ever acting on a different tab than the one the
    // finger is visibly on.
    const onIndexChange = jest.fn();
    const onIndexLongPress = jest.fn();
    renderBar({ onIndexChange, onIndexLongPress });

    for (const x of [NEAR_LEFT_EDGE, 100, WINDOW_CENTER, 250, NEAR_RIGHT_EDGE]) {
      tapAt(x);
      longPressAt(x);
    }

    expect(onIndexLongPress.mock.calls).toEqual(onIndexChange.mock.calls);
  });

  it('does not select the tab it long-presses', () => {
    // It is a secondary action (an account sheet, say) — navigating as well
    // would take the user off the screen they opened it from.
    const onIndexChange = jest.fn();
    renderBar({ onIndexChange, onIndexLongPress: jest.fn() });

    longPressAt(NEAR_RIGHT_EDGE);

    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('still selects on a short tap while the long press is armed', () => {
    const onIndexChange = jest.fn();
    const onIndexLongPress = jest.fn();
    renderBar({ onIndexChange, onIndexLongPress });

    tapAt(NEAR_RIGHT_EDGE);

    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(onIndexLongPress).not.toHaveBeenCalled();
  });

  it('keeps the scrub gesture in the race', () => {
    // The pan is what makes the highlight scrubbable; a long press must not
    // have displaced it.
    renderBar({ onIndexLongPress: jest.fn() });
    // Its scrub worklet, not merely a pan object: this is the handler that
    // drags the highlight under the finger.
    expect(typeof member('Pan').update).toBe('function');
  });
});
