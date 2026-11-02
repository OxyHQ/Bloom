import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The context menu's words, in each Bloom language: its default accessible
 * name (a caller's `label` still wins), and the name of the action that opens
 * it from a screen reader or the keyboard (the trigger's `longpress`).
 */
export interface ContextMenuMessages {
  contextMenu: string;
  showMenu: string;
}

export const CONTEXT_MENU_MESSAGES: MessageCatalog<ContextMenuMessages> =
  defineMessages<ContextMenuMessages>('CONTEXT_MENU_MESSAGES', {
    contextMenu: 'Context menu',
    showMenu: 'Show menu',
  });
