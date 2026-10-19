/**
 * Ported from expo-glass-tabs v0.1.1 — src/index.ts
 * (MIT © 2026 David Mokos).
 *
 * DEFAULT entry for `@oxy.so/bloom/tab-bar`.
 *
 * The platform pieces are imported by their BARE relative name; the generated
 * web entry (`index.web.ts`, selected through the package's `browser` export
 * condition) names `../progressive-blur/index.web` instead. The glyph has no
 * fork: `glyph.tsx` renders the item's Bloom icon everywhere. Everything this
 * module reaches is free of native-only imports, so a consumer's `tsc` and a
 * non-Metro bundler resolve this entry cleanly.
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
