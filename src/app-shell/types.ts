import type { AppColorName } from '../theme/color-presets';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';

import type { PanelErrorBoundaryOptions } from '../error-boundary/types';
import type { ContentPanelChrome, ContentPanelProps } from '../content-panel/types';
import type { NotificationCenterItem, NotificationCenterTab } from '../notification-center/types';
import type { SidebarProps } from '../sidebar/types';
import type { AppShellPanelLayout } from './panel-layout-types';
import type { MotionSpec } from '../motion/spec';

/**
 * How the sidebar reaches a narrow screen (below `lg`):
 *
 * - `overlay`  a drawer over the page with a 40% black backdrop
 * - `reveal`   the sidebar waits beneath the page, which slides 272px toward
 *              the end edge (right in LTR, left in RTL) and rounds its corner
 *              to 32 as the rail scales in from 0.94
 */
export type AppShellDrawer = 'overlay' | 'reveal';

/** AppShell owns the region; this slot can render a complete domain Sidebar. */
export interface AppShellSidebarProps extends Omit<SidebarProps, 'mobile' | 'onClose'> {
  /** Expanded region width. Finite values clamp to zero; omitted uses the size's metrics. */
  width?: number;
  /** Receives the shell's resolved variant, collapse, mobile and dismissal props. */
  render?: (props: SidebarProps) => ReactNode;
  /**
   * Let the in-flow navigation leave the layout entirely (the content takes its
   * room) and float back over the content from the start edge. See `AppShellDock`.
   */
  dock?: AppShellDock;
}

/** One edge of the window, in logical terms: `start` is the left in LTR, the right in RTL. */
export type AppShellEdge = 'top' | 'bottom' | 'start' | 'end';

/** A length per window edge. */
export type AppShellEdges = Partial<Record<AppShellEdge, number>>;

/**
 * How a hidden region comes back while the pointer is at its edge: a floating
 * copy of the SAME mounted content, over the page, which never moves.
 */
export interface AppShellDockPeek {
  /** `hover` (default): Bloom's edge strip opens it. `manual`: only `useAppShell()`'s `peek()` does. */
  trigger?: 'hover' | 'manual';
  /** Depth of the hover strip along the edge. Default 8. */
  edge?: number;
  /** The floating panel's distance from the window's edges. Default 5. */
  inset?: number;
  /** The floating panel's corner radius. Default 12. */
  radius?: number;
  /** How long the pointer may be away before it slides out, ms. Default 120. */
  hideDelay?: number;
  /**
   * `surface` (default) paints Bloom's floating surface behind the content;
   * `plain` paints nothing, for content that draws its own backing.
   */
  appearance?: 'surface' | 'plain';
}

/** Motion as data (`@oxy.so/bloom/motion` `MotionSpec`): a spring or a timed curve. */
export interface AppShellDockMotion {
  /** Coming back into the layout. Default: spring, response 0.215 s, damping ratio 0.79. */
  show?: MotionSpec;
  /** Leaving the layout. Default: the same spring as `show`. */
  hide?: MotionSpec;
  /** The peek sliding in. Default: spring, response 0.185 s, damping ratio 0.77. */
  peekIn?: MotionSpec;
  /** The peek sliding out. Default: 150 ms, cubic-bezier(0.645, 0.045, 0.355, 1). */
  peekOut?: MotionSpec;
}

/**
 * An in-flow region (the sidebar, the top bar) that can leave the layout and
 * peek back over it. Hidden, the region gives its whole room to the content;
 * its content stays mounted (scroll positions, editors and menus survive),
 * inert and out of the accessibility tree until it peeks or comes back.
 * Coming back from a peek docks in place, without motion.
 */
export interface AppShellDock {
  /** Controlled. Pair with `onHiddenChange`. */
  hidden?: boolean;
  defaultHidden?: boolean;
  onHiddenChange?: (hidden: boolean) => void;
  /** Float the hidden region back over the content from its edge. `true` uses the defaults. */
  peek?: boolean | AppShellDockPeek;
  /** Reports the peek opening (true) and finishing its slide out (false). */
  onPeekChange?: (peeking: boolean) => void;
  motion?: AppShellDockMotion;
}

