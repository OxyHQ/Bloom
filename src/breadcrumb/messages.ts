import type { MessageCatalog } from '../locale/messages';

/**
 * The breadcrumb's landmark name, in each Bloom language. A caller's
 * `accessibilityLabel` still wins.
 */
export interface BreadcrumbMessages {
  breadcrumb: string;
}

export const BREADCRUMB_MESSAGES: MessageCatalog<BreadcrumbMessages> = {
  en: {
    breadcrumb: 'Breadcrumb',
  },
  es: {
    breadcrumb: 'Ruta de navegación',
  },
  ca: {
    breadcrumb: 'Ruta de navegació',
  },
  de: {
    breadcrumb: 'Brotkrümelnavigation',
  },
  fr: {
    breadcrumb: 'Fil d’Ariane',
  },
  it: {
    breadcrumb: 'Percorso di navigazione',
  },
  pt: {
    breadcrumb: 'Trilha de navegação',
  },
  ru: {
    breadcrumb: 'Навигационная цепочка',
  },
  tr: {
    breadcrumb: 'İçerik haritası',
  },
  ja: {
    breadcrumb: 'パンくずリスト',
  },
  zh: {
    breadcrumb: '面包屑导航',
  },
  ar: {
    breadcrumb: 'مسار التنقل',
  },
  hi: {
    breadcrumb: 'ब्रेडक्रंब',
  },
  bn: {
    breadcrumb: 'ব্রেডক্রাম্ব',
  },
  id: {
    breadcrumb: 'Jejak navigasi',
  },
};
