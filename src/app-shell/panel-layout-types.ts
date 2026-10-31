import type { ScrollRestorationPersistence } from '../scroll/types';
import type { ReactNode, Ref } from 'react';
import type { Breakpoint } from '../styles/breakpoints';
export type PanelAxis = 'horizontal' | 'vertical';
export type ResponsivePanelAxis =
  | PanelAxis
  | ({ base?: PanelAxis } & Partial<Record<Breakpoint, PanelAxis>>);
import type { AppShellBreakpoint, AppShellPanelProps } from './types';
import type { MotionSpec } from '../motion/spec';
import type { ResizeHandleVariant } from '../layout/types';

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
  /**
   * With `retain`: panels sharing a `stack` id share one slot of the layout,
   * stacked along the other axis in their array order. The slot's weight is
   * `spans[stack]`; each panel's share of it is `spans[id]`.
   */
  stack?: string;
  /**
   * With `retain`, how a panel with `visible: false` waits: `invisible`
   * (default) over the whole region, not painted; `behind`, over the whole
   * region under the shown panels, still painted, for content that draws
   * itself when asked (a page that slides in during a gesture). Inert and out
   * of the accessibility tree either way.
   */
  hiddenPresentation?: 'invisible' | 'behind';
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
  /** Chrome spanning the complete workspace. The group's Screen reserves it once.
   * In joined layouts it shares the group's one Surface. Use null to temporarily
   * hide it while preserving the content tree of a workspace with a header.
   */
  header?: ReactNode;
  /**
   * `scroll-under` keeps the workspace header above native panels while their
   * scroll content clears it; document-flow web keeps its inset header.
   * Defaults to `inset`.
   */
  headerPlacement?: 'inset' | 'scroll-under';
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
  /** Plain uses joined geometry while inheriting its enclosing Surface. */
  appearance?: 'separated' | 'joined' | 'plain';
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
  /** Controlled split weights. A resize between two flexible tracks (no `width`
   * of their own and none in `widths`) commits here instead of freezing pixels,
   * keeping their combined span and dividing it by the settled ratio, so the
   * proportion holds as the region resizes. Overrides each descriptor's `span`.
   */
  spans?: Readonly<Record<string, number>>;
  onSpansChange?: (spans: Readonly<Record<string, number>>) => void;
  /**
   * How the resize handles between panels draw: `grip` (default), a grip that
   * follows the pointer along the edge; `pill`, a 4×36 bar centred in the gap
   * that shows under the pointer and while dragging, its hit strip the gap
   * plus 2px of each pane.
   */
  resizeHandle?: ResizeHandleVariant;
  /** Edge targets for a drag the application owns (a tab, a file, a card). */
  drop?: AppShellPanelDrop;
  /**
   * Retained content: every panel's content stays mounted as a child of one
   * region, in the order its id was first seen, whatever the panels' order,
   * stacks or visibility. Reordering, stacking (`stack`) and hiding change
   * geometry only, so a page in an iframe never reloads and a native view
   * never detaches; a hidden panel keeps the region's full size, invisible
   * and inert, so it shows again without a relayout. Panels are laid out
   * from their spans alone (proportional, `minWidth`/`minHeight` bound
   * resizing) and paint nothing of their own. `split` mode, bounded flow.
   */
  retain?: boolean;
}

/** A panel edge, logical on the inline axis: `start` is the left in LTR, the right in RTL. */
export type PanelDropEdge = 'start' | 'end' | 'top' | 'bottom';
export interface PanelDropTarget {
  panelId: string;
  edge: PanelDropEdge;
}
/** Window coordinates, as `measureInWindow` reports them (the viewport on web). */
export interface PanelDropPoint {
  x: number;
  y: number;
}
/** Growth of a target: slid in, grown once ready, active under the dragged item. */
export type PanelDropStage = 'rest' | 'grown' | 'active';
export interface AppShellPanelDrop {
  /** A drag that could land here is in progress: targets slide in on every accepting panel. */
  active: boolean;
  /** The pointer; targets resolve only while it is over an accepting panel. */
  point?: PanelDropPoint | null;
  /** Default `['start', 'end']`. */
  edges?: readonly PanelDropEdge[];
  /** Panels that accept the drop. Default: every visible panel. */
  panels?: readonly string[];
  /** The dragged item's picture, centred on the pointer, that must overlap a target. Default 209×110; 0×0 tests the point. */
  preview?: { width: number; height: number };
  /** The target under the drag, or null. Called when it changes. */
  onTargetChange?: (target: PanelDropTarget | null) => void;
  /**
   * `surface` (default): an opaque step off the panel's fill, from the surface
   * tokens. `translucent`: a pane over the page (white at 0.45, a 0.08
   * edge and a 0.1 dash in the foreground's ink; the accent at 0.12 when
   * active), a desktop browser's split targets over a live page.
   */
  appearance?: 'surface' | 'translucent';
  /** Overrides the localized names (`"Add left split"`…) by edge. */
  labels?: Partial<Record<PanelDropEdge, string>>;
  /** `slide`: arriving from past the panel's edge; `grow`: between stages. */
  motion?: { slide?: MotionSpec; grow?: MotionSpec };
}
