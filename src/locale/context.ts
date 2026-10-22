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
  /** The explicit locale published to this subtree; undefined preserves automatic intent. */
  locale: string | undefined;
  /** The inherited target, which may still be loading while locale stays visible. */
  requestedLocale?: string;
  /** The effective locale used by Bloom rendering, including a stable SSR snapshot. */
  resolvedLocale?: string;
  /** The languages loaded when this scope last rendered. */
  translations: LoadedTranslations;
}

export const LocaleContext = createContext<LocaleScope | null>(null);

const subscribeRuntimeLocale = () => () => {};
const clientRuntimeLocale = () => runtimeLocale() ?? 'en';
// Static HTML cannot know the browser's language. Explicit locale props still
// win; an automatic locale must hydrate the server's English snapshot first.
const serverRuntimeLocale = () => 'en';

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
  const automaticLocale = useSyncExternalStore(
    subscribeRuntimeLocale,
    clientRuntimeLocale,
    serverRuntimeLocale,
  );
  const translations = useSyncExternalStore(
    subscribeBloomTranslations,
    getBloomTranslations,
    getBloomTranslations,
  );
  const requested = locale ?? parent?.requestedLocale ?? parent?.locale;
  const resolved = requested ?? automaticLocale;
  const language = resolveBloomLanguage(resolved);
  const settled = isBloomLanguageSettled(translations, language);

  // The last locale this scope published. Adjusted during render — React's
  // pattern for state derived from a changing input — so a settled locale is
  // published in the same render that notices it, not one commit later.
  const [shown, setShown] = useState<{
    locale: string | undefined;
    resolvedLocale: string;
    ever: boolean;
  }>(() =>
    settled
      ? { locale: requested, resolvedLocale: resolved, ever: true }
      : {
          locale: parent?.locale,
          resolvedLocale: parent?.resolvedLocale ?? parent?.locale ?? 'en',
          ever: false,
        },
  );
  if (settled && (!shown.ever || shown.locale !== requested || shown.resolvedLocale !== resolved)) {
    setShown({ locale: requested, resolvedLocale: resolved, ever: true });
  }

  useEffect(() => {
    // A failed load settles the language (English stands in); nothing to report here.
    if (!settled) loadBloomLanguage(language).catch(() => undefined);
  }, [language, settled]);

  const published = settled ? requested : shown.locale;
  const resolvedLocale = settled ? resolved : shown.resolvedLocale;
  const value = useMemo<LocaleScope>(
    () => ({ locale: published, requestedLocale: requested, resolvedLocale, translations }),
    [published, requested, resolvedLocale, translations],
  );

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

/** Internal rendering locale; unlike useBloomLocale, this includes automatic resolution. */
export function useResolvedBloomLocale(locale?: string): string | undefined {
  const inherited = useContext(LocaleContext);
  return locale ?? inherited?.resolvedLocale ?? inherited?.locale;
}
