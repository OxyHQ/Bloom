import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the agent-chat family draws or announces, in each Bloom
 * language. The common words (Delete, Copied, "More actions for …") come from
 * `COMMON_MESSAGES`; a caller's `labels` props still win over any entry here.
 */
export interface AgentChatMessages {
  chat: {
    /** Header title fallback. */
    newChat: string;
    emptyTitle: string;
    emptyDescription: string;
    thinking: string;
    error: string;
    /** The empty state's suggestion pills. */
    suggestions: readonly string[];
    /** Speaker names in a shared transcript. */
    you: string;
    assistant: string;
  };
  actions: {
    share: string;
    shared: string;
    more: string;
    exportChats: string;
    markUnread: string;
    deleteChat: string;
  };
  message: {
    copy: string;
    readAloud: string;
    stopReading: string;
  };
  history: {
    region: string;
    recent: string;
    empty: string;
    rename: string;
    renameField: string;
    markUnread: string;
    unread: string;
    exportCount: (count: number) => string;
    accountMenu: (name: string) => string;
    usageLeft: string;
    upgrade: string;
    logOut: string;
  };
  composer: {
    field: string;
    placeholder: string;
    attach: string;
    send: string;
    stop: string;
    notConfigured: string;
    messageCount: (count: number) => string;
    answeringWith: (model: string) => string;
  };
  /** A message's age: "just now", "3 minutes ago". */
  ago: {
    justNow: string;
    minutes: (n: number) => string;
    hours: (n: number) => string;
    days: (n: number) => string;
  };
  /** A rail row's compact age badge: "now", "34m", "5h", "3d". */
  age: {
    now: string;
    minutes: (n: number) => string;
    hours: (n: number) => string;
    days: (n: number) => string;
  };
}

