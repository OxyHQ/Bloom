import type { ReactNode } from 'react';
import type { BloomIconComponent } from '../icons/icon-component';
import type { StyleProp, ViewStyle, ScrollViewProps } from 'react-native';

/** A Remix-style icon: `width` / `height` / `fill`. */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type SidebarIcon = BloomIconComponent;

/**
 * The avatar tints for initials: `neutral`, `blue` (the accent ramp),
 * `lime` (the success ramp) and `pink` (the accent rotated to pink).
 */
export type SidebarAvatarColor = 'neutral' | 'blue' | 'lime' | 'pink';

export interface SidebarAvatar {
  /** Image URI. Wins over `initials`. */
  source?: string;
  initials?: string;
  color?: SidebarAvatarColor;
}

/** A navigation row. Rows without `href` / `onPress` are decoration only. */
export interface SidebarNavItem {
  key: string;
  label: string;
  icon: SidebarIcon;
  /** The glyph while selected, e.g. the filled icon. Used by the `rail` variant. */
  activeIcon?: SidebarIcon;
  /** Link target. On web the row renders a real anchor. */
  href?: string;
  /** Counter badge on the right; primary-tinted when the row is selected. */
  badge?: string | number;
  /**
   * An ACTION row (Settings → a modal): intercepts the navigation. When set,
   * `onNavigate` is not called for this row.
   */
  onPress?: () => void;
  /** Secondary touch action. Also expose it through a keyboard-accessible menu. */
  onLongPress?: () => void;
}

/** One mode of a {@link SidebarModeSwitcherProps.modes} switcher. */
export interface SidebarMode {
  key: string;
  label: string;
  icon: SidebarIcon;
  /** A shortcut hint shown on hover (web), e.g. `⌥⌃1`. */
  shortcut?: string;
}

