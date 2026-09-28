import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `AiProfileCard` draws or announces, in each Bloom
 * language. The `contributionsLabel`, `activityLabel` and `periods` props
 * still win over these.
 */
export interface AiProfileCardMessages {
  contributions: string;
  activity: string;
  /** Names the period switcher after the activity label ("Activity period"). */
  periodGroup: (activityLabel: string) => string;
  periods: { weekly: string; monthly: string; yearly: string };
}

export const AI_PROFILE_CARD_MESSAGES: MessageCatalog<AiProfileCardMessages> = {
  en: {
    contributions: 'Contributions this year',
    activity: 'Activity',
    periodGroup: (label) => `${label} period`,
    periods: { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' },
  },
  es: {
    contributions: 'Contribuciones este año',
    activity: 'Actividad',
    periodGroup: (label) => `Periodo: ${label}`,
    periods: { weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual' },
  },
  ca: {
    contributions: 'Contribucions aquest any',
    activity: 'Activitat',
    periodGroup: (label) => `Període: ${label}`,
    periods: { weekly: 'Setmanal', monthly: 'Mensual', yearly: 'Anual' },
  },
  de: {
    contributions: 'Beiträge in diesem Jahr',
    activity: 'Aktivität',
    periodGroup: (label) => `Zeitraum: ${label}`,
    periods: { weekly: 'Wöchentlich', monthly: 'Monatlich', yearly: 'Jährlich' },
  },
  fr: {
    contributions: 'Contributions cette année',
    activity: 'Activité',
    periodGroup: (label) => `Période : ${label}`,
    periods: { weekly: 'Hebdomadaire', monthly: 'Mensuel', yearly: 'Annuel' },
  },
  it: {
    contributions: 'Contributi quest’anno',
    activity: 'Attività',
    periodGroup: (label) => `Periodo: ${label}`,
    periods: { weekly: 'Settimanale', monthly: 'Mensile', yearly: 'Annuale' },
  },
  pt: {
    contributions: 'Contribuições este ano',
    activity: 'Atividade',
    periodGroup: (label) => `Período: ${label}`,
    periods: { weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual' },
  },
  ru: {
    contributions: 'Вклад за этот год',
    activity: 'Активность',
    periodGroup: (label) => `Период: ${label}`,
    periods: { weekly: 'Неделя', monthly: 'Месяц', yearly: 'Год' },
  },
  tr: {
    contributions: 'Bu yılki katkılar',
    activity: 'Etkinlik',
    periodGroup: (label) => `${label} dönemi`,
    periods: { weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık' },
  },
  ja: {
    contributions: '今年のコントリビューション',
    activity: 'アクティビティ',
    periodGroup: (label) => `${label}の期間`,
    periods: { weekly: '週間', monthly: '月間', yearly: '年間' },
  },
  zh: {
    contributions: '今年的贡献',
    activity: '活动',
    periodGroup: (label) => `${label}周期`,
    periods: { weekly: '每周', monthly: '每月', yearly: '每年' },
  },
  ar: {
    contributions: 'المساهمات هذا العام',
    activity: 'النشاط',
    periodGroup: (label) => `فترة ${label}`,
    periods: { weekly: 'أسبوعي', monthly: 'شهري', yearly: 'سنوي' },
  },
  hi: {
    contributions: 'इस साल के योगदान',
    activity: 'गतिविधि',
    periodGroup: (label) => `${label} की अवधि`,
    periods: { weekly: 'साप्ताहिक', monthly: 'मासिक', yearly: 'वार्षिक' },
  },
  bn: {
    contributions: 'এ বছরের অবদান',
    activity: 'কার্যকলাপ',
    periodGroup: (label) => `${label}-এর সময়কাল`,
    periods: { weekly: 'সাপ্তাহিক', monthly: 'মাসিক', yearly: 'বার্ষিক' },
  },
  id: {
    contributions: 'Kontribusi tahun ini',
    activity: 'Aktivitas',
    periodGroup: (label) => `Periode ${label}`,
    periods: { weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' },
  },
};