/**
 * The layout SHAPE, all drawn by the same engine — the same nav, the same
 * drawer, the same pinned regions, the same slots.
 *
 * - `dashboard` (default) — nav, then one fluid content column capped at
 *   `contentMaxWidth`, with an optional `aside`. The shape this shell shipped
 *   with; unchanged in every measurement.
 * - `feed` — nav, then the routed content CENTRED in a reading column of
 *   `contentWidth`, with the optional `aside` beside it and the pair centred in
 *   what the nav leaves. Wrap the column in a `ContentPanel` with `panel` and
 *   the page background reads as a gutter around it.
 * - `focus` — a single centred column of `contentWidth` and NO nav: sign-in,
 *   onboarding, a reader. It keeps the header, `topBar`, `bottomBar` and
 *   `floatingAction` slots, so a sign-up flow still gets its footer CTA.
 * - `canvas` — the content is the SCREEN: one edge-to-edge area with no reading
 *   column, no max width and no padding, exactly one viewport tall, and the
 *   chrome floats over it. A map, a board, an editor, a photo viewer. Each
 *   region keeps its own inset (the nav is still a card with a gutter around
 *   it) so only the canvas runs to the edge. It never scrolls the document —
 *   the canvas owns its own panning and zooming.
 *
 * Panels — one reading surface, or several side by side (results and a map, a
 * list, a message and its details) — are not a variant: any of `dashboard`,
 * `feed` and `focus` hosts them with `panels`.
 */
export type AppShellVariant = 'dashboard' | 'feed' | 'focus' | 'canvas';

/** A tier from `BREAKPOINTS`, the one source of truth for widths. */
/**
 * Where a region changes shape: one of Bloom's named tiers, or a WIDTH IN
 * PIXELS for an app whose own layout does not land on them — a feed whose side
 * column earns its place at 990, a rail that goes in flow at 500. The named
 * tiers stay the default vocabulary; a number is the escape hatch, resolved by
 * `breakpointPx`.
 */
export type AppShellBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | number;

/** What scrolls the page. See `AppShellProps['scroll']`. */
export type AppShellScroll = 'document' | 'container' | 'fixed' | 'page';

/**
 * When a bar slot is drawn: `compact` (the default) only while the nav is a
 * drawer — the phone case the slot exists for — or `always`, for a bar that is
 * part of the app at every width (a player, a status strip).
 */
export type AppShellBarVisibility = 'compact' | 'always';

