import type { MessageCatalog } from '../locale/messages';

/**
 * The swipe row's fixed strings, in each Bloom language. A caller's
 * `closeLabel` still wins.
 */
export interface SwipeRowMessages {
  /** Names the tap target that closes an open pane. */
  closeActions: string;
}

export const SWIPE_ROW_MESSAGES: MessageCatalog<SwipeRowMessages> = {
  en: {
    closeActions: 'Close actions',
  },
  es: {
    closeActions: 'Cerrar acciones',
  },
  ca: {
    closeActions: 'Tanca les accions',
  },
  de: {
    closeActions: 'Aktionen schließen',
  },
  fr: {
    closeActions: 'Fermer les actions',
  },
  it: {
    closeActions: 'Chiudi azioni',
  },
  pt: {
    closeActions: 'Fechar ações',
  },
  ru: {
    closeActions: 'Скрыть действия',
  },
  tr: {
    closeActions: 'Eylemleri kapat',
  },
  ja: {
    closeActions: 'アクションを閉じる',
  },
  zh: {
    closeActions: '关闭操作',
  },
  ar: {
    closeActions: 'إغلاق الإجراءات',
  },
  hi: {
    closeActions: 'कार्रवाइयां बंद करें',
  },
  bn: {
    closeActions: 'অ্যাকশন বন্ধ করুন',
  },
  id: {
    closeActions: 'Tutup tindakan',
  },
};
