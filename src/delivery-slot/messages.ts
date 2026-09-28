import type { MessageCatalog } from '../locale/messages';
import type { DeliveryTier } from './types';

/**
 * Every fixed string the delivery-slot family draws or announces, in each
 * Bloom language. A caller's `label`, `dayLabel`, `emptyTitle`,
 * `emptyDescription`, `tierLabels`, `soldOutLabel` and the ASAP option's
 * `label` still win.
 */
export interface DeliverySlotMessages {
  tiers: Record<DeliveryTier, string>;
  /** What a taken window says. */
  soldOut: string;
  /** The option that belongs to no day. */
  asap: string;
  /** The field's own name, which is also the radio group's. */
  field: string;
  /** Names the day strip. */
  day: string;
  emptyTitle: string;
  emptyDescription: string;
}

export const DELIVERY_SLOT_MESSAGES: MessageCatalog<DeliverySlotMessages> = {
  en: {
    tiers: { standard: 'Standard', express: 'Express' },
    soldOut: 'Sold out',
    asap: 'As soon as possible',
    field: 'Delivery time',
    day: 'Day',
    emptyTitle: 'No windows left',
    emptyDescription: 'Pick another day, or take the next courier.',
  },
  es: {
    tiers: { standard: 'Estándar', express: 'Exprés' },
    soldOut: 'Agotado',
    asap: 'Lo antes posible',
    field: 'Hora de entrega',
    day: 'Día',
    emptyTitle: 'No quedan franjas',
    emptyDescription: 'Elige otro día o el próximo repartidor disponible.',
  },
  ca: {
    tiers: { standard: 'Estàndard', express: 'Exprés' },
    soldOut: 'Esgotat',
    asap: 'Com més aviat millor',
    field: "Hora d'entrega",
    day: 'Dia',
    emptyTitle: 'No queden franges',
    emptyDescription: 'Tria un altre dia o el proper repartidor disponible.',
  },
  de: {
    tiers: { standard: 'Standard', express: 'Express' },
    soldOut: 'Ausgebucht',
    asap: 'So schnell wie möglich',
    field: 'Lieferzeit',
    day: 'Tag',
    emptyTitle: 'Keine Zeitfenster mehr frei',
    emptyDescription: 'Wähle einen anderen Tag oder den nächsten verfügbaren Kurier.',
  },
  fr: {
    tiers: { standard: 'Standard', express: 'Express' },
    soldOut: 'Complet',
    asap: 'Dès que possible',
    field: 'Heure de livraison',
    day: 'Jour',
    emptyTitle: 'Plus aucun créneau',
    emptyDescription: 'Choisissez un autre jour ou le prochain coursier disponible.',
  },
  it: {
    tiers: { standard: 'Standard', express: 'Espresso' },
    soldOut: 'Esaurito',
    asap: 'Il prima possibile',
    field: 'Orario di consegna',
    day: 'Giorno',
    emptyTitle: 'Nessuna fascia disponibile',
    emptyDescription: 'Scegli un altro giorno o il prossimo corriere disponibile.',
  },
  pt: {
    tiers: { standard: 'Padrão', express: 'Expressa' },
    soldOut: 'Esgotado',
    asap: 'O mais rápido possível',
    field: 'Horário de entrega',
    day: 'Dia',
    emptyTitle: 'Não há mais horários',
    emptyDescription: 'Escolha outro dia ou o próximo entregador disponível.',
  },
  ru: {
    tiers: { standard: 'Обычная', express: 'Экспресс' },
    soldOut: 'Мест нет',
    asap: 'Как можно скорее',
    field: 'Время доставки',
    day: 'День',
    emptyTitle: 'Свободных окон нет',
    emptyDescription: 'Выберите другой день или ближайшего курьера.',
  },
  tr: {
    tiers: { standard: 'Standart', express: 'Ekspres' },
    soldOut: 'Doldu',
    asap: 'En kısa sürede',
    field: 'Teslimat zamanı',
    day: 'Gün',
    emptyTitle: 'Boş zaman aralığı kalmadı',
    emptyDescription: 'Başka bir gün seçin ya da ilk uygun kuryeyi bekleyin.',
  },
  ja: {
    tiers: { standard: '通常配送', express: '速達' },
    soldOut: '受付終了',
    asap: 'できるだけ早く',
    field: '配達時間',
    day: '日付',
    emptyTitle: '空いている時間帯がありません',
    emptyDescription: '別の日を選ぶか、次の配達員をお待ちください。',
  },
  zh: {
    tiers: { standard: '标准配送', express: '极速配送' },
    soldOut: '已约满',
    asap: '尽快送达',
    field: '配送时间',
    day: '日期',
    emptyTitle: '没有可选时段了',
    emptyDescription: '请换一天，或选择下一位骑手。',
  },
  ar: {
    tiers: { standard: 'عادي', express: 'سريع' },
    soldOut: 'نفدت الأماكن',
    asap: 'في أقرب وقت ممكن',
    field: 'وقت التوصيل',
    day: 'اليوم',
    emptyTitle: 'لا توجد فترات متاحة',
    emptyDescription: 'اختر يومًا آخر، أو أقرب مندوب متاح.',
  },
  hi: {
    tiers: { standard: 'सामान्य', express: 'एक्सप्रेस' },
    soldOut: 'भर गया',
    asap: 'जितनी जल्दी हो सके',
    field: 'डिलीवरी का समय',
    day: 'दिन',
    emptyTitle: 'कोई स्लॉट नहीं बचा',
    emptyDescription: 'कोई और दिन चुनें, या अगला उपलब्ध कूरियर लें।',
  },
  bn: {
    tiers: { standard: 'সাধারণ', express: 'এক্সপ্রেস' },
    soldOut: 'পূর্ণ',
    asap: 'যত তাড়াতাড়ি সম্ভব',
    field: 'ডেলিভারির সময়',
    day: 'দিন',
    emptyTitle: 'কোনো স্লট বাকি নেই',
    emptyDescription: 'অন্য একটি দিন বেছে নিন, বা পরবর্তী কুরিয়ার নিন।',
  },
  id: {
    tiers: { standard: 'Reguler', express: 'Ekspres' },
    soldOut: 'Habis',
    asap: 'Secepatnya',
    field: 'Waktu pengantaran',
    day: 'Hari',
    emptyTitle: 'Tidak ada slot tersisa',
    emptyDescription: 'Pilih hari lain, atau ambil kurir berikutnya.',
  },
};
