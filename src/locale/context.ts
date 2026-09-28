import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { resolveBloomLanguage, runtimeLocale } from './languages';
import {
  getBloomTranslations,
  isBloomLanguageSettled,
  loadBloomLanguage,
  subscribeBloomTranslations,
  type LoadedTranslations,
} from './translations';

export interface LocaleScope {
  /** The locale published to this subtree; `undefined` means the runtime's. */
  locale: string | undefined;
  /** The languages loaded when this scope last rendered. */
  translations: LoadedTranslations;
}

export const LocaleContext = createContext<LocaleScope | null>(null);

export interface LocaleProviderProps {
  locale?: string;
  /**
   * Rendered instead of `children` until the locale's strings are available
   * the FIRST time, so a translated app never paints in English first.
   * Omitted, children render at once and the strings arrive in place.
   * `BloomProvider` passes its `onFontsLoading`.
   */
  fallback?: ReactNode;
  children?: ReactNode;
}

/**
 * Sets the locale every Bloom component below it formats and speaks in —
 * month names, dates, and Bloom's own fixed strings (Cancel, Apply, …).
 * `BloomProvider`'s `locale` prop mounts one; mount another to scope a subtree.
 * Unset, components follow the runtime's locale.
 *
 * Bloom's non-English strings load on demand, so a newly asked-for locale is
 * published only once its strings have loaded: until then the subtree keeps
 * the locale it had (or, on first mount, its parent's, or `fallback`). A
 * switch therefore changes every string, date and number in one render, with
 * no English frame in between.
 */
export function LocaleProvider({ locale, fallback, children }: LocaleProviderProps) {
  const parent = useContext(LocaleContext);
  const translations = useSyncExternalStore(subscribeBloomTranslations, getBloomTranslations, getBloomTranslations);
  const requested = locale ?? parent?.locale;
  const language = resolveBloomLanguage(requested ?? runtimeLocale());
  const settled = isBloomLanguageSettled(translations, language);

  // The last locale this scope published. Adjusted during render — React's
  // pattern for state derived from a changing input — so a settled locale is
  // published in the same render that notices it, not one commit later.
  const [shown, setShown] = useState<{ locale: string | undefined; ever: boolean }>(() =>
    settled ? { locale: requested, ever: true } : { locale: parent?.locale, ever: false },
  );
  if (settled && (!shown.ever || shown.locale !== requested)) {
    setShown({ locale: requested, ever: true });
  }

  useEffect(() => {
    // A failed load settles the language (English stands in); nothing to report here.
    if (!settled) loadBloomLanguage(language).catch(() => undefined);
  }, [language, settled]);

  const published = settled ? requested : shown.locale;
  const value = useMemo<LocaleScope>(() => ({ locale: published, translations }), [published, translations]);

  if (fallback !== undefined && !settled && !shown.ever) {
    return createElement(LocaleContext.Provider, { value }, fallback);
  }
  return createElement(LocaleContext.Provider, { value }, children);
}

/**
 * The locale a component should use: its own `locale` prop, else the nearest
 * `LocaleProvider`'s, else `undefined` — which `Intl` and the message catalogs
 * both read as "the runtime's".
 */
export function useBloomLocale(locale?: string): string | undefined {
  const inherited = useContext(LocaleContext);
  return locale ?? inherited?.locale;
}
