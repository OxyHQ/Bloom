import type { MessageCatalog } from '../locale/messages';

/**
 * The menubar's own fixed strings, in each Bloom language; a menu's default
 * name is the common word "Menu". A caller's `label` still wins.
 */
export interface MenubarMessages {
  /** Names the bar itself. */
  menuBar: string;
}

export const MENUBAR_MESSAGES: MessageCatalog<MenubarMessages> = {
  en: {
    menuBar: 'Menu bar',
  },
  es: {
    menuBar: 'Barra de menús',
  },
  ca: {
    menuBar: 'Barra de menús',
  },
  de: {
    menuBar: 'Menüleiste',
  },
  fr: {
    menuBar: 'Barre de menus',
  },
  it: {
    menuBar: 'Barra dei menu',
  },
  pt: {
    menuBar: 'Barra de menus',
  },
  ru: {
    menuBar: 'Строка меню',
  },
  tr: {
    menuBar: 'Menü çubuğu',
  },
  ja: {
    menuBar: 'メニューバー',
  },
  zh: {
    menuBar: '菜单栏',
  },
  ar: {
    menuBar: 'شريط القوائم',
  },
  hi: {
    menuBar: 'मेन्यू बार',
  },
  bn: {
    menuBar: 'মেনু বার',
  },
  id: {
    menuBar: 'Bilah menu',
  },
};
