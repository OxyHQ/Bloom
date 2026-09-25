/**
 * The nav drawer's edge swipe (`AiChatShell`, `navSwipeEnabled`).
 *
 * A drawer with no gesture has exactly one way to open on touch — the header
 * button — which is what a host migrating off `expo-router`'s `Drawer`
 * (`swipeEnabled`) loses. The gesture that replaces it lives on the shell's
 * ROOT, so it is offered every touch the chat, the thread and a host's own
 * content receive: the claim conditions are the whole safety argument and are
 * what this suite pins.
 *
 * `PanResponder.create` is spied rather than the handlers being fired through
 * the tree, for two reasons. The `react-native` mock's `PanResponder` returns
 * empty `panHandlers`, so there is nothing on the rendered node to fire; and
 * the decisions under test are the CONFIG's — `onMoveShouldSetPanResponder`
 * and the release math — which is the same shape as `BottomSheetGesture`'s
 * recording mock. The spy returns a marker for `onMoveShouldSetResponder`, so
 * whether the shell ATTACHED the gesture at all is readable off the root node:
 * arming is two properties (attached, and claiming), and each is asserted.
 */
import React from 'react';
import { Text } from 'react-native';
import * as ReactNative from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { act, render } from '@testing-library/react-native';
import type { GestureResponderEvent, PanResponderGestureState } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { AiChatShell } from '../ai-chat';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

type PanConfig = Parameters<typeof ReactNative.PanResponder.create>[0];

/** Stands in for the whole `panHandlers` bundle: present iff the gesture is armed. */
const ATTACHED = () => false;

let created: PanConfig[] = [];

