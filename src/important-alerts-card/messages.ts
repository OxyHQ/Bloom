import type { MessageCatalog } from '../locale/messages';

/** The alerts card's fixed words in each Bloom language. `title` and `countCaption` still win. */
export interface ImportantAlertsCardMessages {
  title: string;
  /** The caption after the count. */
  thisWeek: string;
}

export const IMPORTANT_ALERTS_CARD_MESSAGES: MessageCatalog<ImportantAlertsCardMessages> = {
  en: { title: 'Important alerts', thisWeek: 'this week' },
  es: { title: 'Alertas importantes', thisWeek: 'esta semana' },
  ca: { title: 'Alertes importants', thisWeek: 'aquesta setmana' },
  de: { title: 'Wichtige Hinweise', thisWeek: 'diese Woche' },
  fr: { title: 'Alertes importantes', thisWeek: 'cette semaine' },
  it: { title: 'Avvisi importanti', thisWeek: 'questa settimana' },
  pt: { title: 'Alertas importantes', thisWeek: 'esta semana' },
  ru: { title: 'Важные оповещения', thisWeek: 'на этой неделе' },
  tr: { title: 'Önemli uyarılar', thisWeek: 'bu hafta' },
  ja: { title: '重要なアラート', thisWeek: '今週' },
  zh: { title: '重要提醒', thisWeek: '本周' },
  ar: { title: 'تنبيهات مهمة', thisWeek: 'هذا الأسبوع' },
  hi: { title: 'महत्वपूर्ण अलर्ट', thisWeek: 'इस सप्ताह' },
  bn: { title: 'গুরুত্বপূর্ণ সতর্কতা', thisWeek: 'এই সপ্তাহে' },
  id: { title: 'Peringatan penting', thisWeek: 'minggu ini' },
};
