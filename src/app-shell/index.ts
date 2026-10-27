import { Screen, ScreenScrollView } from '../screen';
import { createAppShell } from './AppShell';
import { BottomBar } from '../bottom-bar';
import { Fab } from '../fab';
import { ContentPanel } from '../content-panel';
import { BloomColorScope } from '../theme/color-scope';
import { createAppShellPanels } from './AppShellPanels';
import { createPanelLayoutView } from './AppShellPanelLayout';
import { ScrollArea, ScrollBar } from '../layout';
import { useScrollRestoration } from '../scroll';
import { Dialog } from '../dialog';
const PanelLayoutView = createPanelLayoutView(
  ContentPanel,
  BloomColorScope,
  ScrollArea,
  ScrollBar,
  useScrollRestoration,
  Dialog,
  Screen,
);
export const AppShell = createAppShell(
  BottomBar,
  Fab,
  { Screen, ScreenScrollView },
  PanelLayoutView,
  BloomColorScope,
);
export const { AppShellPanel, AppShellPanels } = createAppShellPanels(
  ContentPanel,
  BloomColorScope,
  PanelLayoutView,
  ScrollArea,
);
export { AppShellPanelVisibility } from './AppShellPanelVisibility';
export { AppShellHeader } from './AppShellHeader';
export { AppShellMenuButton } from './AppShellMenuButton';
export { APP_SHELL_DEFAULTS } from './constants';
export { useAppShell, useAppShellPanel, usePanelScrollContainer } from './context';
export { usePanelNavigation, useOptionalPanelNavigation } from './PanelNavigation';
export {
  PANEL_DROP_STAGES,
  PANEL_DROP_MOTION,
  PANEL_DROP_PREVIEW,
  panelDropZoneRect,
  resolvePanelDropTarget,
} from './panel-drop';
export type { PanelDropRect, ResolvePanelDropOptions } from './panel-drop';
export type {
  PanelAxis,
  ResponsivePanelAxis,
  AppShellPanelLayout,
  AppShellPanelViewport,
  PanelRevealRequest,
  AppShellPanelDrop,
  PanelDropEdge,
  PanelDropPoint,
  PanelDropStage,
  PanelDropTarget,
  AppShellPanelDefinition,
  PanelNavigationEntry,
  PanelNavigationState,
  PanelNavigationController,
  PanelNavigationOptions,
} from './panel-layout-types';
export type { AppShellContextValue, AppShellDockState, AppShellPanelValue } from './context';
export { NotificationBell } from './NotificationBell';
export { ProOfferCard } from './ProOfferCard';

export type {
  AppShellSidebarProps,
  AppShellDock,
  AppShellDockMotion,
  AppShellDockPeek,
  AppShellDockPeekChrome,
  AppShellEdge,
  AppShellEdges,
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
  AppShellPanelVisibilityProps,
  AppShellPanelsProps,
  NotificationBellProps,
  ProOfferCardProps,
} from './types';
