import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The dialog family's own fixed strings, in each Bloom language; the words it
 * shares with every family (Close, Back, Search…) come from `COMMON_MESSAGES`.
 */
export interface DialogMessages {
  /** Names a header's segmented tabs when the header has no title. */
  view: string;
  /** Names the backdrop of a dialog with no `label`. */
  dismissDialog: string;
  /** Names the backdrop of a dialog called `label` ("Dismiss Post options"). */
  dismissNamed: (label: string) => string;
}

export const DIALOG_MESSAGES: MessageCatalog<DialogMessages> = defineMessages<DialogMessages>('DIALOG_MESSAGES', {
  view: 'View',
  dismissDialog: 'Dismiss dialog',
  dismissNamed: (label) => `Dismiss ${label}`,
});
