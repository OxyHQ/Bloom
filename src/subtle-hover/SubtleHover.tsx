import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { IS_WEB_TOUCH_DEVICE } from '../styles/pointer';
import { webDataSet } from '../styles/web-data';
import type { SubtleHoverProps } from './types';

/**
 * The marker a `SubtleHover`'s hover group carries: spread it on the element
 * whose hover lights the wash (`<Pressable {...hoverGroupProps}>`). A web
 * `data-bloom-hover-group` attribute; nothing on native.
 */
export const hoverGroupProps: Record<string, unknown> = webDataSet({ bloomHoverGroup: '' });

const STYLE_ID = 'bloom-subtle-hover';
/** The wash fades in over its hover group, at half (dark: 40%) of the contrast fill. */
const CSS = `[data-bloom-subtle-hover]{opacity:0;transition-property:opacity;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms}
@media (hover:hover){[data-bloom-hover-group]:hover [data-bloom-subtle-hover]{opacity:0.5}}
@media (prefers-color-scheme:dark){@media (hover:hover){[data-bloom-hover-group]:hover [data-bloom-subtle-hover]{opacity:0.4}}}`;

/** The cross-fade, as the web's `transition-opacity duration-150`. */
const FADE_MS = 150;
const FADE = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * An absolutely-positioned, non-interactive contrast wash. Two modes:
 *
 * - **Hover group** (`active` omitted): the wash fades in while the pointer is
 *   over the nearest element carrying {@link hoverGroupProps}, through an adopted
 *   stylesheet: no React state. Web-only (native and touch-web have no hover).
 * - **JS `active`**: the wash opacity follows the boolean, so several elements
 *   can light up together (e.g. every post of a thread), cross-fading over
 *   150ms. Web always; native only when `native` is set.
 *
 * The wash color comes from the theme's `contrast50` token so it tracks the
 * active preset and light/dark mode.
 */
export function SubtleHover({ active, style, native = false }: SubtleHoverProps) {
  const isWeb = Platform.OS === 'web';
  if (active === undefined) {
    // A web pointer affordance. Native has no hover, and neither does touch web.
    if (!isWeb || IS_WEB_TOUCH_DEVICE) return null;
    return <HoverWash style={style} />;
  }
  // JS-driven coordinated mode: web always; native only when opted in.
  if (!isWeb && !native) return null;
  return isWeb ? (
    <WebActiveWash active={active} style={style} />
  ) : (
    <NativeActiveWash active={active} style={style} />
  );
}

SubtleHover.displayName = 'SubtleHover';

type WashProps = Pick<SubtleHoverProps, 'style'>;

function HoverWash({ style }: WashProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(STYLE_ID, CSS);
  }, []);
  return (
    <View
      {...webDataSet({ bloomSubtleHover: '' })}
      style={[styles.overlay, { backgroundColor: theme.colors.contrast50 }, style]}
    />
  );
}

function WebActiveWash({ active, style }: WashProps & { active: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.overlay,
        styles.webFade,
        {
          backgroundColor: theme.colors.contrast50,
          opacity: active ? (theme.isDark ? 0.4 : 0.5) : 0,
        },
        style,
      ]}
    />
  );
}

function NativeActiveWash({ active, style }: WashProps & { active: boolean }) {
  const theme = useTheme();
  const target = active ? (theme.isDark ? 0.4 : 0.5) : 0;
  const opacity = useSharedValue(target);
  useEffect(() => {
    opacity.value = withTiming(target, { duration: FADE_MS, easing: FADE });
  }, [opacity, target]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[styles.overlay, { backgroundColor: theme.colors.contrast50 }, fade, style]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  webFade: {
    transitionProperty: 'opacity',
    transitionDuration: '150ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as object,
});
