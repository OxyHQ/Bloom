import React, { Children, createContext, isValidElement, useContext, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { IS_WEB } from './shared';

/**
 * The message motion (`motion/react`-style variants), without the library:
 *
 *   MESSAGE_VARIANTS  the container fades 0 → 1 over 400ms `easeOut` and
 *                     staggers its children 180ms apart
 *   LINE_VARIANTS     each block rises 6px, un-blurs 6px and fades in over
 *                     500ms `cubic-bezier(0.25, 0.1, 0.25, 1)`
 *
 * A container hands each direct child its slot's delay through context; a nested
 * orchestrator (the bullet list) staggers its own items from that delay, as a
 * framer variant child does. Reduced motion mounts everything settled.
 */

const LINE_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const FADE_EASE = Easing.bezier(0, 0, 0.58, 1);
export const STAGGER_MS = 180;

interface RevealSlot {
  /** When this block starts, ms after the message mounted. */
  delay: number;
  /** False when the message mounts settled. */
  animate: boolean;
}

const RevealContext = createContext<RevealSlot>({ delay: 0, animate: false });

export function useRevealSlot(): RevealSlot {
  return useContext(RevealContext);
}

/** Gives each direct child the next stagger slot, starting at `delay`. */
export function RevealSequence({
  children,
  delay = 0,
  animate,
}: {
  children: React.ReactNode;
  delay?: number;
  animate: boolean;
}) {
  let index = 0;
  return (
    <>
      {Children.map(children, (child) => {
        if (child === null || child === undefined || typeof child === 'boolean') return child;
        const slot = { delay: delay + STAGGER_MS * index, animate };
        index += 1;
        return (
          <RevealContext.Provider key={isValidElement(child) ? child.key ?? index : index} value={slot}>
            {child}
          </RevealContext.Provider>
        );
      })}
    </>
  );
}

/** One block rising into place from its slot's delay (`LINE_VARIANTS`). */
export function RevealLine({
  children,
  style,
  delay: delayOverride,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}) {
  const slot = useRevealSlot();
  const reducedMotion = useReducedMotion();
  const animate = slot.animate && !reducedMotion;
  const delay = delayOverride ?? slot.delay;
  const progress = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withTiming(1, { duration: 500, easing: LINE_EASE }));
    // Mount-only: a block reveals once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animated = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ translateY: 6 * (1 - progress.value) }],
      ...(IS_WEB ? { filter: progress.value >= 1 ? 'none' : `blur(${6 * (1 - progress.value)}px)` } : null),
    }),
    [progress],
  );
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** A container fading in over 400ms `easeOut` (`MESSAGE_VARIANTS`' own opacity). */
export function RevealFade({
  children,
  style,
  animate,
  delay = 0,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  animate: boolean;
  delay?: number;
  testID?: string;
}) {
  const reducedMotion = useReducedMotion();
  const run = animate && !reducedMotion;
  const progress = useSharedValue(run ? 0 : 1);
  useEffect(() => {
    if (!run) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withTiming(1, { duration: 400, easing: FADE_EASE }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animated = useAnimatedStyle(() => ({ opacity: progress.value }), [progress]);
  return (
    <Animated.View testID={testID} style={[style, animated]}>
      {children}
    </Animated.View>
  );
}
