import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';

/**
 * True on touch-capable web browsers (coarse pointer). A hover wash only makes
 * sense with a hovering pointer, so it is suppressed on touch web to match
 * native (which has no hover at all).
 */
const IS_WEB_TOUCH_DEVICE =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;

/**
 * Web-only style that (a) cross-fades the overlay opacity and (b) promotes it to
 * its own GPU layer so Safari doesn't nudge the layout by a subpixel when the
 * overlay composites on hover. Cast because RN's `ViewStyle` has no `willChange`
 * / `transition*` keys; react-native-web forwards them to the DOM node.
 */
const WEB_TRANSITION = {
  transitionProperty: 'opacity',
  transitionDuration: '0.1s',
  transitionTimingFunction: 'ease',
  willChange: 'opacity',
} as ViewStyle;

export interface SubtleHoverProps {
  /** Whether the parent is currently hovered. Drives the overlay opacity. */
  hover: boolean;
  /**
   * Overlay opacity when hovered. Defaults to a mode-tuned value (0.4 dark /
   * 0.5 light) that reads as a gentle contrast wash.
   */
  opacity?: number;
  /** Extra style merged last — e.g. `borderRadius` to match the parent. */
  style?: StyleProp<ViewStyle>;
  /**
   * Opt in to rendering on native. Off by default: hover is a pointer
   * affordance, so this is a web-only overlay unless a native surface wants the
   * same wash driven by another interaction (e.g. press).
   */
  native?: boolean;
}

/**
 * An absolutely-positioned, non-interactive contrast wash that fades in while
 * its parent is hovered. Ported from Bluesky's `SubtleHover`. Pairs naturally
 * with {@link useInteractionState} — pass its `state` as `hover`.
 *
 * Renders nothing on touch-web (no hovering pointer) and on native unless
 * `native` is set. Color comes from the theme's `contrast50` token so the wash
 * tracks the active preset and light/dark mode.
 */
export function SubtleHover({ hover, opacity, style, native = false }: SubtleHoverProps) {
  const theme = useTheme();

  const isWeb = Platform.OS === 'web';
  if (isWeb ? IS_WEB_TOUCH_DEVICE : !native) {
    return null;
  }

  const targetOpacity = opacity ?? (theme.isDark ? 0.4 : 0.5);

  return (
    <View
      style={[
        styles.overlay,
        { backgroundColor: theme.colors.contrast50, opacity: hover ? targetOpacity : 0 },
        isWeb ? WEB_TRANSITION : null,
        style,
      ]}
    />
  );
}

SubtleHover.displayName = 'SubtleHover';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});
