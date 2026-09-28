import type { MessageCatalog } from '../locale/messages';

/**
 * `Search`'s own words, in each Bloom language. The field's name is the
 * common "Search"; `label` still wins over it.
 */
export interface SearchMessages {
  /** The clear (✕) button's name. */
  clearQuery: string;
}

export const SEARCH_MESSAGES: MessageCatalog<SearchMessages> = {
  en: { clearQuery: 'Clear search query' },
  es: { clearQuery: 'Borrar la búsqueda' },
  ca: { clearQuery: 'Esborra la cerca' },
  de: { clearQuery: 'Suchanfrage löschen' },
  fr: { clearQuery: 'Effacer la recherche' },
  it: { clearQuery: 'Cancella la ricerca' },
  pt: { clearQuery: 'Limpar pesquisa' },
  ru: { clearQuery: 'Очистить поисковый запрос' },
  tr: { clearQuery: 'Arama sorgusunu temizle' },
  ja: { clearQuery: '検索語句をクリア' },
  zh: { clearQuery: '清除搜索内容' },
  ar: { clearQuery: 'مسح عبارة البحث' },
  hi: { clearQuery: 'खोज क्वेरी साफ़ करें' },
  bn: { clearQuery: 'অনুসন্ধান মুছে ফেলুন' },
  id: { clearQuery: 'Hapus kueri pencarian' },
};
