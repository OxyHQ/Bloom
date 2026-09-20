import { createTabBar, createTabBarButton } from '../tab-bar/TabBarBase';
import { SolidTabBarSurface } from '../tab-bar/surface-solid';
import { ProgressiveBlur } from '../progressive-blur';
import { BottomBarGlyph } from './glyph';
import { BottomBarBase } from './BottomBarBase';
import type { BottomBarProps } from './types';
const Navigation = createTabBar(SolidTabBarSurface, ProgressiveBlur);
const Item = createTabBarButton(BottomBarGlyph);
export function BottomBar(props: BottomBarProps) {
  return <BottomBarBase {...props} Navigation={Navigation} Item={Item} Blur={ProgressiveBlur} />;
}
