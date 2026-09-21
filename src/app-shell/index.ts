import { createAppShell } from './AppShell';
import { BottomBar } from '../bottom-bar';
import { Fab } from '../fab';
import { ContentPanel } from '../content-panel';
import { BloomColorScope } from '../theme/color-scope';
export const AppShell = createAppShell(BottomBar, Fab, ContentPanel, BloomColorScope);
export { AppShellHeader } from './AppShellHeader';
export { AppShellMenuButton } from './AppShellMenuButton';
export { APP_SHELL_DEFAULTS } from './constants';
export { useAppShell } from './context';
export type { AppShellContextValue } from './context';
export { NotificationBell } from './NotificationBell';
export { ProOfferCard } from './ProOfferCard';

export type {
  AppShellNavigationPlacement,
  AppShellNavigationItem,
  AppShellBarVisibility,
  AppShellBreakpoint,
  AppShellDrawer,
  AppShellPane,
  AppShellScroll,
  AppShellVariant,
  AppShellHeaderProps,
  AppShellMenuButtonProps,
  AppShellProps,
  NotificationBellProps,
  ProOfferCardProps,
} from './types';
