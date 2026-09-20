import { View } from 'react-native';
import { applyIconColor } from '../frosted-icon-button/shared';
import type { TabBarGlyphProps } from '../tab-bar/shared';
/** Deliberately neutral: the universal shell never links Apple-only peers. */
export function BottomBarGlyph({ item, tint, size, active }: TabBarGlyphProps) {
  return <View style={{ height: size, alignItems: 'center', justifyContent: 'center' }}>{applyIconColor(active ? item.activeIcon ?? item.icon : item.icon, tint)}</View>;
}
