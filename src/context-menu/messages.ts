import type { MessageCatalog } from '../locale/messages';

/**
 * The context menu's default accessible name, in each Bloom language. A
 * caller's `label` still wins.
 */
export interface ContextMenuMessages {
  contextMenu: string;
}

export const CONTEXT_MENU_MESSAGES: MessageCatalog<ContextMenuMessages> = {
  en: {
    contextMenu: 'Context menu',
  },
  es: {
    contextMenu: 'Menú contextual',
  },
  ca: {
    contextMenu: 'Menú contextual',
  },
  de: {
    contextMenu: 'Kontextmenü',
  },
  fr: {
    contextMenu: 'Menu contextuel',
  },
  it: {
    contextMenu: 'Menu contestuale',
  },
  pt: {
    contextMenu: 'Menu de contexto',
  },
  ru: {
    contextMenu: 'Контекстное меню',
  },
  tr: {
    contextMenu: 'Bağlam menüsü',
  },
  ja: {
    contextMenu: 'コンテキストメニュー',
  },
  zh: {
    contextMenu: '上下文菜单',
  },
  ar: {
    contextMenu: 'القائمة السياقية',
  },
  hi: {
    contextMenu: 'संदर्भ मेन्यू',
  },
  bn: {
    contextMenu: 'কনটেক্সট মেনু',
  },
  id: {
    contextMenu: 'Menu konteks',
  },
};
