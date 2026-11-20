/**
 * iOS: the system tab bar (expo-router's `NativeTabs`, a UITabBarController,
 * on Liquid Glass on iOS 26) over the provider's pages. A page with a bar item
 * is a tab; the `AppLayout`'s primary destination is a tab too, drawn on its
 * own surface (`prominent`, iOS 27); every other page is a hidden tab, reached
 * by `selectTab`. Each glyph is its icon's SF Symbol (`sfSymbols` in the spec);
 * an icon without one, the reader's own avatar, draws the label alone.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import { useContext } from 'react';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTabPager } from '@oxy.so/bloom/tab-pager';
import type { SFSymbol } from 'sf-symbols-typescript';

import { sfSymbolOf } from '../platform/sf-symbol';
import { PrimaryDestinationContext } from './primary';

export function TabViewHost() {
  const { pages } = useTabPager();
  const primary = useContext(PrimaryDestinationContext);
  return (
    <NativeTabs>
      {pages.map((page) => {
        const prominent = primary?.destination === page.name;
        const label = prominent ? primary.label : page.label;
        const glyph = sfSymbolOf(prominent ? primary.icon : page.icon) as SFSymbol | undefined;
        const selected = prominent
          ? undefined
          : (sfSymbolOf(page.activeIcon) as SFSymbol | undefined);
        return (
          <NativeTabs.Trigger
            key={page.name}
            name={page.name}
            hidden={!(page.bar || prominent)}
            prominent={prominent}
          >
            <NativeTabs.Trigger.Label>{label}</NativeTabs.Trigger.Label>
            {glyph ? (
              <NativeTabs.Trigger.Icon sf={selected ? { default: glyph, selected } : glyph} />
            ) : null}
            {page.badge ? (
              <NativeTabs.Trigger.Badge>{String(page.badge)}</NativeTabs.Trigger.Badge>
            ) : null}
          </NativeTabs.Trigger>
        );
      })}
    </NativeTabs>
  );
}
