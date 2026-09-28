import { defineMessages, type MessageCatalog } from '../locale/messages';

/** The select family's fixed words, in each Bloom language. `label` still wins. */
export interface SelectMessages {
  /** The list's name when `SelectContent` has no `label`. */
  selectOption: string;
  /** The scroll chevrons' names. */
  scrollUp: string;
  scrollDown: string;
}

export const SELECT_MESSAGES: MessageCatalog<SelectMessages> = defineMessages<SelectMessages>('SELECT_MESSAGES', { selectOption: 'Select an option', scrollUp: 'Scroll up', scrollDown: 'Scroll down' });
