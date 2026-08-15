/**
 * Ported from expo-glass-tabs v0.1.1 — src/index.ts
 * (MIT © 2026 David Mokos).
 *
 * Entry for `@oxyhq/bloom/tab-bar/expo-router`. The components live in sibling
 * modules because this file is the published entry path and must stay stable;
 * the split also keeps the router bindings and the `TabSlot` renderer — which
 * pull `expo-router` and `react-native-screens` respectively — in separate
 * modules.
 */
export { RouterTabBar, RouterTabBarButton } from './RouterTabBar';
export type { RouterTabBarProps, RouterTabBarButtonProps } from './RouterTabBar';
export { renderFadingTabScreen } from './fading-tab-screen';
