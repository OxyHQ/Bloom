import type { ReactNode } from 'react';

import type { AgentReplyAgent } from '../agent-reply';
import type { BloomIconComponent } from '../icons/icon-component';
import type { SidebarProps } from '../sidebar/types';

/** One conversation row: the agents in it drawn as its avatar, a title and a line under it. */
export interface ConversationSidebarItem {
  id: string;
  /** The row's name; also its accessible name. */
  title: string;
  /** The line under the title: the last message, or "Thinking together…" while it works. */
  description?: string;
  /** Who is in the conversation; their avatars stack as the row's. One agent is drawn larger. */
  agents: AgentReplyAgent[];
  /** Marks the row with a pin and sorts nothing: order is the caller's. */
  pinned?: boolean;
}

/** One entry of a conversation's context menu. */
export interface ConversationSidebarAction {
  key: string;
  label: string;
  /** An icon component Bloom sizes and tints (`RiPushpinLine`, or any taking `width` / `fill`). */
  icon: BloomIconComponent;
  /** Drawn as a destructive row (delete). */
  destructive?: boolean;
}

/** One entry of the "+" menu. */
export interface ConversationSidebarCreateOption {
  key: string;
  label: string;
  description?: string;
  /** Left of the text: an avatar, an `AgentStack`, an icon. */
  leading?: ReactNode;
  onPress: () => void;
}

/** Every word the sidebar draws; each defaults to Bloom's (localized) copy. */
export interface ConversationSidebarLabels {
  /** The panel's accessible name. */
  conversations?: string;
  /** The search field's accessible name. */
  search?: string;
  searchPlaceholder?: string;
  closeSearch?: string;
  /** The store button's name. */
  marketplace?: string;
  /** The "+" button's name. */
  create?: string;
  /** The "+" menu's name. */
  createMenu?: string;
  /** The list's accessible name. */
  list?: string;
  /** Shown when there are no conversations. */
  empty?: string;
  /** The pin's accessible name. */
  pinned?: string;
  /** The context menu's name. */
  actions?: string;
}

export interface ConversationSidebarProps
  extends Omit<SidebarProps, 'toolbar' | 'content' | 'showSearch' | 'children'> {
  conversations: ConversationSidebarItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  /** The search field's text. Controlled with `onQueryChange`; the sidebar does not filter for you. */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Whether the search field is open. Controlled with `onSearchOpenChange`. */
  searchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
  /** The store button beside search; omitted, there is none. */
  onMarketplace?: () => void;
  /** The "+" button does this directly (a new conversation). Use `createOptions` instead for a menu. */
  onCreate?: () => void;
  /** The "+" opens this menu. Wins over `onCreate`; with neither, there is no "+" button. */
  createOptions?: ConversationSidebarCreateOption[];
  /** The context menu of a conversation; none, none. */
  actions?: (conversation: ConversationSidebarItem) => ConversationSidebarAction[];
  onAction?: (conversation: ConversationSidebarItem, key: string) => void;
  labels?: ConversationSidebarLabels;
  /** Under the last row: a loading line, ghost rows while a page of history arrives. With it, the empty text is not drawn. */
  after?: ReactNode;
}
