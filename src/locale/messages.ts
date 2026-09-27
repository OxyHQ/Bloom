import { useMemo } from 'react';

import { useBloomLocale } from './context';
import { resolveBloomLanguage, runtimeLocale, type BloomLanguage } from './languages';

/**
 * A family's fixed strings in every Bloom language. The type makes each
 * language REQUIRED and complete, so a missing translation is a type error
 * rather than an English word inside a translated screen.
 */
export type MessageCatalog<M> = Readonly<Record<BloomLanguage, M>>;

/** The catalog entry for `locale`, falling back to English for a language Bloom does not ship. */
export function pickMessages<M>(catalog: MessageCatalog<M>, locale: string | undefined): M {
  return catalog[resolveBloomLanguage(locale ?? runtimeLocale())];
}

/**
 * The resolved locale (prop → `LocaleProvider` → runtime) and the family's
 * strings in it. A component still lets its `labels` prop win over these.
 */
export function useMessages<M>(
  catalog: MessageCatalog<M>,
  localeProp?: string,
): { locale: string | undefined; messages: M } {
  const locale = useBloomLocale(localeProp);
  const messages = useMemo(() => pickMessages(catalog, locale), [catalog, locale]);
  return { locale, messages };
}
