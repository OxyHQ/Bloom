import type { MessageCatalog } from '../locale/messages';

/**
 * The names of `CategoryBar`'s web scroll arrows, in each Bloom language. A
 * caller's `previousLabel`/`nextLabel` still wins.
 */
export interface CategoryBarMessages {
  previous: string;
  next: string;
}

export const CATEGORY_BAR_MESSAGES: MessageCatalog<CategoryBarMessages> = {
  en: { previous: 'Previous categories', next: 'Next categories' },
  es: { previous: 'Categorías anteriores', next: 'Categorías siguientes' },
  ca: { previous: 'Categories anteriors', next: 'Categories següents' },
  de: { previous: 'Vorherige Kategorien', next: 'Nächste Kategorien' },
  fr: { previous: 'Catégories précédentes', next: 'Catégories suivantes' },
  it: { previous: 'Categorie precedenti', next: 'Categorie successive' },
  pt: { previous: 'Categorias anteriores', next: 'Próximas categorias' },
  ru: { previous: 'Предыдущие категории', next: 'Следующие категории' },
  tr: { previous: 'Önceki kategoriler', next: 'Sonraki kategoriler' },
  ja: { previous: '前のカテゴリ', next: '次のカテゴリ' },
  zh: { previous: '上一组类别', next: '下一组类别' },
  ar: { previous: 'الفئات السابقة', next: 'الفئات التالية' },
  hi: { previous: 'पिछली श्रेणियाँ', next: 'अगली श्रेणियाँ' },
  bn: { previous: 'আগের বিভাগগুলি', next: 'পরের বিভাগগুলি' },
  id: { previous: 'Kategori sebelumnya', next: 'Kategori berikutnya' },
};
