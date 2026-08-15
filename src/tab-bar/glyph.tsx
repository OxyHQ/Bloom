/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos).
 *
 * NEUTRAL default variant of a tab glyph: renders the item's own `icon` node —
 * or its `activeIcon` on the active layer — tinted for this crossfade layer.
 *
 * `item.icon` is the primary icon API for the whole family — a Bloom icon
 * element, exactly like `TabsTrigger` and `FrostedIconButton` take. `sfSymbol`
 * is an iOS-only enhancement and is deliberately ignored here: this file is
 * resolved by web bundlers and by a consumer's `tsc`, where a static
 * `expo-symbols` import would break resolution. See `glyph.native.tsx` for the
 * variant that consumes it. Both implement `TabBarGlyphProps` exactly.
 */
import { View } from 'react-native';

import { applyIconColor } from '../frosted-icon-button/shared';
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
      {applyIconColor(active ? (item.activeIcon ?? item.icon) : item.icon, tint)}
    </View>
  );
}

TabBarGlyph.displayName = 'TabBarGlyph';
