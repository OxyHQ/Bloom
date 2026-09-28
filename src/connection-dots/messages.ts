import type { MessageCatalog } from '../locale/messages';

/**
 * The connection animation's accessible name, in each Bloom language. A
 * caller's `accessibilityLabel` still wins.
 */
export interface ConnectionDotsMessages {
  connecting: string;
}

export const CONNECTION_DOTS_MESSAGES: MessageCatalog<ConnectionDotsMessages> = {
  en: {
    connecting: 'Connecting',
  },
  es: {
    connecting: 'Conectando',
  },
  ca: {
    connecting: 'Connectant',
  },
  de: {
    connecting: 'Verbindung wird hergestellt',
  },
  fr: {
    connecting: 'Connexion en cours',
  },
  it: {
    connecting: 'Connessione in corso',
  },
  pt: {
    connecting: 'Conectando',
  },
  ru: {
    connecting: 'Подключение',
  },
  tr: {
    connecting: 'Bağlanıyor',
  },
  ja: {
    connecting: '接続中',
  },
  zh: {
    connecting: '正在连接',
  },
  ar: {
    connecting: 'جارٍ الاتصال',
  },
  hi: {
    connecting: 'कनेक्ट हो रहा है',
  },
  bn: {
    connecting: 'সংযোগ করা হচ্ছে',
  },
  id: {
    connecting: 'Menghubungkan',
  },
};
