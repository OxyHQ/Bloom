import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** A Remix-style icon: `width` / `height` / `fill`. */
export type SidebarIcon = ComponentType<{ width?: number; height?: number; fill?: string }>;

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
  href?: string;
  badge?: ReactNode;
  selected?: boolean;
  /** Icon-only 36px square (the collapsed rail). */
  collapsed?: boolean;
  onPress?: () => void;
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
  /** Expanded width fills the container instead of 260px (collapsed stays 60). */
  fluid?: boolean;
  /** Removes the floating panel treatment (a sidebar revealed beneath mobile content). */
  flat?: boolean;

  /** Shows `ThemeToggle` above the secondary rows. Defaults to true. */
  showThemeToggle?: boolean;
  /** Quick search over the rows. Defaults to true. */
  showSearch?: boolean;
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
  key: string;
  label: string;
  /** A short chip on the right, e.g. a relative time (`34m`, `now`). */
  meta?: string;
  /** Link target (a real anchor on web). */
  href?: string;
}

export interface SidebarTreeFolder {
  key: string;
  label: string;
  items: ReadonlyArray<SidebarTreeItem>;
  /** Expanded on first render. */
  defaultOpen?: boolean;
}

export interface SidebarTree {
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
