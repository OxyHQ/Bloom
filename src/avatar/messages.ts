import type { MessageCatalog } from '../locale/messages';

export interface AvatarMessages {
  live: string;
}

export const AVATAR_MESSAGES: MessageCatalog<AvatarMessages> = {
  en: { live: 'LIVE' },
  es: { live: 'EN VIVO' },
  ca: { live: 'DIRECTE' },
  de: { live: 'LIVE' },
  fr: { live: 'DIRECT' },
  it: { live: 'DIRETTA' },
  pt: { live: 'AO VIVO' },
  ru: { live: 'ЭФИР' },
  tr: { live: 'CANLI' },
  ja: { live: 'ライブ' },
  zh: { live: '直播' },
  ar: { live: 'مباشر' },
  hi: { live: 'लाइव' },
  bn: { live: 'লাইভ' },
  id: { live: 'LIVE' },
};
