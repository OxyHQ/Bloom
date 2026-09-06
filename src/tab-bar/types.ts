/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos).
 *
 * Public API types for `@oxyhq/bloom/tab-bar`.
 *
 * This module names no PLATFORM package. It is resolved by a consumer's `tsc`,
 * by Metro, and by every web bundler alike, so an import here of
 * expo-glass-effect / expo-symbols / expo-router / react-native-screens would
 * break all three at once. Platform behaviour lives in `surface.native.tsx` /
 * `glyph.native.tsx` / `surface.web.tsx` and the `expo-router/` adapter; the
 * gate is `src/__tests__/TabBarWebFork.test.ts`.
 *
 * `react-native-reanimated` is exempt and always was: it is a REQUIRED peer that
 * every neutral module in this family already imports at runtime
 * (`TabBarBase.tsx`), and the one reference below is `import type`, erased
 * before any bundler sees it.
 */
import type { ReactNode } from 'react';
import type { PressableProps, ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

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
   *
   * An index that names NO tab — negative, past the last tab, or fractional —
   * means no selection: the highlight fades out where it stands and no tab is
   * left tinted. Pass one whenever the current screen is not a tab; an index
   * derived from the route (`TABS.findIndex(…)`) is `-1` on every such screen
   * and is correct as-is. Returning to a real index fades the highlight back in
   * AT that tab rather than sliding to it — while it was invisible there was no
   * position to travel from — and scrubbing still arms it under the finger.
   *
   * OMITTING this prop is a different thing entirely and does not hide
   * anything: that is the focus-driven path, where each button drives the
   * highlight from its own `isFocused`.
   */
  activeIndex?: number;
  /**
   * DRIVEN path — the highlight's live position, in TAB UNITS, on the UI thread.
   * A pager writes its own page position here (`1.4` is 40% of the way from the
   * second tab to the third) and the highlight tracks the finger 1:1 instead of
   * springing to a settled index after the navigation commits.
   *
   * It says WHERE the highlight is, never WHETHER there is one. Selection stays
   * with the path already in play: `activeIndex` when the bar is controlled (an
   * index naming no tab still fades the highlight out — see above), each
   * button's `isFocused` when it is not. Passing this alone, with neither, is a
   * bar that is always selected, which is what the focus-driven path already
   * means.
   *
   * PRECEDENCE, because a shared value with two writers is a race: the SCRUB
   * always wins — a finger on the bar is a direct manipulation of the bar, and
   * releasing it reports through `onIndexChange` like any other selection. Below
   * that, this value wins over every discrete writer: while it is supplied, the
   * controlled effect, the focus effect and a `TabBarButton`'s own press all
   * stop writing the position and leave it to the driver. So a consumer that
   * passes this must keep it truthful — spring it to the settled index after a
   * commit, and after any navigation it did not cause (a deep link, a back
   * gesture), or the highlight stays where the last gesture left it.
   */
  activeProgress?: SharedValue<number>;
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
  /**
   * The progressive blur rising from the bottom edge of the screen behind the
   * pill. Defaults to `true`; `{ intensity }` tunes its strength.
   *
   * Pass `false` to remove it entirely — no blur, and no node left behind. The
   * band is tall (the bar's own bottom gap plus its expanded height plus the
   * bleed above it, 114pt at a zero bottom inset) and full-bleed, so anything a
   * screen floats near the bottom edge — a video scrubber, a FAB — sits INSIDE
   * it and is blurred. That cannot be undone from the outside: `zIndex` only
   * orders siblings within one stacking context, and a screen's FAB is inside
   * an earlier sibling of the bar's host, so no z-order a consumer can write
   * lifts it above this band. Turning the blur off is the only fix that does
   * not also change where the FAB paints relative to everything else.
   *
   * On native the band is ten stacked `expo-blur` layers plus a tail gradient;
   * on web it is one masked `backdrop-filter`. `false` skips both.
   */
  blur?: boolean | { intensity?: number };
  /**
   * Maximum width of the pill, in points. No default — omit it and the bar
   * spans the window exactly as it always has.
   *
   * A CEILING, never a floor: on a window narrower than this the bar keeps its
   * full-bleed width, so a phone layout is untouched by any value big enough to
   * matter on a tablet. When it binds, the pill is constrained to this width and
   * CENTRED, and the ITEM geometry follows it — the item width, the sliding
   * highlight's position and the tap/scrub hit-testing all derive from the same
   * constrained width, so a tap still lands on the tab it is visibly over.
   *
   * That last part is why this cannot be done from the outside. Narrowing the
   * bar with a `style` override moves the pixels only: the highlight and the
   * scrub worklet would still divide the WINDOW width by the tab count, leaving
   * the highlight sized and positioned for a bar that is no longer there. On an
   * iPad the unconstrained bar is the reason to reach for this at all — 810pt at
   * 11" portrait, 1342pt in landscape, leaving 21pt glyphs adrift in cells
   * hundreds of points wide.
   */
  maxWidth?: number;
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