export interface AppShellEngineProps {
  /**
   * Native: keep the shell, navigation and pages inside the device's safe area.
   * The bottom-bar slot still owns its bottom inset; without bottom chrome the
   * frame reserves it. Use `safeArea={false}` on descendant PageHeaders because
   * the frame already owns their top edge. Device insets remain available to
   * dialogs and other portaled surfaces. Defaults to false; no effect on web.
   */
  safeArea?: boolean;
  /**
   * The layout shape. Defaults to `dashboard` — the behaviour this component
   * had before variants existed, down to the pixel.
   */
  variant?: AppShellVariant;
  /**
   * The rail. Rendered in flow at `lg` and up (`sm` and up with
   * `variant: 'rail'`); below it, the same props drive the drawer (`mobile`,
   * and `flat` for `reveal`), always as the panel.
   */
  sidebar?: AppShellSidebarProps;
  /**
   * Default `overlay`: how the rail arrives below `navFrom`. `reveal` slides the WHOLE page
   * sideways for dashboard and compact feed layouts. Feed desktop columns
   * retain their normal layout. Other variants use the overlay drawer.
   */
  drawer?: AppShellDrawer;
  /**
   * Heading over the content. Optional: without it (and without `breadcrumb` /
   * `actions`) the header still renders the menu button while the sidebar is a
   * drawer, and nothing otherwise. A page with its own `header` opens the
   * drawer with `AppShellMenuButton` or `useAppShell()`.
   */
  title?: string;
  /** Breadcrumb trail above the heading (a `Breadcrumb`). */
  breadcrumb?: ReactNode;
  /** Header actions at the end edge — the right in LTR (`NotificationBell`, buttons). */
  actions?: ReactNode;
  /**
   * Replaces the whole header. Put an `AppShellMenuButton` in it to keep the
   * drawer reachable on narrow screens.
   *
   * `null` means NO header — the shell draws nothing at all, not even the
   * menu button it would otherwise render for a drawer, because the page has
   * said it owns that corner. Leave the prop off (or `undefined`) to get the
   * default header.
   */
  header?: ReactNode;
  /**
   * A second column at the page's end edge — the right in LTR, the left in RTL (a detail panel, activity, a
   * chat). In flow from `asideFrom`; below it, stacked under the content or
   * hidden (`asideCollapse`). Pinned like the sidebar — with document scroll
   * it stays in document flow and sticks after tall content reaches its lower edge.
   * Container/fixed modes retain an independently scrolling aside.
   */
  aside?: ReactNode;
  /** The aside column's width. Defaults to 320. */
  asideWidth?: number;
  /** The breakpoint the aside sits beside the content from. Defaults to `xl` (1280). */
  asideFrom?: AppShellBreakpoint;
  /**
   * Below `asideFrom`: `stack` (default) renders it after the content, `hidden`
   * drops it. `canvas` always drops it — the screen is the canvas, so there is
   * no column underneath to stack into.
   */
  asideCollapse?: 'stack' | 'hidden';
  children?: ReactNode;
  /** The content column's max width. Defaults to 1300; `none` fills the available width. */
  contentMaxWidth?: number | 'none';
  /** Floating extras rendered last, e.g. a `ProOfferCard`. */
  overlay?: ReactNode;
  /** Controlled drawer state (below `lg`). */
  drawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
  /**
   * NATIVE: an edge swipe opens and closes the drawer, as expo-router's
   * `Drawer` does with `swipeEnabled`. Closed, a pan that starts within 32 of
   * the START edge (the left in LTR, the right in RTL) and moves toward the end
   * drags the drawer open under the finger; open, a pan toward the start edge on
   * the drawer, its backdrop or (`reveal`) the page drags it closed. The release
   * settles by position and velocity and lands in `drawerOpen` /
   * `onDrawerOpenChange`, controlled or not. Horizontal travel claims the touch
   * and vertical travel fails it, so lists keep scrolling. Reduced motion snaps.
   *
   * With it on, the `overlay` drawer also slides in and out on presses (325ms)
   * instead of appearing. The web has no edge swipe and ignores the prop. Needs
   * a `GestureHandlerRootView` at the app root.
   *
   * Default false: a left-edge pan competes with the iOS native-stack back
   * swipe, so only an app whose drawer IS its edge gesture opts in. The
   * hamburger, the backdrop and the sidebar's close button remain the
   * accessible way to open and close the drawer.
   */
  drawerSwipe?: boolean;
  /** Names the hamburger that opens the drawer (`"Open navigation"` in English). */
  drawerOpenLabel?: string;
  /**
   * Names the controls that close the drawer — the backdrop and the page veil a
   * `reveal` drawer leaves (`"Close navigation"` in English). The sidebar's own close
   * button is `sidebar.closeLabel`.
   */
  drawerCloseLabel?: string;
  /**
   * What scrolls the page.
   *
   * - `document` (default) — WEB: the page grows the document and the browser
   *   scrolls it, like a `ContentPanel` page: scroll restoration, the mobile
   *   address bar collapsing, anchor links and `window.scrollTo` all work, and
   *   the in-flow sidebar stays pinned (`position: sticky`). Native has no
   *   document and treats it as `container`.
   * - `container` — the shell fills its parent and the page scrolls inside its
   *   own `ScrollView`. For a shell embedded in a bounded box.
   * - `fixed` — the shell is exactly one screen tall and NOTHING scrolls: the
   *   header stays, and the content fills the rest of the height (`flex: 1`),
   *   so the page owns its own scrolling — a chat, a map, a board. On web the
   *   frame is `100dvh`; on native it fills its parent.
   * - `page` — the mode for routes that are `Screen` pages: `document` on web
   *   (the window scrolls, `Screen documentScroll` + `ScreenScrollView` stay in
   *   document flow) and `fixed` on native, where each route's
   *   `ScreenScrollView` is the scroller — never nested in a shell ScrollView.
   *   A `panel` fills on native and the bottom-bar clearance reaches the
   *   route's `ScreenScrollView`. Replaces `Platform.OS === 'web' ? 'document' : 'fixed'`.
   */
  scroll?: AppShellScroll;

