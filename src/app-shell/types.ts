import type { AppColorName } from '../theme/color-presets';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ContentPanelFramedBreakpoint } from '../content-panel/types';
import type { NotificationCenterItem, NotificationCenterTab } from '../notification-center/types';
import type { SidebarProps } from '../sidebar/types';

/**
 * How the sidebar reaches a narrow screen (below `lg`):
 *
 * - `overlay`  a drawer over the page with a 40% black backdrop
 * - `reveal`   the sidebar waits beneath the page, which slides 272px toward
 *              the end edge (right in LTR, left in RTL) and rounds its corner
 *              to 32 as the rail scales in from 0.94
 */
export type AppShellDrawer = 'overlay' | 'reveal';

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
 * - `split` — a list pane, a detail pane and an optional info pane, each
 *   scrolling on its own, with a draggable divider. One screen, never a
 *   document scroll (see `scroll`). Below `splitFrom` exactly one pane renders,
 *   chosen by `pane`.
 * - `focus` — a single centred column of `contentWidth` and NO nav: sign-in,
 *   onboarding, a reader. It keeps the header, `topBar`, `bottomBar` and
 *   `floatingAction` slots, so a sign-up flow still gets its footer CTA.
 * - `canvas` — the content is the SCREEN: one edge-to-edge area with no reading
 *   column, no max width and no padding, exactly one viewport tall, and the
 *   chrome floats over it. A map, a board, an editor, a photo viewer. Each
 *   region keeps its own inset (the nav is still a card with a gutter around
 *   it) so only the canvas runs to the edge. Like `split`, it never scrolls the
 *   document — the canvas owns its own panning and zooming.
 */
export type AppShellVariant = 'dashboard' | 'feed' | 'split' | 'focus' | 'canvas';

/** Which single pane a `split` shell shows below `splitFrom`. */
export type AppShellPane = 'list' | 'detail' | 'info';

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
export type AppShellScroll = 'document' | 'container' | 'fixed';

/**
 * When a bar slot is drawn: `compact` (the default) only while the nav is a
 * drawer — the phone case the slot exists for — or `always`, for a bar that is
 * part of the app at every width (a player, a status strip).
 */
export type AppShellBarVisibility = 'compact' | 'always';

export interface AppShellEngineProps {
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
  sidebar?: Omit<SidebarProps, 'mobile' | 'onClose'>;
  /**
   * How the rail arrives below `navFrom`. `reveal` slides the WHOLE page
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
  /** The content column's max width. Defaults to 1300. */
  contentMaxWidth?: number;
  /** Floating extras rendered last, e.g. a `ProOfferCard`. */
  overlay?: ReactNode;
  /** Controlled drawer state (below `lg`). */
  drawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
  /** Names the hamburger that opens the drawer. Default `"Open navigation"`. */
  drawerOpenLabel?: string;
  /**
   * Names the controls that close the drawer — the backdrop and the page veil a
   * `reveal` drawer leaves. Default `"Close navigation"`. The sidebar's own close
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
   */
  scroll?: AppShellScroll;

  // -- sizes and breakpoints -------------------------------------------------
  /**
   * `feed` / `focus`: the reading column's width. Default 600 — the measure a
   * single column of body text stays readable at. It is a MAXIMUM on a narrow
   * screen: the column shrinks to the space it has rather than overflowing.
   */
  contentWidth?: number;
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
   * Defaults to the tier the sidebar's own variant implies — `sm` for a rail
   * (80px fits early), `lg` for the full panel — and to `sm` whenever
   * `navExpandedFrom` is set, because below that tier the nav IS a rail.
   */
  navFrom?: AppShellBreakpoint;
  /**
   * Icons below, labels from here up: the shell swaps `sidebar.variant` between
   * `rail` and `panel` at this width. Unset (the default) the sidebar keeps
   * whatever variant it was given at every width.
   */
  navExpandedFrom?: AppShellBreakpoint;

  // -- feed ------------------------------------------------------------------
  /**
   * `feed`: wrap the centre column in a `ContentPanel`, so the page background
   * reads as a gutter around a framed surface. The shell renders the panel —
   * a page that renders its own inside this one trips `ContentPanel`'s nesting
   * guard. Screens own their content padding; the shell adds no horizontal inset.
   */
  panel?: boolean;
  /** Theme only the central reading column; navigation, aside and framing retain the app theme. */
  panelColorPreset?: AppColorName;
  /** Optional independent framing breakpoint. By default a shell with navigation
   * frames its panel exactly while the sidebar/rail is in flow. */
  framedFrom?: ContentPanelFramedBreakpoint;

  // -- split -----------------------------------------------------------------
  /** `split`: the first pane. `children` is the detail pane beside it. */
  list?: ReactNode;
  /** `split`: an optional third pane, from `infoFrom`. */
  info?: ReactNode;
  /** `split`: which single pane renders below `splitFrom`. Default `list`. */
  pane?: AppShellPane;
  /** `split`: the list pane's resting width (360); a drag moves it in range. */
  listWidth?: number;
  /** `split`: the range a drag may reach. Defaults 280 and 520. */
  listMinWidth?: number;
  listMaxWidth?: number;
  /** `split`: reports the width a drag settled on. */
  onListWidthChange?: (width: number) => void;
  /** `split`: the info pane's width. Default 320. */
  infoWidth?: number;
  /** `split`: the width two panes fit from. Default `md` (768). */
  splitFrom?: AppShellBreakpoint;
  /** `split`: the width the third pane fits from. Default `xl` (1280). */
  infoFrom?: AppShellBreakpoint;
  /** `split`: whether the divider drags. Default `true`. */
  resizable?: boolean;
  /** `split`: names the divider. Default `"Resize panes"`. */
  resizeLabel?: string;
  /**
   * `split`: the shell gives each pane its own `ScrollView` (default). Turn it
   * off when the pane's own content scrolls — a `FlatList`, a virtualizer —
   * rather than nesting two scrollers.
   */
  paneScroll?: boolean;

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
   * The bottom bar: pinned to the bottom of the viewport (or of the frame when
   * the shell does not own the page), with the bottom safe-area inset applied
   * as its own padding. The content column reserves its MEASURED height, so the
   * last item is never hidden behind it.
   */
  bottomBar?: ReactNode;
  /** Reserve the measured bar height in document/container content (default true).
   * False keeps the bar over fullscreen content whose own scroller accounts for
   * the occupied bottom edge. The bar still publishes its real edge occupancy.
   * Fixed mode always leaves clearance to its child navigator/list. */
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
  /** Defaults to `"Open navigation"`. */
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
  /** Names the hamburger. Default `"Open navigation"`. */
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
  navigationMaterial?: 'solid' | 'translucent';
  /** Bottom action follows scroll collapse by hiding (default), or remains visible. */
  bottomActionBehavior?: 'hide' | 'visible';
  /** Web defaults to document; native to auto. Explicit auto owns a ScrollView.
   * external: the child list owns scrolling; avoids nested virtualized lists. */
  scroll?: AppShellScroll | 'auto' | 'external';
  /** Sidebar configuration, including card (detached, default) or docked surface. Also applies with navigation. */
  sidebar?: Omit<SidebarProps, 'mobile' | 'onClose'>;
  primaryAction?: import('../fab/types').FabProps;
  title?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  header?: ReactNode;
  children?: ReactNode;
  contentMaxWidth?: number;
  overlay?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}


/** Additive entry point: legacy layout variants and adaptive navigation share the same chrome. */
export type AppShellProps = Omit<AppShellEngineProps, 'scroll'> & AppShellNavigationProps & {
  scroll?: AppShellScroll | 'auto' | 'external';
};
