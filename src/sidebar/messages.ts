import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the sidebar family draws or announces, in each Bloom
 * language. A caller's `*Label` props (and an account's or plan's own labels)
 * still win over any entry here.
 */
export interface SidebarMessages {
  /** The navigation landmark's name. */
  sidebar: string;
  collapse: string;
  expand: string;
  /** The `mobile` close button. */
  close: string;
  /** The quick-search row and its name. */
  quickSearch: string;
  /** The search field's placeholder in the panel. */
  searchPlaceholder: string;
  /** The same in a flat `mobile` header's compact field. */
  searchPlaceholderCompact: string;
  /** Names the search field. */
  filter: string;
  /** Names the button that clears and closes the search. */
  clearSearch: string;
  noResults: string;
  /** Names the mode switcher's radio group. */
  mode: string;
  /** The plan card's action. */
  upgrade: string;
  /** The account menu's section heading, its two actions and its name. */
  usersWithAccess: string;
  addUser: string;
  manage: string;
  accountMenu: string;
  /** Names a team switcher's menu ("Acme menu"). */
  teamMenu: (team: string) => string;
}

export const SIDEBAR_MESSAGES: MessageCatalog<SidebarMessages> = defineMessages<SidebarMessages>('SIDEBAR_MESSAGES', {
  sidebar: 'Sidebar',
  collapse: 'Collapse sidebar',
  expand: 'Expand sidebar',
  close: 'Close sidebar',
  quickSearch: 'Quick Search',
  searchPlaceholder: 'Search navigation…',
  searchPlaceholderCompact: 'Search...',
  filter: 'Filter navigation',
  clearSearch: 'Clear navigation search',
  noResults: 'No results',
  mode: 'Mode',
  upgrade: 'Upgrade',
  usersWithAccess: 'Users with access',
  addUser: 'Add user',
  manage: 'Manage',
  accountMenu: 'Account menu',
  teamMenu: (team) => `${team} menu`,
});