  // -- sizes and breakpoints -------------------------------------------------
  /**
   * `feed` / `focus`: the reading column's width. Default 600 — the measure a
   * single column of body text stays readable at. It is a MAXIMUM on a narrow
   * screen: the column shrinks to the space it has rather than overflowing.
   */
  contentWidth?: number;
  /**
   * Feed layouts: let content occupy the configured aside's existing track.
   * Keeps the outer column envelope and navigation capacity unchanged. The
   * aside stays mounted but hidden/inert; below asideFrom no extra track is
   * reserved and a stacked aside is hidden. Bloom animates the transfer.
   * Default `content`.
   */
  contentSpan?: 'content' | 'content-aside';
  /** edge keeps navigation at the shell edge; content centers it with the reading column and aside. */
  navigationAlign?: 'edge' | 'content';
  /** Gap between the in-flow navigation and content. Defaults to the column gap. */
  navigationGap?: number;
  /** feed/focus: gap between the reading column and aside. Defaults to the column gap. */
  asideGap?: number;
  /**
   * The space between the shell's edge and its regions. Default 12 for
   * `dashboard` (which also keeps its historical 16 column gap, so existing
   * pages do not move) and 16 for the other variants, where one number drives
   * both.
   */
  gutter?: number;
  /**
   * The width the nav sits in FLOW from; below it the same nav is a drawer.
   * Without navigation overrides, defaults to `md`, with a tablet rail below
   * `lg` and a desktop panel above it. The desktop panel collapses when its
   * expanded width, reading column, visible aside and gaps do not fit.
   * An explicit sidebar variant defaults to the tier that variant implies — `sm` for a rail
   * (80px fits early), `lg` for the full panel — and to `sm` whenever
   * `navExpandedFrom` is set, because below that tier the nav IS a rail.
   */
  navFrom?: AppShellBreakpoint;
  /**
   * Icons below, labels from here up: the shell swaps `sidebar.variant` between
   * `rail` and `panel` at this width. Unset (the default), navigation adapts automatically. An explicit sidebar
   * variant keeps that variant at every width. Panel collapse is independent
   * of this tier; `sidebar.collapsed` overrides the automatic capacity decision.
   */
  navExpandedFrom?: AppShellBreakpoint;

  // -- feed ------------------------------------------------------------------
  /**
   * The region holds PANELS: the routes render `AppShellPanel` (one surface)
   * or `AppShellPanels` (several side by side), and the shell frames them —
   * `gutter` on all four sides and between them while framed, nothing at all
   * while compact (full-bleed), and the viewport geometry each mode needs.
   * Put the panel where the layout is declared: around the router outlet when
   * every page is one panel, in a route group's layout, or in a route made of
   * several. The shell never wraps its children in a surface itself, so its
   * tree around them is the same for every route and every `scroll`.
   */
  panels?: boolean;
  /**
   * `panels`: the width (of the shell's own box) its panels are framed from.
   * Default: exactly while the navigation is in flow — `md` without navigation.
   */
  framedFrom?: AppShellBreakpoint;