export const AGENT_CHAT_MESSAGES: MessageCatalog<AgentChatMessages> = {
  en: {
    chat: {
      newChat: 'New chat',
      emptyTitle: 'What can I help with?',
      emptyDescription: 'This chat runs against your own API key. History stays in this browser.',
      thinking: 'Thinking',
      error: 'Something went wrong. Check the server logs, then try again.',
      suggestions: [
        'Explain what this starter does',
        'Write a product update in three sentences',
        'Give me five names for a scheduling app',
      ],
      you: 'You',
      assistant: 'Assistant',
    },
    actions: {
      share: 'Share chat',
      shared: 'Transcript copied',
      more: 'More actions for this chat',
      exportChats: 'Export chats',
      markUnread: 'Mark as unread',
      deleteChat: 'Delete chat',
    },
    message: { copy: 'Copy message', readAloud: 'Read aloud', stopReading: 'Stop reading aloud' },
    history: {
      region: 'Chat history',
      recent: 'Recent',
      empty: 'Chats you start show up here.',
      rename: 'Rename',
      renameField: 'Rename chat',
      markUnread: 'Mark as unread',
      unread: 'Unread',
      exportCount: (n) =>
        n === 0 ? 'No chats to export' : plural('en', n, { one: 'Export {n} chat', other: 'Export {n} chats' }),
      accountMenu: (name) => `${name} account menu`,
      usageLeft: 'Usage left',
      upgrade: 'Upgrade to Max',
      logOut: 'Log out',
    },
    composer: {
      field: 'Message',
      placeholder: 'Ask me anything',
      attach: 'Add attachment',
      send: 'Send message',
      stop: 'Stop generating',
      notConfigured: 'Not configured',
      messageCount: (n) => plural('en', n, { one: '{n} message', other: '{n} messages' }),
      answeringWith: (model) => `Answering with ${model}`,
    },
    ago: {
      justNow: 'just now',
      minutes: (n) => plural('en', n, { one: '{n} minute ago', other: '{n} minutes ago' }),
      hours: (n) => plural('en', n, { one: '{n} hour ago', other: '{n} hours ago' }),
      days: (n) => plural('en', n, { one: '{n} day ago', other: '{n} days ago' }),
    },
    age: { now: 'now', minutes: (n) => `${n}m`, hours: (n) => `${n}h`, days: (n) => `${n}d` },
  },
  es: {
    chat: {
      newChat: 'Nuevo chat',
      emptyTitle: '¿En qué puedo ayudarte?',
      emptyDescription: 'Este chat usa tu propia clave de API. El historial se queda en este navegador.',
      thinking: 'Pensando',
      error: 'Algo salió mal. Revisa los registros del servidor y vuelve a intentarlo.',
      suggestions: [
        'Explica qué hace este proyecto inicial',
        'Escribe una actualización de producto en tres frases',
        'Dame cinco nombres para una app de citas',
      ],
      you: 'Tú',
      assistant: 'Asistente',
    },
    actions: {
      share: 'Compartir chat',
      shared: 'Transcripción copiada',
      more: 'Más acciones de este chat',
      exportChats: 'Exportar chats',
      markUnread: 'Marcar como no leído',
      deleteChat: 'Eliminar chat',
    },
    message: { copy: 'Copiar mensaje', readAloud: 'Leer en voz alta', stopReading: 'Dejar de leer en voz alta' },
    history: {
      region: 'Historial de chats',
      recent: 'Recientes',
      empty: 'Los chats que inicies aparecerán aquí.',
      rename: 'Cambiar nombre',
      renameField: 'Cambiar nombre del chat',
      markUnread: 'Marcar como no leído',
      unread: 'No leído',
      exportCount: (n) =>
        n === 0 ? 'No hay chats para exportar' : plural('es', n, { one: 'Exportar {n} chat', other: 'Exportar {n} chats' }),
      accountMenu: (name) => `Menú de la cuenta de ${name}`,
      usageLeft: 'Uso restante',
      upgrade: 'Mejorar a Max',
      logOut: 'Cerrar sesión',
    },
    composer: {
      field: 'Mensaje',
      placeholder: 'Pregúntame lo que quieras',
      attach: 'Añadir archivo adjunto',
      send: 'Enviar mensaje',
      stop: 'Detener la generación',
      notConfigured: 'Sin configurar',
      messageCount: (n) => plural('es', n, { one: '{n} mensaje', other: '{n} mensajes' }),
      answeringWith: (model) => `Respondiendo con ${model}`,
    },
    ago: {
      justNow: 'ahora mismo',
      minutes: (n) => plural('es', n, { one: 'hace {n} minuto', other: 'hace {n} minutos' }),
      hours: (n) => plural('es', n, { one: 'hace {n} hora', other: 'hace {n} horas' }),
      days: (n) => plural('es', n, { one: 'hace {n} día', other: 'hace {n} días' }),
    },
    age: { now: 'ahora', minutes: (n) => `${n} min`, hours: (n) => `${n} h`, days: (n) => `${n} d` },
  },
  ca: {
    chat: {
      newChat: 'Xat nou',
      emptyTitle: 'En què et puc ajudar?',
      emptyDescription: 'Aquest xat funciona amb la teva pròpia clau d’API. L’historial es queda en aquest navegador.',
      thinking: 'Pensant',
      error: 'Alguna cosa ha fallat. Revisa els registres del servidor i torna-ho a provar.',
      suggestions: [
        'Explica què fa aquest projecte inicial',
        'Escriu una actualització de producte en tres frases',
        'Dona’m cinc noms per a una app de cites',
      ],
      you: 'Tu',
      assistant: 'Assistent',
    },
    actions: {
      share: 'Comparteix el xat',
      shared: 'Transcripció copiada',
      more: 'Més accions d’aquest xat',
      exportChats: 'Exporta els xats',
      markUnread: 'Marca com a no llegit',
      deleteChat: 'Suprimeix el xat',
    },
    message: { copy: 'Copia el missatge', readAloud: 'Llegeix en veu alta', stopReading: 'Deixa de llegir en veu alta' },
    history: {
      region: 'Historial de xats',
      recent: 'Recents',
      empty: 'Els xats que comencis apareixeran aquí.',
      rename: 'Canvia el nom',
      renameField: 'Canvia el nom del xat',
      markUnread: 'Marca com a no llegit',
      unread: 'No llegit',
      exportCount: (n) =>
        n === 0 ? 'No hi ha xats per exportar' : plural('ca', n, { one: 'Exporta {n} xat', other: 'Exporta {n} xats' }),
      accountMenu: (name) => `Menú del compte de ${name}`,
      usageLeft: 'Ús restant',
      upgrade: 'Passa a Max',
      logOut: 'Tanca la sessió',
    },
    composer: {
      field: 'Missatge',
      placeholder: 'Pregunta’m el que vulguis',
      attach: 'Afegeix un fitxer adjunt',
      send: 'Envia el missatge',
      stop: 'Atura la generació',
      notConfigured: 'No configurat',
      messageCount: (n) => plural('ca', n, { one: '{n} missatge', other: '{n} missatges' }),
      answeringWith: (model) => `Responent amb ${model}`,
    },
    ago: {
      justNow: 'ara mateix',
      minutes: (n) => plural('ca', n, { one: 'fa {n} minut', other: 'fa {n} minuts' }),
      hours: (n) => plural('ca', n, { one: 'fa {n} hora', other: 'fa {n} hores' }),
      days: (n) => plural('ca', n, { one: 'fa {n} dia', other: 'fa {n} dies' }),
    },
    age: { now: 'ara', minutes: (n) => `${n} min`, hours: (n) => `${n} h`, days: (n) => `${n} d` },
  },
  de: {
    chat: {
      newChat: 'Neuer Chat',
      emptyTitle: 'Wobei kann ich helfen?',
      emptyDescription: 'Dieser Chat läuft mit deinem eigenen API-Schlüssel. Der Verlauf bleibt in diesem Browser.',
      thinking: 'Denkt nach',
      error: 'Etwas ist schiefgelaufen. Prüfe die Serverprotokolle und versuche es dann erneut.',
      suggestions: [
        'Erkläre, was dieses Starterprojekt macht',
        'Schreibe ein Produkt-Update in drei Sätzen',
        'Nenne mir fünf Namen für eine Terminplanungs-App',
      ],
      you: 'Du',
      assistant: 'Assistent',
    },
    actions: {
      share: 'Chat teilen',
      shared: 'Transkript kopiert',
      more: 'Weitere Aktionen für diesen Chat',
      exportChats: 'Chats exportieren',
      markUnread: 'Als ungelesen markieren',
      deleteChat: 'Chat löschen',
    },
    message: { copy: 'Nachricht kopieren', readAloud: 'Vorlesen', stopReading: 'Vorlesen beenden' },
    history: {
      region: 'Chatverlauf',
      recent: 'Zuletzt',
      empty: 'Chats, die du beginnst, erscheinen hier.',
      rename: 'Umbenennen',
      renameField: 'Chat umbenennen',
      markUnread: 'Als ungelesen markieren',
      unread: 'Ungelesen',
      exportCount: (n) =>
        n === 0
          ? 'Keine Chats zum Exportieren'
          : plural('de', n, { one: '{n} Chat exportieren', other: '{n} Chats exportieren' }),
      accountMenu: (name) => `Kontomenü von ${name}`,
      usageLeft: 'Verbleibende Nutzung',
      upgrade: 'Auf Max upgraden',
      logOut: 'Abmelden',
    },
    composer: {
      field: 'Nachricht',
      placeholder: 'Frag mich etwas',
      attach: 'Anhang hinzufügen',
      send: 'Nachricht senden',
      stop: 'Generierung stoppen',
      notConfigured: 'Nicht konfiguriert',
      messageCount: (n) => plural('de', n, { one: '{n} Nachricht', other: '{n} Nachrichten' }),
      answeringWith: (model) => `Antwortet mit ${model}`,
    },
    ago: {
      justNow: 'gerade eben',
      minutes: (n) => plural('de', n, { one: 'vor {n} Minute', other: 'vor {n} Minuten' }),
      hours: (n) => plural('de', n, { one: 'vor {n} Stunde', other: 'vor {n} Stunden' }),
      days: (n) => plural('de', n, { one: 'vor {n} Tag', other: 'vor {n} Tagen' }),
    },
    age: { now: 'jetzt', minutes: (n) => `${n} Min.`, hours: (n) => `${n} Std.`, days: (n) => `${n} T.` },
  },
  fr: {
    chat: {
      newChat: 'Nouvelle discussion',
      emptyTitle: 'Comment puis-je vous aider ?',
      emptyDescription: 'Cette discussion utilise votre propre clé API. L’historique reste dans ce navigateur.',
      thinking: 'Réflexion en cours',
      error: 'Une erreur s’est produite. Consultez les journaux du serveur, puis réessayez.',
      suggestions: [
        'Explique ce que fait ce projet de démarrage',
        'Rédige une mise à jour produit en trois phrases',
        'Propose-moi cinq noms pour une application de prise de rendez-vous',
      ],
      you: 'Vous',
      assistant: 'Assistant',
    },
    actions: {
      share: 'Partager la discussion',
      shared: 'Transcription copiée',
      more: 'Plus d’actions pour cette discussion',
      exportChats: 'Exporter les discussions',
      markUnread: 'Marquer comme non lu',
      deleteChat: 'Supprimer la discussion',
    },
    message: { copy: 'Copier le message', readAloud: 'Lire à voix haute', stopReading: 'Arrêter la lecture à voix haute' },
    history: {
      region: 'Historique des discussions',
      recent: 'Récentes',
      empty: 'Les discussions que vous lancez apparaissent ici.',
      rename: 'Renommer',
      renameField: 'Renommer la discussion',
      markUnread: 'Marquer comme non lu',
      unread: 'Non lu',
      exportCount: (n) =>
        n === 0
          ? 'Aucune discussion à exporter'
          : plural('fr', n, { one: 'Exporter {n} discussion', other: 'Exporter {n} discussions' }),
      accountMenu: (name) => `Menu du compte de ${name}`,
      usageLeft: 'Utilisation restante',
      upgrade: 'Passer à Max',
      logOut: 'Se déconnecter',
    },
    composer: {
      field: 'Message',
      placeholder: 'Posez-moi une question',
      attach: 'Ajouter une pièce jointe',
      send: 'Envoyer le message',
      stop: 'Arrêter la génération',
      notConfigured: 'Non configuré',
      messageCount: (n) => plural('fr', n, { one: '{n} message', other: '{n} messages' }),
      answeringWith: (model) => `Réponse avec ${model}`,
    },
    ago: {
      justNow: 'à l’instant',
      minutes: (n) => plural('fr', n, { one: 'il y a {n} minute', other: 'il y a {n} minutes' }),
      hours: (n) => plural('fr', n, { one: 'il y a {n} heure', other: 'il y a {n} heures' }),
      days: (n) => plural('fr', n, { one: 'il y a {n} jour', other: 'il y a {n} jours' }),
    },
    age: { now: 'à l’instant', minutes: (n) => `${n} min`, hours: (n) => `${n} h`, days: (n) => `${n} j` },
  },
  it: {
    chat: {
      newChat: 'Nuova chat',
      emptyTitle: 'Come posso aiutarti?',
      emptyDescription: 'Questa chat usa la tua chiave API. La cronologia resta in questo browser.',
      thinking: 'Sto pensando',
      error: 'Si è verificato un errore. Controlla i log del server, poi riprova.',
      suggestions: [
        'Spiega cosa fa questo progetto di partenza',
        'Scrivi un aggiornamento di prodotto in tre frasi',
        'Dammi cinque nomi per un’app di prenotazione appuntamenti',
      ],
      you: 'Tu',
      assistant: 'Assistente',
    },
    actions: {
      share: 'Condividi chat',
      shared: 'Trascrizione copiata',
      more: 'Altre azioni per questa chat',
      exportChats: 'Esporta chat',
      markUnread: 'Segna come non letta',
      deleteChat: 'Elimina chat',
    },
    message: { copy: 'Copia messaggio', readAloud: 'Leggi ad alta voce', stopReading: 'Interrompi la lettura' },
    history: {
      region: 'Cronologia chat',
      recent: 'Recenti',
      empty: 'Le chat che inizi appaiono qui.',
      rename: 'Rinomina',
      renameField: 'Rinomina chat',
      markUnread: 'Segna come non letta',
      unread: 'Non letta',
      exportCount: (n) =>
        n === 0 ? 'Nessuna chat da esportare' : plural('it', n, { one: 'Esporta {n} chat', other: 'Esporta {n} chat' }),
      accountMenu: (name) => `Menu account di ${name}`,
      usageLeft: 'Utilizzo rimanente',
      upgrade: 'Passa a Max',
      logOut: 'Esci',
    },
    composer: {
      field: 'Messaggio',
      placeholder: 'Chiedimi qualsiasi cosa',
      attach: 'Aggiungi allegato',
      send: 'Invia messaggio',
      stop: 'Interrompi generazione',
      notConfigured: 'Non configurato',
      messageCount: (n) => plural('it', n, { one: '{n} messaggio', other: '{n} messaggi' }),
      answeringWith: (model) => `Risposta con ${model}`,
    },
    ago: {
      justNow: 'proprio ora',
      minutes: (n) => plural('it', n, { one: '{n} minuto fa', other: '{n} minuti fa' }),
      hours: (n) => plural('it', n, { one: '{n} ora fa', other: '{n} ore fa' }),
      days: (n) => plural('it', n, { one: '{n} giorno fa', other: '{n} giorni fa' }),
    },
    age: { now: 'ora', minutes: (n) => `${n} min`, hours: (n) => `${n} h`, days: (n) => `${n} g` },
  },
  pt: {
    chat: {
      newChat: 'Nova conversa',
      emptyTitle: 'Como posso ajudar?',
      emptyDescription: 'Esta conversa usa sua própria chave de API. O histórico fica neste navegador.',
      thinking: 'Pensando',
      error: 'Algo deu errado. Verifique os logs do servidor e tente novamente.',
      suggestions: [
        'Explique o que este projeto inicial faz',
        'Escreva uma atualização de produto em três frases',
        'Me dê cinco nomes para um app de agendamento',
      ],
      you: 'Você',
      assistant: 'Assistente',
    },
    actions: {
      share: 'Compartilhar conversa',
      shared: 'Transcrição copiada',
      more: 'Mais ações desta conversa',
      exportChats: 'Exportar conversas',
      markUnread: 'Marcar como não lida',
      deleteChat: 'Excluir conversa',
    },
    message: { copy: 'Copiar mensagem', readAloud: 'Ler em voz alta', stopReading: 'Parar leitura em voz alta' },
    history: {
      region: 'Histórico de conversas',
      recent: 'Recentes',
      empty: 'As conversas que você iniciar aparecem aqui.',
      rename: 'Renomear',
      renameField: 'Renomear conversa',
      markUnread: 'Marcar como não lida',
      unread: 'Não lida',
      exportCount: (n) =>
        n === 0
          ? 'Nenhuma conversa para exportar'
          : plural('pt', n, { one: 'Exportar {n} conversa', other: 'Exportar {n} conversas' }),
      accountMenu: (name) => `Menu da conta de ${name}`,
      usageLeft: 'Uso restante',
      upgrade: 'Fazer upgrade para o Max',
      logOut: 'Sair',
    },
    composer: {
      field: 'Mensagem',
      placeholder: 'Pergunte qualquer coisa',
      attach: 'Adicionar anexo',
      send: 'Enviar mensagem',
      stop: 'Parar geração',
      notConfigured: 'Não configurado',
      messageCount: (n) => plural('pt', n, { one: '{n} mensagem', other: '{n} mensagens' }),
      answeringWith: (model) => `Respondendo com ${model}`,
    },
    ago: {
      justNow: 'agora mesmo',
      minutes: (n) => plural('pt', n, { one: 'há {n} minuto', other: 'há {n} minutos' }),
      hours: (n) => plural('pt', n, { one: 'há {n} hora', other: 'há {n} horas' }),
      days: (n) => plural('pt', n, { one: 'há {n} dia', other: 'há {n} dias' }),
    },
    age: { now: 'agora', minutes: (n) => `${n} min`, hours: (n) => `${n} h`, days: (n) => `${n} d` },
  },
  ru: {
    chat: {
      newChat: 'Новый чат',
      emptyTitle: 'Чем могу помочь?',
      emptyDescription: 'Этот чат работает с вашим собственным API-ключом. История хранится в этом браузере.',
      thinking: 'Думаю',
      error: 'Что-то пошло не так. Проверьте журналы сервера и повторите попытку.',
      suggestions: [
        'Объясни, что делает этот стартовый проект',
        'Напиши новость о продукте в трёх предложениях',
        'Предложи пять названий для приложения-планировщика',
      ],
      you: 'Вы',
      assistant: 'Ассистент',
    },
    actions: {
      share: 'Поделиться чатом',
      shared: 'Переписка скопирована',
      more: 'Другие действия с этим чатом',
      exportChats: 'Экспортировать чаты',
      markUnread: 'Отметить как непрочитанный',
      deleteChat: 'Удалить чат',
    },
    message: { copy: 'Копировать сообщение', readAloud: 'Прочитать вслух', stopReading: 'Остановить чтение вслух' },
    history: {
      region: 'История чатов',
      recent: 'Недавние',
      empty: 'Здесь появятся начатые вами чаты.',
      rename: 'Переименовать',
      renameField: 'Переименовать чат',
      markUnread: 'Отметить как непрочитанный',
      unread: 'Непрочитанный',
      exportCount: (n) =>
        n === 0
          ? 'Нет чатов для экспорта'
          : plural('ru', n, {
              one: 'Экспортировать {n} чат',
              few: 'Экспортировать {n} чата',
              many: 'Экспортировать {n} чатов',
              other: 'Экспортировать {n} чата',
            }),
      accountMenu: (name) => `Меню аккаунта ${name}`,
      usageLeft: 'Остаток лимита',
      upgrade: 'Перейти на Max',
      logOut: 'Выйти',
    },
    composer: {
      field: 'Сообщение',
      placeholder: 'Спросите что угодно',
      attach: 'Прикрепить файл',
      send: 'Отправить сообщение',
      stop: 'Остановить генерацию',
      notConfigured: 'Не настроено',
      messageCount: (n) =>
        plural('ru', n, { one: '{n} сообщение', few: '{n} сообщения', many: '{n} сообщений', other: '{n} сообщения' }),
      answeringWith: (model) => `Отвечает ${model}`,
    },
    ago: {
      justNow: 'только что',
      minutes: (n) =>
        plural('ru', n, { one: '{n} минуту назад', few: '{n} минуты назад', many: '{n} минут назад', other: '{n} минуты назад' }),
      hours: (n) =>
        plural('ru', n, { one: '{n} час назад', few: '{n} часа назад', many: '{n} часов назад', other: '{n} часа назад' }),
      days: (n) =>
        plural('ru', n, { one: '{n} день назад', few: '{n} дня назад', many: '{n} дней назад', other: '{n} дня назад' }),
    },
    age: { now: 'сейчас', minutes: (n) => `${n} мин`, hours: (n) => `${n} ч`, days: (n) => `${n} д` },
  },
  tr: {
    chat: {
      newChat: 'Yeni sohbet',
      emptyTitle: 'Nasıl yardımcı olabilirim?',
      emptyDescription: 'Bu sohbet kendi API anahtarınızla çalışır. Geçmiş bu tarayıcıda kalır.',
      thinking: 'Düşünüyor',
      error: 'Bir sorun oluştu. Sunucu günlüklerini kontrol edip tekrar deneyin.',
      suggestions: [
        'Bu başlangıç projesinin ne yaptığını açıkla',
        'Üç cümlelik bir ürün güncellemesi yaz',
        'Bir randevu uygulaması için beş isim öner',
      ],
      you: 'Sen',
      assistant: 'Asistan',
    },
    actions: {
      share: 'Sohbeti paylaş',
      shared: 'Döküm kopyalandı',
      more: 'Bu sohbet için diğer işlemler',
      exportChats: 'Sohbetleri dışa aktar',
      markUnread: 'Okunmadı olarak işaretle',
      deleteChat: 'Sohbeti sil',
    },
    message: { copy: 'Mesajı kopyala', readAloud: 'Sesli oku', stopReading: 'Sesli okumayı durdur' },
    history: {
      region: 'Sohbet geçmişi',
      recent: 'Son sohbetler',
      empty: 'Başlattığınız sohbetler burada görünür.',
      rename: 'Yeniden adlandır',
      renameField: 'Sohbeti yeniden adlandır',
      markUnread: 'Okunmadı olarak işaretle',
      unread: 'Okunmadı',
      exportCount: (n) => (n === 0 ? 'Dışa aktarılacak sohbet yok' : plural('tr', n, { other: '{n} sohbeti dışa aktar' })),
      accountMenu: (name) => `${name} hesap menüsü`,
      usageLeft: 'Kalan kullanım',
      upgrade: 'Max’e yükselt',
      logOut: 'Oturumu kapat',
    },
    composer: {
      field: 'Mesaj',
      placeholder: 'Bana her şeyi sorabilirsin',
      attach: 'Ek ekle',
      send: 'Mesaj gönder',
      stop: 'Üretmeyi durdur',
      notConfigured: 'Yapılandırılmadı',
      messageCount: (n) => plural('tr', n, { other: '{n} mesaj' }),
      answeringWith: (model) => `${model} ile yanıtlanıyor`,
    },
    ago: {
      justNow: 'az önce',
      minutes: (n) => plural('tr', n, { other: '{n} dakika önce' }),
      hours: (n) => plural('tr', n, { other: '{n} saat önce' }),
      days: (n) => plural('tr', n, { other: '{n} gün önce' }),
    },
    age: { now: 'şimdi', minutes: (n) => `${n} dk`, hours: (n) => `${n} sa`, days: (n) => `${n} g` },
  },
  ja: {
    chat: {
      newChat: '新しいチャット',
      emptyTitle: '何をお手伝いしましょうか？',
      emptyDescription: 'このチャットはご自身の API キーで動作します。履歴はこのブラウザに保存されます。',
      thinking: '考え中',
      error: '問題が発生しました。サーバーログを確認してから、もう一度お試しください。',
      suggestions: [
        'このスターターが何をするのか説明して',
        '製品アップデートを3文で書いて',
        'スケジュール管理アプリの名前を5つ考えて',
      ],
      you: 'あなた',
      assistant: 'アシスタント',
    },
    actions: {
      share: 'チャットを共有',
      shared: 'トランスクリプトをコピーしました',
      more: 'このチャットのその他の操作',
      exportChats: 'チャットをエクスポート',
      markUnread: '未読にする',
      deleteChat: 'チャットを削除',
    },
    message: { copy: 'メッセージをコピー', readAloud: '読み上げる', stopReading: '読み上げを停止' },
    history: {
      region: 'チャット履歴',
      recent: '最近',
      empty: '開始したチャットはここに表示されます。',
      rename: '名前を変更',
      renameField: 'チャット名を変更',
      markUnread: '未読にする',
      unread: '未読',
      exportCount: (n) =>
        n === 0 ? 'エクスポートするチャットがありません' : plural('ja', n, { other: '{n}件のチャットをエクスポート' }),
      accountMenu: (name) => `${name}のアカウントメニュー`,
      usageLeft: '残りの利用量',
      upgrade: 'Max にアップグレード',
      logOut: 'ログアウト',
    },
    composer: {
      field: 'メッセージ',
      placeholder: '何でも聞いてください',
      attach: '添付ファイルを追加',
      send: 'メッセージを送信',
      stop: '生成を停止',
      notConfigured: '未設定',
      messageCount: (n) => plural('ja', n, { other: '{n}件のメッセージ' }),
      answeringWith: (model) => `${model} で回答中`,
    },
    ago: {
      justNow: 'たった今',
      minutes: (n) => plural('ja', n, { other: '{n}分前' }),
      hours: (n) => plural('ja', n, { other: '{n}時間前' }),
      days: (n) => plural('ja', n, { other: '{n}日前' }),
    },
    age: { now: '今', minutes: (n) => `${n}分`, hours: (n) => `${n}時間`, days: (n) => `${n}日` },
  },
  zh: {
    chat: {
      newChat: '新对话',
      emptyTitle: '有什么可以帮你的？',
      emptyDescription: '此对话使用你自己的 API 密钥。历史记录保存在此浏览器中。',
      thinking: '思考中',
      error: '出了点问题。请检查服务器日志，然后重试。',
      suggestions: ['解释一下这个入门项目是做什么的', '用三句话写一条产品更新', '给一个日程安排应用起五个名字'],
      you: '你',
      assistant: '助手',
    },
    actions: {
      share: '分享对话',
      shared: '已复制对话记录',
      more: '此对话的更多操作',
      exportChats: '导出对话',
      markUnread: '标记为未读',
      deleteChat: '删除对话',
    },
    message: { copy: '复制消息', readAloud: '朗读', stopReading: '停止朗读' },
    history: {
      region: '对话历史',
      recent: '最近',
      empty: '你发起的对话会显示在这里。',
      rename: '重命名',
      renameField: '重命名对话',
      markUnread: '标记为未读',
      unread: '未读',
      exportCount: (n) => (n === 0 ? '没有可导出的对话' : plural('zh', n, { other: '导出 {n} 个对话' })),
      accountMenu: (name) => `${name}的账户菜单`,
      usageLeft: '剩余用量',
      upgrade: '升级到 Max',
      logOut: '退出登录',
    },
    composer: {
      field: '消息',
      placeholder: '有问题尽管问',
      attach: '添加附件',
      send: '发送消息',
      stop: '停止生成',
      notConfigured: '未配置',
      messageCount: (n) => plural('zh', n, { other: '{n} 条消息' }),
      answeringWith: (model) => `正在使用 ${model} 回答`,
    },
    ago: {
      justNow: '刚刚',
      minutes: (n) => plural('zh', n, { other: '{n} 分钟前' }),
      hours: (n) => plural('zh', n, { other: '{n} 小时前' }),
      days: (n) => plural('zh', n, { other: '{n} 天前' }),
    },
    age: { now: '刚刚', minutes: (n) => `${n}分钟`, hours: (n) => `${n}小时`, days: (n) => `${n}天` },
  },
  ar: {
    chat: {
      newChat: 'محادثة جديدة',
      emptyTitle: 'كيف يمكنني مساعدتك؟',
      emptyDescription: 'تعمل هذه المحادثة بمفتاح API الخاص بك. يبقى السجل في هذا المتصفح.',
      thinking: 'جارٍ التفكير',
      error: 'حدث خطأ ما. تحقق من سجلات الخادم، ثم حاول مرة أخرى.',
      suggestions: [
        'اشرح ما يفعله هذا المشروع المبدئي',
        'اكتب تحديثًا عن المنتج في ثلاث جمل',
        'اقترح خمسة أسماء لتطبيق جدولة مواعيد',
      ],
      you: 'أنت',
      assistant: 'المساعد',
    },
    actions: {
      share: 'مشاركة المحادثة',
      shared: 'تم نسخ نص المحادثة',
      more: 'إجراءات إضافية لهذه المحادثة',
      exportChats: 'تصدير المحادثات',
      markUnread: 'وضع علامة كغير مقروءة',
      deleteChat: 'حذف المحادثة',
    },
    message: { copy: 'نسخ الرسالة', readAloud: 'القراءة بصوت عالٍ', stopReading: 'إيقاف القراءة بصوت عالٍ' },
    history: {
      region: 'سجل المحادثات',
      recent: 'الأخيرة',
      empty: 'تظهر هنا المحادثات التي تبدأها.',
      rename: 'إعادة تسمية',
      renameField: 'إعادة تسمية المحادثة',
      markUnread: 'وضع علامة كغير مقروءة',
      unread: 'غير مقروءة',
      exportCount: (n) =>
        n === 0
          ? 'لا توجد محادثات لتصديرها'
          : plural('ar', n, {
              one: 'تصدير محادثة واحدة',
              two: 'تصدير محادثتين',
              few: 'تصدير {n} محادثات',
              many: 'تصدير {n} محادثة',
              other: 'تصدير {n} محادثة',
            }),
      accountMenu: (name) => `قائمة حساب ${name}`,
      usageLeft: 'الاستخدام المتبقي',
      upgrade: 'الترقية إلى Max',
      logOut: 'تسجيل الخروج',
    },
    composer: {
      field: 'الرسالة',
      placeholder: 'اسألني أي شيء',
      attach: 'إضافة مرفق',
      send: 'إرسال الرسالة',
      stop: 'إيقاف الإنشاء',
      notConfigured: 'غير مُعد',
      messageCount: (n) =>
        plural('ar', n, {
          zero: 'لا توجد رسائل',
          one: 'رسالة واحدة',
          two: 'رسالتان',
          few: '{n} رسائل',
          many: '{n} رسالة',
          other: '{n} رسالة',
        }),
      answeringWith: (model) => `الإجابة باستخدام ${model}`,
    },
    ago: {
      justNow: 'الآن',
      minutes: (n) =>
        plural('ar', n, { one: 'منذ دقيقة', two: 'منذ دقيقتين', few: 'منذ {n} دقائق', many: 'منذ {n} دقيقة', other: 'منذ {n} دقيقة' }),
      hours: (n) =>
        plural('ar', n, { one: 'منذ ساعة', two: 'منذ ساعتين', few: 'منذ {n} ساعات', many: 'منذ {n} ساعة', other: 'منذ {n} ساعة' }),
      days: (n) =>
        plural('ar', n, { one: 'منذ يوم', two: 'منذ يومين', few: 'منذ {n} أيام', many: 'منذ {n} يومًا', other: 'منذ {n} يوم' }),
    },
    age: { now: 'الآن', minutes: (n) => `${n} د`, hours: (n) => `${n} س`, days: (n) => `${n} ي` },
  },
  hi: {
    chat: {
      newChat: 'नई चैट',
      emptyTitle: 'मैं किसमें मदद कर सकता हूं?',
      emptyDescription: 'यह चैट आपकी अपनी API कुंजी से चलती है। इतिहास इसी ब्राउज़र में रहता है।',
      thinking: 'सोच रहा है',
      error: 'कुछ गलत हो गया। सर्वर लॉग देखें, फिर दोबारा कोशिश करें।',
      suggestions: [
        'बताओ कि यह स्टार्टर प्रोजेक्ट क्या करता है',
        'तीन वाक्यों में एक प्रोडक्ट अपडेट लिखो',
        'शेड्यूलिंग ऐप के लिए पांच नाम सुझाओ',
      ],
      you: 'आप',
      assistant: 'असिस्टेंट',
    },
    actions: {
      share: 'चैट शेयर करें',
      shared: 'ट्रांसक्रिप्ट कॉपी हो गया',
      more: 'इस चैट के लिए और कार्रवाइयां',
      exportChats: 'चैट एक्सपोर्ट करें',
      markUnread: 'अपठित के रूप में चिह्नित करें',
      deleteChat: 'चैट हटाएं',
    },
    message: { copy: 'मैसेज कॉपी करें', readAloud: 'पढ़कर सुनाएं', stopReading: 'पढ़कर सुनाना बंद करें' },
    history: {
      region: 'चैट इतिहास',
      recent: 'हाल की',
      empty: 'आप जो चैट शुरू करेंगे, वे यहां दिखेंगी।',
      rename: 'नाम बदलें',
      renameField: 'चैट का नाम बदलें',
      markUnread: 'अपठित के रूप में चिह्नित करें',
      unread: 'अपठित',
      exportCount: (n) =>
        n === 0 ? 'एक्सपोर्ट करने के लिए कोई चैट नहीं' : plural('hi', n, { other: '{n} चैट एक्सपोर्ट करें' }),
      accountMenu: (name) => `${name} का खाता मेनू`,
      usageLeft: 'बचा हुआ उपयोग',
      upgrade: 'Max में अपग्रेड करें',
      logOut: 'लॉग आउट करें',
    },
    composer: {
      field: 'मैसेज',
      placeholder: 'मुझसे कुछ भी पूछें',
      attach: 'अटैचमेंट जोड़ें',
      send: 'मैसेज भेजें',
      stop: 'जनरेट करना रोकें',
      notConfigured: 'कॉन्फ़िगर नहीं है',
      messageCount: (n) => plural('hi', n, { other: '{n} मैसेज' }),
      answeringWith: (model) => `${model} से जवाब दिया जा रहा है`,
    },
    ago: {
      justNow: 'अभी-अभी',
      minutes: (n) => plural('hi', n, { other: '{n} मिनट पहले' }),
      hours: (n) => plural('hi', n, { one: '{n} घंटा पहले', other: '{n} घंटे पहले' }),
      days: (n) => plural('hi', n, { other: '{n} दिन पहले' }),
    },
    age: { now: 'अभी', minutes: (n) => `${n} मि॰`, hours: (n) => `${n} घं॰`, days: (n) => `${n} दि॰` },
  },
  bn: {
    chat: {
      newChat: 'নতুন চ্যাট',
      emptyTitle: 'আমি কীভাবে সাহায্য করতে পারি?',
      emptyDescription: 'এই চ্যাটটি আপনার নিজের API কী দিয়ে চলে। ইতিহাস এই ব্রাউজারেই থাকে।',
      thinking: 'ভাবছে',
      error: 'কিছু একটা ভুল হয়েছে। সার্ভারের লগ দেখে আবার চেষ্টা করুন।',
      suggestions: [
        'এই স্টার্টার প্রজেক্টটি কী করে তা ব্যাখ্যা করো',
        'তিন বাক্যে একটি প্রোডাক্ট আপডেট লেখো',
        'একটি শিডিউলিং অ্যাপের জন্য পাঁচটি নাম দাও',
      ],
      you: 'আপনি',
      assistant: 'সহকারী',
    },
    actions: {
      share: 'চ্যাট শেয়ার করুন',
      shared: 'ট্রান্সক্রিপ্ট কপি হয়েছে',
      more: 'এই চ্যাটের জন্য আরও কাজ',
      exportChats: 'চ্যাট এক্সপোর্ট করুন',
      markUnread: 'অপঠিত হিসেবে চিহ্নিত করুন',
      deleteChat: 'চ্যাট মুছুন',
    },
    message: { copy: 'মেসেজ কপি করুন', readAloud: 'জোরে পড়ুন', stopReading: 'জোরে পড়া বন্ধ করুন' },
    history: {
      region: 'চ্যাটের ইতিহাস',
      recent: 'সাম্প্রতিক',
      empty: 'আপনার শুরু করা চ্যাটগুলো এখানে দেখাবে।',
      rename: 'নাম বদলান',
      renameField: 'চ্যাটের নাম বদলান',
      markUnread: 'অপঠিত হিসেবে চিহ্নিত করুন',
      unread: 'অপঠিত',
      exportCount: (n) =>
        n === 0 ? 'এক্সপোর্ট করার মতো কোনো চ্যাট নেই' : plural('bn', n, { other: '{n}টি চ্যাট এক্সপোর্ট করুন' }),
      accountMenu: (name) => `${name}-এর অ্যাকাউন্ট মেনু`,
      usageLeft: 'বাকি ব্যবহার',
      upgrade: 'Max-এ আপগ্রেড করুন',
      logOut: 'লগ আউট করুন',
    },
    composer: {
      field: 'মেসেজ',
      placeholder: 'আমাকে যেকোনো কিছু জিজ্ঞাসা করুন',
      attach: 'অ্যাটাচমেন্ট যোগ করুন',
      send: 'মেসেজ পাঠান',
      stop: 'তৈরি করা থামান',
      notConfigured: 'কনফিগার করা হয়নি',
      messageCount: (n) => plural('bn', n, { other: '{n}টি মেসেজ' }),
      answeringWith: (model) => `${model} দিয়ে উত্তর দেওয়া হচ্ছে`,
    },
    ago: {
      justNow: 'এইমাত্র',
      minutes: (n) => plural('bn', n, { other: '{n} মিনিট আগে' }),
      hours: (n) => plural('bn', n, { other: '{n} ঘণ্টা আগে' }),
      days: (n) => plural('bn', n, { other: '{n} দিন আগে' }),
    },
    age: { now: 'এখন', minutes: (n) => `${n} মি`, hours: (n) => `${n} ঘ`, days: (n) => `${n} দি` },
  },
  id: {
    chat: {
      newChat: 'Obrolan baru',
      emptyTitle: 'Ada yang bisa saya bantu?',
      emptyDescription: 'Obrolan ini berjalan dengan kunci API Anda sendiri. Riwayat tetap tersimpan di browser ini.',
      thinking: 'Berpikir',
      error: 'Terjadi kesalahan. Periksa log server, lalu coba lagi.',
      suggestions: [
        'Jelaskan apa yang dilakukan proyek awal ini',
        'Tulis pembaruan produk dalam tiga kalimat',
        'Beri saya lima nama untuk aplikasi penjadwalan',
      ],
      you: 'Anda',
      assistant: 'Asisten',
    },
    actions: {
      share: 'Bagikan obrolan',
      shared: 'Transkrip disalin',
      more: 'Tindakan lainnya untuk obrolan ini',
      exportChats: 'Ekspor obrolan',
      markUnread: 'Tandai belum dibaca',
      deleteChat: 'Hapus obrolan',
    },
    message: { copy: 'Salin pesan', readAloud: 'Bacakan', stopReading: 'Berhenti membacakan' },
    history: {
      region: 'Riwayat obrolan',
      recent: 'Terbaru',
      empty: 'Obrolan yang Anda mulai akan muncul di sini.',
      rename: 'Ganti nama',
      renameField: 'Ganti nama obrolan',
      markUnread: 'Tandai belum dibaca',
      unread: 'Belum dibaca',
      exportCount: (n) => (n === 0 ? 'Tidak ada obrolan untuk diekspor' : plural('id', n, { other: 'Ekspor {n} obrolan' })),
      accountMenu: (name) => `Menu akun ${name}`,
      usageLeft: 'Sisa penggunaan',
      upgrade: 'Tingkatkan ke Max',
      logOut: 'Keluar',
    },
    composer: {
      field: 'Pesan',
      placeholder: 'Tanyakan apa saja',
      attach: 'Tambahkan lampiran',
      send: 'Kirim pesan',
      stop: 'Hentikan pembuatan',
      notConfigured: 'Belum dikonfigurasi',
      messageCount: (n) => plural('id', n, { other: '{n} pesan' }),
      answeringWith: (model) => `Menjawab dengan ${model}`,
    },
    ago: {
      justNow: 'baru saja',
      minutes: (n) => plural('id', n, { other: '{n} menit lalu' }),
      hours: (n) => plural('id', n, { other: '{n} jam lalu' }),
      days: (n) => plural('id', n, { other: '{n} hari lalu' }),
    },
    age: { now: 'sekarang', minutes: (n) => `${n} mnt`, hours: (n) => `${n} j`, days: (n) => `${n} h` },
  },
};
