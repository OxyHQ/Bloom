import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, runOnJS, withTiming, type SharedValue } from 'react-native-reanimated';

import { DRAWER_SWIPE } from './constants';

/** The drawer's own open/close timing (`reveal` on native), shared with the release. */
export const DRAWER_MS = 325;
export const DRAWER_EASE = Easing.bezier(0.42, 0, 0.58, 1);
/**
 * A released drag already moves, so it settles decelerating rather than on the
 * ease-in-out a press starts from rest with (which would stall under the finger
 * that just let go).
 */
const RELEASE_EASE = Easing.out(Easing.cubic);
/** The quickest settle, for a release a few points from where it lands. */
const RELEASE_MIN_MS = 120;

export interface DrawerSwipeOptions {
  /** `drawerSwipe`, on a native platform. Off builds no gesture at all. */
  swipe: boolean;
  /** There is a drawer to open at this width (the nav is not in flow). */
  available: boolean;
  open: boolean;
  /**
   * `reveal`: the frame's pan also CLOSES, because the open drawer and the page
   * it pushed aside are both inside the frame. `overlay` portals its drawer out
   * of the frame, so the `drawer` gesture closes it there instead.
   */
  closeOnFrame: boolean;
  rtl: boolean;
  /** The frame's measured width: the start-edge strip is read from its far side in RTL. */
  frameWidth: number;
  /** Points of finger travel from closed to open: what moves, moving 1:1. */
  travel: number;
  /** The drawer's open amount, 0–1 — the same shared value its press animation drives. */
  progress: SharedValue<number>;
  /** Where `progress` stood when the active drag began. */
  start: SharedValue<number>;
  reducedMotion: boolean;
  /** JS: a drag toward open began (an `overlay` drawer must mount to be seen). */
  onOpenDragStart: () => void;
  /** JS: the release landed, open or closed. */
  onSettle: (open: boolean) => void;
}

/**
 * The builder API's pan, named by what it returns: it is the one spelling the
 * whole peer range (gesture-handler 2.16 to 3) types the same way.
 */
type PanGesture = ReturnType<typeof Gesture.Pan>;

export interface DrawerSwipeGestures {
  /** On the shell's frame: opens from the start edge; `reveal` also closes. */
  frame: PanGesture | null;
  /** On the portaled `overlay` drawer and its backdrop: closes. */
  drawer: PanGesture | null;
}

/**
 * `drawerSwipe`: the edge swipe expo-router's `Drawer` (`swipeEnabled`) has,
 * driving the drawer's EXISTING open amount on the UI thread.
 *
 * Closed, a pan that begins within `DRAWER_SWIPE.edgeWidth` of the START edge
 * (the left in LTR, the right in RTL — the strip is tested against the touch's
 * own `x`, a sign no inset would mirror) and moves toward the end edge drags the
 * drawer open, 1:1 with the finger. Open, a pan toward the start edge drags it
 * closed. Either activates on horizontal travel only and FAILS on vertical
 * travel, so the sidebar's list and the page keep scrolling. A release faster
 * than `flingVelocity` settles in its own direction; a slower one settles on
 * whichever side of half way it was let go. Only the landing reaches React:
 * `onSettle` runs once, after the drawer is at rest, and the shell turns it
 * into the controlled `drawerOpen` / `onDrawerOpenChange` state.
 *
 * Every value a callback reads is a number, a boolean, a shared value or a
 * function (the worklet-captures gate).
 */
export function useDrawerSwipe({
  swipe,
  available,
  open,
  closeOnFrame,
  rtl,
  frameWidth,
  travel,
  progress,
  start,
  reducedMotion,
  onOpenDragStart,
  onSettle,
}: DrawerSwipeOptions): DrawerSwipeGestures {
  return useMemo(() => {
    if (!swipe) return { frame: null, drawer: null };
    // Signs, read once: `dir` turns a physical translation into "toward open".
    const dir = rtl ? -1 : 1;
    const span = Math.max(1, travel);

    const pan = (opening: boolean, active: boolean) =>
      Gesture.Pan()
        .enabled(active)
        // One-sided: only motion in the drag's own direction claims the touch,
        // so a pan the other way stays with whatever is under the finger.
        .activeOffsetX((opening ? dir : -dir) * DRAWER_SWIPE.activateOffset)
        .failOffsetY([-DRAWER_SWIPE.failOffset, DRAWER_SWIPE.failOffset])
        .onTouchesDown((event, manager) => {
          'worklet';
          if (!opening) return;
          const touch = event.allTouches[0];
          if (!touch) return;
          const fromStart = rtl ? frameWidth - touch.x : touch.x;
          if (fromStart > DRAWER_SWIPE.edgeWidth) manager.fail();
        })
        .onStart(() => {
          'worklet';
          start.value = progress.value;
          if (opening) runOnJS(onOpenDragStart)();
        })
        .onUpdate((event) => {
          'worklet';
          const next = start.value + (dir * event.translationX) / span;
          progress.value = Math.min(1, Math.max(0, next));
        })
        .onEnd((event) => {
          'worklet';
          const velocity = dir * event.velocityX;
          const target =
            Math.abs(velocity) > DRAWER_SWIPE.flingVelocity
              ? velocity > 0
                ? 1
                : 0
              : progress.value > 0.5
                ? 1
                : 0;
          if (reducedMotion) {
            progress.value = target;
            runOnJS(onSettle)(target === 1);
            return;
          }
          const remaining = Math.abs(target - progress.value);
          progress.value = withTiming(
            target,
            {
              duration: Math.max(RELEASE_MIN_MS, DRAWER_MS * remaining),
              easing: RELEASE_EASE,
            },
            (finished) => {
              'worklet';
              // An interrupted settle (a new drag, a press) hands the state to
              // whatever interrupted it.
              if (finished) runOnJS(onSettle)(target === 1);
            },
          );
        });

    return {
      frame: pan(!open, available && (!open || closeOnFrame)),
      drawer: closeOnFrame ? null : pan(false, available && open),
    };
  }, [
    swipe,
    available,
    open,
    closeOnFrame,
    rtl,
    frameWidth,
    travel,
    progress,
    start,
    reducedMotion,
    onOpenDragStart,
    onSettle,
  ]);
}
