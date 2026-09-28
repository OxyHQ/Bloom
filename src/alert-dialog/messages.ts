import type { MessageCatalog } from '../locale/messages';

/**
 * The alert dialog's default confirm word, in each Bloom language ("Cancel"
 * is the common word). A caller's `confirmLabel` still wins.
 */
export interface AlertDialogMessages {
  confirm: string;
}

export const ALERT_DIALOG_MESSAGES: MessageCatalog<AlertDialogMessages> = {
  en: {
    confirm: 'Confirm',
  },
  es: {
    confirm: 'Confirmar',
  },
  ca: {
    confirm: 'Confirma',
  },
  de: {
    confirm: 'Bestätigen',
  },
  fr: {
    confirm: 'Confirmer',
  },
  it: {
    confirm: 'Conferma',
  },
  pt: {
    confirm: 'Confirmar',
  },
  ru: {
    confirm: 'Подтвердить',
  },
  tr: {
    confirm: 'Onayla',
  },
  ja: {
    confirm: '確認',
  },
  zh: {
    confirm: '确认',
  },
  ar: {
    confirm: 'تأكيد',
  },
  hi: {
    confirm: 'पुष्टि करें',
  },
  bn: {
    confirm: 'নিশ্চিত করুন',
  },
  id: {
    confirm: 'Konfirmasi',
  },
};
