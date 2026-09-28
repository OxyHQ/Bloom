import type { MessageCatalog } from '../locale/messages';
import { plural, type PluralCategory } from '../locale/plural';
import type { BloomLanguage } from '../locale/languages';

/**
 * Every fixed string the rating family draws or announces, in each Bloom
 * language. `reviewsLabel`, `newLabel` and `formatStarLabel` still win.
 */
export interface RatingMessages {
  /** Drawn in place of the value when there is no rating yet. */
  newRating: string;
  /** The count and its word, "128 reviews". `count` is drawn exactly as given ("1.2k" too). */
  reviews: (count: number | string) => string;
  /** The accessible name of a rated `Rating`: "Rated 4.9 out of 5". */
  rated: (value: string) => string;
  /** The same with the count's words (`reviews(…)` or the caller's) appended. */
  ratedWithReviews: (value: string, reviews: string) => string;
  /** `RatingInput`'s name for one star: "4 stars". */
  star: (value: number, max: number) => string;
}

/**
 * `plural` for a count that may be a preformatted string: the category comes
 * from its number when it has one, and `{n}` is the string as given.
 */
function countForms(
  language: BloomLanguage,
  count: number | string,
  forms: Partial<Record<PluralCategory, string>> & { other: string },
): string {
  const n = typeof count === 'number' ? count : Number(count);
  const withSlot = Object.fromEntries(
    Object.entries(forms).map(([key, form]) => [key, form.replace('{n}', '\u0000')]),
  ) as typeof forms;
  return plural(language, Number.isFinite(n) ? n : 99, withSlot).replace('\u0000', String(count));
}

