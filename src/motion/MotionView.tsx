import { createElement, useMemo, useRef, type ReactNode, type Ref } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { mergeRefs } from '../hooks/merge-refs';
import { MotionWrapper, transitionStyle, usePlay } from './motion-host';
import type { Play } from './play';
import type { Timing } from './timing';

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
}

/**
 * A view that plays Bloom motion: keyframes (`play`) and transitions of its
 * own transform and opacity (`transition`). Native: an `Animated.View` on
 * Reanimated's CSS engine, with no worklet. Web: a `View` animated by the Web
 * Animations API and CSS transitions, with no Reanimated.
 */
export function MotionView({ play, transition, style, ref, ...rest }: MotionViewProps): ReactNode {
  const own = useRef<unknown>(null);
  // One callback for the view's life: a new one each render would detach and
  // re-attach the animated host's ref on every render.
  const merged = useMemo(() => mergeRefs([own, ref]), [ref]);
  const played = usePlay(own, play);
  const host =
    rest.entering !== undefined || rest.exiting !== undefined ? Animated.View : MotionWrapper;
  return createElement(host as never, {
    ...rest,
    ...played.props,
    ref: merged,
    style: [style, transition ? transitionStyle(transition) : null, played.style],
  });
}