beforeEach(() => {
  created = [];
  jest.spyOn(ReactNative.PanResponder, 'create').mockImplementation((config) => {
    created.push(config);
    return { panHandlers: { onMoveShouldSetResponder: ATTACHED } };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function setWindowWidth(width: number) {
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

/** A gesture state with one finger and nothing else happening. */
function gesture(over: Partial<PanResponderGestureState> = {}): PanResponderGestureState {
  return {
    stateID: 1,
    moveX: 0,
    moveY: 0,
    x0: 0,
    y0: 0,
    dx: 0,
    dy: 0,
    vx: 0,
    vy: 0,
    numberActiveTouches: 1,
    _accountsForMovesUpTo: 0,
    ...over,
  };
}

/**
 * A drag that has travelled `dx` from `startX`. `moveX` is where the finger is
 * NOW — the shell recovers the start from `moveX - dx`, because `x0` is only
 * filled in at grant.
 */
function dragFrom(startX: number, dx: number, dy = 3): PanResponderGestureState {
  return gesture({ dx, dy, moveX: startX + dx, moveY: dy });
}

const TOUCH = { nativeEvent: { type: 'touchmove' } } as unknown as GestureResponderEvent;

interface ShellOptions {
  /** `null` is "the host gave no drawer"; omitted is the ordinary case. */
  mobileSidebar?: React.ReactNode;
  navSwipeEnabled?: boolean;
}

function renderShell({ mobileSidebar = <Text>nav</Text>, navSwipeEnabled }: ShellOptions = {}) {
  const onNavOpenChange = jest.fn();
  // The children carry a counter so `refresh()` produces a real re-render:
  // `useAnimatedStyle` is evaluated at render time under the mock, which is
  // the only way to read what a mid-drag write to the shared value did.
  const draw = (tick: number) => (
    <BloomThemeProvider mode="light">
      <AiChatShell
        testID="shell"
        sidebar={null}
        mobileSidebar={mobileSidebar}
        navSwipeEnabled={navSwipeEnabled}
        onNavOpenChange={onNavOpenChange}>
        <Text>{`chat ${tick}`}</Text>
      </AiChatShell>
    </BloomThemeProvider>
  );
  const utils = render(draw(0));
  let tick = 0;
  return {
    ...utils,
    onNavOpenChange,
    refresh: () => {
      tick += 1;
      utils.rerender(draw(tick));
    },
    root: () => utils.getByTestId('shell'),
    /** The shell's own responder: it is created before any descendant's. */
    config: () => {
      expect(created.length).toBeGreaterThan(0);
      return created[0]!;
    },
    /**
     * How far the drawer is out, read off the veil the reveal drives. A closed
     * veil is hidden from assistive tech, so the query has to include it.
     */
    revealed: () => {
      let node: ReactTestInstance | null = utils.getByLabelText('Close navigation', { includeHiddenElements: true });
      while (node && resolvedStyle(node.props.style).opacity === undefined) node = node.parent;
      return resolvedStyle(node?.props.style).opacity as number | undefined;
    },
  };
}

/** Claim, grant, drag to `dx`, let go at `vx`. */
function swipe(config: PanConfig, from: number, dx: number, vx = 0.02) {
  const claimed = config.onMoveShouldSetPanResponder!(TOUCH, dragFrom(from, dx > 0 ? 20 : -20));
  act(() => {
    config.onPanResponderGrant!(TOUCH, gesture());
  });
  act(() => {
    config.onPanResponderMove!(TOUCH, gesture({ dx }));
  });
  act(() => {
    config.onPanResponderRelease!(TOUCH, gesture({ dx, vx }));
  });
  return claimed;
}

describe('AiChatShell nav swipe', () => {
  it('opens the drawer on a drag in from the left edge, below lg', () => {
    const shell = renderShell();
    expect(shell.root().props.onMoveShouldSetResponder).toBe(ATTACHED);
    expect(swipe(shell.config(), 6, 200)).toBe(true);
    expect(shell.onNavOpenChange).toHaveBeenCalledWith(true);
    expect(shell.revealed()).toBe(1);
  });

  it('follows the finger rather than waiting for the release', () => {
    const shell = renderShell();
    const config = shell.config();
    act(() => {
      config.onPanResponderGrant!(TOUCH, gesture());
    });
    act(() => {
      // Half of REVEAL_OFFSET (272).
      config.onPanResponderMove!(TOUCH, gesture({ dx: 136 }));
    });
    shell.refresh();
    expect(shell.revealed()).toBeCloseTo(0.5, 5);
    // Still only a drag: nothing has been committed.
    expect(shell.onNavOpenChange).not.toHaveBeenCalled();
  });

  it('settles back closed when the drag is released short, and says nothing happened', () => {
    const shell = renderShell();
    swipe(shell.config(), 6, 60);
    expect(shell.revealed()).toBe(0);
    expect(shell.onNavOpenChange).not.toHaveBeenCalled();
  });

  it('opens on a fast flick that never got halfway', () => {
    const shell = renderShell();
    swipe(shell.config(), 6, 40, 0.9);
    expect(shell.onNavOpenChange).toHaveBeenCalledWith(true);
    expect(shell.revealed()).toBe(1);
  });

  it('closes an open drawer on a drag back, from anywhere over the veil', () => {
    const shell = renderShell();
    swipe(shell.config(), 6, 200);
    shell.onNavOpenChange.mockClear();
    const config = shell.config();
    // Mid-screen is fine once it is open — the veil is over all of it.
    expect(config.onMoveShouldSetPanResponder!(TOUCH, dragFrom(300, -40))).toBe(true);
    // ...and the opening direction is not.
    expect(config.onMoveShouldSetPanResponder!(TOUCH, dragFrom(300, 40))).toBe(false);
    swipe(config, 300, -200, -0.9);
    expect(shell.onNavOpenChange).toHaveBeenCalledWith(false);
    expect(shell.revealed()).toBe(0);
  });

  it('leaves a vertical drag to the thread, and a diagonal one too', () => {
    const claim = renderShell().config().onMoveShouldSetPanResponder!;
    expect(claim(TOUCH, gesture({ dx: 8, dy: 60, moveX: 14, moveY: 60 }))).toBe(false);
    // 40 across, 30 down: horizontal, but not by twice.
    expect(claim(TOUCH, gesture({ dx: 40, dy: 30, moveX: 46, moveY: 30 }))).toBe(false);
  });

  it('leaves a horizontal drag that did not start at the edge to the content', () => {
    const claim = renderShell().config().onMoveShouldSetPanResponder!;
    // A carousel or a scrolling code block in the middle of the chat.
    expect(claim(TOUCH, dragFrom(200, 60))).toBe(false);
    // One pixel outside the strip is outside it.
    expect(claim(TOUCH, dragFrom(25, 60))).toBe(false);
    expect(claim(TOUCH, dragFrom(24, 60))).toBe(true);
  });

  it('never claims a touch that has not moved, and never a pinch', () => {
    const config = renderShell().config();
    expect(config.onStartShouldSetPanResponder!(TOUCH, gesture())).toBe(false);
    expect(config.onMoveShouldSetPanResponder!(TOUCH, dragFrom(6, 8))).toBe(false);
    expect(
      config.onMoveShouldSetPanResponder!(TOUCH, { ...dragFrom(6, 60), numberActiveTouches: 2 }),
    ).toBe(false);
  });

  it('does not arm from lg up, where the sidebar is in flow', () => {
    setWindowWidth(1100);
    const shell = renderShell();
    expect(shell.root().props.onMoveShouldSetResponder).toBeUndefined();
    expect(shell.config().onMoveShouldSetPanResponder!(TOUCH, dragFrom(6, 200))).toBe(false);
  });

  it('does not arm without a mobileSidebar, where there is no drawer to open', () => {
    const shell = renderShell({ mobileSidebar: null });
    expect(shell.root().props.onMoveShouldSetResponder).toBeUndefined();
    expect(shell.config().onMoveShouldSetPanResponder!(TOUCH, dragFrom(6, 200))).toBe(false);
  });

  it('is turned off by navSwipeEnabled={false}', () => {
    const shell = renderShell({ navSwipeEnabled: false });
    expect(shell.root().props.onMoveShouldSetResponder).toBeUndefined();
    expect(shell.config().onMoveShouldSetPanResponder!(TOUCH, dragFrom(6, 200))).toBe(false);
    // The drawer still exists — only the gesture is gone.
    expect(shell.getByLabelText('Close navigation', { includeHiddenElements: true })).toBeTruthy();
  });

  it('keeps the drag but snaps the settle under reduced motion', () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const shell = renderShell();
    const config = shell.config();
    const timing = jest.spyOn(Reanimated, 'withTiming');
    act(() => {
      config.onPanResponderGrant!(TOUCH, gesture());
    });
    act(() => {
      config.onPanResponderMove!(TOUCH, gesture({ dx: 136 }));
    });
    shell.refresh();
    // The drag itself is 1:1 with the finger either way — it is not an animation.
    expect(shell.revealed()).toBeCloseTo(0.5, 5);
    act(() => {
      config.onPanResponderRelease!(TOUCH, gesture({ dx: 200, vx: 0.02 }));
    });
    expect(shell.revealed()).toBe(1);
    expect(timing).not.toHaveBeenCalled();
  });

  it('puts the drawer back where it was when something else takes the gesture', () => {
    const shell = renderShell();
    const config = shell.config();
    act(() => {
      config.onPanResponderGrant!(TOUCH, gesture());
    });
    act(() => {
      config.onPanResponderMove!(TOUCH, gesture({ dx: 200 }));
    });
    act(() => {
      config.onPanResponderTerminate!(TOUCH, gesture({ dx: 200 }));
    });
    expect(shell.revealed()).toBe(0);
    expect(shell.onNavOpenChange).not.toHaveBeenCalled();
    // Nothing may take it off us while the drawer is following the finger.
    expect(config.onPanResponderTerminationRequest!(TOUCH, gesture())).toBe(false);
  });
});
