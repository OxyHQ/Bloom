import type { SidebarNavItem } from '../sidebar/types';
import type { AppShellSidebarProps } from './types';

/**
 * The sidebar as the modal drawer shows it: choosing anything in it — a row, an
 * action row, the compose action — closes the drawer first, so the reader sees
 * where they went rather than the drawer still over it.
 */
export function closingOnChoice(
  sidebar: AppShellSidebarProps,
  close: () => void,
): AppShellSidebarProps {
  function after<A extends unknown[]>(choose: (...args: A) => void) {
    return (...args: A) => {
      close();
      choose(...args);
    };
  }
  const rows = (items: SidebarNavItem[] | undefined) =>
    items?.map((item) => (item.onPress ? { ...item, onPress: after(item.onPress) } : item));
  return {
    ...sidebar,
    items: rows(sidebar.items),
    secondaryItems: rows(sidebar.secondaryItems),
    onNavigate: sidebar.onNavigate && after(sidebar.onNavigate),
    primaryAction: sidebar.primaryAction && {
      ...sidebar.primaryAction,
      onPress: after(sidebar.primaryAction.onPress),
    },
  };
}
