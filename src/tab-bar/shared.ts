/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos).
 *
 * Geometry, motion constants, theme resolution and the contracts for the two
 * injected platform components. Everything here is platform-neutral — no
 * expo-glass-effect, expo-symbols, expo-router or react-native-screens — because
 * this module is pulled into the native bundle, the web bundle and a consumer's
 * `tsc` alike.
 */
import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';

import { withAlpha } from '../theme/color-utils';
import type { ThemeColors } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import type { TabBarItem, TabBarTheme } from './types';

// ---------------------------------------------------------------------------
//  Geometry
//
//  Every dimension the bar animates is a constant here rather than a measured
//  layout: the highlight's position, the item box height and the capsule radius
//  are all derived from these on the UI thread each frame. Measuring instead
//  would put a layout round-trip between the finger and the pixels.
// ---------------------------------------------------------------------------

export const EXPANDED_HEIGHT = 58;
export const MINIMIZED_HEIGHT = 44;
/** Extra horizontal inset applied to the pill when minimized (per side). */
export const MINIMIZED_INSET = 34;
/** Outer margin between the pill and the screen edges (per side). */
export const BAR_MARGIN = 12;
/** Inner inset between the capsule wall and the tab items. */
export const ROW_PAD_H = 4;
export const LABEL_HEIGHT = 13;
export const ICON_SIZE = 21;
/**
 * Space between icon and label — folded into the label's animated height so it
 * fully disappears when minimized (keeps the icon perfectly centered).
 */
export const ITEM_GAP = 2;
export const LABEL_BLOCK = LABEL_HEIGHT + ITEM_GAP;
export const ITEM_PAD_V = 7;
/** Highlight content heights — radius must track h/2 for a true capsule. */
export const HIGHLIGHT_EXPANDED = ICON_SIZE + LABEL_BLOCK + ITEM_PAD_V * 2;
export const HIGHLIGHT_MINIMIZED = ICON_SIZE + ITEM_PAD_V * 2;
/** How far the bottom progressive blur bleeds above the pill. */
export const BLUR_BLEED = 44;
/** Label type size. Small by design — the icon carries the meaning. */
export const LABEL_FONT_SIZE = 9.5;

/**
 * How much of the bottom safe-area inset the bar's own gap absorbs. The pill
 * already floats clear of the content, so sitting the FULL inset below it
 * strands it in the middle of the screen on a home-indicator device.
 */
const SAFE_AREA_ABSORBED = 16;
/** Gap floor, for a device (or a browser) reporting no bottom inset at all. */
const MIN_BOTTOM_GAP = 12;

/**
 * Vertical gap between the bottom of the pill and the bottom of the window.
 *
 * The safe-area inset is folded in HERE, which is why anything accounting for
 * the bar in its own layout must go through `useTabBarFootprint` (which derives
 * its number from this same function) rather than adding `insets.bottom` to a
 * hardcoded height — that double-counts the inset.
 */
export function tabBarBottomGap(bottomInset: number): number {
  return Math.max(bottomInset - SAFE_AREA_ABSORBED, MIN_BOTTOM_GAP);
}

/**
 * Slide spring: interruptible by design — rapid tab-hopping retargets with
 * preserved velocity. Slight under-damping gives the pill a tiny settle, safe
 * here because it's transform-only (no layout involved).
 */
export const SLIDE_SPRING = { duration: 420, dampingRatio: 0.82 };

/**
 * Fade for the highlight coming and going when the selection does — an
 * `activeIndex` that names no tab (see `TabBarProps.activeIndex`).
 *
 * A timing, not a spring, and deliberately shorter than {@link SLIDE_SPRING}:
 * appearing and disappearing is a change of STATE, not a movement, so it must
 * not read as a second animation racing the slide. The capsule fades where it
 * stands — moving it out of view instead would drag it the length of the bar on
 * its way out and sweep the active tint across every tab it passed.
 */
export const HIGHLIGHT_FADE = { duration: 160 };

/**
 * How long a press must be held before `onIndexLongPress` fires.
 *
 * Comfortably above the tap gesture's own 400ms ceiling: the two can never both
 * be candidates at the same instant, so arming the long press cannot cost the
 * bar a tap. Matches the platform long-press feel (iOS ~0.5s).
 */
export const LONG_PRESS_MIN_DURATION = 500;

// ---------------------------------------------------------------------------
//  Theme
// ---------------------------------------------------------------------------

