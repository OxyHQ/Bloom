import type { MessageCatalog } from '../locale/messages';

/**
 * The hover card's default accessible name, in each Bloom language. A caller's
 * `label` still wins.
 */
export interface HoverCardMessages {
  hoverCard: string;
}

export const HOVER_CARD_MESSAGES: MessageCatalog<HoverCardMessages> = {
  en: {
    hoverCard: 'Hover card',
  },
  es: {
    hoverCard: 'Tarjeta de vista previa',
  },
  ca: {
    hoverCard: 'Targeta de previsualització',
  },
  de: {
    hoverCard: 'Vorschaukarte',
  },
  fr: {
    hoverCard: 'Carte d’aperçu',
  },
  it: {
    hoverCard: 'Scheda di anteprima',
  },
  pt: {
    hoverCard: 'Cartão de pré-visualização',
  },
  ru: {
    hoverCard: 'Карточка предпросмотра',
  },
  tr: {
    hoverCard: 'Önizleme kartı',
  },
  ja: {
    hoverCard: 'プレビューカード',
  },
  zh: {
    hoverCard: '预览卡片',
  },
  ar: {
    hoverCard: 'بطاقة معاينة',
  },
  hi: {
    hoverCard: 'पूर्वावलोकन कार्ड',
  },
  bn: {
    hoverCard: 'প্রিভিউ কার্ড',
  },
  id: {
    hoverCard: 'Kartu pratinjau',
  },
};
