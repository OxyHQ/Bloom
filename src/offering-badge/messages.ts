import type { Offering } from '../listing-card/types';
import type { MessageCatalog } from '../locale/messages';

/**
 * The word each offering is drawn with, in each Bloom language. A caller's
 * `label` still wins.
 */
export interface OfferingBadgeMessages {
  offerings: Record<Offering, string>;
}

export const OFFERING_BADGE_MESSAGES: MessageCatalog<OfferingBadgeMessages> = {
  en: { offerings: { long_term_rent: 'For rent', sale: 'For sale', short_term_rent: 'Vacation rental', exchange: 'Swap' } },
  es: { offerings: { long_term_rent: 'En alquiler', sale: 'En venta', short_term_rent: 'Alquiler vacacional', exchange: 'Intercambio' } },
  ca: { offerings: { long_term_rent: 'En lloguer', sale: 'En venda', short_term_rent: 'Lloguer turístic', exchange: 'Intercanvi' } },
  de: { offerings: { long_term_rent: 'Zu vermieten', sale: 'Zu verkaufen', short_term_rent: 'Ferienwohnung', exchange: 'Tausch' } },
  fr: { offerings: { long_term_rent: 'À louer', sale: 'À vendre', short_term_rent: 'Location de vacances', exchange: 'Échange' } },
  it: { offerings: { long_term_rent: 'In affitto', sale: 'In vendita', short_term_rent: 'Casa vacanze', exchange: 'Scambio' } },
  pt: { offerings: { long_term_rent: 'Para alugar', sale: 'À venda', short_term_rent: 'Aluguel por temporada', exchange: 'Troca' } },
  ru: { offerings: { long_term_rent: 'Аренда', sale: 'Продажа', short_term_rent: 'Посуточно', exchange: 'Обмен' } },
  tr: { offerings: { long_term_rent: 'Kiralık', sale: 'Satılık', short_term_rent: 'Tatil kiralık', exchange: 'Takas' } },
  ja: { offerings: { long_term_rent: '賃貸', sale: '売買', short_term_rent: 'バケーションレンタル', exchange: '交換' } },
  zh: { offerings: { long_term_rent: '出租', sale: '出售', short_term_rent: '度假短租', exchange: '置换' } },
  ar: { offerings: { long_term_rent: 'للإيجار', sale: 'للبيع', short_term_rent: 'إيجار سياحي', exchange: 'مقايضة' } },
  hi: { offerings: { long_term_rent: 'किराए पर', sale: 'बिक्री के लिए', short_term_rent: 'छुट्टियों का किराया', exchange: 'अदला-बदली' } },
  bn: { offerings: { long_term_rent: 'ভাড়া', sale: 'বিক্রয়', short_term_rent: 'ছুটির ভাড়া', exchange: 'বিনিময়' } },
  id: { offerings: { long_term_rent: 'Disewakan', sale: 'Dijual', short_term_rent: 'Sewa liburan', exchange: 'Tukar' } },
};