export interface SidebarModeSwitcherProps {
  modes: ReadonlyArray<SidebarMode>;
  /** Key of the selected mode. */
  value: string;
  onValueChange: (key: string) => void;
  /** Collapses the labels and hints, leaving the icons. */
  collapsed?: boolean;
  /** The radio group's accessible name. Defaults to `"Mode"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SidebarItemProps {
  icon: SidebarIcon;
  label: string;
  /**
   * The row's size. Inside a `Sidebar` it is inherited from the panel — pass
   * it only for a row standing on its own.
   */
  size?: SidebarSize;
  href?: string;
  badge?: ReactNode;
  selected?: boolean;
  /** Icon-only square matching the sidebar size (40px for md). */
  collapsed?: boolean;
  onPress?: () => void;
  /** Secondary touch action. Also expose it through a keyboard-accessible menu. */
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SidebarRailItemProps {
  icon: SidebarIcon;
  /** The glyph while selected (e.g. the filled icon); defaults to `icon`. */
  activeIcon?: SidebarIcon;
  label: string;
  href?: string;
  /** Sits over the indicator's top-right corner. */
  badge?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  /** Secondary touch action. Also expose it through a keyboard-accessible menu. */
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * - `panel`  the floating sidebar: account, quick search, rows, theme toggle,
 *            team or plan card; collapsible
 * - `rail`   an 80px navigation rail: icon over label, items centred, the
 *            selected icon on a 48 × 32 pill. Navigation only
 */
export type SidebarVariant = 'panel' | 'rail';

/**
 * The panel's own SURFACE — what the sidebar looks like as an object on the
 * page, independent of what it contains. It is the axis two apps differ on
 * most: the same rows read as a different product behind a different edge.
 *
 * - `card` (default) the floating panel: radius 24, a hairline and the panel
 *   shadow, on the panel fill. A sidebar that sits IN the page.
 * - `plain` no edge at all — no radius, no border, no shadow: the rows sit
 *   straight on the page. The social/reader look, and what a revealed mobile
 *   drawer uses.
 * - `docked` a column flush to the window's edge: no radius, one hairline on
 *   the INNER edge only, the panel fill, and it stretches the full height.
 *   The workspace look (a channel list, a file tree).
 */
export type SidebarSurface = 'card' | 'plain' | 'docked';

/**
 * How big the rows are, and with them the panel. One axis, three rungs, every
 * measurement in `SIDEBAR_METRICS`:
 *
 * - `sm`  a 30px square, an 18px glyph, `body-2-medium`; 232 expanded, 46 collapsed
 * - `md` (default) 40 / 22 / `headline-medium`; 260 expanded, 56 collapsed
 * - `lg`  44 / 24 / `title-3-medium`; 300 expanded, 60 collapsed — the
 *   destination-first rail a social app reads with at arm's length
 */
export type SidebarSize = 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';

/** A row in the team menu. */
export interface SidebarMenuItem {
  key: string;
  label: string;
  icon: SidebarIcon;
  badge?: string | number;
  selected?: boolean;
  href?: string;
  onPress?: () => void;
}

export interface SidebarMenuGroup {
  id: string;
  /** Section label above the rows ("Company"). */
  label?: string;
  items: SidebarMenuItem[];
}

/** The team card at the bottom of the rail and the menu it opens. */
export interface SidebarTeam {
  name: string;
  email?: string;
  avatar?: SidebarAvatar;
  groups?: SidebarMenuGroup[];
  /** Footer line: product name and an optional version chip. */
  footer?: { label: string; version?: string };
}

export interface SidebarAccountUser {
  id: string;
  name: string;
  avatar?: SidebarAvatar;
  selected?: boolean;
  onPress?: () => void;
}

/**
 * The brand at the top of the sidebar. Give a mark, a wordmark or both.
 */
export interface SidebarLogo {
  /**
   * The mark (a logo glyph, an SVG, an image). Centred in a 36 × 36 box and
   * kept while the sidebar is collapsed; size it yourself — 24–28px reads right.
   */
  icon?: ReactNode;
  /**
   * The wordmark beside the mark, hidden while collapsed. A string renders as
   * the product name in `headline-semibold`; anything else renders as given.
   */
  wordmark?: ReactNode;
  /** Link target (a real anchor on web). On native, pass `onPress` too. */
  href?: string;
  /** Called on press — a router's navigation to home, say. */
  onPress?: () => void;
  /** The logo's accessible name. Defaults to a string `wordmark`. */
  accessibilityLabel?: string;
}

export interface SidebarLogoViewProps {
  logo: SidebarLogo;
  /** Collapses the wordmark, keeping the mark. */
  collapsed?: boolean;
  /** Renders the mark only (the navigation rail). Defaults to true. */
  showWordmark?: boolean;
  testID?: string;
}

/** The account switcher at the top of the rail and the menu it opens. */
export interface SidebarAccount {
  name: string;
  avatar?: SidebarAvatar;
  /** "Users with access". */
  users?: SidebarAccountUser[];
  usersLabel?: string;
  onAddUser?: () => void;
  onManage?: () => void;
  addUserLabel?: string;
  manageLabel?: string;
}

export interface SidebarTeamMenuProps {
  team: SidebarTeam;
  collapsed?: boolean;
  /** Repaints the expanded card (the flat mobile variant). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SidebarUserMenuProps {
  account: SidebarAccount;
  collapsed?: boolean;
  /** Suppresses the hover pill until the pointer next leaves (set after expanding). */
  suppressHover?: boolean;
  onHoverSuppressionEnd?: () => void;
  /** Background of the 32px avatar (the flat mobile variant repaints it). */
  avatarBackground?: string;
  testID?: string;
}

export interface SidebarProps {
  /** Center the main navigation group in space above the persistent footer. */
  contentAlignment?: 'start' | 'center';
  /** App-owned destination content after the built-in rows/tree, inside the same
   * scroll viewport. Hidden and noninteractive while collapsed; remains mounted
   * so pagination and disclosure state survive. Not rendered in variant="rail".
   * Compose rows here, never another ScrollView. Quick search filters only the
   * built-in items/tree; disable it when your content owns search.
   */
  content?: ReactNode;
  /** Observes the destination viewport after Bloom updates its edge fades.
   * Useful for loading another page of history. No separate scroll owner.
   */
  onScroll?: ScrollViewProps['onScroll'];
  /** Additional persistent bottom content, outside destination scrolling.
   * Receives the rendered state: true in a rail, false in a mobile panel.
   * Existing account/theme/team controls remain; omit account when supplying your own account footer.
   */
  footer?: ReactNode | ((state: { collapsed: boolean }) => ReactNode);
  /** Persistent primary action below destinations. Its label collapses to a named icon button. */
  primaryAction?: {
    label: string;
    icon: SidebarIcon;
    onPress: () => void;
    disabled?: boolean;
  };
  /** Defaults to `panel`. */
  variant?: SidebarVariant;
  /** Primary navigation rows. */
  items?: SidebarNavItem[];
  /**
   * A mode switcher under the header (Search / Computer): a vertical segmented
   * control of icon + label rows. Rendered when given; see `SidebarModeSwitcher`.
   */
  modes?: ReadonlyArray<SidebarMode>;
  /** Key of the selected mode. */
  mode?: string;
  onModeChange?: (key: string) => void;
  /** The mode group's accessible name. Defaults to `"Mode"`. */
  modesLabel?: string;
  /** Rows pinned to the bottom above the team card (Support, Settings). */
  secondaryItems?: SidebarNavItem[];
  /** Key of the selected row. */
  selected?: string;
  /**
   * Called when a row with `href` is pressed. When provided on web, the
   * browser's own navigation is prevented, so a router can take over.
   */
  onNavigate?: (item: SidebarNavItem) => void;

  /** Controlled collapsed state. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;

  /** Rendered inside a mobile drawer: always expanded, close button instead of collapse. */
  mobile?: boolean;
  onClose?: () => void;
  /** Expanded width fills the container instead of the size's own width. */
  fluid?: boolean;
  /** The panel's edge. Defaults to `card`. */
  surface?: SidebarSurface;
  /** The row size, and the panel width that follows it. Defaults to `md`. */
  size?: SidebarSize;

  /** Shows `ThemeToggle` above the secondary rows. Defaults to true. */
  showThemeToggle?: boolean;
  /** Quick search over the rows. Defaults to true. */
  showSearch?: boolean;
  /** Controlled quick-search text; also lets app-owned content filter the same query. */
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  /** Shortcut hint on the quick-search button. Defaults to "⌘L". */
  searchShortcutLabel?: string;
  /** Binds ⌘L / Ctrl+L on web. Defaults to true. */
  searchShortcut?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
  noResultsLabel?: string;

  /**
   * The brand at the top: a mark and/or a wordmark. In the panel it takes the
   * header row beside the collapse control — the account switcher, if given
   * too, moves to its own row under it. The rail shows the mark above its
   * items.
   */
  logo?: SidebarLogo;
  account?: SidebarAccount;
  team?: SidebarTeam;

  /**
   * A labelled tree of expandable folders under the primary rows (the AI chat's
   * "Repositories"). Quick search filters it too. With a tree, the header and
   * search stay put and only the rows scroll. Hidden while collapsed.
   */
  tree?: SidebarTree;
  /** Key of the selected tree row. */
  selectedTreeItem?: string;
  onTreeItemPress?: (item: SidebarTreeItem, folder: SidebarTreeFolder) => void;
  /** The plan card at the foot of the rail, in place of the team card. */
  plan?: SidebarPlan;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A row under a tree folder. */
export interface SidebarTreeItem {
  /** Secondary controls beside the row, never nested inside its press target. */
  actions?: ReactNode;
  /** Warm navigation data on hover/touch and before selection. */
  onPrefetch?: () => void;
  onLongPress?: () => void;
  key: string;
  label: string;
  /** A short chip on the right, e.g. a relative time (`34m`, `now`). */
  meta?: string;
  /** Link target (a real anchor on web). */
  href?: string;
}

export interface SidebarTreeFolder {
  /** Secondary controls beside the disclosure, such as edit/create menus. */
  actions?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  key: string;
  label: string;
  items: ReadonlyArray<SidebarTreeItem>;
  /** Expanded on first render. */
  defaultOpen?: boolean;
}

export interface SidebarTree {
  /** Collection actions, e.g. create a project, beside the section label. */
  actions?: ReactNode;
  /** The section label, e.g. `Repositories`. */
  label: string;
  folders: ReadonlyArray<SidebarTreeFolder>;
}

export interface SidebarFolderProps {
  folder: SidebarTreeFolder;
  /** Controlled expansion. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hold the folder open regardless (a search is filtering it). */
  forceOpen?: boolean;
  selectedItem?: string;
  onItemPress?: (item: SidebarTreeItem, folder: SidebarTreeFolder) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The plan card: an avatar, the workspace and its plan, and an action button. */
export interface SidebarPlan {
  name: string;
  /** The plan line under the name, e.g. `Pro Plan`. */
  plan: string;
  avatar?: SidebarAvatar;
  /** Default `'Upgrade'`. */
  actionLabel?: string;
  onAction?: () => void;
}

export interface SidebarPlanCardProps {
  plan: SidebarPlan;
  /** The 36px avatar-only form for a collapsed rail. */
  collapsed?: boolean;
  /** Repaints the card (the flat variant sits it on the panel colour). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
