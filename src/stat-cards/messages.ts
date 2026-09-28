import type { MessageCatalog } from '../locale/messages';

/** The stat cards' fixed words in each Bloom language. A stat's `hintLabel` and `caption` still win. */
export interface StatCardsMessages {
  /** The info glyph's name: "About Revenue". */
  about: (label: string) => string;
  /** The footer band's comparison caption. */
  fromLastMonth: string;
}

export const STAT_CARDS_MESSAGES: MessageCatalog<StatCardsMessages> = {
  en: { about: (label) => `About ${label}`, fromLastMonth: 'From last month' },
  es: { about: (label) => `Acerca de ${label}`, fromLastMonth: 'Respecto al mes pasado' },
  ca: { about: (label) => `Quant a ${label}`, fromLastMonth: 'Respecte al mes passat' },
  de: { about: (label) => `Über ${label}`, fromLastMonth: 'Gegenüber Vormonat' },
  fr: { about: (label) => `À propos de ${label}`, fromLastMonth: 'Par rapport au mois dernier' },
  it: { about: (label) => `Informazioni su ${label}`, fromLastMonth: 'Rispetto al mese scorso' },
  pt: { about: (label) => `Sobre ${label}`, fromLastMonth: 'Em relação ao mês passado' },
  ru: { about: (label) => `Подробнее: ${label}`, fromLastMonth: 'По сравнению с прошлым месяцем' },
  tr: { about: (label) => `${label} hakkında`, fromLastMonth: 'Geçen aya göre' },
  ja: { about: (label) => `${label}について`, fromLastMonth: '先月比' },
  zh: { about: (label) => `关于${label}`, fromLastMonth: '较上月' },
  ar: { about: (label) => `حول ${label}`, fromLastMonth: 'مقارنةً بالشهر الماضي' },
  hi: { about: (label) => `${label} के बारे में`, fromLastMonth: 'पिछले महीने से' },
  bn: { about: (label) => `${label} সম্পর্কে`, fromLastMonth: 'গত মাসের তুলনায়' },
  id: { about: (label) => `Tentang ${label}`, fromLastMonth: 'Dari bulan lalu' },
};
