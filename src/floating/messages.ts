import type { MessageCatalog } from '../locale/messages';

/**
 * The floating menus' own fixed strings, in each Bloom language. A caller's
 * `label` still wins.
 */
export interface FloatingMessages {
  /** A submenu panel's default name. */
  submenu: string;
}

export const FLOATING_MESSAGES: MessageCatalog<FloatingMessages> = {
  en: {
    submenu: 'Submenu',
  },
  es: {
    submenu: 'Submenú',
  },
  ca: {
    submenu: 'Submenú',
  },
  de: {
    submenu: 'Untermenü',
  },
  fr: {
    submenu: 'Sous-menu',
  },
  it: {
    submenu: 'Sottomenu',
  },
  pt: {
    submenu: 'Menu secundário',
  },
  ru: {
    submenu: 'Подменю',
  },
  tr: {
    submenu: 'Alt menü',
  },
  ja: {
    submenu: 'サブメニュー',
  },
  zh: {
    submenu: '子菜单',
  },
  ar: {
    submenu: 'قائمة فرعية',
  },
  hi: {
    submenu: 'उप-मेन्यू',
  },
  bn: {
    submenu: 'সাবমেনু',
  },
  id: {
    submenu: 'Sub-menu',
  },
};
