import type { ScrollRestorationPersistence } from '../scroll/types';
import type { ReactNode, Ref } from 'react';
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
  /** Opt in to the layout's controlled reordering. Fixed and hidden panel slots stay in place. */
  reorderable?: boolean;
  /** Human-readable panel name used by the reorder handle and announcements. */
  reorderLabel?: string;
  /** Explicit semantic visibility, independent of responsive eligibility. */
  visible?: boolean;
  content?: ReactNode;
  /** Host controls composed into the route Screen's existing PageHeader actions. */
  headerActions?: ReactNode;
  /** Panel footer composed below the route Screen bottom bar, measured and pinned by that Screen. */
  bottomBar?: ReactNode;
  /** Horizontal document layout: follows the page until its bottom fits, then sticks. */
  sticky?: boolean;
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  onHeightChange?: (height: number) => void;
  /** Weight of a flexible track; default 1 in split layouts.
   * In a deck, an explicit positive span shares spare room without shrinking the width basis.
   */
  span?: number;
  navigation?: PanelNavigationOptions;
}
/** A transient user action, not persisted selection or restoration state. */
export interface PanelRevealRequest {
  id: string;
  /** Change this key to reveal the same panel again. */
  requestKey: string | number;
}
/** The compositor's scroll owner, independent of DOM and native ScrollView handles. */
export interface AppShellPanelViewport {
  getOffset(): { x: number; y: number };
  measure(): Promise<{ x: number; y: number; width: number; height: number } | null>;
  scrollBy(offset: { x?: number; y?: number }): void;
  reveal(id: string): void;
}
export interface AppShellPanelLayout {
  panels: readonly AppShellPanelDefinition[];
  /** Access the existing viewport for domain gestures, without nesting another scroller. */
  viewportRef?: Ref<AppShellPanelViewport>;
  onViewportScroll?: (offset: { x: number; y: number }) => void;
  /** Commit a full ID permutation after a handle drag or keyboard move. The host applies this order. */
  onPanelOrderChange?: (ids: readonly string[]) => void;
  mode?: 'split' | 'deck';
  /** Fade outgoing panels before moving tracks, then reveal incoming content at its settled width. */
  transition?: 'simultaneous' | 'exit-before-enter';
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
  /** Compact selection only. Restoring or changing selection never scrolls the document. */
  activePanel?: string;
  /** Explicitly reveal a panel in a horizontal document Deck, once per id/key pair. */
  revealPanel?: PanelRevealRequest;
  /** Occupies the eligible tracks without changing the shell envelope. */
  expandedPanel?: string;
  /** Controlled resting widths, shared by pointer and keyboard resizing. */
  heights?: Readonly<Record<string, number>>;
  onHeightsChange?: (heights: Readonly<Record<string, number>>) => void;
  widths?: Readonly<Record<string, number>>;
  onWidthsChange?: (widths: Readonly<Record<string, number>>) => void;
}