  // -- pinned slots ----------------------------------------------------------
  /**
   * The phone header: a sibling ABOVE the shell's columns, spanning it edge to
   * edge, pinned to the top (sticky with document scroll). Nothing a consumer
   * writes needs `position: fixed` or a negative margin to be a top bar.
   *
   * `header` is the in-column page heading and is unaffected; a shell may have
   * both. NOT drawn under `drawer="reveal"`: that drawer slides the whole page
   * 272px sideways, and a bar pinned to the frame would stay behind while the
   * page it belongs to left it — so `reveal` keeps its in-column `header`.
   */
  topBar?: ReactNode;
  /** `compact` (default): only while the nav is a drawer. */
  topBarVisibility?: AppShellBarVisibility;
  /**
   * Let a shown `topBar` leave the layout and peek back from the top edge,
   * like `sidebar.dock` does from the start edge. See `AppShellDock`.
   */
  topBarDock?: AppShellDock;
  /**
   * The framed region's distance from each window edge, overriding `gutter`
   * there only (panels and the gap between them keep `gutter`). A flush
   * navigation still owns the start edge; `start` applies while it is hidden
   * or absent.
   */
  frameInset?: AppShellEdges;
  /**
   * `page` (default) paints the theme's page background behind the regions.
   * `transparent` paints nothing, so a window's own backdrop (a native
   * material, a wallpaper, a tint the host draws) shows between them.
   */
  background?: 'page' | 'transparent';
  /**
   * The bottom bar: pinned to the bottom of the viewport (or of the frame when
   * the shell does not own the page), with the bottom safe-area inset applied
   * as its own padding. The content column reserves its MEASURED height, so the
   * last item is never hidden behind it.
   */
  bottomBar?: ReactNode;
  /** Reserve the measured bar height under the content (default true): below
   * document/container content and under bounded (native) panels.
   * False keeps the bar over the content: bounded panels reach under it and
   * Bloom's scrollers (`Screen`, `ScreenScrollView`, `VirtualList`,
   * `useScreenScroll`) clear it. The bar still publishes its real edge occupancy. */
  reserveBottomBarSpace?: boolean;
  /** `compact` (default): only while the nav is a drawer. */
  bottomBarVisibility?: AppShellBarVisibility;
  /** The compose/FAB corner — above the bottom bar when there is one. */
  floatingAction?: ReactNode;
  /** Which corner. Default `end` (the right in a left-to-right layout). */
  floatingActionPlacement?: 'start' | 'end';

  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AppShellMenuButtonProps {
  /** `"Open navigation"` in English. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AppShellHeaderProps {
  /** Optional: a header can be just the menu button, breadcrumb or actions. */
  title?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  /** Shows the hamburger (below `lg`); omit for no menu button. */
  onMenuPress?: () => void;
  /** Swaps the hamburger for a close glyph while the drawer is open. */
  menuOpen?: boolean;
  /**
   * Whether the hamburger has anything to open. `AppShell` passes its own
   * answer, taken from the shell's MEASURED width and `navFrom`; standalone the
   * header falls back to the window being narrower than `lg`.
   */
  showMenu?: boolean;
  /** Names the hamburger (`"Open navigation"` in English). */
  menuLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface NotificationBellProps {
  notifications?: NotificationCenterItem[];
  /** Overrides the count on the glyph; defaults to the unread items. */
  unreadCount?: number;
  onAction?: (notificationId: string, actionId: string) => void;
  onMarkAllRead?: () => void;
  defaultTab?: NotificationCenterTab;
  /** Popover width. Default 440. */
  width?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export interface ProOfferCardProps {
  title: ReactNode;
  description: ReactNode;
  /** The call to action's label. */
  ctaLabel: string;
  onCtaPress?: () => void;
  /** Called by the close control; persisting the dismissal is the host's call. */
  onDismiss: () => void;
  /** The mark above the copy (an animated Pro logo). */
  logo?: ReactNode;
  /** Light across the top, masked out before it reaches the copy. */
  backdrop?: ReactNode;
  backdropHeight?: number;
  accessibilityLabel?: string;
  dismissLabel?: string;
  /**
   * `fixed` (default) anchors bottom-start (bottom-left in LTR) of the viewport (web) / the nearest
   * positioned parent (native); `inline` renders in flow.
   */
  placement?: 'fixed' | 'inline';
  /** Delay before the card rises in, ms. Defaults to 1200. */
  enterDelay?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export type AppShellNavigationPlacement = 'auto' | 'bottom' | 'rail' | 'sidebar';
export interface AppShellNavigationItem {
  value: string;
  label: string;
  icon: ReactNode;
}
export interface AppShellNavigationProps {
  active?: boolean;
  navigation?: AppShellNavigationItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  navigationPlacement?: AppShellNavigationPlacement;
  /** Bottom action follows scroll collapse by hiding (default), or remains visible. */
  bottomActionBehavior?: 'hide' | 'visible';
  /** Web defaults to document; native to auto. Explicit auto owns a ScrollView.
   * external: the child list owns scrolling; avoids nested virtualized lists. */
  scroll?: AppShellScroll | 'auto' | 'external';
  /** Sidebar configuration, including card (detached, default) or docked surface. Also applies with navigation. */
  sidebar?: AppShellSidebarProps;
  primaryAction?: import('../fab/types').FabProps;
  title?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  header?: ReactNode;
  children?: ReactNode;
  contentMaxWidth?: number | 'none';
  overlay?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Additive entry point: legacy layout variants and adaptive navigation share the same chrome. */
export type AppShellProps = Omit<AppShellEngineProps, 'scroll'> &
  AppShellNavigationProps & {
    /** Modular root content: split panes or an independently scrolling deck. */
    panelLayout?: AppShellPanelLayout;
    scroll?: AppShellScroll | 'auto' | 'external';
  };

/** One panel: a rounded surface in a `panels` shell, alone or in `AppShellPanels`. */
export interface AppShellPanelProps {
  /** Names the panel for `AppShellPanels`' `show` and `useAppShellPanel()`. */
  id?: string;
  children?: ReactNode;
  /** Mount inline content even before it becomes visible; hidden content stays inactive. Floating sheets retain their surface lifecycle. */
  keepMounted?: boolean;
  /** Chrome that spans the panel above its content (a page header, a toolbar). */
  header?: ReactNode;
  /**
   * Who scrolls the panel's content. `content` (default): the content does —
   * a `ScreenScrollView`, a `FlatList`, a map, a navigator — and in a growing
   * (document) region a sole panel grows with the page. `panel`: Bloom wraps
   * the content in a `ScrollView` that clears the bottom bar (bounded regions).
   */
  scroll?: 'content' | 'panel';
  /**
   * In `AppShellPanels`: the panel's resting width. It gives way (down to
   * `minWidth`) before a flexible panel goes below its own `minWidth`. Without
   * a width the panel takes the room the others leave.
   */
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** In `AppShellPanels`: a divider on this panel's end edge drags its `width`. */
  resizable?: boolean;
  /** Reports the width a drag or an arrow key settled on. */
  onWidthChange?: (width: number) => void;
  /** Names the divider (`"Resize panes"` in English). */
  resizeLabel?: string;
  /** In `AppShellPanels`: the group width (its own box) this panel needs; below it, it is not drawn. */
  hideBelow?: AppShellBreakpoint;
  /** In a panel group: below this width, present this panel as a floating side sheet.
   * The other tracks remain in place. `open` controls only the compact sheet;
   * Descriptors also use `visible` to hide both presentations.
   */
  floating?: {
    below: AppShellBreakpoint;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    label: string;
    width?: number;
  };
  /** `ContentPanel`'s: `plain` keeps layout and clipping without painting a surface. */
  appearance?: ContentPanelProps['appearance'];
  /** `ContentPanel`'s edge while framed. */
  chrome?: ContentPanelChrome;
  /** ContentPanel surface utilities; use with chrome="none" for a flat custom fill. */
  surfaceClassName?: ContentPanelProps['surfaceClassName'];
  /** Publish the color painted by surfaceClassName to descendant chrome. */
  surfaceColor?: ContentPanelProps['surfaceColor'];
  /** Theme only this panel; navigation, aside and framing keep the app theme. */
  colorPreset?: AppColorName;
  /**
   * Isolate render errors to this panel with a themed, localized retry state.
   * Off by default; give `resetKey` (the route) when the panel outlives a route.
   */
  errorBoundary?: boolean | PanelErrorBoundaryOptions;
  testID?: string;
}

/** Several panels side by side, laid out and collapsed by the shell's rules. */
export interface AppShellPanelsProps {
  /** A local work area owns its frame and bottom edge inside a page panel.
   * Region composition remains the default and rejects nested page panels.
   */
  scope?: 'region' | 'local';
  /** Embedded descriptor composition, using the same renderer as AppShell.panelLayout.
   * Defaults to bounded flow and contained horizontal scrolling.
   * Supply either layout or JSX children.
   */
  layout?: AppShellPanelLayout;
  /** `AppShellPanel` elements; conditional ones (`{open && <AppShellPanel …/>}`) are fine. */
  children?: ReactNode;
  /**
   * `separated` (default): each panel its own surface, the shell's `gutter`
   * between them. `joined`: one surface with hairline dividers. `plain`: joined
   * geometry with inherited backing, for workspaces inside Dialog/another Surface. While the shell
   * is compact (panels full-bleed) both draw hairlines.
   */
  appearance?: 'separated' | 'joined' | 'plain';
  /**
   * Below this width — of the group's OWN box, so a sidebar beside it counts —
   * exactly one panel renders: the one `show` names, else the first.
   */
  collapseBelow?: AppShellBreakpoint;
  /** The `id` of the panel shown alone while collapsed. */
  show?: string;
  /** Controlled resting widths, shared by pointer and keyboard resizing. */
  widths?: AppShellPanelLayout['widths'];
  onWidthsChange?: AppShellPanelLayout['onWidthsChange'];
  /** Controlled split weights; flexible pairs commit their resized proportion here. */
  spans?: AppShellPanelLayout['spans'];
  onSpansChange?: AppShellPanelLayout['onSpansChange'];
  testID?: string;
}

/** Responsive presentation only; hidden content remains mounted. */
export interface AppShellPanelVisibilityProps extends ViewProps {
  when: 'alone' | 'multiple';
  className?: string;
}
