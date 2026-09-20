import { createAppShell } from './AppShell';
import { BottomBar } from '../bottom-bar';
import { Fab } from '../fab';
export const AppShell = createAppShell(BottomBar, Fab);
export { AppShellHeader } from './AppShellHeader';
export { NotificationBell } from './NotificationBell';
export { ProOfferCard } from './ProOfferCard';

export type {
  AppShellNavigationPlacement,
  AppShellNavigationItem,
  AppShellHeaderProps,
  AppShellProps,
  NotificationBellProps,
  ProOfferCardProps,
} from './types';
