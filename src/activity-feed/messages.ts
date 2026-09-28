import type { MessageCatalog } from '../locale/messages';
import type { ActivityFeedKind } from './types';

/**
 * Every fixed string the activity feed and its filter row draw or announce, in
 * each Bloom language. A caller's `labels`, `emptyLabel`, `formatLoggedBy` and
 * `accessibilityLabel` still win.
 */
export interface ActivityFeedMessages {
  /** Each kind's word: the entry's meta line and the filter chip. */
  kinds: Record<ActivityFeedKind, string>;
  /** What an empty feed says. */
  empty: string;
  /** The trail under an entry. */
  loggedBy: (name: string) => string;
  /** Names the filter row. */
  filterActivity: string;
}

export const ACTIVITY_FEED_MESSAGES: MessageCatalog<ActivityFeedMessages> = {
  en: {
    kinds: { call: 'Call', email: 'Email', meeting: 'Meeting', note: 'Note', 'stage-change': 'Stage change', task: 'Task completed' },
    empty: 'Nothing logged yet',
    loggedBy: (name) => `Logged by ${name}`,
    filterActivity: 'Filter activity',
  },
  es: {
    kinds: { call: 'Llamada', email: 'Correo', meeting: 'Reunión', note: 'Nota', 'stage-change': 'Cambio de etapa', task: 'Tarea completada' },
    empty: 'Aún no hay actividad registrada',
    loggedBy: (name) => `Registrado por ${name}`,
    filterActivity: 'Filtrar actividad',
  },
  ca: {
    kinds: { call: 'Trucada', email: 'Correu', meeting: 'Reunió', note: 'Nota', 'stage-change': "Canvi d'etapa", task: 'Tasca completada' },
    empty: 'Encara no hi ha activitat registrada',
    loggedBy: (name) => `Registrat per ${name}`,
    filterActivity: "Filtra l'activitat",
  },
  de: {
    kinds: { call: 'Anruf', email: 'E-Mail', meeting: 'Meeting', note: 'Notiz', 'stage-change': 'Phasenwechsel', task: 'Aufgabe erledigt' },
    empty: 'Noch keine Aktivitäten erfasst',
    loggedBy: (name) => `Erfasst von ${name}`,
    filterActivity: 'Aktivitäten filtern',
  },
  fr: {
    kinds: { call: 'Appel', email: 'E-mail', meeting: 'Réunion', note: 'Note', 'stage-change': "Changement d'étape", task: 'Tâche terminée' },
    empty: 'Aucune activité enregistrée',
    loggedBy: (name) => `Enregistré par ${name}`,
    filterActivity: "Filtrer l'activité",
  },
  it: {
    kinds: { call: 'Chiamata', email: 'Email', meeting: 'Riunione', note: 'Nota', 'stage-change': 'Cambio di fase', task: 'Attività completata' },
    empty: 'Nessuna attività registrata',
    loggedBy: (name) => `Registrato da ${name}`,
    filterActivity: 'Filtra attività',
  },
  pt: {
    kinds: { call: 'Chamada', email: 'E-mail', meeting: 'Reunião', note: 'Nota', 'stage-change': 'Mudança de etapa', task: 'Tarefa concluída' },
    empty: 'Nenhuma atividade registrada',
    loggedBy: (name) => `Registrado por ${name}`,
    filterActivity: 'Filtrar atividade',
  },
  ru: {
    kinds: { call: 'Звонок', email: 'Письмо', meeting: 'Встреча', note: 'Заметка', 'stage-change': 'Смена этапа', task: 'Задача выполнена' },
    empty: 'Пока ничего не записано',
    loggedBy: (name) => `Записал(а): ${name}`,
    filterActivity: 'Фильтр активности',
  },
  tr: {
    kinds: { call: 'Arama', email: 'E-posta', meeting: 'Toplantı', note: 'Not', 'stage-change': 'Aşama değişikliği', task: 'Görev tamamlandı' },
    empty: 'Henüz kayıtlı etkinlik yok',
    loggedBy: (name) => `Kaydeden: ${name}`,
    filterActivity: 'Etkinliği filtrele',
  },
  ja: {
    kinds: { call: '通話', email: 'メール', meeting: 'ミーティング', note: 'メモ', 'stage-change': 'ステージ変更', task: 'タスク完了' },
    empty: 'まだ記録はありません',
    loggedBy: (name) => `記録者: ${name}`,
    filterActivity: 'アクティビティを絞り込む',
  },
  zh: {
    kinds: { call: '通话', email: '邮件', meeting: '会议', note: '备注', 'stage-change': '阶段变更', task: '任务已完成' },
    empty: '暂无记录',
    loggedBy: (name) => `记录人：${name}`,
    filterActivity: '筛选动态',
  },
  ar: {
    kinds: { call: 'مكالمة', email: 'بريد إلكتروني', meeting: 'اجتماع', note: 'ملاحظة', 'stage-change': 'تغيير المرحلة', task: 'مهمة مكتملة' },
    empty: 'لم يُسجَّل أي نشاط بعد',
    loggedBy: (name) => `سجّله ${name}`,
    filterActivity: 'تصفية النشاط',
  },
  hi: {
    kinds: { call: 'कॉल', email: 'ईमेल', meeting: 'मीटिंग', note: 'नोट', 'stage-change': 'चरण बदला', task: 'कार्य पूरा' },
    empty: 'अभी तक कुछ दर्ज नहीं हुआ',
    loggedBy: (name) => `${name} द्वारा दर्ज`,
    filterActivity: 'गतिविधि फ़िल्टर करें',
  },
  bn: {
    kinds: { call: 'কল', email: 'ইমেল', meeting: 'মিটিং', note: 'নোট', 'stage-change': 'পর্যায় পরিবর্তন', task: 'কাজ সম্পন্ন' },
    empty: 'এখনও কিছু লগ করা হয়নি',
    loggedBy: (name) => `${name} লগ করেছেন`,
    filterActivity: 'কার্যকলাপ ফিল্টার করুন',
  },
  id: {
    kinds: { call: 'Panggilan', email: 'Email', meeting: 'Rapat', note: 'Catatan', 'stage-change': 'Perubahan tahap', task: 'Tugas selesai' },
    empty: 'Belum ada aktivitas tercatat',
    loggedBy: (name) => `Dicatat oleh ${name}`,
    filterActivity: 'Filter aktivitas',
  },
};
