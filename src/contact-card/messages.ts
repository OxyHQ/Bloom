import type { MessageCatalog } from '../locale/messages';
import type { ContactChannelKind } from './types';

/**
 * Every fixed string the contact-card family draws or announces, in each
 * Bloom language. A channel's `label`, an owner's `label` and the caller's
 * own copy still win over these.
 */
export interface ContactCardMessages {
  /**
   * Per channel: `action`, the one-word label on a card wide enough to carry
   * one, and `name`, the button's accessible name about the subject — a whole
   * phrase per language, since a preposition's place and case differ.
   */
  channels: Record<ContactChannelKind, { action: string; name: (subject: string) => string }>;
  /** Names the row of fact and tag chips. */
  labelsFor: (name: string) => string;
  /** The word before the owner's name in the footer. */
  owner: string;
}

export const CONTACT_CARD_MESSAGES: MessageCatalog<ContactCardMessages> = {
  en: {
    channels: {
      email: { action: 'Email', name: (s) => `Email ${s}` },
      phone: { action: 'Call', name: (s) => `Call ${s}` },
      chat: { action: 'Message', name: (s) => `Message ${s}` },
      meeting: { action: 'Meet', name: (s) => `Schedule a meeting with ${s}` },
      video: { action: 'Video', name: (s) => `Start a video call with ${s}` },
      website: { action: 'Website', name: (s) => `Open the website of ${s}` },
    },
    labelsFor: (name) => `Labels for ${name}`,
    owner: 'Owner',
  },
  es: {
    channels: {
      email: { action: 'Correo', name: (s) => `Enviar un correo a ${s}` },
      phone: { action: 'Llamar', name: (s) => `Llamar a ${s}` },
      chat: { action: 'Mensaje', name: (s) => `Enviar un mensaje a ${s}` },
      meeting: { action: 'Reunión', name: (s) => `Programar una reunión con ${s}` },
      video: { action: 'Vídeo', name: (s) => `Iniciar una videollamada con ${s}` },
      website: { action: 'Sitio web', name: (s) => `Abrir el sitio web de ${s}` },
    },
    labelsFor: (name) => `Etiquetas de ${name}`,
    owner: 'Responsable',
  },
  ca: {
    channels: {
      email: { action: 'Correu', name: (s) => `Envia un correu a ${s}` },
      phone: { action: 'Truca', name: (s) => `Truca a ${s}` },
      chat: { action: 'Missatge', name: (s) => `Envia un missatge a ${s}` },
      meeting: { action: 'Reunió', name: (s) => `Programa una reunió amb ${s}` },
      video: { action: 'Vídeo', name: (s) => `Inicia una videotrucada amb ${s}` },
      website: { action: 'Lloc web', name: (s) => `Obre el lloc web de ${s}` },
    },
    labelsFor: (name) => `Etiquetes de ${name}`,
    owner: 'Responsable',
  },
  de: {
    channels: {
      email: { action: 'E-Mail', name: (s) => `E-Mail an ${s}` },
      phone: { action: 'Anrufen', name: (s) => `${s} anrufen` },
      chat: { action: 'Nachricht', name: (s) => `Nachricht an ${s}` },
      meeting: { action: 'Meeting', name: (s) => `Meeting mit ${s} planen` },
      video: { action: 'Video', name: (s) => `Videoanruf mit ${s} starten` },
      website: { action: 'Website', name: (s) => `Website von ${s} öffnen` },
    },
    labelsFor: (name) => `Labels von ${name}`,
    owner: 'Verantwortlich',
  },
  fr: {
    channels: {
      email: { action: 'E-mail', name: (s) => `Envoyer un e-mail à ${s}` },
      phone: { action: 'Appeler', name: (s) => `Appeler ${s}` },
      chat: { action: 'Message', name: (s) => `Envoyer un message à ${s}` },
      meeting: { action: 'Réunion', name: (s) => `Planifier une réunion avec ${s}` },
      video: { action: 'Vidéo', name: (s) => `Lancer un appel vidéo avec ${s}` },
      website: { action: 'Site web', name: (s) => `Ouvrir le site web de ${s}` },
    },
    labelsFor: (name) => `Libellés de ${name}`,
    owner: 'Responsable',
  },
  it: {
    channels: {
      email: { action: 'Email', name: (s) => `Invia un'email a ${s}` },
      phone: { action: 'Chiama', name: (s) => `Chiama ${s}` },
      chat: { action: 'Messaggio', name: (s) => `Invia un messaggio a ${s}` },
      meeting: { action: 'Riunione', name: (s) => `Pianifica una riunione con ${s}` },
      video: { action: 'Video', name: (s) => `Avvia una videochiamata con ${s}` },
      website: { action: 'Sito web', name: (s) => `Apri il sito web di ${s}` },
    },
    labelsFor: (name) => `Etichette di ${name}`,
    owner: 'Responsabile',
  },
  pt: {
    channels: {
      email: { action: 'E-mail', name: (s) => `Enviar e-mail para ${s}` },
      phone: { action: 'Ligar', name: (s) => `Ligar para ${s}` },
      chat: { action: 'Mensagem', name: (s) => `Enviar mensagem para ${s}` },
      meeting: { action: 'Reunião', name: (s) => `Agendar reunião com ${s}` },
      video: { action: 'Vídeo', name: (s) => `Iniciar videochamada com ${s}` },
      website: { action: 'Site', name: (s) => `Abrir o site de ${s}` },
    },
    labelsFor: (name) => `Etiquetas de ${name}`,
    owner: 'Responsável',
  },
  ru: {
    // A name after a colon keeps its nominative case; a verb would demand another.
    channels: {
      email: { action: 'Письмо', name: (s) => `Написать письмо: ${s}` },
      phone: { action: 'Позвонить', name: (s) => `Позвонить: ${s}` },
      chat: { action: 'Сообщение', name: (s) => `Написать сообщение: ${s}` },
      meeting: { action: 'Встреча', name: (s) => `Назначить встречу: ${s}` },
      video: { action: 'Видео', name: (s) => `Начать видеозвонок: ${s}` },
      website: { action: 'Сайт', name: (s) => `Открыть сайт: ${s}` },
    },
    labelsFor: (name) => `Метки: ${name}`,
    owner: 'Ответственный',
  },
  tr: {
    // The same colon form: Turkish case suffixes depend on the name's vowels.
    channels: {
      email: { action: 'E-posta', name: (s) => `E-posta gönder: ${s}` },
      phone: { action: 'Ara', name: (s) => `Ara: ${s}` },
      chat: { action: 'Mesaj', name: (s) => `Mesaj gönder: ${s}` },
      meeting: { action: 'Toplantı', name: (s) => `Toplantı planla: ${s}` },
      video: { action: 'Görüntülü', name: (s) => `Görüntülü arama başlat: ${s}` },
      website: { action: 'Web sitesi', name: (s) => `Web sitesini aç: ${s}` },
    },
    labelsFor: (name) => `Etiketler: ${name}`,
    owner: 'Sorumlu',
  },
  ja: {
    channels: {
      email: { action: 'メール', name: (s) => `${s}にメールを送信` },
      phone: { action: '電話', name: (s) => `${s}に電話` },
      chat: { action: 'メッセージ', name: (s) => `${s}にメッセージを送信` },
      meeting: { action: 'ミーティング', name: (s) => `${s}とのミーティングを設定` },
      video: { action: 'ビデオ', name: (s) => `${s}とビデオ通話を開始` },
      website: { action: 'ウェブサイト', name: (s) => `${s}のウェブサイトを開く` },
    },
    labelsFor: (name) => `${name}のラベル`,
    owner: '担当者',
  },
  zh: {
    channels: {
      email: { action: '邮件', name: (s) => `给 ${s} 发送邮件` },
      phone: { action: '通话', name: (s) => `呼叫 ${s}` },
      chat: { action: '消息', name: (s) => `给 ${s} 发消息` },
      meeting: { action: '会议', name: (s) => `与 ${s} 安排会议` },
      video: { action: '视频', name: (s) => `与 ${s} 开始视频通话` },
      website: { action: '网站', name: (s) => `打开 ${s} 的网站` },
    },
    labelsFor: (name) => `${name} 的标签`,
    owner: '负责人',
  },
  ar: {
    channels: {
      email: { action: 'البريد', name: (s) => `إرسال بريد إلكتروني إلى ${s}` },
      phone: { action: 'اتصال', name: (s) => `الاتصال بـ ${s}` },
      chat: { action: 'رسالة', name: (s) => `إرسال رسالة إلى ${s}` },
      meeting: { action: 'اجتماع', name: (s) => `جدولة اجتماع مع ${s}` },
      video: { action: 'فيديو', name: (s) => `بدء مكالمة فيديو مع ${s}` },
      website: { action: 'الموقع', name: (s) => `فتح موقع ${s} الإلكتروني` },
    },
    labelsFor: (name) => `تصنيفات ${name}`,
    owner: 'المسؤول',
  },
  hi: {
    channels: {
      email: { action: 'ईमेल', name: (s) => `${s} को ईमेल करें` },
      phone: { action: 'कॉल', name: (s) => `${s} को कॉल करें` },
      chat: { action: 'संदेश', name: (s) => `${s} को संदेश भेजें` },
      meeting: { action: 'मीटिंग', name: (s) => `${s} के साथ मीटिंग शेड्यूल करें` },
      video: { action: 'वीडियो', name: (s) => `${s} के साथ वीडियो कॉल शुरू करें` },
      website: { action: 'वेबसाइट', name: (s) => `${s} की वेबसाइट खोलें` },
    },
    labelsFor: (name) => `${name} के लेबल`,
    owner: 'स्वामी',
  },
  bn: {
    channels: {
      email: { action: 'ইমেল', name: (s) => `${s}-কে ইমেল করুন` },
      phone: { action: 'কল', name: (s) => `${s}-কে কল করুন` },
      chat: { action: 'বার্তা', name: (s) => `${s}-কে বার্তা পাঠান` },
      meeting: { action: 'মিটিং', name: (s) => `${s}-এর সাথে মিটিং নির্ধারণ করুন` },
      video: { action: 'ভিডিও', name: (s) => `${s}-এর সাথে ভিডিও কল শুরু করুন` },
      website: { action: 'ওয়েবসাইট', name: (s) => `${s}-এর ওয়েবসাইট খুলুন` },
    },
    labelsFor: (name) => `${name}-এর লেবেল`,
    owner: 'মালিক',
  },
  id: {
    channels: {
      email: { action: 'Email', name: (s) => `Kirim email ke ${s}` },
      phone: { action: 'Telepon', name: (s) => `Telepon ${s}` },
      chat: { action: 'Pesan', name: (s) => `Kirim pesan ke ${s}` },
      meeting: { action: 'Rapat', name: (s) => `Jadwalkan rapat dengan ${s}` },
      video: { action: 'Video', name: (s) => `Mulai panggilan video dengan ${s}` },
      website: { action: 'Situs web', name: (s) => `Buka situs web ${s}` },
    },
    labelsFor: (name) => `Label untuk ${name}`,
    owner: 'Pemilik',
  },
};
