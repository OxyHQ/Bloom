import type { MessageCatalog } from '../locale/messages';

/**
 * The pagination's own fixed strings, in each Bloom language; Previous and
 * Next are the common words. A caller's `accessibilityLabel` / `getPageLabel`
 * still wins.
 */
export interface PaginationMessages {
  /** Names the navigation landmark. */
  pagination: string;
  /** Names a page button. */
  goToPage: (page: number) => string;
}

export const PAGINATION_MESSAGES: MessageCatalog<PaginationMessages> = {
  en: {
    pagination: 'Pagination',
    goToPage: (page) => `Go to page ${page}`,
  },
  es: {
    pagination: 'Paginación',
    goToPage: (page) => `Ir a la página ${page}`,
  },
  ca: {
    pagination: 'Paginació',
    goToPage: (page) => `Ves a la pàgina ${page}`,
  },
  de: {
    pagination: 'Seitennummerierung',
    goToPage: (page) => `Zu Seite ${page}`,
  },
  fr: {
    pagination: 'Navigation entre les pages',
    goToPage: (page) => `Aller à la page ${page}`,
  },
  it: {
    pagination: 'Paginazione',
    goToPage: (page) => `Vai a pagina ${page}`,
  },
  pt: {
    pagination: 'Paginação',
    goToPage: (page) => `Ir para a página ${page}`,
  },
  ru: {
    pagination: 'Нумерация страниц',
    goToPage: (page) => `Перейти на страницу ${page}`,
  },
  tr: {
    pagination: 'Sayfalandırma',
    goToPage: (page) => `${page}. sayfaya git`,
  },
  ja: {
    pagination: 'ページネーション',
    goToPage: (page) => `${page}ページへ移動`,
  },
  zh: {
    pagination: '分页',
    goToPage: (page) => `转到第 ${page} 页`,
  },
  ar: {
    pagination: 'ترقيم الصفحات',
    goToPage: (page) => `الانتقال إلى الصفحة ${page}`,
  },
  hi: {
    pagination: 'पेजिनेशन',
    goToPage: (page) => `पेज ${page} पर जाएं`,
  },
  bn: {
    pagination: 'পৃষ্ঠা নির্বাচন',
    goToPage: (page) => `পৃষ্ঠা ${page}-এ যান`,
  },
  id: {
    pagination: 'Penomoran halaman',
    goToPage: (page) => `Buka halaman ${page}`,
  },
};
