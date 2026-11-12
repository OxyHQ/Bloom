import * as ContextMenu from '../context-menu/index';
import * as Dropdown from '../dropdown-menu/index';
import { createConversationSidebar } from './create-conversation-sidebar';

/**
 * A sidebar of conversations: its tools on top (search, and the store and "+" buttons when given), a list
 * of conversations with their agents' avatars and a context menu each, and the panel's own footer.
 */
export const ConversationSidebar = createConversationSidebar({ Dropdown, ContextMenu });

export type {
  ConversationSidebarAction,
  ConversationSidebarCreateOption,
  ConversationSidebarItem,
  ConversationSidebarLabels,
  ConversationSidebarProps,
} from './types';
