import { createAppShell } from './AppShell';
import { BottomBar } from '../bottom-bar';
import { Fab } from '../fab';
import { ContentPanel } from '../content-panel';
import { BloomColorScope } from '../theme/color-scope';
import { createAppShellPanels } from './AppShellPanels';
export const AppShell = createAppShell(BottomBar, Fab);
export const { AppShellPanel, AppShellPanels } = createAppShellPanels(
  ContentPanel,
  BloomColorScope,
);
export { AppShellHeader } from './AppShellHeader';
export { AppShellMenuButton } from './AppShellMenuButton';
export { APP_SHELL_DEFAULTS } from './constants';
export { useAppShell, useAppShellPanel } from './context';
export type { AppShellContextValue, AppShellPanelValue } from './context';
export { NotificationBell } from './NotificationBell';
export { ProOfferCard } from './ProOfferCard';

export type {
  AppShellNavigationPlacement,
  AppShellNavigationItem,
  AppShellBarVisibility,
  AppShellBreakpoint,
  AppShellDrawer,
  AppShellScroll,
  AppShellVariant,
  AppShellHeaderProps,
  AppShellMenuButtonProps,
  AppShellProps,
  AppShellPanelProps,
  AppShellPanelsProps,
  NotificationBellProps,
  ProOfferCardProps,
} from './types';
