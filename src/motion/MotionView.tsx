import {
  createElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type Ref,
} from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { mergeRefs } from '../hooks/merge-refs';
import type { KeyframesValue } from './keyframes';
import { LeavingContext } from './leaving';
import { MotionWrapper, exitingOf, transitionStyle, usePlay } from './motion-host';
import type { Play } from './play';
import type { Timing } from './timing';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

export interface MotionViewProps extends Omit<ViewProps, 'style'> {
  /** Keyframes playing on the view now; each new `id` starts them over. */
  play?: Play;
  /** Changes of the view's transform and opacity play with this timing. */
  transition?: Timing;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<unknown>;
  children?: ReactNode;
  /**
   * A consumer's own Reanimated layout animations (a toast's `animation.enter`
   * and `.exit`): with one, the view is Reanimated's `Animated.View` on every
   * platform, so the builder plays as Reanimated plays it.
   */
  entering?: unknown;
  exiting?: unknown;
  /**
   * How the view leaves when its `Presence` child is removed: keyframes and
   * whether the view holds a material host (see `Play.material`), or `null`
   * for no motion. Native plays them after the unmount, as a Reanimated layout
   * animation on a native snapshot (no JS); the web plays them while the
   * `Presence` keeps the view, then lets it go.
   */
  exit?: { keyframes: KeyframesValue; material: boolean } | null;
}

/**
 * A view that plays Bloom motion: keyframes (`play`) and transitions of its
 * own transform and opacity (`transition`). Native: an `Animated.View` on
 * Reanimated's CSS engine, with no worklet. Web: a `View` animated by the Web
 * Animations API and CSS transitions, with no Reanimated.
 */
export function MotionView({
  play,
  transition,
  exit,
  style,
  ref,
  ...rest
}: MotionViewProps): ReactNode {
  const own = useRef<unknown>(null);
  // One callback for the view's life: a new one each render would detach and
  // re-attach the animated host's ref on every render.
  const merged = useMemo(() => mergeRefs([own, ref]), [ref]);
  const reduced = usePrefersReducedMotion();
  const exitTiming = exit && !reduced ? exit.keyframes.timing() : undefined;

  // Web: the removal plays while the Presence keeps the view; with none to
  // play, the view goes at once. (Native never sets a leaving.)
  const leaving = useContext(LeavingContext);
  const leavesAtOnce = leaving !== undefined && (exit === undefined || exitTiming === undefined);
  useLayoutEffect(() => {
    if (leavesAtOnce) leaving?.onLeft();
  }, [leavesAtOnce, leaving]);
  const leavingPlay: Play | undefined =
    leaving !== undefined && exit && exitTiming !== undefined
      ? {
          id: -1,
          keyframes: exit.keyframes,
          timing: exitTiming,
          fill: 'forwards',
          material: exit.material,
          onEnd: leaving.onLeft,
        }
      : undefined;
  const played = usePlay(own, leavingPlay ?? play);

  // Native: the removal is a layout animation, played after the unmount.
  const exiting =
    exit && exitTiming !== undefined ? exitingOf(exit.keyframes, exitTiming) : rest.exiting;
  const host = rest.entering !== undefined || exiting !== undefined ? Animated.View : MotionWrapper;
  return createElement(host as never, {
    ...rest,
    exiting,
    ...played.props,
    ref: merged,
    style: [style, transition ? transitionStyle(transition) : null, played.style],
  });
}
