/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos).
 *
 * expo-router bindings for the tab bar. This subpath
 * (`@oxyhq/bloom/tab-bar/expo-router`) is the ONLY place in Bloom that may
 * import `expo-router` or `react-native-screens`, which is why it is a separate
 * entry: the core `@oxyhq/bloom/tab-bar` stays usable in an app with no router
 * at all, and neither optional peer is pulled into a bundle that never asks for
 * it.
 */
import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';

import { TabBar, TabBarButton } from '../index';
import type { TabBarItem, TabBarProps } from '../types';

/**
 * `activeIndex` is omitted deliberately: with a router the highlight is driven
 * by each trigger's own focus (see `RouterTabBarButton`), which is what keeps it
 * correct through deep links, back gestures and any other programmatic
 * navigation. Setting both would put two writers on one shared value.
 */
export type RouterTabBarProps = TabListProps & Omit<TabBarProps, 'activeIndex'>;

export type RouterTabBarButtonProps = TabTriggerSlotProps & {
  item: TabBarItem;
  /** Position in the bar — must match the trigger's order in the `TabList`. */
  index: number;
};

/**
 * The bar, as expo-router's `<TabList asChild>` child.
 *
 * Navigation happens through `onIndexChange`, not through the triggers: the
 * bar's gesture detector consumes the touches (that is what makes scrubbing
 * possible), so a tap never reaches the trigger's own `Pressable`.
 *
 * ```tsx
 * <TabList asChild>
 *   <RouterTabBar onIndexChange={(i) => router.navigate(TABS[i].href)}>
 *     {TABS.map(({ href, ...item }, index) => (
 *       <TabTrigger key={item.name} name={item.name} href={href} asChild>
 *         <RouterTabBarButton item={item} index={index} />
 *       </TabTrigger>
 *     ))}
 *   </RouterTabBar>
 * </TabList>
 * ```
 */
export function RouterTabBar({
  // `asChild` is `TabList`'s own instruction to forward its props to this
  // component instead of wrapping them in a `<View>`. It is consumed there and
  // is meaningless below, so it is dropped rather than passed to a real view.
  asChild: _asChild,
  ...props
}: RouterTabBarProps) {
  return <TabBar {...props} />;
}

RouterTabBar.displayName = 'RouterTabBar';

/**
 * One trigger, as expo-router's `<TabTrigger asChild>` child. The trigger
 * supplies `isFocused` and `onPress`; the button uses the first to drive the
 * highlight and the second to navigate on keyboard / assistive-technology
 * activation.
 */
export function RouterTabBarButton({
  item,
  index,
  // The trigger's resolved path, injected for react-native-web's anchor
  // rendering. `Pressable` has no such prop, and navigation already runs
  // through the bar's `onIndexChange`, so it stops here.
  href: _href,
  ...props
}: RouterTabBarButtonProps) {
  return <TabBarButton {...props} item={item} index={index} />;
}

RouterTabBarButton.displayName = 'RouterTabBarButton';
