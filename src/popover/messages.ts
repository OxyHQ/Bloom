import type { MessageCatalog } from '../locale/messages';

/**
 * The popover's default accessible name, in each Bloom language. A caller's
 * `label` still wins — and should be given, naming what the panel holds.
 */
export interface PopoverMessages {
  popover: string;
}

export const POPOVER_MESSAGES: MessageCatalog<PopoverMessages> = {
  en: {
    popover: 'Popover',
  },
  es: {
    popover: 'Ventana emergente',
  },
  ca: {
    popover: 'Finestra emergent',
  },
  de: {
    popover: 'Pop-up',
  },
  fr: {
    popover: 'Fenêtre contextuelle',
  },
  it: {
    popover: 'Finestra popup',
  },
  pt: {
    popover: 'Pop-over',
  },
  ru: {
    popover: 'Всплывающее окно',
  },
  tr: {
    popover: 'Açılır pencere',
  },
  ja: {
    popover: 'ポップオーバー',
  },
  zh: {
    popover: '弹出框',
  },
  ar: {
    popover: 'نافذة منبثقة',
  },
  hi: {
    popover: 'पॉपओवर',
  },
  bn: {
    popover: 'পপওভার',
  },
  id: {
    popover: 'Jendela munculan',
  },
};
