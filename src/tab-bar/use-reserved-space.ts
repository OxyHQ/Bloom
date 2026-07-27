/**
 * How much room a screen must leave at the bottom for the floating bar.
 *
 * The bar is `position: absolute` over the content, so nothing reserves space
 * for it automatically — every scrollable screen under a tab layout has to pad
 * its own content out from under the pill. That number is built from the bar's
 * private geometry (its expanded height and the gap it keeps from the window's
 * bottom edge), which is exactly why it is exported as a hook: hardcoding it in
 * an app silently drifts the moment the bar changes by a pixel.
 *
 * Platform-neutral, like the rest of the family — `react-native-safe-area-context`
 * is already a required Bloom peer and is what the bar itself measures with.
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EXPANDED_HEIGHT, tabBarBottomGap } from './shared';

/**
 * The vertical space the tab bar occupies above the bottom of the window, in
 * px. Use it directly as the bottom padding (or bottom offset) of anything that
 * would otherwise sit under the bar:
 *
 * ```tsx
 * const reserved = useTabBarReservedSpace();
 *
 * <Animated.ScrollView contentContainerStyle={{ paddingBottom: reserved }} />
 * <Fab style={{ position: 'absolute', right: 16, bottom: reserved + 12 }} />
 * ```
 *
 * The value ALREADY INCLUDES the bottom safe-area inset — the bar folds the
 * inset into its own bottom gap, so it is measured from the true window edge,
 * not from the safe area. Never write `reserved + insets.bottom`: that counts
 * the home indicator twice and strands a visible band of dead space under every
 * list (a 76px bar reserving 110px on an iOS device or PWA). It is the whole
 * number; nothing needs adding to it.
 *
 * It is the EXPANDED height, deliberately. The bar minimizes while scrolling
 * down and re-expands on the way up, so reserving the minimized height would
 * hide the end of a list the moment the user scrolled back to it.
 */
export function useTabBarReservedSpace(): number {
  const insets = useSafeAreaInsets();
  return tabBarBottomGap(insets.bottom) + EXPANDED_HEIGHT;
}
