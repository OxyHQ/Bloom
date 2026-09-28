import type { BloomLanguage } from '../locale/languages';
import type { MessageCatalog } from '../locale/messages';
import { plural, type PluralCategory } from '../locale/plural';
import type { PlaceOpenState } from './types';

/**
 * Every fixed string the place-card family draws or announces, in each Bloom
 * language. A caller's `openLabel`/`newLabel`/`accessibilityLabel` still wins.
 */
export interface PlaceCardMessages {
  /** The state pill. */
  openStates: Readonly<Record<PlaceOpenState, string>>;
  /** An unrated place, in place of its rating. */
  new: string;
  /** Names `PlaceActions`' row. */
  actions: string;
  /** Names a card's action row after its place: "Forner de la Plaça actions". */
  actionsFor: (name: string) => string;
  /**
   * "Rated 4.6 out of 5, 318 reviews". `value` arrives formatted; `reviews` is
   * a count, or the app's own pre-formatted one ("1.2k").
   */
  rated: (value: string, reviews?: number | string) => string;
}

/** `plural` for a count that may arrive pre-formatted: a string takes `other`. */
function countOf(
  language: BloomLanguage,
  count: number | string,
  forms: Partial<Record<PluralCategory, string>> & { other: string },
): string {
  return typeof count === 'number' ? plural(language, count, forms) : forms.other.replace('{n}', count);
}

const withReviews = (sentence: string, reviews: string | undefined) =>
  reviews === undefined ? sentence : `${sentence}, ${reviews}`;

