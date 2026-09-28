import { useContext, useMemo } from 'react';

import { LocaleContext } from './context';
import { resolveBloomLanguage, runtimeLocale } from './languages';
import { getBloomTranslations, type LoadedTranslations } from './translations';
import type { Translations } from './translations/types';

/**
 * A family's fixed strings. The English ones are inline; every other language
 * lives in `./translations/<language>.ts` under the catalog's `id`, where the
 * `Translations` type makes each family and each key REQUIRED, so a missing
 * translation is a type error rather than an English word inside a translated
 * screen.
 */
export interface MessageCatalog<M> {
  /** The catalog's key in `Translations`: its exported name. */
  readonly id: string;
  readonly en: M;
}

/** The strings type of a catalog. */
export type CatalogMessages<C> = C extends MessageCatalog<infer M> ? M : never;

/** Declares a family's catalog: its id (its exported name) and its English strings. */
export function defineMessages<M>(id: keyof Translations, en: M): MessageCatalog<M> {
  return { id, en };
}

function pickFrom<M>(translations: LoadedTranslations, catalog: MessageCatalog<M>, locale: string | undefined): M {
  const language = resolveBloomLanguage(locale ?? runtimeLocale());
  if (language === 'en') return catalog.en;
  const table = translations.tables[language];
  // `Translations[id]` IS `M`: `translations/types.ts` derives each entry from
  // the catalog declared under that id (`CatalogMessages<typeof ID>`).
  return table ? (table[catalog.id as keyof Translations] as unknown as M) : catalog.en;
}

/**
 * The catalog entry for `locale`: English for a language Bloom does not ship,
 * and for one whose strings have not loaded (see `loadBloomLocale`).
 */
export function pickMessages<M>(catalog: MessageCatalog<M>, locale: string | undefined): M {
  return pickFrom(getBloomTranslations(), catalog, locale);
}

/**
 * The resolved locale (prop → `LocaleProvider` → runtime) and the family's
 * strings in it. A component still lets its `labels` prop win over these.
 * Re-renders with the translated strings when a `LocaleProvider` above it
 * finishes loading them.
 */
export function useMessages<M>(
  catalog: MessageCatalog<M>,
  localeProp?: string,
): { locale: string | undefined; messages: M } {
  const scope = useContext(LocaleContext);
  const locale = localeProp ?? scope?.locale;
  const translations = scope ? scope.translations : getBloomTranslations();
  const messages = useMemo(() => pickFrom(translations, catalog, locale), [translations, catalog, locale]);
  return { locale, messages };
}
