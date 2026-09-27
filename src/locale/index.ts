export { LocaleProvider, useBloomLocale } from './context';
export { BLOOM_LANGUAGES, resolveBloomLanguage, type BloomLanguage } from './languages';
// `messages.ts` and `plural.ts` are how families localise themselves, not app
// API: an app speaks through `locale` and each family's `labels` overrides.
