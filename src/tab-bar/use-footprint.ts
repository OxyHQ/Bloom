/**
 * How much room the floating bar physically takes at the bottom of the window.
 *
 * The bar is `position: absolute` over the content, so nothing accounts for it
 * automatically — every screen under a tab layout has to keep its own content
 * out from under the pill. That number is built from the bar's private geometry
 * (its expanded height and the gap it holds off the window's bottom edge),
 * which is exactly why it is exported as a hook: hardcoding it in an app
 * silently drifts the moment the bar changes by a pixel.
 *
 * Platform-neutral, like the rest of the family — `react-native-safe-area-context`
 * is already a required Bloom peer and is what the bar itself measures with.
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EXPANDED_HEIGHT, tabBarBottomGap } from './shared';

/**
 * The vertical space the tab bar OCCUPIES above the bottom of the window, in
 * px: its own height plus its own bottom offset, and nothing else.
 *
 * It is deliberately the raw footprint, with no clearance folded in. Clearance
 * is a consumer decision and it differs per call site — a scroll view wants the
 * footprint plus a breathing gap so the last row clears the pill, while a
 * floating action button anchored by `bottom` already supplies its own gap and
 * wants the footprint bare. Baking a margin in here would place that FAB too
 * high and make one word mean two things inside a single file. Add your own:
 *
 * ```tsx
 * const footprint = useTabBarFootprint();
 *
 * <Animated.ScrollView contentContainerStyle={{ paddingBottom: footprint + 12 }} />
 * <Fab style={{ position: 'absolute', right: 16, bottom: footprint }} />
 * ```
 *
 * The value ALREADY INCLUDES the bottom safe-area inset — the bar folds the
 * inset into its own gap, so this is measured from the true window edge, not
 * from the safe area. Never write `footprint + insets.bottom`: that counts the
 * home indicator twice and strands a visible band of dead space under every
 * list (114px accounted for a 76px bar on an iOS device or PWA). Whatever you
 * add on top is your own clearance — never the inset a second time.
 *
 * It is the EXPANDED height, deliberately. The bar minimizes while scrolling
 * down and re-expands on the way up, so measuring the minimized height would
 * hide the end of a list the moment the user scrolled back to it.
 */
export function useTabBarFootprint(): number {
  const insets = useSafeAreaInsets();
  return tabBarBottomGap(insets.bottom) + EXPANDED_HEIGHT;
}
