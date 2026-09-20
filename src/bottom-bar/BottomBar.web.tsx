import { createTabBar, createTabBarButton } from '../tab-bar/TabBarBase';
import { TabBarSurface } from '../tab-bar/surface.web';
import { ProgressiveBlur } from '../progressive-blur/index.web';
import { BottomBarGlyph } from './glyph';
import { BottomBarBase } from './BottomBarBase';
import type { BottomBarProps } from './types';
const Navigation = createTabBar(TabBarSurface, ProgressiveBlur);
const Item = createTabBarButton(BottomBarGlyph);
export function BottomBar(props: BottomBarProps) {
  return <BottomBarBase {...props} Navigation={Navigation} Item={Item} Blur={ProgressiveBlur} />;
}
