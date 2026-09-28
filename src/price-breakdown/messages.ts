import type { MessageCatalog } from '../locale/messages';
import type { PriceLineState } from './types';

/**
 * Every fixed string the price breakdown draws or announces, in each Bloom
 * language. A caller's `stateLabels`, `expandLabel`, `collapseLabel`,
 * `infoAccessibilityLabel` and `accessibilityLabel` still win.
 */
export interface PriceBreakdownMessages {
  /** The word drawn beside an amount that is not the answer yet. */
  states: Record<Exclude<PriceLineState, 'final'>, string>;
  /** The disclosure of a collapsible summary. */
  showDetails: string;
  hideDetails: string;
  /** Names the list of charges. */
  breakdown: string;
  /** Names a line's info glyph: "About Service fee". */
  about: (label: string) => string;
}

export const PRICE_BREAKDOWN_MESSAGES: MessageCatalog<PriceBreakdownMessages> = {
  en: {
    states: { estimated: 'Estimated', pending: 'Pending' },
    showDetails: 'Show price details',
    hideDetails: 'Hide price details',
    breakdown: 'Price breakdown',
    about: (label) => `About ${label}`,
  },
  es: {
    states: { estimated: 'Estimado', pending: 'Pendiente' },
    showDetails: 'Mostrar detalles del precio',
    hideDetails: 'Ocultar detalles del precio',
    breakdown: 'Desglose del precio',
    about: (label) => `Acerca de ${label}`,
  },
  ca: {
    states: { estimated: 'Estimat', pending: 'Pendent' },
    showDetails: 'Mostra els detalls del preu',
    hideDetails: 'Amaga els detalls del preu',
    breakdown: 'Desglossament del preu',
    about: (label) => `Quant a ${label}`,
  },
  de: {
    states: { estimated: 'Geschätzt', pending: 'Ausstehend' },
    showDetails: 'Preisdetails anzeigen',
    hideDetails: 'Preisdetails ausblenden',
    breakdown: 'Preisaufschlüsselung',
    about: (label) => `Über ${label}`,
  },
  fr: {
    states: { estimated: 'Estimé', pending: 'En attente' },
    showDetails: 'Afficher le détail du prix',
    hideDetails: 'Masquer le détail du prix',
    breakdown: 'Détail du prix',
    about: (label) => `À propos de ${label}`,
  },
  it: {
    states: { estimated: 'Stimato', pending: 'In sospeso' },
    showDetails: 'Mostra dettagli prezzo',
    hideDetails: 'Nascondi dettagli prezzo',
    breakdown: 'Dettaglio del prezzo',
    about: (label) => `Informazioni su ${label}`,
  },
  pt: {
    states: { estimated: 'Estimado', pending: 'Pendente' },
    showDetails: 'Mostrar detalhes do preço',
    hideDetails: 'Ocultar detalhes do preço',
    breakdown: 'Detalhamento do preço',
    about: (label) => `Sobre ${label}`,
  },
  ru: {
    states: { estimated: 'Предварительно', pending: 'Уточняется' },
    showDetails: 'Показать детали цены',
    hideDetails: 'Скрыть детали цены',
    breakdown: 'Детализация цены',
    about: (label) => `Подробнее: ${label}`,
  },
  tr: {
    states: { estimated: 'Tahmini', pending: 'Beklemede' },
    showDetails: 'Fiyat ayrıntılarını göster',
    hideDetails: 'Fiyat ayrıntılarını gizle',
    breakdown: 'Fiyat dökümü',
    about: (label) => `${label} hakkında`,
  },
  ja: {
    states: { estimated: '概算', pending: '未確定' },
    showDetails: '料金の内訳を表示',
    hideDetails: '料金の内訳を隠す',
    breakdown: '料金の内訳',
    about: (label) => `${label}について`,
  },
  zh: {
    states: { estimated: '预估', pending: '待定' },
    showDetails: '显示价格明细',
    hideDetails: '隐藏价格明细',
    breakdown: '价格明细',
    about: (label) => `关于${label}`,
  },
  ar: {
    states: { estimated: 'تقديري', pending: 'قيد الانتظار' },
    showDetails: 'عرض تفاصيل السعر',
    hideDetails: 'إخفاء تفاصيل السعر',
    breakdown: 'تفاصيل السعر',
    about: (label) => `حول ${label}`,
  },
  hi: {
    states: { estimated: 'अनुमानित', pending: 'लंबित' },
    showDetails: 'कीमत का विवरण दिखाएँ',
    hideDetails: 'कीमत का विवरण छिपाएँ',
    breakdown: 'कीमत का ब्योरा',
    about: (label) => `${label} के बारे में`,
  },
  bn: {
    states: { estimated: 'আনুমানিক', pending: 'অপেক্ষমাণ' },
    showDetails: 'দামের বিবরণ দেখান',
    hideDetails: 'দামের বিবরণ লুকান',
    breakdown: 'দামের বিভাজন',
    about: (label) => `${label} সম্পর্কে`,
  },
  id: {
    states: { estimated: 'Perkiraan', pending: 'Tertunda' },
    showDetails: 'Tampilkan rincian harga',
    hideDetails: 'Sembunyikan rincian harga',
    breakdown: 'Rincian harga',
    about: (label) => `Tentang ${label}`,
  },
};
