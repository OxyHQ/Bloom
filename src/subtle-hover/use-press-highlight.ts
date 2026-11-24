import { useMemo } from 'react';
import { Platform, type PressableProps } from 'react-native';
import { Easing, type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '../theme';

/** The props a row's pressable host spreads for its press highlight. */
export interface PressHighlightHostProps {
  /** Android: the platform ripple, bounded by the row. */
  android_ripple?: PressableProps['android_ripple'];
  /** iOS: lights `pressed`. Call it from the host's own `onPressIn` if it has one. */
  onPressIn?: () => void;
  /** iOS: fades `pressed` out. Call it from the host's own `onPressOut` if it has one. */
  onPressOut?: () => void;
}

export interface PressHighlight {
  /** Spread on the row's `Pressable`; nothing on the web. */
  hostProps: PressHighlightHostProps;
  /**
   * iOS: hand it to the row's `SubtleHover` (`<SubtleHover pressed={…} />`),
   * whose wash it drives on the UI thread. `undefined` elsewhere.
   */
  pressed: SharedValue<number> | undefined;
}

/** The release's fade, as `SubtleHover`'s cross-fade. */
const FADE_OUT = { duration: 150, easing: Easing.bezier(0.4, 0, 0.2, 1) };

const NONE: PressHighlight = Object.freeze({ hostProps: Object.freeze({}), pressed: undefined });

/**
 * Android: the ripple React Native draws for a `Pressable` (`android_ripple`).
 * The press reaches the view as a command, without a React render, and the
 * ripple animates on the render thread.
 */
function useRipple(): PressHighlight {
  const color = useTheme().colors.contrast50;
  return useMemo(
    () => ({ hostProps: { android_ripple: { color, borderless: false } }, pressed: undefined }),
    [color],
  );
}

/**
 * iOS: a wash the press lights at once and the release fades, as a table
 * cell's highlight. Press in and out only set a shared value: no React render,
 * and the wash's opacity follows it on the UI thread.
 */
function useWash(): PressHighlight {
  const pressed = useSharedValue(0);
  return useMemo(
    () => ({
      hostProps: {
        onPressIn: () => {
          pressed.value = 1;
        },
        onPressOut: () => {
          pressed.value = withTiming(0, FADE_OUT);
        },
      },
      pressed,
    }),
    [pressed],
  );
}

function useNone(): PressHighlight {
  return NONE;
}

/**
 * A pressable row's pressed state on native, in the wash `SubtleHover` paints:
 * the theme's `contrast50`, the fill an unfilled Bloom control takes while
 * held. Android draws its ripple; iOS lights the row's `SubtleHover`. The web
 * has the pointer's hover wash and gets nothing here.
 *
 * Spread `hostProps` only on a row that takes a press: a `Pressable` without
 * `onPress` still answers a touch.
 *
 * ```tsx
 * const highlight = usePressHighlight();
 * <Pressable onPress={open} {...highlight.hostProps}>
 *   <SubtleHover pressed={highlight.pressed} />
 *   …
 * </Pressable>
 * ```
 *
 * A child that takes its own press (a button, a link) holds the touch, so the
 * row does not light; a scroll that takes the touch releases it.
 *
 * @deprecated A row pays hooks for it (iOS: a shared value and the wash's
 * animated style). Use `pressHighlight`, the same highlight on the row's own
 * `Pressable` with no hook, state or component.
 */
export const usePressHighlight: () => PressHighlight =
  Platform.OS === 'android' ? useRipple : Platform.OS === 'ios' ? useWash : useNone;
