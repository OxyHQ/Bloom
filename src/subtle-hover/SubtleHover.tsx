import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import { IS_WEB_TOUCH_DEVICE } from '../styles/pointer';

export interface SubtleHoverProps {
  /**
   * JS-driven visibility for a coordinated highlight — e.g. every post of one
   * thread lighting up together. When omitted, the wash instead follows CSS
   * `group-hover` on web with ZERO React state: the parent element must carry
   * `className="group"`.
   */
  active?: boolean;
  /** Extra style merged last — e.g. `borderRadius` to match the parent. */
  style?: StyleProp<ViewStyle>;
  /**
   * Render on native too (default `false`). Hover is a web pointer affordance,
   * so the CSS `group-hover` mode is web-only; native only shows the wash in the
   * JS `active` mode, and only when this is set.
   */
  native?: boolean;
}

/**
 * An absolutely-positioned, non-interactive contrast wash. Two modes:
 *
 * - **CSS `group-hover`** (`active` omitted): the wash fades in on hover purely
 *   through NativeWind classes — no React state. The parent must carry
 *   `className="group"`. Web-only (native and touch-web have no hover).
 * - **JS `active`**: the wash opacity follows the boolean, so several elements
 *   can light up together (e.g. every post of a thread). Web always; native
 *   only when `native` is set.
 *
 * The wash color comes from the theme's `contrast50` token so it tracks the
 * active preset and light/dark mode. The web cross-fade is a NativeWind
 * `transition-opacity` class — no manual `willChange` / web-style casts.
 */
export function SubtleHover({ active, style, native = false }: SubtleHoverProps) {
  const theme = useTheme();
  const isWeb = Platform.OS === 'web';

  // Full literal class strings (never concatenated fragments) so NativeWind's
  // compiler statically extracts every variant.
  if (active === undefined) {
    // CSS group-hover: a web pointer affordance. Native has no hover, and
    // neither does touch web — render nothing there.
    if (!isWeb || IS_WEB_TOUCH_DEVICE) return null;
    return (
      <View
        {...({
          className:
            'opacity-0 group-hover:opacity-50 dark:group-hover:opacity-40 transition-opacity duration-150',
        } as Record<string, string>)}
        style={[styles.overlay, { backgroundColor: theme.colors.contrast50 }, style]}
      />
    );
  }

  // JS-driven coordinated mode: web always; native only when opted in.
  if (!isWeb && !native) return null;
  return (
    <View
      {...({ className: 'transition-opacity duration-150' } as Record<string, string>)}
      style={[
        styles.overlay,
        {
          backgroundColor: theme.colors.contrast50,
          opacity: active ? (theme.isDark ? 0.4 : 0.5) : 0,
        },
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
