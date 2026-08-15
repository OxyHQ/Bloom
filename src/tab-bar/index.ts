/**
 * Ported from expo-glass-tabs v0.1.1 — src/index.ts
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 *
 * DEFAULT entry for `@oxyhq/bloom/tab-bar`.
 *
 * The platform pieces are imported by their BARE relative name so Metro's
 * platform-extension resolution picks `surface.native.tsx` / `glyph.native.tsx`
 * on iOS and Android, and every other resolver falls back to the neutral
 * `surface.tsx` / `glyph.tsx`. Both neutral files, and everything else this
 * module reaches, are free of native-only imports, so a consumer's `tsc` and a
 * non-Metro bundler resolve this entry cleanly. Web bundlers select
 * `index.web.tsx` instead, through the package's `browser` export condition.
 */
import { ProgressiveBlur } from '../progressive-blur';
import { createTabBar, createTabBarButton } from './TabBarBase';
import { TabBarGlyph } from './glyph';
import { TabBarSurface } from './surface';

export const TabBar = createTabBar(TabBarSurface, ProgressiveBlur);
export const TabBarButton = createTabBarButton(TabBarGlyph);

export {
  MINIMIZE_SPRING,
  setMinimized,
  TabBarMinimizeProvider,
  useMinimizeOnScroll,
  useMinimizeState,
  useTabBarMinimized,
} from './context';
export type { MinimizeState } from './context';
export { useTabBarFootprint } from './use-footprint';
export type { TabBarButtonProps, TabBarItem, TabBarProps, TabBarTheme } from './types';
