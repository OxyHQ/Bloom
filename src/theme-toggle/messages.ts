import { defineMessages, type MessageCatalog } from '../locale/messages';

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

export const THEME_TOGGLE_MESSAGES: MessageCatalog<ThemeToggleMessages> =
  defineMessages<ThemeToggleMessages>('THEME_TOGGLE_MESSAGES', {
    theme: 'Theme',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    useDarkMode: 'Use dark mode',
    useLightMode: 'Use light mode',
  });
