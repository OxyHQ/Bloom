import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The alert dialog's default confirm word, in each Bloom language ("Cancel"
 * is the common word). A caller's `confirmLabel` still wins.
 */
export interface AlertDialogMessages {
  confirm: string;
}

export const ALERT_DIALOG_MESSAGES: MessageCatalog<AlertDialogMessages> =
  defineMessages<AlertDialogMessages>('ALERT_DIALOG_MESSAGES', {
    confirm: 'Confirm',
  });
