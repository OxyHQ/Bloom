export { LocaleProvider, useBloomLocale, type LocaleProviderProps } from './context';
export { loadBloomLocale } from './translations';
export { BLOOM_LANGUAGES, resolveBloomLanguage, type BloomLanguage } from './languages';
// Numbers, money and durations in the reader's locale, as Bloom's own families
// format them: pass the locale `useBloomLocale()` resolved. (`formatFileSize`
// is `@oxy.so/bloom/file-upload`'s.)
export {
  formatClock,
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatInteger,
  formatMultiplier,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from './format-number';
export {
  formatRelativeTime,
  type RelativeTimeOptions,
  type RelativeTimeStyle,
} from './format-relative-time';
// `messages.ts` and `plural.ts` are how families localise themselves, not app
// API: an app speaks through `locale` and each family's `labels` overrides.
