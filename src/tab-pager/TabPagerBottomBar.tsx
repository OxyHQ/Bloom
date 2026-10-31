import { useCallback, useContext } from 'react';
import { BottomBar } from '../bottom-bar';
import type { BottomBarProps } from '../bottom-bar/types';
import { useHapticFeedback } from '../hooks/use-haptics';
import { TabPagerActiveContext, TabPagerChromeContext, useTabPagerContext } from './context';
import type { TabPagerBottomBarProps } from './types';

/**
 * What binds a `BottomBar` to the pager: the destinations with `bar` as its
 * items, the highlight following the pager frame by frame, the bar fading away
 * over a page without an item, a press doing what pressing that destination
 * does anywhere (`selectDestination`), a long press its `onLongPress`.
 */
export function useTabPagerBottomBar(
  onReselect?: (name: string) => void,
): Required<
  Pick<BottomBarProps, 'items' | 'value' | 'onValueChange' | 'activeProgress' | 'hideProgress'>
> &
  Pick<BottomBarProps, 'onValueLongPress'> {
  const { model, progress, chromeProgress, selectDestination } = useTabPagerContext();
  const { activeIndex, activePage } = useContext(TabPagerActiveContext);
  const { destinations, barItems } = useContext(TabPagerChromeContext);
  const haptics = useHapticFeedback();
  // An unmatched value is the bar's "no selection": a pushed route, or a page
  // that draws no item.
  const value = activePage !== null && model.barIndexOf(activeIndex) >= 0 ? activePage : '';
  const onValueChange = useCallback(
    (name: string) => {
      haptics.tap();
      if (onReselect && name === value) onReselect(name);
      else selectDestination(name);
    },
    [haptics, value, onReselect, selectDestination],
  );
  const onValueLongPress = useCallback(
    (name: string) =>
      destinations.find((destination) => destination.name === name)?.onLongPress?.(),
    [destinations],
  );
  return {
    items: barItems,
    value,
    onValueChange,
    // Only when something answers it: the bar adds a gesture for it.
    onValueLongPress: destinations.some((destination) => destination.onLongPress)
      ? onValueLongPress
      : undefined,
    activeProgress: progress,
    hideProgress: chromeProgress,
  };
}

/**
 * `BottomBar` bound to the tab pager. An `AppShell` under a `TabPagerProvider`
 * draws one on its own; render this only to replace the shell's. Everything
 * else is `BottomBar`'s own props — `action` for a compose button,
 * `minimizeProgress`.
 */
export function TabPagerBottomBar({ onReselect, ...props }: TabPagerBottomBarProps) {
  const { onValueLongPress, ...bound } = useTabPagerBottomBar(onReselect);
  return <BottomBar onValueLongPress={onValueLongPress} {...props} {...bound} />;
}
