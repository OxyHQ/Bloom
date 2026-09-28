import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `AgentLimitsCard` draws or announces, in each Bloom
 * language. A caller's `labels` prop still wins over any entry here.
 */
export interface AgentLimitsCardMessages {
  contextWindow: string;
  freeSpace: string;
  planUsageLimits: string;
  managePlan: string;
}

export const AGENT_LIMITS_CARD_MESSAGES: MessageCatalog<AgentLimitsCardMessages> = {
  en: { contextWindow: 'Context window', freeSpace: 'Free space', planUsageLimits: 'Plan usage limits', managePlan: 'Manage plan' },
  es: { contextWindow: 'Ventana de contexto', freeSpace: 'Espacio libre', planUsageLimits: 'Límites de uso del plan', managePlan: 'Gestionar plan' },
  ca: { contextWindow: 'Finestra de context', freeSpace: 'Espai lliure', planUsageLimits: 'Límits d’ús del pla', managePlan: 'Gestiona el pla' },
  de: { contextWindow: 'Kontextfenster', freeSpace: 'Freier Platz', planUsageLimits: 'Nutzungslimits des Tarifs', managePlan: 'Tarif verwalten' },
  fr: { contextWindow: 'Fenêtre de contexte', freeSpace: 'Espace libre', planUsageLimits: 'Limites d’utilisation de l’abonnement', managePlan: 'Gérer l’abonnement' },
  it: { contextWindow: 'Finestra di contesto', freeSpace: 'Spazio libero', planUsageLimits: 'Limiti di utilizzo del piano', managePlan: 'Gestisci piano' },
  pt: { contextWindow: 'Janela de contexto', freeSpace: 'Espaço livre', planUsageLimits: 'Limites de uso do plano', managePlan: 'Gerenciar plano' },
  ru: { contextWindow: 'Контекстное окно', freeSpace: 'Свободно', planUsageLimits: 'Лимиты тарифа', managePlan: 'Управление тарифом' },
  tr: { contextWindow: 'Bağlam penceresi', freeSpace: 'Boş alan', planUsageLimits: 'Plan kullanım sınırları', managePlan: 'Planı yönet' },
  ja: { contextWindow: 'コンテキストウィンドウ', freeSpace: '空き容量', planUsageLimits: 'プランの利用上限', managePlan: 'プランを管理' },
  zh: { contextWindow: '上下文窗口', freeSpace: '可用空间', planUsageLimits: '套餐用量限制', managePlan: '管理套餐' },
  ar: { contextWindow: 'نافذة السياق', freeSpace: 'المساحة الفارغة', planUsageLimits: 'حدود استخدام الخطة', managePlan: 'إدارة الخطة' },
  hi: { contextWindow: 'कॉन्टेक्स्ट विंडो', freeSpace: 'खाली जगह', planUsageLimits: 'प्लान की उपयोग सीमाएं', managePlan: 'प्लान प्रबंधित करें' },
  bn: { contextWindow: 'কনটেক্সট উইন্ডো', freeSpace: 'খালি জায়গা', planUsageLimits: 'প্ল্যানের ব্যবহারের সীমা', managePlan: 'প্ল্যান পরিচালনা করুন' },
  id: { contextWindow: 'Jendela konteks', freeSpace: 'Ruang kosong', planUsageLimits: 'Batas penggunaan paket', managePlan: 'Kelola paket' },
};
