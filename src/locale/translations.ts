import { resolveBloomLanguage, runtimeLocale, type BloomLanguage } from './languages';
import type { Translations } from './translations/types';

/**
 * Bloom's strings in every language but English, loaded on demand.
 *
 * English lives inline in each family's `messages.ts`, so a component always
 * has something to render synchronously. Every other language is one module
 * under `./translations/`, holding that language for EVERY family, and this
 * file is its only importer: each `import()` below is the single site that
 * reaches its module, so a bundler emits one chunk per language and an app
 * downloads the strings of the language it runs in and nothing else. (Expo's
 * web export hoists any module two async chunks share into the eager
 * `__common` chunk; a second importer of a language module would put it back
 * in every page load.)
 */

type TranslatedLanguage = Exclude<BloomLanguage, 'en'>;

/**
 * The languages loaded so far, and those whose module failed to load (they
 * render in English rather than hold a screen forever; the next request tries
 * again). Replaced, never mutated, so it can be a React snapshot.
 */
export interface LoadedTranslations {
  readonly tables: Readonly<Partial<Record<TranslatedLanguage, Translations>>>;
  readonly failed: ReadonlySet<TranslatedLanguage>;
}

let snapshot: LoadedTranslations = { tables: {}, failed: new Set() };

function update(language: TranslatedLanguage, table: Translations | undefined): void {
  const failed = new Set(snapshot.failed);
  if (table) failed.delete(language);
  else failed.add(language);
  snapshot = {
    tables: table ? { ...snapshot.tables, [language]: table } : snapshot.tables,
    failed,
  };
  for (const listener of listeners) listener();
}
const pending = new Map<TranslatedLanguage, Promise<void>>();
const listeners = new Set<() => void>();

function importLanguage(language: TranslatedLanguage): Promise<{ default: Translations }> {
  switch (language) {
    case 'es':
      return import('./translations/es');
    case 'ca':
      return import('./translations/ca');
    case 'de':
      return import('./translations/de');
    case 'fr':
      return import('./translations/fr');
    case 'it':
      return import('./translations/it');
    case 'pt':
      return import('./translations/pt');
    case 'ru':
      return import('./translations/ru');
    case 'tr':
      return import('./translations/tr');
    case 'ja':
      return import('./translations/ja');
    case 'zh':
      return import('./translations/zh');
    case 'ar':
      return import('./translations/ar');
    case 'hi':
      return import('./translations/hi');
    case 'bn':
      return import('./translations/bn');
    case 'id':
      return import('./translations/id');
  }
}

/** Makes `language`'s strings available. Idempotent; concurrent calls share one load. */
export function loadBloomLanguage(language: BloomLanguage): Promise<void> {
  if (language === 'en' || snapshot.tables[language]) return Promise.resolve();
  const inFlight = pending.get(language);
  if (inFlight) return inFlight;
  const load = importLanguage(language).then(
    (module) => {
      pending.delete(language);
      update(language, module.default);
    },
    (error: unknown) => {
      pending.delete(language);
      update(language, undefined);
      throw error;
    },
  );
  pending.set(language, load);
  return load;
}

/**
 * Loads Bloom's strings for `locale` (default: the runtime's) ahead of
 * rendering. Optional: `BloomProvider` loads its `locale` itself and holds its
 * first paint on `onFontsLoading` until they arrive. Call it where the first
 * render must already be translated without that hold — before hydrating
 * server-rendered markup, for instance.
 */
export function loadBloomLocale(locale?: string): Promise<void> {
  return loadBloomLanguage(resolveBloomLanguage(locale ?? runtimeLocale()));
}

/**
 * Whether `language`'s final strings are available in `translations`: English
 * always; another language once its module loaded — or failed, in which case
 * English stands in rather than holding the screen.
 */
export function isBloomLanguageSettled(
  translations: LoadedTranslations,
  language: BloomLanguage,
): boolean {
  return (
    language === 'en' ||
    translations.tables[language] !== undefined ||
    translations.failed.has(language)
  );
}

export function subscribeBloomTranslations(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBloomTranslations(): LoadedTranslations {
  return snapshot;
}

/**
 * Registers a language synchronously. For a test environment that cannot
 * await module loads; an app uses `loadBloomLocale`.
 */
export function registerBloomTranslations(
  language: TranslatedLanguage,
  translations: Translations,
): void {
  update(language, translations);
}

/** Forgets every loaded language. Tests only. */
export function resetBloomTranslations(): void {
  snapshot = { tables: {}, failed: new Set() };
  pending.clear();
  for (const listener of listeners) listener();
}
