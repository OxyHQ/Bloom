/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 *
 * WEB variant of the tab bar's capsule surface: the browser's own frosted
 * material, `backdrop-filter`, under the theme's translucent glass tint.
 *
 * The element stays a react-native-web `Animated.View` because the capsule
 * radius is animated by reanimated on every minimize frame. The two web-only
 * declarations ride in the STYLE object rather than a CSS class: react-native-
 * web does not forward `className` to the DOM (its `forwardedProps` list has no
 * `className`, and `createDOMProps` overwrites the attribute with the atomic
 * class it generates), whereas unknown style properties ARE passed straight
 * through its style compiler. That is the same route `Dialog.web.tsx` uses for
 * its `animation` shorthand. No stylesheet needs injecting here: there is no
 * `@keyframes` or pseudo-class involved, so nothing that an inline declaration
 * cannot express.
 *
 * Browsers without `backdrop-filter` simply skip it and are left with the
 * translucent tint — a graceful degradation that needs no `@supports` rule.
 */
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { TabBarSurfaceProps } from './shared';

/**
 * Blur radius of the web glass, in px. Tuned to read like the iOS 26 `regular`
 * glass under the same 55%-alpha tint: enough to dissolve text scrolling
 * underneath without smearing large shapes into mush. The saturation boost is
 * what keeps colors behind the bar from going flat and grey.
 */
const GLASS_BLUR_PX = 24;
const GLASS_FILTER = `blur(${GLASS_BLUR_PX}px) saturate(180%)`;

// Web-only CSS, unknown to React Native's `ViewStyle`. Both spellings are set:
// Safari still needs the prefixed property for `backdrop-filter`.
const glassFilterStyle = {
  backdropFilter: GLASS_FILTER,
  WebkitBackdropFilter: GLASS_FILTER,
} as ViewStyle;

export function TabBarSurface({ theme, style }: TabBarSurfaceProps) {
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        glassFilterStyle,
        { backgroundColor: theme.glassTint },
        style,
      ]}
    />
  );
}

TabBarSurface.displayName = 'TabBarSurface';
