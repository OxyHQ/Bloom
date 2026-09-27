import { createContext, createElement, useContext, type ReactNode } from 'react';

const LocaleContext = createContext<string | undefined>(undefined);

/**
 * Sets the locale every Bloom component below it formats and speaks in —
 * month names, dates, and Bloom's own fixed strings (Cancel, Apply, …).
 * `BloomProvider`'s `locale` prop mounts one; mount another to scope a subtree.
 * Unset, components follow the runtime's locale.
 */
export function LocaleProvider({ locale, children }: { locale?: string; children?: ReactNode }) {
  return createElement(LocaleContext.Provider, { value: locale }, children);
}

/**
 * The locale a component should use: its own `locale` prop, else the nearest
 * `LocaleProvider`'s, else `undefined` — which `Intl` and the message catalogs
 * both read as "the runtime's".
 */
export function useBloomLocale(locale?: string): string | undefined {
  const inherited = useContext(LocaleContext);
  return locale ?? inherited;
}
