import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The context menu's default accessible name, in each Bloom language. A
 * caller's `label` still wins.
 */
export interface ContextMenuMessages {
  contextMenu: string;
}

export const CONTEXT_MENU_MESSAGES: MessageCatalog<ContextMenuMessages> = defineMessages<ContextMenuMessages>('CONTEXT_MENU_MESSAGES', {
  contextMenu: 'Context menu',
});
