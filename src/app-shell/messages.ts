import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the app-shell family announces, in each Bloom language.
 * Each has a prop (`drawerOpenLabel`, `menuLabel`, `resizeLabel`, …) that
 * still wins over its entry here.
 */
export interface AppShellMessages {
  /** The hamburger that opens the drawer. */
  openNavigation: string;
  /** The backdrop and veil that close the drawer. */
  closeNavigation: string;
  /** The split layout's draggable divider. */
  resizePanes: string;
  /** `NotificationBell`'s trigger and popover. */
  notifications: string;
  /** `ProOfferCard`'s region. */
  proOffer: string;
}

export const APP_SHELL_MESSAGES: MessageCatalog<AppShellMessages> = {
  en: {
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    resizePanes: 'Resize panes',
    notifications: 'Notifications',
    proOffer: 'Pro offer',
  },
  es: {
    openNavigation: 'Abrir navegación',
    closeNavigation: 'Cerrar navegación',
    resizePanes: 'Cambiar el tamaño de los paneles',
    notifications: 'Notificaciones',
    proOffer: 'Oferta Pro',
  },
  ca: {
    openNavigation: 'Obre la navegació',
    closeNavigation: 'Tanca la navegació',
    resizePanes: 'Canvia la mida dels panells',
    notifications: 'Notificacions',
    proOffer: 'Oferta Pro',
  },
  de: {
    openNavigation: 'Navigation öffnen',
    closeNavigation: 'Navigation schließen',
    resizePanes: 'Bereichsgröße ändern',
    notifications: 'Benachrichtigungen',
    proOffer: 'Pro-Angebot',
  },
  fr: {
    openNavigation: 'Ouvrir la navigation',
    closeNavigation: 'Fermer la navigation',
    resizePanes: 'Redimensionner les panneaux',
    notifications: 'Notifications',
    proOffer: 'Offre Pro',
  },
  it: {
    openNavigation: 'Apri la navigazione',
    closeNavigation: 'Chiudi la navigazione',
    resizePanes: 'Ridimensiona i riquadri',
    notifications: 'Notifiche',
    proOffer: 'Offerta Pro',
  },
  pt: {
    openNavigation: 'Abrir navegação',
    closeNavigation: 'Fechar navegação',
    resizePanes: 'Redimensionar painéis',
    notifications: 'Notificações',
    proOffer: 'Oferta Pro',
  },
  ru: {
    openNavigation: 'Открыть навигацию',
    closeNavigation: 'Закрыть навигацию',
    resizePanes: 'Изменить размер панелей',
    notifications: 'Уведомления',
    proOffer: 'Предложение Pro',
  },
  tr: {
    openNavigation: 'Gezinmeyi aç',
    closeNavigation: 'Gezinmeyi kapat',
    resizePanes: 'Bölmeleri yeniden boyutlandır',
    notifications: 'Bildirimler',
    proOffer: 'Pro teklifi',
  },
  ja: {
    openNavigation: 'ナビゲーションを開く',
    closeNavigation: 'ナビゲーションを閉じる',
    resizePanes: 'ペインのサイズを変更',
    notifications: '通知',
    proOffer: 'Pro のご案内',
  },
  zh: {
    openNavigation: '打开导航',
    closeNavigation: '关闭导航',
    resizePanes: '调整窗格大小',
    notifications: '通知',
    proOffer: 'Pro 优惠',
  },
  ar: {
    openNavigation: 'فتح التنقل',
    closeNavigation: 'إغلاق التنقل',
    resizePanes: 'تغيير حجم الأجزاء',
    notifications: 'الإشعارات',
    proOffer: 'عرض Pro',
  },
  hi: {
    openNavigation: 'नेविगेशन खोलें',
    closeNavigation: 'नेविगेशन बंद करें',
    resizePanes: 'पैन का आकार बदलें',
    notifications: 'सूचनाएँ',
    proOffer: 'Pro ऑफ़र',
  },
  bn: {
    openNavigation: 'নেভিগেশন খুলুন',
    closeNavigation: 'নেভিগেশন বন্ধ করুন',
    resizePanes: 'প্যানের আকার বদলান',
    notifications: 'বিজ্ঞপ্তি',
    proOffer: 'Pro অফার',
  },
  id: {
    openNavigation: 'Buka navigasi',
    closeNavigation: 'Tutup navigasi',
    resizePanes: 'Ubah ukuran panel',
    notifications: 'Notifikasi',
    proOffer: 'Penawaran Pro',
  },
};
