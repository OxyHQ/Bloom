import type { BloomLanguage } from '../locale/languages';
import type { MessageCatalog } from '../locale/messages';
import { plural, pluralCategory, type PluralCategory } from '../locale/plural';
import type { VendorAvailability, VendorFactKey } from './types';

/**
 * Every fixed string the vendor card draws or announces, in each Bloom
 * language. A caller's `factLabels`, `availabilityLabel`, `newLabel` and
 * `accessibilityLabel` still win over any entry here.
 */
export interface VendorCardMessages {
  /** The word said before each reading in the card's accessible name. */
  facts: Record<VendorFactKey, string>;
  /** The status pill. `open` draws none. */
  availability: Record<Exclude<VendorAvailability, 'open'>, string>;
  /** An unrated vendor's mark. */
  new: string;
  /**
   * The rating in the card's accessible name: "Rated 4.8 out of 5, 214
   * reviews". `reviews` is the app's count, a number or pre-formatted text.
   */
  rated: (value: string, reviews?: number | string) => string;
}

/** A count the app may hand over as a number or as its own text ("1.2k"). */
function counted(
  language: BloomLanguage,
  count: number | string,
  forms: Partial<Record<PluralCategory, string>> & { other: string },
): string {
  if (typeof count === 'number') return plural(language, count, forms);
  const form = /^\d+$/.test(count) ? forms[pluralCategory(language, Number(count))] : undefined;
  return (form ?? forms.other).replace('{n}', count);
}

const has = (reviews: number | string | undefined): reviews is number | string =>
  reviews != null && reviews !== '';

