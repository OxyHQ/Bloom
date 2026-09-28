import { createTabBar, createTabBarButton } from '../tab-bar/TabBarBase';
import { TranslucentTabBarSurface } from '../tab-bar/surface-translucent';
import { ProgressiveBlur } from '../progressive-blur/index.web';
import { BottomBarGlyph } from './glyph';
import { BottomBarBase } from './BottomBarBase';
import type { BottomBarProps } from './types';
const Navigation = createTabBar(TranslucentTabBarSurface, ProgressiveBlur);
const Item = createTabBarButton(BottomBarGlyph);
export function BottomBar(props: BottomBarProps) {
  return <BottomBarBase {...props} Navigation={Navigation} Item={Item} Blur={ProgressiveBlur} />;
}
