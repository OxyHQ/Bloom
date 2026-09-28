import type { MessageCatalog } from '../locale/messages';

/** The recent-hires card's fixed words in each Bloom language. `title` still wins. */
export interface RecentHiresCardMessages {
  title: string;
}

export const RECENT_HIRES_CARD_MESSAGES: MessageCatalog<RecentHiresCardMessages> = {
  en: { title: 'Recent hires' },
  es: { title: 'Incorporaciones recientes' },
  ca: { title: 'Incorporacions recents' },
  de: { title: 'Neueinstellungen' },
  fr: { title: 'Recrutements récents' },
  it: { title: 'Assunzioni recenti' },
  pt: { title: 'Contratações recentes' },
  ru: { title: 'Новые сотрудники' },
  tr: { title: 'Son işe alımlar' },
  ja: { title: '最近の採用' },
  zh: { title: '近期入职' },
  ar: { title: 'التعيينات الأخيرة' },
  hi: { title: 'हाल की भर्तियाँ' },
  bn: { title: 'সাম্প্রতিক নিয়োগ' },
  id: { title: 'Karyawan baru' },
};
