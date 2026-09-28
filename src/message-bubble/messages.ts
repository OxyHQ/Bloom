import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the message-bubble family draws or announces, in each
 * Bloom language. A caller's `labels` / `label` prop still wins over any entry
 * here. Dates, call titles and durations are pre-formatted by the caller.
 */
export interface MessageBubbleMessages {
  /** The forwarded line: "Forwarded from Ana". */
  forwardedFrom: (name: string) => string;
  /** What a deleted bubble says. */
  deleted: string;
  /** Names the retry control on a failed message. */
  retry: string;
  /** Names the `+` reaction control. */
  addReaction: string;
  /** Names the reply quote when it is pressable. */
  replyTo: string;
  /** Announced on a selected bubble. */
  selected: string;
  /** Announced on a message that has not been sent yet. */
  pending: string;
  /** Announced on a message that failed to send. */
  failed: string;
  /** Appended to a reaction pill's name when it is the reader's own: "👍, 3, selected". */
  reactionSelected: string;
  /** `UnreadSeparator`'s label. */
  unread: string;
  /** `TypingBubble`'s name. */
  typing: string;
}

export const MESSAGE_BUBBLE_MESSAGES: MessageCatalog<MessageBubbleMessages> = {
  en: {
    forwardedFrom: (name) => `Forwarded from ${name}`,
    deleted: 'This message was deleted',
    retry: 'Retry sending',
    addReaction: 'Add a reaction',
    replyTo: 'Go to the quoted message',
    selected: 'Selected',
    pending: 'Sending',
    failed: 'Not sent',
    reactionSelected: 'selected',
    unread: 'Unread messages',
    typing: 'Typing…',
  },
  es: {
    forwardedFrom: (name) => `Reenviado de ${name}`,
    deleted: 'Se eliminó este mensaje',
    retry: 'Reintentar envío',
    addReaction: 'Añadir una reacción',
    replyTo: 'Ir al mensaje citado',
    selected: 'Seleccionado',
    pending: 'Enviando',
    failed: 'No enviado',
    reactionSelected: 'seleccionada',
    unread: 'Mensajes no leídos',
    typing: 'Escribiendo…',
  },
  ca: {
    forwardedFrom: (name) => `Reenviat de ${name}`,
    deleted: "S'ha suprimit aquest missatge",
    retry: "Torna a provar d'enviar",
    addReaction: 'Afegeix una reacció',
    replyTo: 'Vés al missatge citat',
    selected: 'Seleccionat',
    pending: "S'està enviant",
    failed: 'No enviat',
    reactionSelected: 'seleccionada',
    unread: 'Missatges no llegits',
    typing: 'Escrivint…',
  },
  de: {
    forwardedFrom: (name) => `Weitergeleitet von ${name}`,
    deleted: 'Diese Nachricht wurde gelöscht',
    retry: 'Erneut senden',
    addReaction: 'Reaktion hinzufügen',
    replyTo: 'Zur zitierten Nachricht',
    selected: 'Ausgewählt',
    pending: 'Wird gesendet',
    failed: 'Nicht gesendet',
    reactionSelected: 'ausgewählt',
    unread: 'Ungelesene Nachrichten',
    typing: 'Schreibt…',
  },
  fr: {
    forwardedFrom: (name) => `Transféré de ${name}`,
    deleted: 'Ce message a été supprimé',
    retry: "Réessayer l'envoi",
    addReaction: 'Ajouter une réaction',
    replyTo: 'Aller au message cité',
    selected: 'Sélectionné',
    pending: 'Envoi en cours',
    failed: 'Non envoyé',
    reactionSelected: 'sélectionnée',
    unread: 'Messages non lus',
    typing: "En train d'écrire…",
  },
  it: {
    forwardedFrom: (name) => `Inoltrato da ${name}`,
    deleted: 'Questo messaggio è stato eliminato',
    retry: "Riprova l'invio",
    addReaction: 'Aggiungi una reazione',
    replyTo: 'Vai al messaggio citato',
    selected: 'Selezionato',
    pending: 'Invio in corso',
    failed: 'Non inviato',
    reactionSelected: 'selezionata',
    unread: 'Messaggi non letti',
    typing: 'Sta scrivendo…',
  },
  pt: {
    forwardedFrom: (name) => `Encaminhada de ${name}`,
    deleted: 'Esta mensagem foi apagada',
    retry: 'Tentar enviar novamente',
    addReaction: 'Adicionar uma reação',
    replyTo: 'Ir para a mensagem citada',
    selected: 'Selecionada',
    pending: 'Enviando',
    failed: 'Não enviada',
    reactionSelected: 'selecionada',
    unread: 'Mensagens não lidas',
    typing: 'Digitando…',
  },
  ru: {
    forwardedFrom: (name) => `Переслано от ${name}`,
    deleted: 'Сообщение удалено',
    retry: 'Отправить ещё раз',
    addReaction: 'Добавить реакцию',
    replyTo: 'Перейти к цитируемому сообщению',
    selected: 'Выбрано',
    pending: 'Отправляется',
    failed: 'Не отправлено',
    reactionSelected: 'выбрано',
    unread: 'Непрочитанные сообщения',
    typing: 'Печатает…',
  },
  tr: {
    forwardedFrom: (name) => `${name} kaynağından iletildi`,
    deleted: 'Bu mesaj silindi',
    retry: 'Yeniden göndermeyi dene',
    addReaction: 'Tepki ekle',
    replyTo: 'Alıntılanan mesaja git',
    selected: 'Seçildi',
    pending: 'Gönderiliyor',
    failed: 'Gönderilemedi',
    reactionSelected: 'seçildi',
    unread: 'Okunmamış mesajlar',
    typing: 'Yazıyor…',
  },
  ja: {
    forwardedFrom: (name) => `${name}から転送`,
    deleted: 'このメッセージは削除されました',
    retry: '再送信',
    addReaction: 'リアクションを追加',
    replyTo: '引用元のメッセージへ移動',
    selected: '選択済み',
    pending: '送信中',
    failed: '未送信',
    reactionSelected: '選択済み',
    unread: '未読メッセージ',
    typing: '入力中…',
  },
  zh: {
    forwardedFrom: (name) => `转发自 ${name}`,
    deleted: '此消息已被删除',
    retry: '重新发送',
    addReaction: '添加回应',
    replyTo: '跳转到引用的消息',
    selected: '已选择',
    pending: '正在发送',
    failed: '未发送',
    reactionSelected: '已选择',
    unread: '未读消息',
    typing: '正在输入…',
  },
  ar: {
    forwardedFrom: (name) => `تمت إعادة التوجيه من ${name}`,
    deleted: 'تم حذف هذه الرسالة',
    retry: 'إعادة محاولة الإرسال',
    addReaction: 'إضافة تفاعل',
    replyTo: 'الانتقال إلى الرسالة المقتبسة',
    selected: 'محدد',
    pending: 'جارٍ الإرسال',
    failed: 'لم يتم الإرسال',
    reactionSelected: 'محدد',
    unread: 'رسائل غير مقروءة',
    typing: 'يكتب…',
  },
  hi: {
    forwardedFrom: (name) => `${name} से फ़ॉरवर्ड किया गया`,
    deleted: 'यह संदेश हटा दिया गया था',
    retry: 'फिर से भेजने की कोशिश करें',
    addReaction: 'प्रतिक्रिया जोड़ें',
    replyTo: 'उद्धृत संदेश पर जाएं',
    selected: 'चयनित',
    pending: 'भेजा जा रहा है',
    failed: 'नहीं भेजा गया',
    reactionSelected: 'चयनित',
    unread: 'अपठित संदेश',
    typing: 'टाइप कर रहे हैं…',
  },
  bn: {
    forwardedFrom: (name) => `${name} থেকে ফরওয়ার্ড করা হয়েছে`,
    deleted: 'এই বার্তাটি মুছে ফেলা হয়েছে',
    retry: 'আবার পাঠানোর চেষ্টা করুন',
    addReaction: 'প্রতিক্রিয়া যোগ করুন',
    replyTo: 'উদ্ধৃত বার্তায় যান',
    selected: 'নির্বাচিত',
    pending: 'পাঠানো হচ্ছে',
    failed: 'পাঠানো যায়নি',
    reactionSelected: 'নির্বাচিত',
    unread: 'অপঠিত বার্তা',
    typing: 'টাইপ করছে…',
  },
  id: {
    forwardedFrom: (name) => `Diteruskan dari ${name}`,
    deleted: 'Pesan ini telah dihapus',
    retry: 'Coba kirim lagi',
    addReaction: 'Tambahkan reaksi',
    replyTo: 'Buka pesan yang dikutip',
    selected: 'Dipilih',
    pending: 'Mengirim',
    failed: 'Tidak terkirim',
    reactionSelected: 'dipilih',
    unread: 'Pesan belum dibaca',
    typing: 'Mengetik…',
  },
};
