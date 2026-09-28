import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { MessageDeliveryStatus, PresenceStatus } from './types';

/**
 * Every fixed string the chat-indicators family announces, in each Bloom
 * language. A caller's `label` / `accessibilityLabel` / `formatLabel` prop
 * still wins over any entry here.
 */
export interface ChatIndicatorsMessages {
  /** A presence dot's name per status. */
  presence: Record<PresenceStatus, string>;
  /** A delivery tick's name per status. */
  status: Record<MessageDeliveryStatus, string>;
  /** An unread badge's name with no count. */
  unread: string;
  /** An unread badge's name for a count: "3 unread messages". */
  unreadCount: (count: number) => string;
}

export const CHAT_INDICATORS_MESSAGES: MessageCatalog<ChatIndicatorsMessages> = {
  en: {
    presence: { online: 'Online', idle: 'Away', offline: 'Offline', busy: 'Busy' },
    status: { sending: 'Sending…', sent: 'Sent', delivered: 'Delivered', read: 'Read', failed: 'Not sent' },
    unread: 'Unread',
    unreadCount: (n) => plural('en', n, { one: '{n} unread message', other: '{n} unread messages' }),
  },
  es: {
    presence: { online: 'En línea', idle: 'Ausente', offline: 'Desconectado', busy: 'Ocupado' },
    status: { sending: 'Enviando…', sent: 'Enviado', delivered: 'Entregado', read: 'Leído', failed: 'No enviado' },
    unread: 'No leído',
    unreadCount: (n) => plural('es', n, { one: '{n} mensaje no leído', other: '{n} mensajes no leídos' }),
  },
  ca: {
    presence: { online: 'En línia', idle: 'Absent', offline: 'Desconnectat', busy: 'Ocupat' },
    status: { sending: "S'està enviant…", sent: 'Enviat', delivered: 'Lliurat', read: 'Llegit', failed: 'No enviat' },
    unread: 'No llegit',
    unreadCount: (n) => plural('ca', n, { one: '{n} missatge no llegit', other: '{n} missatges no llegits' }),
  },
  de: {
    presence: { online: 'Online', idle: 'Abwesend', offline: 'Offline', busy: 'Beschäftigt' },
    status: { sending: 'Wird gesendet…', sent: 'Gesendet', delivered: 'Zugestellt', read: 'Gelesen', failed: 'Nicht gesendet' },
    unread: 'Ungelesen',
    unreadCount: (n) => plural('de', n, { one: '{n} ungelesene Nachricht', other: '{n} ungelesene Nachrichten' }),
  },
  fr: {
    presence: { online: 'En ligne', idle: 'Absent', offline: 'Hors ligne', busy: 'Occupé' },
    status: { sending: 'Envoi…', sent: 'Envoyé', delivered: 'Distribué', read: 'Lu', failed: 'Non envoyé' },
    unread: 'Non lu',
    unreadCount: (n) => plural('fr', n, { one: '{n} message non lu', other: '{n} messages non lus' }),
  },
  it: {
    presence: { online: 'Online', idle: 'Assente', offline: 'Offline', busy: 'Occupato' },
    status: { sending: 'Invio in corso…', sent: 'Inviato', delivered: 'Consegnato', read: 'Letto', failed: 'Non inviato' },
    unread: 'Non letto',
    unreadCount: (n) => plural('it', n, { one: '{n} messaggio non letto', other: '{n} messaggi non letti' }),
  },
  pt: {
    presence: { online: 'On-line', idle: 'Ausente', offline: 'Off-line', busy: 'Ocupado' },
    status: { sending: 'Enviando…', sent: 'Enviada', delivered: 'Entregue', read: 'Lida', failed: 'Não enviada' },
    unread: 'Não lida',
    unreadCount: (n) => plural('pt', n, { one: '{n} mensagem não lida', other: '{n} mensagens não lidas' }),
  },
  ru: {
    presence: { online: 'В сети', idle: 'Нет на месте', offline: 'Не в сети', busy: 'Занят' },
    status: { sending: 'Отправка…', sent: 'Отправлено', delivered: 'Доставлено', read: 'Прочитано', failed: 'Не отправлено' },
    unread: 'Не прочитано',
    unreadCount: (n) =>
      plural('ru', n, {
        one: '{n} непрочитанное сообщение',
        few: '{n} непрочитанных сообщения',
        many: '{n} непрочитанных сообщений',
        other: '{n} непрочитанного сообщения',
      }),
  },
  tr: {
    presence: { online: 'Çevrimiçi', idle: 'Uzakta', offline: 'Çevrimdışı', busy: 'Meşgul' },
    status: { sending: 'Gönderiliyor…', sent: 'Gönderildi', delivered: 'İletildi', read: 'Okundu', failed: 'Gönderilemedi' },
    unread: 'Okunmadı',
    unreadCount: (n) => plural('tr', n, { one: '{n} okunmamış mesaj', other: '{n} okunmamış mesaj' }),
  },
  ja: {
    presence: { online: 'オンライン', idle: '退席中', offline: 'オフライン', busy: '取り込み中' },
    status: { sending: '送信中…', sent: '送信済み', delivered: '配信済み', read: '既読', failed: '未送信' },
    unread: '未読',
    unreadCount: (n) => `未読メッセージ ${n} 件`,
  },
  zh: {
    presence: { online: '在线', idle: '离开', offline: '离线', busy: '忙碌' },
    status: { sending: '正在发送…', sent: '已发送', delivered: '已送达', read: '已读', failed: '未发送' },
    unread: '未读',
    unreadCount: (n) => `${n} 条未读消息`,
  },
  ar: {
    presence: { online: 'متصل', idle: 'بعيد', offline: 'غير متصل', busy: 'مشغول' },
    status: { sending: 'جارٍ الإرسال…', sent: 'تم الإرسال', delivered: 'تم التسليم', read: 'تمت القراءة', failed: 'لم يتم الإرسال' },
    unread: 'غير مقروءة',
    unreadCount: (n) =>
      plural('ar', n, {
        zero: 'لا توجد رسائل غير مقروءة',
        one: 'رسالة واحدة غير مقروءة',
        two: 'رسالتان غير مقروءتين',
        few: '{n} رسائل غير مقروءة',
        many: '{n} رسالة غير مقروءة',
        other: '{n} رسالة غير مقروءة',
      }),
  },
  hi: {
    presence: { online: 'ऑनलाइन', idle: 'दूर', offline: 'ऑफ़लाइन', busy: 'व्यस्त' },
    status: { sending: 'भेजा जा रहा है…', sent: 'भेजा गया', delivered: 'डिलीवर हुआ', read: 'पढ़ा गया', failed: 'नहीं भेजा गया' },
    unread: 'अपठित',
    unreadCount: (n) => plural('hi', n, { one: '{n} अपठित संदेश', other: '{n} अपठित संदेश' }),
  },
  bn: {
    presence: { online: 'অনলাইন', idle: 'দূরে', offline: 'অফলাইন', busy: 'ব্যস্ত' },
    status: { sending: 'পাঠানো হচ্ছে…', sent: 'পাঠানো হয়েছে', delivered: 'পৌঁছেছে', read: 'পড়া হয়েছে', failed: 'পাঠানো যায়নি' },
    unread: 'অপঠিত',
    unreadCount: (n) => `${n}টি অপঠিত বার্তা`,
  },
  id: {
    presence: { online: 'Online', idle: 'Pergi', offline: 'Offline', busy: 'Sibuk' },
    status: { sending: 'Mengirim…', sent: 'Terkirim', delivered: 'Diterima', read: 'Dibaca', failed: 'Tidak terkirim' },
    unread: 'Belum dibaca',
    unreadCount: (n) => `${n} pesan belum dibaca`,
  },
};