export const PLACE_CARD_MESSAGES: MessageCatalog<PlaceCardMessages> = {
  en: {
    openStates: {
      open: 'Open',
      'closing-soon': 'Closing soon',
      closed: 'Closed',
      'opening-soon': 'Opens soon',
    },
    new: 'New',
    actions: 'Actions',
    actionsFor: (name) => `${name} actions`,
    rated: (value, reviews) =>
      withReviews(
        `Rated ${value} out of 5`,
        reviews === undefined ? undefined : countOf('en', reviews, { one: '{n} review', other: '{n} reviews' }),
      ),
  },
  es: {
    openStates: {
      open: 'Abierto',
      'closing-soon': 'Cierra pronto',
      closed: 'Cerrado',
      'opening-soon': 'Abre pronto',
    },
    new: 'Nuevo',
    actions: 'Acciones',
    actionsFor: (name) => `Acciones de ${name}`,
    rated: (value, reviews) =>
      withReviews(
        `Valoración de ${value} sobre 5`,
        reviews === undefined ? undefined : countOf('es', reviews, { one: '{n} reseña', other: '{n} reseñas' }),
      ),
  },
  ca: {
    openStates: {
      open: 'Obert',
      'closing-soon': 'Tanca aviat',
      closed: 'Tancat',
      'opening-soon': 'Obre aviat',
    },
    new: 'Nou',
    actions: 'Accions',
    actionsFor: (name) => `Accions de ${name}`,
    rated: (value, reviews) =>
      withReviews(
        `Valoració de ${value} sobre 5`,
        reviews === undefined ? undefined : countOf('ca', reviews, { one: '{n} ressenya', other: '{n} ressenyes' }),
      ),
  },
  de: {
    openStates: {
      open: 'Geöffnet',
      'closing-soon': 'Schließt bald',
      closed: 'Geschlossen',
      'opening-soon': 'Öffnet bald',
    },
    new: 'Neu',
    actions: 'Aktionen',
    actionsFor: (name) => `Aktionen für ${name}`,
    rated: (value, reviews) =>
      withReviews(
        `Mit ${value} von 5 bewertet`,
        reviews === undefined ? undefined : countOf('de', reviews, { one: '{n} Bewertung', other: '{n} Bewertungen' }),
      ),
  },
  fr: {
    openStates: {
      open: 'Ouvert',
      'closing-soon': 'Ferme bientôt',
      closed: 'Fermé',
      'opening-soon': 'Ouvre bientôt',
    },
    new: 'Nouveau',
    actions: 'Actions',
    actionsFor: (name) => `Actions pour ${name}`,
    rated: (value, reviews) =>
      withReviews(
        `Noté ${value} sur 5`,
        reviews === undefined ? undefined : countOf('fr', reviews, { one: '{n} avis', other: '{n} avis' }),
      ),
  },
  it: {
    openStates: {
      open: 'Aperto',
      'closing-soon': 'Chiude a breve',
      closed: 'Chiuso',
      'opening-soon': 'Apre a breve',
    },
    new: 'Nuovo',
    actions: 'Azioni',
    actionsFor: (name) => `Azioni per ${name}`,
    rated: (value, reviews) =>
      withReviews(
        `Valutazione di ${value} su 5`,
        reviews === undefined ? undefined : countOf('it', reviews, { one: '{n} recensione', other: '{n} recensioni' }),
      ),
  },
  pt: {
    openStates: {
      open: 'Aberto',
      'closing-soon': 'Fecha em breve',
      closed: 'Fechado',
      'opening-soon': 'Abre em breve',
    },
    new: 'Novo',
    actions: 'Ações',
    actionsFor: (name) => `Ações de ${name}`,
    rated: (value, reviews) =>
      withReviews(
        `Avaliação de ${value} de 5`,
        reviews === undefined ? undefined : countOf('pt', reviews, { one: '{n} avaliação', other: '{n} avaliações' }),
      ),
  },
  ru: {
    openStates: {
      open: 'Открыто',
      'closing-soon': 'Скоро закроется',
      closed: 'Закрыто',
      'opening-soon': 'Скоро откроется',
    },
    new: 'Новое',
    actions: 'Действия',
    actionsFor: (name) => `Действия: ${name}`,
    rated: (value, reviews) =>
      withReviews(
        `Оценка ${value} из 5`,
        reviews === undefined ? undefined : countOf('ru', reviews, { one: '{n} отзыв', few: '{n} отзыва', many: '{n} отзывов', other: '{n} отзыва' }),
      ),
  },
  tr: {
    openStates: {
      open: 'Açık',
      'closing-soon': 'Yakında kapanıyor',
      closed: 'Kapalı',
      'opening-soon': 'Yakında açılıyor',
    },
    new: 'Yeni',
    actions: 'İşlemler',
    actionsFor: (name) => `${name} işlemleri`,
    rated: (value, reviews) =>
      withReviews(
        `5 üzerinden ${value} puan`,
        reviews === undefined ? undefined : countOf('tr', reviews, { other: '{n} değerlendirme' }),
      ),
  },
  ja: {
    openStates: {
      open: '営業中',
      'closing-soon': 'まもなく閉店',
      closed: '営業時間外',
      'opening-soon': 'まもなく開店',
    },
    new: '新規',
    actions: '操作',
    actionsFor: (name) => `${name}の操作`,
    rated: (value, reviews) =>
      withReviews(
        `5点中${value}点の評価`,
        reviews === undefined ? undefined : countOf('ja', reviews, { other: '{n}件のレビュー' }),
      ),
  },
  zh: {
    openStates: {
      open: '营业中',
      'closing-soon': '即将打烊',
      closed: '已打烊',
      'opening-soon': '即将营业',
    },
    new: '新',
    actions: '操作',
    actionsFor: (name) => `${name}的操作`,
    rated: (value, reviews) =>
      withReviews(
        `评分 ${value} 分（满分 5 分）`,
        reviews === undefined ? undefined : countOf('zh', reviews, { other: '{n} 条评价' }),
      ),
  },
  ar: {
    openStates: {
      open: 'مفتوح',
      'closing-soon': 'يُغلق قريبًا',
      closed: 'مغلق',
      'opening-soon': 'يُفتح قريبًا',
    },
    new: 'جديد',
    actions: 'الإجراءات',
    actionsFor: (name) => `إجراءات ${name}`,
    rated: (value, reviews) =>
      withReviews(
        `التقييم ${value} من 5`,
        reviews === undefined ? undefined : countOf('ar', reviews, { zero: 'لا توجد مراجعات', one: 'مراجعة واحدة', two: 'مراجعتان', few: '{n} مراجعات', many: '{n} مراجعة', other: '{n} مراجعة' }),
      ),
  },
  hi: {
    openStates: {
      open: 'खुला है',
      'closing-soon': 'जल्द बंद होगा',
      closed: 'बंद है',
      'opening-soon': 'जल्द खुलेगा',
    },
    new: 'नया',
    actions: 'कार्रवाइयाँ',
    actionsFor: (name) => `${name} के लिए कार्रवाइयाँ`,
    rated: (value, reviews) =>
      withReviews(
        `5 में से ${value} रेटिंग`,
        reviews === undefined ? undefined : countOf('hi', reviews, { one: '{n} समीक्षा', other: '{n} समीक्षाएँ' }),
      ),
  },
  bn: {
    openStates: {
      open: 'খোলা',
      'closing-soon': 'শীঘ্রই বন্ধ হবে',
      closed: 'বন্ধ',
      'opening-soon': 'শীঘ্রই খুলবে',
    },
    new: 'নতুন',
    actions: 'কার্যক্রম',
    actionsFor: (name) => `${name}-এর কার্যক্রম`,
    rated: (value, reviews) =>
      withReviews(
        `5-এর মধ্যে ${value} রেটিং`,
        reviews === undefined ? undefined : countOf('bn', reviews, { other: '{n}টি রিভিউ' }),
      ),
  },
  id: {
    openStates: {
      open: 'Buka',
      'closing-soon': 'Segera tutup',
      closed: 'Tutup',
      'opening-soon': 'Segera buka',
    },
    new: 'Baru',
    actions: 'Tindakan',
    actionsFor: (name) => `Tindakan untuk ${name}`,
    rated: (value, reviews) =>
      withReviews(
        `Rating ${value} dari 5`,
        reviews === undefined ? undefined : countOf('id', reviews, { other: '{n} ulasan' }),
      ),
  },
};
