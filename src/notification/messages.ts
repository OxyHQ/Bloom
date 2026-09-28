import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `Notification` announces, in each Bloom language. A
 * caller's `closeLabel` still wins.
 */
export interface NotificationMessages {
  /** The close button's name. */
  dismiss: string;
}

export const NOTIFICATION_MESSAGES: MessageCatalog<NotificationMessages> = {
  en: { dismiss: 'Dismiss notification' },
  es: { dismiss: 'Descartar notificación' },
  ca: { dismiss: 'Descarta la notificació' },
  de: { dismiss: 'Benachrichtigung schließen' },
  fr: { dismiss: 'Ignorer la notification' },
  it: { dismiss: 'Ignora notifica' },
  pt: { dismiss: 'Dispensar notificação' },
  ru: { dismiss: 'Закрыть уведомление' },
  tr: { dismiss: 'Bildirimi kapat' },
  ja: { dismiss: '通知を閉じる' },
  zh: { dismiss: '关闭通知' },
  ar: { dismiss: 'تجاهل الإشعار' },
  hi: { dismiss: 'सूचना हटाएँ' },
  bn: { dismiss: 'বিজ্ঞপ্তি সরান' },
  id: { dismiss: 'Tutup notifikasi' },
};
