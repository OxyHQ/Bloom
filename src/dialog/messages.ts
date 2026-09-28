import type { MessageCatalog } from '../locale/messages';

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

export const DIALOG_MESSAGES: MessageCatalog<DialogMessages> = {
  en: {
    view: 'View',
    dismissDialog: 'Dismiss dialog',
    dismissNamed: (label) => `Dismiss ${label}`,
  },
  es: {
    view: 'Vista',
    dismissDialog: 'Cerrar diálogo',
    dismissNamed: (label) => `Cerrar ${label}`,
  },
  ca: {
    view: 'Vista',
    dismissDialog: 'Tanca el diàleg',
    dismissNamed: (label) => `Tanca ${label}`,
  },
  de: {
    view: 'Ansicht',
    dismissDialog: 'Dialog schließen',
    dismissNamed: (label) => `${label} schließen`,
  },
  fr: {
    view: 'Vue',
    dismissDialog: 'Fermer la boîte de dialogue',
    dismissNamed: (label) => `Fermer ${label}`,
  },
  it: {
    view: 'Vista',
    dismissDialog: 'Chiudi finestra di dialogo',
    dismissNamed: (label) => `Chiudi ${label}`,
  },
  pt: {
    view: 'Visualização',
    dismissDialog: 'Fechar caixa de diálogo',
    dismissNamed: (label) => `Fechar ${label}`,
  },
  ru: {
    view: 'Вид',
    dismissDialog: 'Закрыть диалоговое окно',
    dismissNamed: (label) => `Закрыть: ${label}`,
  },
  tr: {
    view: 'Görünüm',
    dismissDialog: 'İletişim kutusunu kapat',
    dismissNamed: (label) => `${label} kapat`,
  },
  ja: {
    view: '表示',
    dismissDialog: 'ダイアログを閉じる',
    dismissNamed: (label) => `${label}を閉じる`,
  },
  zh: {
    view: '视图',
    dismissDialog: '关闭对话框',
    dismissNamed: (label) => `关闭${label}`,
  },
  ar: {
    view: 'العرض',
    dismissDialog: 'إغلاق مربع الحوار',
    dismissNamed: (label) => `إغلاق ${label}`,
  },
  hi: {
    view: 'दृश्य',
    dismissDialog: 'डायलॉग बंद करें',
    dismissNamed: (label) => `${label} बंद करें`,
  },
  bn: {
    view: 'ভিউ',
    dismissDialog: 'ডায়ালগ বন্ধ করুন',
    dismissNamed: (label) => `${label} বন্ধ করুন`,
  },
  id: {
    view: 'Tampilan',
    dismissDialog: 'Tutup dialog',
    dismissNamed: (label) => `Tutup ${label}`,
  },
};
