import type { MessageCatalog } from '../locale/messages';

/** Every fixed string the theme toggle draws or announces, in each Bloom language. */
export interface ThemeToggleMessages {
  /** The segmented group's name. */
  theme: string;
  /** The sidebar row's text and name; a segment's and the icon button's tooltip. */
  darkMode: string;
  lightMode: string;
  /** A segment's or the icon button's name: the action it takes. */
  useDarkMode: string;
  useLightMode: string;
}

export const THEME_TOGGLE_MESSAGES: MessageCatalog<ThemeToggleMessages> = {
  en: { theme: 'Theme', darkMode: 'Dark mode', lightMode: 'Light mode', useDarkMode: 'Use dark mode', useLightMode: 'Use light mode' },
  es: { theme: 'Tema', darkMode: 'Modo oscuro', lightMode: 'Modo claro', useDarkMode: 'Usar modo oscuro', useLightMode: 'Usar modo claro' },
  ca: { theme: 'Tema', darkMode: 'Mode fosc', lightMode: 'Mode clar', useDarkMode: 'Utilitza el mode fosc', useLightMode: 'Utilitza el mode clar' },
  de: { theme: 'Design', darkMode: 'Dunkelmodus', lightMode: 'Hellmodus', useDarkMode: 'Dunkelmodus verwenden', useLightMode: 'Hellmodus verwenden' },
  fr: { theme: 'Thème', darkMode: 'Mode sombre', lightMode: 'Mode clair', useDarkMode: 'Utiliser le mode sombre', useLightMode: 'Utiliser le mode clair' },
  it: { theme: 'Tema', darkMode: 'Modalità scura', lightMode: 'Modalità chiara', useDarkMode: 'Usa la modalità scura', useLightMode: 'Usa la modalità chiara' },
  pt: { theme: 'Tema', darkMode: 'Modo escuro', lightMode: 'Modo claro', useDarkMode: 'Usar modo escuro', useLightMode: 'Usar modo claro' },
  ru: { theme: 'Тема', darkMode: 'Тёмная тема', lightMode: 'Светлая тема', useDarkMode: 'Включить тёмную тему', useLightMode: 'Включить светлую тему' },
  tr: { theme: 'Tema', darkMode: 'Koyu mod', lightMode: 'Açık mod', useDarkMode: 'Koyu modu kullan', useLightMode: 'Açık modu kullan' },
  ja: { theme: 'テーマ', darkMode: 'ダークモード', lightMode: 'ライトモード', useDarkMode: 'ダークモードにする', useLightMode: 'ライトモードにする' },
  zh: { theme: '主题', darkMode: '深色模式', lightMode: '浅色模式', useDarkMode: '使用深色模式', useLightMode: '使用浅色模式' },
  ar: { theme: 'المظهر', darkMode: 'الوضع الداكن', lightMode: 'الوضع الفاتح', useDarkMode: 'استخدام الوضع الداكن', useLightMode: 'استخدام الوضع الفاتح' },
  hi: { theme: 'थीम', darkMode: 'डार्क मोड', lightMode: 'लाइट मोड', useDarkMode: 'डार्क मोड इस्तेमाल करें', useLightMode: 'लाइट मोड इस्तेमाल करें' },
  bn: { theme: 'থিম', darkMode: 'ডার্ক মোড', lightMode: 'লাইট মোড', useDarkMode: 'ডার্ক মোড ব্যবহার করুন', useLightMode: 'লাইট মোড ব্যবহার করুন' },
  id: { theme: 'Tema', darkMode: 'Mode gelap', lightMode: 'Mode terang', useDarkMode: 'Gunakan mode gelap', useLightMode: 'Gunakan mode terang' },
};
