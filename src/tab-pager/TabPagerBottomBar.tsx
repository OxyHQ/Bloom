import { useCallback, useContext } from 'react';
import { BottomBar } from '../bottom-bar';
import { useHaptics } from '../hooks/use-haptics';
import { TabPagerItemsContext, useTabPagerContext } from './context';
import type { TabPagerBottomBarProps } from './types';

/**
 * `BottomBar` bound to the tab pager, for `AppShell`'s `bottomBar` slot.
 *
 * Its items are the pages that declare one; the highlight follows the pager
 * frame by frame, the bar fades away over a page without an item, and a press
 * selects that page. Everything else is `BottomBar`'s own props — `action` for a
 * compose button, `onValueLongPress`, `minimizeProgress`.
 */
export function TabPagerBottomBar({ onReselect, ...props }: TabPagerBottomBarProps) {
  const { model, activeIndex, activePage, progress, chromeProgress, selectTab } =
    useTabPagerContext();
  const items = useContext(TabPagerItemsContext);
  const impact = useHaptics();
  // An unmatched value is the bar's "no selection": a pushed route, or a page
  // that draws no item.
  const value = activePage !== null && model.barIndexOf(activeIndex) >= 0 ? activePage : '';
  const onValueChange = useCallback(
    (name: string) => {
      impact('light');
      if (name === value) onReselect?.(name);
      else selectTab(name);
    },
    [impact, value, onReselect, selectTab],
  );
  return (
    <BottomBar
      {...props}
      items={items}
      value={value}
      onValueChange={onValueChange}
      activeProgress={progress}
      hideProgress={chromeProgress}
    />
  );
}
