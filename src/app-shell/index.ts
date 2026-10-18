import { createAppShell } from './AppShell';
import { BottomBar } from '../bottom-bar';
import { Fab } from '../fab';
import { ContentPanel } from '../content-panel';
import { BloomColorScope } from '../theme/color-scope';
import { createAppShellPanels } from './AppShellPanels';
import { createPanelLayoutView } from './AppShellPanelLayout';
import { ScrollArea, ScrollBar } from '../layout';
import { useScrollRestoration } from '../scroll';
const PanelLayoutView = createPanelLayoutView(
  ContentPanel,
  BloomColorScope,
  ScrollArea,
  ScrollBar,
  useScrollRestoration,
);
export const AppShell = createAppShell(BottomBar, Fab, PanelLayoutView);
export const { AppShellPanel, AppShellPanels } = createAppShellPanels(
  ContentPanel,
  BloomColorScope,
  PanelLayoutView,
);
export { AppShellHeader } from './AppShellHeader';
export { AppShellMenuButton } from './AppShellMenuButton';
export { APP_SHELL_DEFAULTS } from './constants';
export { useAppShell, useAppShellPanel, usePanelScrollContainer } from './context';
export { usePanelNavigation, useOptionalPanelNavigation } from './PanelNavigation';
export type {
  PanelAxis,
  ResponsivePanelAxis,
  AppShellPanelLayout,
  AppShellPanelDefinition,
  PanelNavigationEntry,
  PanelNavigationState,
  PanelNavigationController,
  PanelNavigationOptions,
} from './panel-layout-types';
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