export const RATING_MESSAGES: MessageCatalog<RatingMessages> = {
  en: {
    newRating: 'New',
    reviews: (c) => countForms('en', c, { one: '{n} review', other: '{n} reviews' }),
    rated: (v) => `Rated ${v} out of 5`,
    ratedWithReviews: (v, r) => `Rated ${v} out of 5, ${r}`,
    star: (n) => plural('en', n, { one: '{n} star', other: '{n} stars' }),
  },
  es: {
    newRating: 'Nuevo',
    reviews: (c) => countForms('es', c, { one: '{n} reseña', other: '{n} reseñas' }),
    rated: (v) => `Valoración: ${v} de 5`,
    ratedWithReviews: (v, r) => `Valoración: ${v} de 5, ${r}`,
    star: (n) => plural('es', n, { one: '{n} estrella', other: '{n} estrellas' }),
  },
  ca: {
    newRating: 'Nou',
    reviews: (c) => countForms('ca', c, { one: '{n} ressenya', other: '{n} ressenyes' }),
    rated: (v) => `Valoració: ${v} de 5`,
    ratedWithReviews: (v, r) => `Valoració: ${v} de 5, ${r}`,
    star: (n) => plural('ca', n, { one: '{n} estrella', other: '{n} estrelles' }),
  },
  de: {
    newRating: 'Neu',
    reviews: (c) => countForms('de', c, { one: '{n} Bewertung', other: '{n} Bewertungen' }),
    rated: (v) => `Bewertet mit ${v} von 5`,
    ratedWithReviews: (v, r) => `Bewertet mit ${v} von 5, ${r}`,
    star: (n) => plural('de', n, { one: '{n} Stern', other: '{n} Sterne' }),
  },
  fr: {
    newRating: 'Nouveau',
    reviews: (c) => countForms('fr', c, { one: '{n} avis', other: '{n} avis' }),
    rated: (v) => `Noté ${v} sur 5`,
    ratedWithReviews: (v, r) => `Noté ${v} sur 5, ${r}`,
    star: (n) => plural('fr', n, { one: '{n} étoile', other: '{n} étoiles' }),
  },
  it: {
    newRating: 'Nuovo',
    reviews: (c) => countForms('it', c, { one: '{n} recensione', other: '{n} recensioni' }),
    rated: (v) => `Valutazione ${v} su 5`,
    ratedWithReviews: (v, r) => `Valutazione ${v} su 5, ${r}`,
    star: (n) => plural('it', n, { one: '{n} stella', other: '{n} stelle' }),
  },
  pt: {
    newRating: 'Novo',
    reviews: (c) => countForms('pt', c, { one: '{n} avaliação', other: '{n} avaliações' }),
    rated: (v) => `Avaliado com ${v} de 5`,
    ratedWithReviews: (v, r) => `Avaliado com ${v} de 5, ${r}`,
    star: (n) => plural('pt', n, { one: '{n} estrela', other: '{n} estrelas' }),
  },
  ru: {
    newRating: 'Новое',
    reviews: (c) =>
      countForms('ru', c, { one: '{n} отзыв', few: '{n} отзыва', many: '{n} отзывов', other: '{n} отзыва' }),
    rated: (v) => `Оценка ${v} из 5`,
    ratedWithReviews: (v, r) => `Оценка ${v} из 5, ${r}`,
    star: (n) => plural('ru', n, { one: '{n} звезда', few: '{n} звезды', many: '{n} звёзд', other: '{n} звезды' }),
  },
  tr: {
    newRating: 'Yeni',
    reviews: (c) => countForms('tr', c, { other: '{n} değerlendirme' }),
    rated: (v) => `5 üzerinden ${v} puan`,
    ratedWithReviews: (v, r) => `5 üzerinden ${v} puan, ${r}`,
    star: (n) => plural('tr', n, { other: '{n} yıldız' }),
  },
  ja: {
    newRating: '新着',
    reviews: (c) => countForms('ja', c, { other: 'レビュー{n}件' }),
    rated: (v) => `5点中${v}点`,
    ratedWithReviews: (v, r) => `5点中${v}点、${r}`,
    star: (n) => plural('ja', n, { other: '星{n}つ' }),
  },
  zh: {
    newRating: '新',
    reviews: (c) => countForms('zh', c, { other: '{n} 条评价' }),
    rated: (v) => `评分 ${v}（满分 5 分）`,
    ratedWithReviews: (v, r) => `评分 ${v}（满分 5 分），${r}`,
    star: (n) => plural('zh', n, { other: '{n} 星' }),
  },
  ar: {
    newRating: 'جديد',
    reviews: (c) =>
      countForms('ar', c, {
        zero: 'لا توجد مراجعات',
        one: 'مراجعة واحدة',
        two: 'مراجعتان',
        few: '{n} مراجعات',
        many: '{n} مراجعة',
        other: '{n} مراجعة',
      }),
    rated: (v) => `التقييم ${v} من 5`,
    ratedWithReviews: (v, r) => `التقييم ${v} من 5، ${r}`,
    star: (n) =>
      plural('ar', n, {
        zero: 'لا نجوم',
        one: 'نجمة واحدة',
        two: 'نجمتان',
        few: '{n} نجوم',
        many: '{n} نجمة',
        other: '{n} نجمة',
      }),
  },
  hi: {
    newRating: 'नया',
    reviews: (c) => countForms('hi', c, { one: '{n} समीक्षा', other: '{n} समीक्षाएँ' }),
    rated: (v) => `5 में से ${v} रेटिंग`,
    ratedWithReviews: (v, r) => `5 में से ${v} रेटिंग, ${r}`,
    star: (n) => plural('hi', n, { one: '{n} स्टार', other: '{n} स्टार' }),
  },
  bn: {
    newRating: 'নতুন',
    reviews: (c) => countForms('bn', c, { other: '{n}টি রিভিউ' }),
    rated: (v) => `৫-এর মধ্যে ${v} রেটিং`,
    ratedWithReviews: (v, r) => `৫-এর মধ্যে ${v} রেটিং, ${r}`,
    star: (n) => plural('bn', n, { other: '{n} তারকা' }),
  },
  id: {
    newRating: 'Baru',
    reviews: (c) => countForms('id', c, { other: '{n} ulasan' }),
    rated: (v) => `Rating ${v} dari 5`,
    ratedWithReviews: (v, r) => `Rating ${v} dari 5, ${r}`,
    star: (n) => plural('id', n, { other: '{n} bintang' }),
  },
};
