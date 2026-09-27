/**
 * The languages Bloom ships its own strings in — the fleet's app languages.
 * A `MessageCatalog` must name every one of them, so adding a language here
 * fails the type-check of every catalog until it is translated.
 */
export const BLOOM_LANGUAGES = [
  'en',
  'es',
  'ca',
  'de',
  'fr',
  'it',
  'pt',
  'ru',
  'tr',
  'ja',
  'zh',
  'ar',
  'hi',
  'bn',
  'id',
] as const;

export type BloomLanguage = (typeof BLOOM_LANGUAGES)[number];

const SUPPORTED = new Set<string>(BLOOM_LANGUAGES);

/**
 * The language a BCP 47 tag asks for, among Bloom's: its primary subtag
 * (`es-MX` → `es`, `pt_BR` → `pt`, `ca-ES-valencia` → `ca`). Anything Bloom
 * does not ship, and no tag at all, falls back to English.
 */
export function resolveBloomLanguage(locale: string | null | undefined): BloomLanguage {
  const primary = locale?.split(/[-_]/)[0]?.toLowerCase();
  return primary && SUPPORTED.has(primary) ? (primary as BloomLanguage) : 'en';
}

/** The runtime's own locale (the browser's, or the device's through Hermes' `Intl`). */
export function runtimeLocale(): string | undefined {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}
