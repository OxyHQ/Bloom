import type { MessageCatalog } from '../locale/messages';
import type { EvictionStatus } from './types';

/**
 * Every fixed string the eviction family draws or announces, in each Bloom
 * language. A caller's `*Label` props and `formatSource` still win.
 */
export interface EvictionMessages {
  /** The status badge's word. */
  status: Record<EvictionStatus, string>;
  /** The attendance toggle ("I'll be there"). */
  attend: string;
  share: string;
  contactSupport: string;
  verified: string;
  /** Names `EvictionTimeline`'s list. */
  caseHistory: string;
  /** A history entry's source, beside its date. */
  source: (source: string) => string;
}

export const EVICTION_MESSAGES: MessageCatalog<EvictionMessages> = {
  en: {
    status: {
      scheduled: 'Scheduled',
      postponed: 'Postponed',
      suspended: 'Suspended',
      executed: 'Executed',
      cancelled: 'Cancelled',
    },
    attend: "I'll be there",
    share: 'Share',
    contactSupport: 'Contact support group',
    verified: 'Community verified',
    caseHistory: 'Case history',
    source: (source) => `Source: ${source}`,
  },
  es: {
    status: {
      scheduled: 'Programado',
      postponed: 'Aplazado',
      suspended: 'Suspendido',
      executed: 'Ejecutado',
      cancelled: 'Cancelado',
    },
    attend: 'Estaré allí',
    share: 'Compartir',
    contactSupport: 'Contactar con el grupo de apoyo',
    verified: 'Verificado por la comunidad',
    caseHistory: 'Historial del caso',
    source: (source) => `Fuente: ${source}`,
  },
  ca: {
    status: {
      scheduled: 'Programat',
      postponed: 'Ajornat',
      suspended: 'Suspès',
      executed: 'Executat',
      cancelled: 'Cancel·lat',
    },
    attend: 'Hi seré',
    share: 'Comparteix',
    contactSupport: 'Contacta amb el grup de suport',
    verified: 'Verificat per la comunitat',
    caseHistory: 'Historial del cas',
    source: (source) => `Font: ${source}`,
  },
  de: {
    status: {
      scheduled: 'Angesetzt',
      postponed: 'Verschoben',
      suspended: 'Ausgesetzt',
      executed: 'Vollstreckt',
      cancelled: 'Abgesagt',
    },
    attend: 'Ich bin dabei',
    share: 'Teilen',
    contactSupport: 'Unterstützungsgruppe kontaktieren',
    verified: 'Von der Community bestätigt',
    caseHistory: 'Fallverlauf',
    source: (source) => `Quelle: ${source}`,
  },
  fr: {
    status: {
      scheduled: 'Programmée',
      postponed: 'Reportée',
      suspended: 'Suspendue',
      executed: 'Exécutée',
      cancelled: 'Annulée',
    },
    attend: 'Je serai là',
    share: 'Partager',
    contactSupport: 'Contacter le groupe de soutien',
    verified: 'Vérifié par la communauté',
    caseHistory: 'Historique du dossier',
    source: (source) => `Source : ${source}`,
  },
  it: {
    status: {
      scheduled: 'Programmato',
      postponed: 'Rinviato',
      suspended: 'Sospeso',
      executed: 'Eseguito',
      cancelled: 'Annullato',
    },
    attend: 'Ci sarò',
    share: 'Condividi',
    contactSupport: 'Contatta il gruppo di sostegno',
    verified: 'Verificato dalla comunità',
    caseHistory: 'Cronologia del caso',
    source: (source) => `Fonte: ${source}`,
  },
  pt: {
    status: {
      scheduled: 'Agendado',
      postponed: 'Adiado',
      suspended: 'Suspenso',
      executed: 'Executado',
      cancelled: 'Cancelado',
    },
    attend: 'Vou estar lá',
    share: 'Partilhar',
    contactSupport: 'Contactar o grupo de apoio',
    verified: 'Verificado pela comunidade',
    caseHistory: 'Histórico do caso',
    source: (source) => `Fonte: ${source}`,
  },
  ru: {
    status: {
      scheduled: 'Назначено',
      postponed: 'Перенесено',
      suspended: 'Приостановлено',
      executed: 'Исполнено',
      cancelled: 'Отменено',
    },
    attend: 'Я приду',
    share: 'Поделиться',
    contactSupport: 'Связаться с группой поддержки',
    verified: 'Подтверждено сообществом',
    caseHistory: 'История дела',
    source: (source) => `Источник: ${source}`,
  },
  tr: {
    status: {
      scheduled: 'Planlandı',
      postponed: 'Ertelendi',
      suspended: 'Durduruldu',
      executed: 'Uygulandı',
      cancelled: 'İptal edildi',
    },
    attend: 'Orada olacağım',
    share: 'Paylaş',
    contactSupport: 'Destek grubuyla iletişime geç',
    verified: 'Topluluk tarafından doğrulandı',
    caseHistory: 'Dava geçmişi',
    source: (source) => `Kaynak: ${source}`,
  },
  ja: {
    status: {
      scheduled: '予定',
      postponed: '延期',
      suspended: '停止',
      executed: '執行済み',
      cancelled: '中止',
    },
    attend: '参加します',
    share: '共有',
    contactSupport: '支援グループに連絡',
    verified: 'コミュニティ確認済み',
    caseHistory: '事案の経緯',
    source: (source) => `出典: ${source}`,
  },
  zh: {
    status: {
      scheduled: '已排期',
      postponed: '已推迟',
      suspended: '已暂停',
      executed: '已执行',
      cancelled: '已取消',
    },
    attend: '我会到场',
    share: '分享',
    contactSupport: '联系支援团体',
    verified: '社区已核实',
    caseHistory: '案件记录',
    source: (source) => `来源：${source}`,
  },
  ar: {
    status: {
      scheduled: 'مُجدوَل',
      postponed: 'مؤجَّل',
      suspended: 'معلَّق',
      executed: 'مُنفَّذ',
      cancelled: 'ملغى',
    },
    attend: 'سأكون هناك',
    share: 'مشاركة',
    contactSupport: 'التواصل مع مجموعة الدعم',
    verified: 'تحقّق منه المجتمع',
    caseHistory: 'سجل القضية',
    source: (source) => `المصدر: ${source}`,
  },
  hi: {
    status: {
      scheduled: 'निर्धारित',
      postponed: 'स्थगित',
      suspended: 'निलंबित',
      executed: 'लागू किया गया',
      cancelled: 'रद्द',
    },
    attend: 'मैं वहाँ रहूँगा',
    share: 'शेयर करें',
    contactSupport: 'सहायता समूह से संपर्क करें',
    verified: 'समुदाय द्वारा सत्यापित',
    caseHistory: 'मामले का इतिहास',
    source: (source) => `स्रोत: ${source}`,
  },
  bn: {
    status: {
      scheduled: 'নির্ধারিত',
      postponed: 'স্থগিত',
      suspended: 'মুলতবি',
      executed: 'কার্যকর হয়েছে',
      cancelled: 'বাতিল',
    },
    attend: 'আমি থাকব',
    share: 'শেয়ার করুন',
    contactSupport: 'সহায়তা গোষ্ঠীর সঙ্গে যোগাযোগ করুন',
    verified: 'কমিউনিটি যাচাইকৃত',
    caseHistory: 'মামলার ইতিহাস',
    source: (source) => `সূত্র: ${source}`,
  },
  id: {
    status: {
      scheduled: 'Dijadwalkan',
      postponed: 'Ditunda',
      suspended: 'Ditangguhkan',
      executed: 'Dilaksanakan',
      cancelled: 'Dibatalkan',
    },
    attend: 'Saya akan hadir',
    share: 'Bagikan',
    contactSupport: 'Hubungi kelompok pendukung',
    verified: 'Diverifikasi komunitas',
    caseHistory: 'Riwayat kasus',
    source: (source) => `Sumber: ${source}`,
  },
};
