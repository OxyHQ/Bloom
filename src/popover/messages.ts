import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The popover's default accessible name, in each Bloom language. A caller's
 * `label` still wins — and should be given, naming what the panel holds.
 */
export interface PopoverMessages {
  popover: string;
}

export const POPOVER_MESSAGES: MessageCatalog<PopoverMessages> = defineMessages<PopoverMessages>('POPOVER_MESSAGES', {
  popover: 'Popover',
});
