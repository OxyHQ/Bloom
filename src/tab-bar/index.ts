/**
 * Ported from expo-glass-tabs v0.1.1 — src/index.ts
 * (MIT © 2026 David Mokos).
 *
 * DEFAULT entry for `@oxy.so/bloom/tab-bar`.
 *
 * The platform pieces are imported by their BARE relative name so Metro's
 * platform-extension resolution picks `glyph.native.tsx`
 * on iOS and Android, and every other resolver falls back to the neutral
 * `glyph.tsx`. The neutral file, and everything else this
 * module reaches, are free of native-only imports, so a consumer's `tsc` and a
 * non-Metro bundler resolve this entry cleanly. Web bundlers select
 * `index.web.tsx` instead, through the package's `browser` export condition.
 */
import { ProgressiveBlur } from '../progressive-blur';
import { createTabBar, createTabBarButton } from './TabBarBase';
import { TabBarGlyph } from './glyph';

export const TabBar = createTabBar(ProgressiveBlur);
export const TabBarButton = createTabBarButton(TabBarGlyph);

export {
  MINIMIZE_SPRING,
  setMinimized,
  TabBarMinimizeProvider,
  useExpandTabBar,
  useMinimizeOnScroll,
  useMinimizeState,
  useTabBarMinimized,
} from './context';
export type { MinimizeState } from './context';
export { useTabBarFootprint } from './use-footprint';
export type { TabBarButtonProps, TabBarItem, TabBarProps, TabBarTheme } from './types';
