import { View } from 'react-native';
import { applyIconColor } from '../icons/apply-icon-color';
import { withGlyphBadge } from '../tab-bar/glyph-badge';
import type { TabBarGlyphProps } from '../tab-bar/shared';
/** Deliberately neutral: the universal shell never links Apple-only peers. */
export function BottomBarGlyph({ item, tint, size, active }: TabBarGlyphProps) {
  return (
    <View style={{ height: size, alignItems: 'center', justifyContent: 'center' }}>
      {withGlyphBadge(
        applyIconColor(active ? (item.activeIcon ?? item.icon) : item.icon, tint),
        item.badge,
      )}
    </View>
  );
}
