import { createContext, useContext } from 'react';
import { I18nManager } from 'react-native';
import type { Direction } from './types';

export const DirectionContext = createContext<{ locale: string; direction: Direction }>({
  locale: 'en', direction: I18nManager.isRTL ? 'rtl' : 'ltr',
});
export function useDirection(): Direction { return useContext(DirectionContext).direction; }
export function useBloomLocale() { return useContext(DirectionContext); }

/** Resolve by language and explicit script, without changing the device locale. */
export function directionForLocale(locale: string): Direction {
  const parts = locale.toLowerCase().replace(/_/g, '-').split('-');
  const script = parts.find(part => part.length === 4);
  if (script) return ['arab', 'hebr', 'thaa', 'nkoo', 'adlm', 'rohg', 'syrc', 'mand', 'samr'].includes(script) ? 'rtl' : 'ltr';
  return ['ar', 'he', 'iw', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ku', 'ckb'].includes(parts[0] ?? 'en') ? 'rtl' : 'ltr';
}
