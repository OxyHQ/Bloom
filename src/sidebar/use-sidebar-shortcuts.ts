import { useEffect, useRef } from 'react';
import { isTextEntry } from '../overlay/modal-keyboard';
import { IS_WEB } from '../styles/platform';
import { matchesShortcut, parseShortcut } from './shortcuts';
import type { SidebarNavItem, SidebarProps } from './types';

type Bindings = Pick<
  SidebarProps,
  'items' | 'secondaryItems' | 'modes' | 'onModeChange' | 'onNavigate'
>;

/** What pressing a row does: its own action, else navigation to its link. */
export function sidebarItemAction(
  item: SidebarNavItem,
  onNavigate: SidebarProps['onNavigate'],
): (() => void) | undefined {
  if (item.onPress) return item.onPress;
  if (onNavigate && item.href != null) return () => onNavigate(item);
  return undefined;
}

/**
 * Web: an item's or a mode's declared `shortcut` does what pressing it does,
 * for as long as the sidebar is mounted. Ignored while typing in a field.
 *
 * An app mounting the same navigation twice (in flow and in a drawer) gets one
 * action per key press: the first sidebar to act marks the event handled
 * (`preventDefault`) and every other listener — another sidebar, or an app's
 * own older binding — stands down on a handled event.
 */
export function useSidebarShortcuts(bindings: Bindings) {
  // Read at key time, so a new closure over app state never re-subscribes.
  const latest = useRef(bindings);
  useEffect(() => {
    latest.current = bindings;
  });
  const declared = [
    ...(bindings.items ?? []),
    ...(bindings.secondaryItems ?? []),
    ...(bindings.modes ?? []),
  ].some((entry) => entry.shortcut);
  useEffect(() => {
    if (!IS_WEB || !declared || typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || isTextEntry(event.target)) return;
      const {
        items = [],
        secondaryItems = [],
        modes = [],
        onModeChange,
        onNavigate,
      } = latest.current;
      for (const mode of modes) {
        const shortcut = mode.shortcut ? parseShortcut(mode.shortcut) : undefined;
        if (!shortcut || !onModeChange || !matchesShortcut(event, shortcut)) continue;
        event.preventDefault();
        onModeChange(mode.key);
        return;
      }
      for (const item of [...items, ...secondaryItems]) {
        const shortcut = item.shortcut ? parseShortcut(item.shortcut) : undefined;
        const action =
          shortcut && matchesShortcut(event, shortcut) && sidebarItemAction(item, onNavigate);
        if (!action) continue;
        event.preventDefault();
        action();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [declared]);
}
