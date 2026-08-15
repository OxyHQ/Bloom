/**
 * Ported from expo-glass-tabs v0.1.1 — src/index.ts
 * (MIT © 2026 David Mokos).
 *
 * WEB entry for `@oxyhq/bloom/tab-bar`, selected through the package's
 * `browser` export condition.
 *
 * The web modules are imported by their FULL `.web` name on purpose. Inside the
 * published `lib/` every file is plain `.js` (`surface.js` next to
 * `surface.web.js`), and no web bundler resolves a bare `./surface` to the
 * `.web` sibling by extension — only Metro does that. Writing the fork path
 * explicitly is the same thing the generated root barrel does
 * (`src/index.web.ts` → `from './dialog/index.web'`). `./glyph` has no web fork:
 * the neutral file already renders `item.icon`, which is the correct web
 * behaviour, and it is what any resolver lands on here.
 */
import { ProgressiveBlur } from '../progressive-blur/index.web';
import { createTabBar, createTabBarButton } from './TabBarBase';
import { TabBarGlyph } from './glyph';
import { TabBarSurface } from './surface.web';

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
