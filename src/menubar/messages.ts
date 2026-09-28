import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The menubar's own fixed strings, in each Bloom language; a menu's default
 * name is the common word "Menu". A caller's `label` still wins.
 */
export interface MenubarMessages {
  /** Names the bar itself. */
  menuBar: string;
}

export const MENUBAR_MESSAGES: MessageCatalog<MenubarMessages> = defineMessages<MenubarMessages>('MENUBAR_MESSAGES', {
  menuBar: 'Menu bar',
});