export const VENDOR_CARD_MESSAGES: MessageCatalog<VendorCardMessages> = {
  en: {
    facts: { deliveryTime: 'Delivery time', deliveryFee: 'Delivery', distance: 'Distance', minimumOrder: 'Minimum order' },
    availability: { paused: 'Paused', closed: 'Closed' },
    new: 'New',
    rated: (value, reviews) =>
      `Rated ${value} out of 5${has(reviews) ? `, ${counted('en', reviews, { one: '{n} review', other: '{n} reviews' })}` : ''}`,
  },
  es: {
    facts: { deliveryTime: 'Tiempo de entrega', deliveryFee: 'Envío', distance: 'Distancia', minimumOrder: 'Pedido mínimo' },
    availability: { paused: 'En pausa', closed: 'Cerrado' },
    new: 'Nuevo',
    rated: (value, reviews) =>
      `Valoración: ${value} de 5${has(reviews) ? `, ${counted('es', reviews, { one: '{n} reseña', other: '{n} reseñas' })}` : ''}`,
  },
  ca: {
    facts: { deliveryTime: "Temps d'entrega", deliveryFee: 'Enviament', distance: 'Distància', minimumOrder: 'Comanda mínima' },
    availability: { paused: 'En pausa', closed: 'Tancat' },
    new: 'Nou',
    rated: (value, reviews) =>
      `Valoració: ${value} de 5${has(reviews) ? `, ${counted('ca', reviews, { one: '{n} ressenya', other: '{n} ressenyes' })}` : ''}`,
  },
  de: {
    facts: { deliveryTime: 'Lieferzeit', deliveryFee: 'Liefergebühr', distance: 'Entfernung', minimumOrder: 'Mindestbestellwert' },
    availability: { paused: 'Pausiert', closed: 'Geschlossen' },
    new: 'Neu',
    rated: (value, reviews) =>
      `Bewertet mit ${value} von 5${has(reviews) ? `, ${counted('de', reviews, { one: '{n} Bewertung', other: '{n} Bewertungen' })}` : ''}`,
  },
  fr: {
    facts: { deliveryTime: 'Délai de livraison', deliveryFee: 'Livraison', distance: 'Distance', minimumOrder: 'Commande minimum' },
    availability: { paused: 'En pause', closed: 'Fermé' },
    new: 'Nouveau',
    rated: (value, reviews) =>
      `Noté ${value} sur 5${has(reviews) ? `, ${counted('fr', reviews, { one: '{n} avis', other: '{n} avis' })}` : ''}`,
  },
  it: {
    facts: { deliveryTime: 'Tempo di consegna', deliveryFee: 'Consegna', distance: 'Distanza', minimumOrder: 'Ordine minimo' },
    availability: { paused: 'In pausa', closed: 'Chiuso' },
    new: 'Nuovo',
    rated: (value, reviews) =>
      `Valutazione ${value} su 5${has(reviews) ? `, ${counted('it', reviews, { one: '{n} recensione', other: '{n} recensioni' })}` : ''}`,
  },
  pt: {
    facts: { deliveryTime: 'Tempo de entrega', deliveryFee: 'Entrega', distance: 'Distância', minimumOrder: 'Pedido mínimo' },
    availability: { paused: 'Pausado', closed: 'Fechado' },
    new: 'Novo',
    rated: (value, reviews) =>
      `Avaliação ${value} de 5${has(reviews) ? `, ${counted('pt', reviews, { one: '{n} avaliação', other: '{n} avaliações' })}` : ''}`,
  },
  ru: {
    facts: { deliveryTime: 'Время доставки', deliveryFee: 'Доставка', distance: 'Расстояние', minimumOrder: 'Минимальный заказ' },
    availability: { paused: 'Приостановлено', closed: 'Закрыто' },
    new: 'Новое',
    rated: (value, reviews) =>
      `Оценка ${value} из 5${has(reviews) ? `, ${counted('ru', reviews, { one: '{n} отзыв', few: '{n} отзыва', many: '{n} отзывов', other: '{n} отзыва' })}` : ''}`,
  },
  tr: {
    facts: { deliveryTime: 'Teslimat süresi', deliveryFee: 'Teslimat', distance: 'Mesafe', minimumOrder: 'Minimum sipariş' },
    availability: { paused: 'Duraklatıldı', closed: 'Kapalı' },
    new: 'Yeni',
    rated: (value, reviews) =>
      `5 üzerinden ${value} puan${has(reviews) ? `, ${counted('tr', reviews, { other: '{n} değerlendirme' })}` : ''}`,
  },
  ja: {
    facts: { deliveryTime: '配達時間', deliveryFee: '配達料', distance: '距離', minimumOrder: '最低注文金額' },
    availability: { paused: '一時停止中', closed: '営業時間外' },
    new: '新着',
    rated: (value, reviews) =>
      `評価 ${value}（5点満点）${has(reviews) ? `、${counted('ja', reviews, { other: 'レビュー{n}件' })}` : ''}`,
  },
  zh: {
    facts: { deliveryTime: '配送时间', deliveryFee: '配送费', distance: '距离', minimumOrder: '起送价' },
    availability: { paused: '暂停营业', closed: '已打烊' },
    new: '新店',
    rated: (value, reviews) =>
      `评分 ${value}（满分 5 分）${has(reviews) ? `，${counted('zh', reviews, { other: '{n} 条评价' })}` : ''}`,
  },
  ar: {
    facts: { deliveryTime: 'وقت التوصيل', deliveryFee: 'التوصيل', distance: 'المسافة', minimumOrder: 'الحد الأدنى للطلب' },
    availability: { paused: 'متوقف مؤقتًا', closed: 'مغلق' },
    new: 'جديد',
    rated: (value, reviews) =>
      `التقييم ${value} من 5${has(reviews) ? `، ${counted('ar', reviews, { zero: 'لا مراجعات', one: 'مراجعة واحدة', two: 'مراجعتان', few: '{n} مراجعات', many: '{n} مراجعة', other: '{n} مراجعة' })}` : ''}`,
  },
  hi: {
    facts: { deliveryTime: 'डिलीवरी का समय', deliveryFee: 'डिलीवरी', distance: 'दूरी', minimumOrder: 'न्यूनतम ऑर्डर' },
    availability: { paused: 'रुका हुआ', closed: 'बंद' },
    new: 'नया',
    rated: (value, reviews) =>
      `5 में से ${value} रेटिंग${has(reviews) ? `, ${counted('hi', reviews, { one: '{n} समीक्षा', other: '{n} समीक्षाएँ' })}` : ''}`,
  },
  bn: {
    facts: { deliveryTime: 'ডেলিভারির সময়', deliveryFee: 'ডেলিভারি', distance: 'দূরত্ব', minimumOrder: 'ন্যূনতম অর্ডার' },
    availability: { paused: 'বিরতিতে', closed: 'বন্ধ' },
    new: 'নতুন',
    rated: (value, reviews) =>
      `৫-এর মধ্যে ${value} রেটিং${has(reviews) ? `, ${counted('bn', reviews, { other: '{n}টি রিভিউ' })}` : ''}`,
  },
  id: {
    facts: { deliveryTime: 'Waktu pengantaran', deliveryFee: 'Ongkos kirim', distance: 'Jarak', minimumOrder: 'Pesanan minimum' },
    availability: { paused: 'Dijeda', closed: 'Tutup' },
    new: 'Baru',
    rated: (value, reviews) =>
      `Rating ${value} dari 5${has(reviews) ? `, ${counted('id', reviews, { other: '{n} ulasan' })}` : ''}`,
  },
};
