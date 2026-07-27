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
   * The glyph, as a Bloom icon element (`<Icons.Home_Stroke2_Corner0_Rounded />`)
   * or any node. Every `@oxyhq/bloom/icons` export carries its full style and
   * corner suffix; a shortened `Home` is not an export, and a name that does not
   * exist is simply `undefined`, which React then rejects as an invalid element
   * type. This is the primary icon API — same convention as `Tabs`/`TabsTrigger`
   * and `FrostedIconButton`. The bar renders it TWICE (an inactive layer with the
   * active layer crossfading on top), injecting the layer's tint as the icon's
   * `fill` unless the element already sets one. See {@link TabBarItem.activeIcon}
   * for a set whose selected state is a different shape rather than a tint.
   */
  icon: ReactNode;
  /**
   * Optional second node rendered by the ACTIVE crossfade layer instead of
   * `icon`; without it that layer renders `icon` again, which is the original
   * behaviour.
   *
   * For icon sets that express selection by SHAPE rather than by tint — an
   * outline glyph that becomes a filled one, with a different path — a tint
   * crossfade cannot say what the set says, because both layers would draw the
   * same shape in two colors. Supplying the filled variant here makes the
   * existing crossfade swap NODES, so the outline dissolves into the fill.
   *
   * It is also the escape hatch for an icon that ignores the injected tint: the
   * bar tints a glyph by cloning it with a `fill` prop (see `applyIconColor`),
   * so an icon set that paints from a `color` prop instead never lights up, with
   * no error. Pre-color both nodes yourself and the crossfade still works.
   *
   * On iOS an item carrying `sfSymbol` renders the symbol on both layers and
   * ignores this — a symbol is tinted natively, so the tint crossfade is the
   * right expression there.
   */
  activeIcon?: ReactNode;
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
  /**
   * Called with the index under the finger when a tab is pressed and HELD.
   *
   * This is the only way to reach a long press on the bar: its gesture detector
   * consumes the touches (that is what makes scrubbing possible), so a button's
   * own `onLongPress` never fires for a real finger. The gesture is added to the
   * bar's gesture race only when this prop is supplied — holding still for half
   * a second on a bar without it keeps behaving exactly as before, and can still
   * start a scrub.
   *
   * Long-pressing does NOT move the highlight or select the tab; it is a
   * secondary action (an account switcher on the profile tab, say).
   */
  onIndexLongPress?: (index: number) => void;
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
