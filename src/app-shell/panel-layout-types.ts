import type { ScrollRestorationPersistence } from '../scroll/types';
import type { ReactNode } from 'react';
import type { Breakpoint } from '../styles/breakpoints';
export type PanelAxis = 'horizontal' | 'vertical';
export type ResponsivePanelAxis =
  | PanelAxis
  | ({ base?: PanelAxis } & Partial<Record<Breakpoint, PanelAxis>>);
import type { AppShellBreakpoint, AppShellPanelProps } from './types';

export interface PanelNavigationEntry {
  key: string;
  name: string;
  params?: Readonly<Record<string, unknown>>;
}
export interface PanelNavigationState {
  entries: readonly PanelNavigationEntry[];
  index: number;
}
export interface PanelNavigationController extends PanelNavigationState {
  entry: PanelNavigationEntry;
  canGoBack: boolean;
  canGoForward: boolean;
  push(entry: Omit<PanelNavigationEntry, 'key'> & { key?: string }): void;
  replace(entry: Omit<PanelNavigationEntry, 'key'> & { key?: string }): void;
  /** Move atomically through this panel history, including controlled histories. */
  go(delta: number): void;
  back(): void;
  forward(): void;
}
export interface PanelNavigationOptions {
  initialEntries: readonly PanelNavigationEntry[];
  /** Optional host-owned scroll persistence, isolated to this panel. */
  scrollRestoration?: ScrollRestorationPersistence;
  /** Controlled history. Browser URL integration belongs to the host. */
  state?: PanelNavigationState;
  onNavigationChange?: (state: PanelNavigationState) => void;
  render(entry: PanelNavigationEntry, navigation: PanelNavigationController): ReactNode;
}
export interface AppShellPanelDefinition extends Omit<AppShellPanelProps, 'children' | 'id'> {
  id: string;
  /** Explicit semantic visibility, independent of responsive eligibility. */
  visible?: boolean;
  /** Mount even when initially hidden (for persistent host routers). */
  keepMounted?: boolean;
  content?: ReactNode;
  /** Host controls composed into the route Screen's existing PageHeader actions. */
  headerActions?: ReactNode;
  /** Horizontal document layout: follows the page until its bottom fits, then sticks. */
  sticky?: boolean;
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  onHeightChange?: (height: number) => void;
  /** Weight of a flexible track; default 1. */
  span?: number;
  navigation?: PanelNavigationOptions;
}
export interface AppShellPanelLayout {
  panels: readonly AppShellPanelDefinition[];
  mode?: 'split' | 'deck';
  /** Web horizontal decks use the document scrollbar by default. Native remains native-scrolling. */
  horizontalScroll?: 'document' | 'contained';
  /** Web document Deck: edge action revealed by hover/focus only at the logical scroll end. */
  trailingAction?: ReactNode;
  /** Resolves against the shell container, never a consumer window hook. */
  axis?: ResponsivePanelAxis;
  /** Document grows with the main panel; bounded panels own vertical scrolling. */
  flow?: 'document' | 'bounded';
  appearance?: 'separated' | 'joined';
  gap?: number;
  /** Measured shell width, rather than the capped reading envelope. */
  collapseBelow?: AppShellBreakpoint;
  /** Compact selection; in a document Deck, changing this also reveals that panel. */
  activePanel?: string;
  /** Occupies the eligible tracks without changing the shell envelope. */
  expandedPanel?: string;
  /** Controlled resting widths, shared by pointer and keyboard resizing. */
  heights?: Readonly<Record<string, number>>;
  onHeightsChange?: (heights: Readonly<Record<string, number>>) => void;
  widths?: Readonly<Record<string, number>>;
  onWidthsChange?: (widths: Readonly<Record<string, number>>) => void;
}
