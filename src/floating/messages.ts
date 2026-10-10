import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The floating menus' own fixed strings, in each Bloom language. A caller's
 * `label` still wins.
 */
export interface FloatingMessages {
  /** A submenu panel's default name. */
  submenu: string;
}

export const FLOATING_MESSAGES: MessageCatalog<FloatingMessages> = defineMessages<FloatingMessages>(
  'FLOATING_MESSAGES',
  {
    submenu: 'Submenu',
  },
);
