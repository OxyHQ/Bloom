/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 *
 * Public API types for `@oxyhq/bloom/tab-bar`.
 *
 * This module imports from `react` and `react-native` ONLY. It is resolved by a
 * consumer's `tsc`, by Metro, and by every web bundler alike, so a platform
 * import here (expo-glass-effect / expo-symbols / expo-router) would break all
 * three at once. Platform behaviour lives in `surface.native.tsx` /
 * `glyph.native.tsx` / `surface.web.tsx` and the `expo-router/` adapter.
 */
import type { ReactNode } from 'react';
import type { PressableProps, ViewProps } from 'react-native';

export type TabBarItem = {
  /** Stable identity for the tab (a route name in router-driven usage). */
  name: string;
  /** Text under the icon; fades out and is clipped when the bar minimizes. */
  label: string;
  /**
   * The glyph, as a Bloom icon element (`<Icons.Home />`) or any node. This is
   * the primary icon API — same convention as `Tabs`/`TabsTrigger` and
   * `FrostedIconButton`. The bar renders it TWICE (an inactive layer with the
   * active layer crossfading on top), injecting the layer's tint as the icon's
   * `fill` unless the element already sets one.
   */
  icon: ReactNode;
  /**
   * Optional SF Symbol name, used INSTEAD of `icon` on iOS only. A pure
   * enhancement handled solely in `glyph.native.tsx`; the neutral and web
   * glyphs ignore it and render `icon`, so every platform stays covered.
   */
  sfSymbol?: string;
};

export type TabBarTheme = {
  /** Label/glyph color of the tab the highlight is over. */
  activeTint: string;
  /** Label/glyph color of every other tab. */
  inactiveTint: string;
  /** Sliding highlight pill color. */
  highlight: string;
  /** Tint layered over the liquid glass (iOS 26) surface. */
  glassTint: string;
  /** Near-opaque background used when liquid glass is unavailable. */
  solidFallback: string;
};

export type TabBarProps = ViewProps & {
  /**
   * CONTROLLED path — the index of the focused tab. The bar owns the sliding
   * highlight and springs it here whenever this changes. Use this when there is
   * no router in play; the router adapter uses the per-button `isFocused` path
   * instead (see {@link TabBarButtonProps.isFocused}) and must NOT pass this.
   */
  activeIndex?: number;
  /**
   * Called with the chosen index when a tab is picked by tap, by scrub release,
   * or by keyboard/assistive-technology activation of a `TabBarButton`.
   */
  onIndexChange?: (index: number) => void;
  /** Partial override of the theme resolved from Bloom's color tokens. */
  theme?: Partial<TabBarTheme>;
  /**
   * Haptic tick as the scrub crosses tab boundaries. Defaults to `true`. Runs
   * through Bloom's `useHaptics`, so it is already a no-op on web and when the
   * optional `expo-haptics` peer is absent.
   */
  haptics?: boolean;
};

export type TabBarButtonProps = PressableProps & {
  item: TabBarItem;
  /** Position in the bar. Drives the highlight target and the glyph crossfade. */
  index: number;
  /**
   * FOCUS-DRIVEN path — supplied by the `expo-router` adapter from the tab
   * trigger's own focus state. When present it wins over the bar's
   * `activeIndex`, and this button (not the bar) drives the highlight, which is
   * what makes programmatic navigation, deep links and back gestures move it.
   *
   * Leave it undefined for the controlled path: the button then resolves its
   * focus from the bar's `activeIndex` and reports presses through the bar's
   * `onIndexChange`.
   */
  isFocused?: boolean;
};
