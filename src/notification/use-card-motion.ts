import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
import type { WebCssStyle } from '../styles/web-view-style';

/** One end of the card's entrance or exit: where it comes from / goes to. */
export interface CardMotionPose {
  opacity: number;
  translateY: number;
  scale: number;
  /** Web only — native has no CSS `filter`. */
  blur: number;
  duration: number;
}

/** `motion/react`'s `easeOut` and `easeInOut`. */
export const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
export const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

const IS_WEB = Platform.OS === 'web';

/**
 * The self-managed enter/exit notification and announcement cards run
 * through `AnimatePresence`: an optional entrance after `introDelay` seconds, and
 * an exit on dismiss after which the card unmounts and `onExited` fires.
 *
 * RN `Animated` rather than Reanimated so the web build needs no worklets
 * runtime; opacity and transforms ride the native driver where there is one.
 * The blur is web-only (a CSS `filter`), and with it the whole animation has to
 * stay on the JS driver on web, which is the only place the filter exists.
 *
 * Reduced motion skips both animations: the card appears in place and leaves
 * immediately.
 */
export function useCardMotion({
  intro,
  introDelay,
  exit,
  exitEasing,
  onExited,
}: {
  intro: CardMotionPose;
  /** Seconds. `undefined` = no entrance. */
  introDelay: number | undefined;
  exit: CardMotionPose;
  exitEasing: (value: number) => number;
  onExited?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const animateIntro = introDelay !== undefined && !reducedMotion;
  const enter = useRef(new Animated.Value(animateIntro ? 0 : 1)).current;
  const leave = useRef(new Animated.Value(0)).current;
  // A ref, so `dismiss` keeps one identity: a timer that captured it on mount
  // (auto-dismiss) and a later press cannot both run the exit.
  const dismissingRef = useRef(false);
  const [gone, setGone] = useState(false);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  useEffect(() => {
    if (!animateIntro) return;
    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: intro.duration,
      delay: (introDelay ?? 0) * 1000,
      easing: EASE_OUT,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
    // Mount-only, like `initial`/`animate`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    const finish = () => {
      setGone(true);
      onExitedRef.current?.();
    };
    if (reducedMotion) {
      finish();
      return;
    }
    enter.stopAnimation();
    Animated.timing(leave, {
      toValue: 1,
      duration: exit.duration,
      easing: exitEasing,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    }).start((result) => {
      // Interrupted (unmounted mid-exit) → do not report an exit that never landed.
      if (result?.finished !== false) finish();
    });
  }, [reducedMotion, enter, leave, exit.duration, exitEasing]);

  const style = useMemo((): Animated.WithAnimatedObject<WebCssStyle> => {
    const lerp = (value: Animated.Value, from: number, to: number) =>
      value.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
    const animated: Record<string, unknown> = {
      opacity: Animated.multiply(lerp(enter, intro.opacity, 1), lerp(leave, 1, exit.opacity)),
      transform: [
        { translateY: Animated.add(lerp(enter, intro.translateY, 0), lerp(leave, 0, exit.translateY)) },
        { scale: Animated.multiply(lerp(enter, intro.scale, 1), lerp(leave, 1, exit.scale)) },
      ],
    };
    if (IS_WEB) {
      animated.filter = Animated.add(lerp(enter, intro.blur, 0), lerp(leave, 0, exit.blur)).interpolate({
        inputRange: [0, 10],
        outputRange: ['blur(0px)', 'blur(10px)'],
      });
    }
    return animated as Animated.WithAnimatedObject<WebCssStyle>;
  }, [enter, leave, intro, exit]);

  return { style, dismiss, gone };
}
