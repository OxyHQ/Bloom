/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos).
 *
 * The tab glyph on EVERY platform: renders the item's own `icon` node — or its
 * `activeIcon` on the active layer — tinted for this crossfade layer.
 *
 * `item.icon` is the icon API for the whole family — a Bloom icon element,
 * exactly like `TabsTrigger` and `FrostedIconButton` take. There is no platform
 * fork: Metro, web bundlers, a consumer's `tsc` and Jest all resolve this one
 * file (gate: `TabBarWebFork.test.ts`).
 */
import { View } from 'react-native';

import { applyIconColor } from '../frosted-icon-button/shared';
import { withGlyphBadge } from './glyph-badge';
import type { TabBarGlyphProps } from './shared';

export function TabBarGlyph({ item, tint, size, active }: TabBarGlyphProps) {
  // The tint is injected as the icon's `fill` FALLBACK — an icon that sets its
  // own `fill` (a brand mark, say) keeps it, so the crossfade layers simply
  // render it twice at full opacity and it never flickers.
  //
  // `activeIcon` is what makes the crossfade able to swap NODES: an icon set
  // whose selected state is a different SHAPE (outline → filled) cannot be
  // expressed by tinting one node two ways. Absent, the layer renders `icon`.
  return (
    <View style={{ height: size, alignItems: 'center', justifyContent: 'center' }}>
      {withGlyphBadge(
        applyIconColor(active ? (item.activeIcon ?? item.icon) : item.icon, tint),
        item.badge,
      )}
    </View>
  );
}

TabBarGlyph.displayName = 'TabBarGlyph';
