import {
  withDelay,
  withSequence,
  withTiming,
  type LayoutAnimation,
} from 'react-native-reanimated';

/**
 * Reanimated custom layout-animation presets. Each is a worklet builder
 * compatible with an `Animated.View`'s `entering` / `exiting` prop:
 *
 * ```tsx
 * <Animated.View entering={ScaleAndFadeIn} exiting={ScaleAndFadeOut} />
 * ```
 *
 * Ported from Bluesky's custom-animation set. The `'worklet'` directive is
 * preserved through Bloom's build; the consuming app's Metro + reanimated Babel
 * plugin transforms it so the animation runs on the UI thread (same path the
 * existing `bottom-sheet` gesture worklets rely on).
 */

/** Entering: fade in while growing from 70% to full size. */
export const ScaleAndFadeIn: () => LayoutAnimation = () => {
  'worklet';
  return {
    animations: {
      opacity: withTiming(1),
      transform: [{ scale: withTiming(1) }],
    },
    initialValues: {
      opacity: 0,
      transform: [{ scale: 0.7 }],
    },
  };
};

/** Exiting counterpart to {@link ScaleAndFadeIn}: fade out while shrinking to 70%. */
export const ScaleAndFadeOut: () => LayoutAnimation = () => {
  'worklet';
  return {
    animations: {
      opacity: withTiming(0),
      transform: [{ scale: withTiming(0.7) }],
    },
    initialValues: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
  };
};

/**
 * Exiting with a brief "pop": the scale dips to 70%, overshoots to 110%, and the
 * element fades out. Good for confirming a tapped or removed item.
 */
export const ShrinkAndPop: () => LayoutAnimation = () => {
  'worklet';
  return {
    animations: {
      opacity: withDelay(125, withTiming(0, { duration: 125 })),
      transform: [
        {
          scale: withSequence(
            withTiming(0.7, { duration: 75 }),
            withTiming(1.1, { duration: 150 }),
          ),
        },
      ],
    },
    initialValues: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
  };
};
