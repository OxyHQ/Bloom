/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos).
 *
 * NATIVE variant of a tab glyph. Identical to the neutral variant except that
 * an item carrying an `sfSymbol` renders as a real SF Symbol on iOS: the system
 * glyph set, weight-matched to the platform and tinted natively.
 *
 * `expo-symbols` is imported STATICALLY and only here — Metro selects `.native`
 * on iOS/Android, so it never reaches a web bundle or a consumer's type-check
 * (see the neutral `glyph.tsx` sibling). Android has no SF Symbols, so it falls
 * through to the item's own icon node, which every item provides.
 */
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform, View } from 'react-native';

import { applyIconColor } from '../frosted-icon-button/shared';
import type { TabBarGlyphProps } from './shared';

export function TabBarGlyph({ item, tint, size, active }: TabBarGlyphProps) {
  if (item.sfSymbol && Platform.OS === 'ios') {
    // `TabBarItem.sfSymbol` is a plain `string` because `types.ts` may import
    // from react/react-native only — pulling `expo-symbols`' `SFSymbol` union
    // into the public type would drag a native-only package into every web
    // bundle and every consumer's type-check. The narrowing happens here, at
    // the single boundary where the symbol reaches the native view; an unknown
    // name renders nothing rather than crashing, which is why no runtime
    // validation is warranted.
    return (
      <SymbolView
        name={item.sfSymbol as SFSymbol}
        tintColor={tint}
        size={size}
        weight="semibold"
      />
    );
  }

  // Same node-swapping crossfade as the neutral variant: the active layer takes
  // `activeIcon` when the item has one. An SF Symbol never reaches here, and is
  // tinted natively above, so the tint crossfade remains its correct expression.
  return (
    <View style={{ height: size, alignItems: 'center', justifyContent: 'center' }}>
      {applyIconColor(active ? (item.activeIcon ?? item.icon) : item.icon, tint)}
    </View>
  );
}

TabBarGlyph.displayName = 'TabBarGlyph';
