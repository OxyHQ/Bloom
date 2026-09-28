import type { MessageCatalog } from '../locale/messages';
import type { OrderStatusStepState } from './types';

/**
 * Every fixed string the order-status family announces, in each Bloom
 * language. `done` is the common word (`COMMON_MESSAGES.done`). A caller's
 * `stateLabels` and `accessibilityLabel` still win.
 */
export interface OrderStatusMessages {
  /** What a screen reader says for each state, before the step's own label. */
  states: Record<Exclude<OrderStatusStepState, 'done'>, string>;
  /** Names the timeline as a whole. */
  status: string;
}

export const ORDER_STATUS_MESSAGES: MessageCatalog<OrderStatusMessages> = {
  en: { states: { current: 'In progress', upcoming: 'Not yet', failed: 'Failed' }, status: 'Status' },
  es: { states: { current: 'En curso', upcoming: 'Pendiente', failed: 'Fallido' }, status: 'Estado' },
  ca: { states: { current: 'En curs', upcoming: 'Pendent', failed: 'Fallit' }, status: 'Estat' },
  de: { states: { current: 'In Bearbeitung', upcoming: 'Ausstehend', failed: 'Fehlgeschlagen' }, status: 'Status' },
  fr: { states: { current: 'En cours', upcoming: 'À venir', failed: 'Échec' }, status: 'Statut' },
  it: { states: { current: 'In corso', upcoming: 'Non ancora', failed: 'Non riuscito' }, status: 'Stato' },
  pt: { states: { current: 'Em andamento', upcoming: 'Pendente', failed: 'Falhou' }, status: 'Status' },
  ru: { states: { current: 'В процессе', upcoming: 'Ещё не начато', failed: 'Ошибка' }, status: 'Статус' },
  tr: { states: { current: 'Devam ediyor', upcoming: 'Henüz değil', failed: 'Başarısız' }, status: 'Durum' },
  ja: { states: { current: '進行中', upcoming: '未着手', failed: '失敗' }, status: 'ステータス' },
  zh: { states: { current: '进行中', upcoming: '未开始', failed: '失败' }, status: '状态' },
  ar: { states: { current: 'قيد التنفيذ', upcoming: 'لم يبدأ بعد', failed: 'فشل' }, status: 'الحالة' },
  hi: { states: { current: 'जारी है', upcoming: 'अभी नहीं', failed: 'विफल' }, status: 'स्थिति' },
  bn: { states: { current: 'চলছে', upcoming: 'এখনও নয়', failed: 'ব্যর্থ' }, status: 'অবস্থা' },
  id: { states: { current: 'Sedang berlangsung', upcoming: 'Belum', failed: 'Gagal' }, status: 'Status' },
};
