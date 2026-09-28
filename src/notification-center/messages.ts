import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { NotificationCenterTab } from './types';

/**
 * Every fixed string the notification center draws or announces, in each
 * Bloom language. `title`, `emptyMessage` and `emptyDescription` props still
 * win over their entries here.
 */
export interface NotificationCenterMessages {
  title: string;
  emptyMessage: string;
  emptyDescription: string;
  /** The header's count line at zero. */
  noUnread: string;
  /** The header's count line above zero. */
  unread: (count: number) => string;
  markAllRead: string;
  /** The tab strip's name. */
  category: string;
  tabs: Record<NotificationCenterTab, string>;
  /** Names a row's unread dot. */
  unreadDot: string;
}

export const NOTIFICATION_CENTER_MESSAGES: MessageCatalog<NotificationCenterMessages> = {
  en: {
    title: 'Notifications',
    emptyMessage: 'You’re all caught up.',
    emptyDescription: 'New activity will appear here when it arrives.',
    noUnread: 'No unread notifications',
    unread: (n) => plural('en', n, { other: '{n} unread' }),
    markAllRead: 'Mark all read',
    category: 'Notification category',
    tabs: { all: 'All', mentions: 'Mentions', system: 'System' },
    unreadDot: 'Unread',
  },
  es: {
    title: 'Notificaciones',
    emptyMessage: 'Estás al día.',
    emptyDescription: 'La nueva actividad aparecerá aquí cuando llegue.',
    noUnread: 'No hay notificaciones sin leer',
    unread: (n) => plural('es', n, { one: '{n} sin leer', other: '{n} sin leer' }),
    markAllRead: 'Marcar todo como leído',
    category: 'Categoría de notificación',
    tabs: { all: 'Todas', mentions: 'Menciones', system: 'Sistema' },
    unreadDot: 'No leída',
  },
  ca: {
    title: 'Notificacions',
    emptyMessage: 'Ja estàs al dia.',
    emptyDescription: 'La nova activitat apareixerà aquí quan arribi.',
    noUnread: 'No hi ha notificacions sense llegir',
    unread: (n) => plural('ca', n, { one: '{n} sense llegir', other: '{n} sense llegir' }),
    markAllRead: 'Marca-ho tot com a llegit',
    category: 'Categoria de notificació',
    tabs: { all: 'Totes', mentions: 'Mencions', system: 'Sistema' },
    unreadDot: 'Sense llegir',
  },
  de: {
    title: 'Benachrichtigungen',
    emptyMessage: 'Du bist auf dem neuesten Stand.',
    emptyDescription: 'Neue Aktivitäten erscheinen hier, sobald sie eintreffen.',
    noUnread: 'Keine ungelesenen Benachrichtigungen',
    unread: (n) => plural('de', n, { one: '{n} ungelesen', other: '{n} ungelesen' }),
    markAllRead: 'Alle als gelesen markieren',
    category: 'Benachrichtigungskategorie',
    tabs: { all: 'Alle', mentions: 'Erwähnungen', system: 'System' },
    unreadDot: 'Ungelesen',
  },
  fr: {
    title: 'Notifications',
    emptyMessage: 'Vous êtes à jour.',
    emptyDescription: 'La nouvelle activité apparaîtra ici dès son arrivée.',
    noUnread: 'Aucune notification non lue',
    unread: (n) => plural('fr', n, { one: '{n} non lue', other: '{n} non lues' }),
    markAllRead: 'Tout marquer comme lu',
    category: 'Catégorie de notification',
    tabs: { all: 'Toutes', mentions: 'Mentions', system: 'Système' },
    unreadDot: 'Non lue',
  },
  it: {
    title: 'Notifiche',
    emptyMessage: 'Sei in pari.',
    emptyDescription: 'Le nuove attività appariranno qui non appena arrivano.',
    noUnread: 'Nessuna notifica da leggere',
    unread: (n) => plural('it', n, { one: '{n} da leggere', other: '{n} da leggere' }),
    markAllRead: 'Segna tutto come letto',
    category: 'Categoria di notifica',
    tabs: { all: 'Tutte', mentions: 'Menzioni', system: 'Sistema' },
    unreadDot: 'Da leggere',
  },
  pt: {
    title: 'Notificações',
    emptyMessage: 'Está tudo em dia.',
    emptyDescription: 'Novas atividades aparecerão aqui quando chegarem.',
    noUnread: 'Nenhuma notificação não lida',
    unread: (n) => plural('pt', n, { one: '{n} não lida', other: '{n} não lidas' }),
    markAllRead: 'Marcar tudo como lido',
    category: 'Categoria de notificação',
    tabs: { all: 'Todas', mentions: 'Menções', system: 'Sistema' },
    unreadDot: 'Não lida',
  },
  ru: {
    title: 'Уведомления',
    emptyMessage: 'Вы всё просмотрели.',
    emptyDescription: 'Новые события появятся здесь, как только они произойдут.',
    noUnread: 'Нет непрочитанных уведомлений',
    unread: (n) => plural('ru', n, { one: '{n} непрочитанное', few: '{n} непрочитанных', many: '{n} непрочитанных', other: '{n} непрочитанных' }),
    markAllRead: 'Отметить все как прочитанные',
    category: 'Категория уведомлений',
    tabs: { all: 'Все', mentions: 'Упоминания', system: 'Система' },
    unreadDot: 'Не прочитано',
  },
  tr: {
    title: 'Bildirimler',
    emptyMessage: 'Her şeyi gördünüz.',
    emptyDescription: 'Yeni etkinlikler geldiğinde burada görünecek.',
    noUnread: 'Okunmamış bildirim yok',
    unread: (n) => plural('tr', n, { other: '{n} okunmamış' }),
    markAllRead: 'Tümünü okundu olarak işaretle',
    category: 'Bildirim kategorisi',
    tabs: { all: 'Tümü', mentions: 'Bahsetmeler', system: 'Sistem' },
    unreadDot: 'Okunmadı',
  },
  ja: {
    title: '通知',
    emptyMessage: 'すべて確認済みです。',
    emptyDescription: '新しいアクティビティはここに表示されます。',
    noUnread: '未読の通知はありません',
    unread: (n) => plural('ja', n, { other: '未読 {n} 件' }),
    markAllRead: 'すべて既読にする',
    category: '通知のカテゴリ',
    tabs: { all: 'すべて', mentions: 'メンション', system: 'システム' },
    unreadDot: '未読',
  },
  zh: {
    title: '通知',
    emptyMessage: '你已看完所有通知。',
    emptyDescription: '新动态到达后会显示在这里。',
    noUnread: '没有未读通知',
    unread: (n) => plural('zh', n, { other: '{n} 条未读' }),
    markAllRead: '全部标为已读',
    category: '通知类别',
    tabs: { all: '全部', mentions: '提及', system: '系统' },
    unreadDot: '未读',
  },
  ar: {
    title: 'الإشعارات',
    emptyMessage: 'لقد اطّلعت على كل شيء.',
    emptyDescription: 'سيظهر النشاط الجديد هنا عند وصوله.',
    noUnread: 'لا توجد إشعارات غير مقروءة',
    unread: (n) =>
      plural('ar', n, {
        zero: 'لا إشعارات غير مقروءة',
        one: 'إشعار واحد غير مقروء',
        two: 'إشعاران غير مقروءين',
        few: '{n} إشعارات غير مقروءة',
        many: '{n} إشعارًا غير مقروء',
        other: '{n} إشعار غير مقروء',
      }),
    markAllRead: 'تعليم الكل كمقروء',
    category: 'فئة الإشعارات',
    tabs: { all: 'الكل', mentions: 'الإشارات', system: 'النظام' },
    unreadDot: 'غير مقروء',
  },
  hi: {
    title: 'सूचनाएँ',
    emptyMessage: 'आपने सब कुछ देख लिया है।',
    emptyDescription: 'नई गतिविधि आने पर यहाँ दिखाई देगी।',
    noUnread: 'कोई अपठित सूचना नहीं',
    unread: (n) => plural('hi', n, { other: '{n} अपठित' }),
    markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
    category: 'सूचना की श्रेणी',
    tabs: { all: 'सभी', mentions: 'उल्लेख', system: 'सिस्टम' },
    unreadDot: 'अपठित',
  },
  bn: {
    title: 'বিজ্ঞপ্তি',
    emptyMessage: 'আপনি সব দেখে ফেলেছেন।',
    emptyDescription: 'নতুন কার্যকলাপ এলে এখানে দেখা যাবে।',
    noUnread: 'কোনো অপঠিত বিজ্ঞপ্তি নেই',
    unread: (n) => plural('bn', n, { other: '{n}টি অপঠিত' }),
    markAllRead: 'সব পঠিত হিসেবে চিহ্নিত করুন',
    category: 'বিজ্ঞপ্তির বিভাগ',
    tabs: { all: 'সব', mentions: 'উল্লেখ', system: 'সিস্টেম' },
    unreadDot: 'অপঠিত',
  },
  id: {
    title: 'Notifikasi',
    emptyMessage: 'Semua sudah Anda lihat.',
    emptyDescription: 'Aktivitas baru akan muncul di sini saat tiba.',
    noUnread: 'Tidak ada notifikasi yang belum dibaca',
    unread: (n) => plural('id', n, { other: '{n} belum dibaca' }),
    markAllRead: 'Tandai semua sudah dibaca',
    category: 'Kategori notifikasi',
    tabs: { all: 'Semua', mentions: 'Sebutan', system: 'Sistem' },
    unreadDot: 'Belum dibaca',
  },
};
