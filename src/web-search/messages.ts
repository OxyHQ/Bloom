import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `WebSearch` draws or announces, in each Bloom language.
 * The `labels` and `working` props still win over these.
 */
export interface WebSearchMessages {
  /** The collapsible sources row. */
  sources: string;
  /** The indicator trailing the log while it runs. */
  working: string;
}

export const WEB_SEARCH_MESSAGES: MessageCatalog<WebSearchMessages> = {
  en: { sources: 'Sources', working: 'Working' },
  es: { sources: 'Fuentes', working: 'Trabajando' },
  ca: { sources: 'Fonts', working: 'Treballant' },
  de: { sources: 'Quellen', working: 'Arbeitet' },
  fr: { sources: 'Sources consultées', working: 'En cours' },
  it: { sources: 'Fonti', working: 'In corso' },
  pt: { sources: 'Fontes', working: 'Trabalhando' },
  ru: { sources: 'Источники', working: 'Работаю' },
  tr: { sources: 'Kaynaklar', working: 'Çalışıyor' },
  ja: { sources: '情報源', working: '作業中' },
  zh: { sources: '来源', working: '处理中' },
  ar: { sources: 'المصادر', working: 'جارٍ العمل' },
  hi: { sources: 'स्रोत', working: 'काम चल रहा है' },
  bn: { sources: 'উৎস', working: 'কাজ চলছে' },
  id: { sources: 'Sumber', working: 'Sedang bekerja' },
};
