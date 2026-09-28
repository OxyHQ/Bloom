import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the media-shelf family draws or announces, in each Bloom
 * language. Previous/next come from the common words; a caller's `*Label`
 * prop still wins over any entry.
 */
export interface MediaShelfMessages {
  /** `FilterChips`' group name. */
  filters: string;
  /** `Shelf`'s header link. */
  showAll: string;
}

export const MEDIA_SHELF_MESSAGES: MessageCatalog<MediaShelfMessages> = {
  en: { filters: 'Filters', showAll: 'Show all' },
  es: { filters: 'Filtros', showAll: 'Mostrar todo' },
  ca: { filters: 'Filtres', showAll: 'Mostra-ho tot' },
  de: { filters: 'Filter', showAll: 'Alle anzeigen' },
  fr: { filters: 'Filtres', showAll: 'Tout afficher' },
  it: { filters: 'Filtri', showAll: 'Mostra tutto' },
  pt: { filters: 'Filtros', showAll: 'Mostrar tudo' },
  ru: { filters: 'Фильтры', showAll: 'Показать все' },
  tr: { filters: 'Filtreler', showAll: 'Tümünü göster' },
  ja: { filters: 'フィルター', showAll: 'すべて表示' },
  zh: { filters: '筛选', showAll: '显示全部' },
  ar: { filters: 'عوامل التصفية', showAll: 'عرض الكل' },
  hi: { filters: 'फ़िल्टर', showAll: 'सभी दिखाएं' },
  bn: { filters: 'ফিল্টার', showAll: 'সব দেখান' },
  id: { filters: 'Filter', showAll: 'Tampilkan semua' },
};