/**
 * Resolve the bar's five colors from Bloom's theme tokens, with an optional
 * partial override on top.
 *
 * Upstream hardcoded a dark palette (`#FFFFFF` / `rgba(10,10,12,0.55)` / …),
 * which would ignore the active preset and read as a black bar in a light
 * theme. Each role maps onto the token that already carries that meaning, so
 * the bar follows `BloomThemeProvider` for free:
 *
 *   - the two tints are the standard foreground pair;
 *   - the highlight is `contrast50`, the token meant for a subtle raised fill;
 *   - the glass tint is a 55%-alpha page background, so the liquid-glass
 *     material behind it still refracts content;
 *   - the solid fallback is a 94%-alpha `backgroundSecondary` — near-opaque, so
 *     the bar reads as a distinct surface where there is no glass to lens.
 *
 * Overrides are coalesced key by key (not spread) so an explicit `undefined` in
 * a partial can never punch a hole in the resolved theme.
 */
export function resolveTabBarTheme(
  colors: ThemeColors,
  overrides?: Partial<TabBarTheme>,
): TabBarTheme {
  return {
    activeTint: overrides?.activeTint ?? colors.text,
    inactiveTint: overrides?.inactiveTint ?? colors.textSecondary,
    highlight: overrides?.highlight ?? colors.contrast50,
    glassTint: overrides?.glassTint ?? withAlpha(colors.background, 0.55),
    solidFallback: overrides?.solidFallback ?? withAlpha(colors.backgroundSecondary, 0.94),
  };
}

/**
 * Hook form of {@link resolveTabBarTheme}.
 *
 * Memoized on the individual override VALUES rather than on the `overrides`
 * object: callers pass an inline literal (`theme={{ highlight: '#…' }}`), whose
 * identity changes every render. The resolved theme feeds a React context and a
 * reanimated dependency array, so a fresh identity per render would re-render
 * every button and rebuild the label mapper for nothing.
 */
export function useTabBarTheme(overrides?: Partial<TabBarTheme>): TabBarTheme {
  const { colors } = useTheme();
  const { activeTint, inactiveTint, highlight, glassTint, solidFallback } = overrides ?? {};

  return useMemo(
    () =>
      resolveTabBarTheme(colors, {
        activeTint,
        inactiveTint,
        highlight,
        glassTint,
        solidFallback,
      }),
    [colors, activeTint, inactiveTint, highlight, glassTint, solidFallback],
  );
}

// ---------------------------------------------------------------------------
//  Injected platform components
//
//  `TabBarBase` is platform-agnostic and receives its two platform-specific
//  pieces as component props (the same shape as `BottomSheetBase`'s `Shell`).
//  The three surface variants and the two glyph variants implement these exact
//  signatures, which is what makes the resolution paths interchangeable:
//  Metro picks `*.native.tsx`, the `browser` export condition picks the entry
//  that imports `*.web.tsx`, everything else gets the neutral file.
// ---------------------------------------------------------------------------

export interface TabBarSurfaceProps {
  /** Resolved theme — the surface picks `glassTint` or `solidFallback`. */
  theme: TabBarTheme;
  /**
   * Animated capsule shape (a `borderRadius` tracking the animated height).
   * It rides on the surface itself rather than on a clipping parent: iOS 26
   * glass renders its own native corner configuration (true squircle + rim
   * lighting), which an RN mask would flatten.
   *
   * Typed through `AnimatedStyle` because this always receives a
   * `useAnimatedStyle` result, which reanimated 4.5 returns as an opaque
   * `AnimatedStyleHandle` rather than the plain style object 4.2 handed back.
   * Same reason `BottomSheetProps.style` is typed this way. Every variant
   * forwards it into an `Animated.View` (or an animated `GlassView`), so the
   * wider type is what they genuinely accept.
   */
  style: StyleProp<AnimatedStyle<ViewStyle>>;
}

export interface TabBarGlyphProps {
  item: TabBarItem;
  /** Color for THIS layer — the bar renders one glyph per crossfade layer. */
  tint: string;
  /** Rendered icon size in px ({@link ICON_SIZE}). */
  size: number;
  /**
   * Which crossfade layer this is: `false` for the inactive one underneath,
   * `true` for the one fading in on top. The active layer renders
   * `item.activeIcon` when the item has one, so a set that expresses selection
   * by shape (outline → filled) crossfades between two different nodes rather
   * than between two tints of the same node.
   */
  active: boolean;
}
