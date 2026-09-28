export { LocaleProvider, useBloomLocale, type LocaleProviderProps } from './context';
export { loadBloomLocale } from './translations';
export { BLOOM_LANGUAGES, resolveBloomLanguage, type BloomLanguage } from './languages';
// `messages.ts` and `plural.ts` are how families localise themselves, not app
// API: an app speaks through `locale` and each family's `labels` overrides.
