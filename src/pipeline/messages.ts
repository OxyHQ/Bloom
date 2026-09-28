import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { DealHealth } from './types';

/**
 * Every fixed string the pipeline family draws or announces, in each Bloom
 * language. A caller's `healthLabel`, `moveLabel`, `emptyLabel`,
 * `loadMoreLabel` and `accessibilityLabel` still win.
 */
export interface PipelineMessages {
  /** Each health's word. */
  health: Record<DealHealth, string>;
  /** The stalled signal with its pre-formatted duration: "Stalled for 14 days". */
  stalledFor: (duration: string) => string;
  /** The move action's name: "Move Acme renewal". */
  move: (title: string) => string;
  /** Names the tab row of the `single` layout. */
  stages: string;
  /** A stage tab's name with its count: "Qualified, 3 deals". */
  stageWithCount: (name: string, count: number) => string;
  /** What an empty column says. */
  empty: string;
  loadMore: string;
}

export const PIPELINE_MESSAGES: MessageCatalog<PipelineMessages> = {
  en: {
    health: { 'on-track': 'On track', 'at-risk': 'At risk', stalled: 'Stalled' },
    stalledFor: (duration) => `Stalled for ${duration}`,
    move: (title) => `Move ${title}`,
    stages: 'Pipeline stages',
    stageWithCount: (name, n) => `${name}, ${plural('en', n, { one: '{n} deal', other: '{n} deals' })}`,
    empty: 'No deals in this stage',
    loadMore: 'Load more',
  },
  es: {
    health: { 'on-track': 'En curso', 'at-risk': 'En riesgo', stalled: 'Estancado' },
    stalledFor: (duration) => `Estancado desde hace ${duration}`,
    move: (title) => `Mover ${title}`,
    stages: 'Etapas del embudo',
    stageWithCount: (name, n) => `${name}, ${plural('es', n, { one: '{n} oportunidad', other: '{n} oportunidades' })}`,
    empty: 'No hay oportunidades en esta etapa',
    loadMore: 'Cargar más',
  },
  ca: {
    health: { 'on-track': 'Al dia', 'at-risk': 'En risc', stalled: 'Encallat' },
    stalledFor: (duration) => `Encallat des de fa ${duration}`,
    move: (title) => `Mou ${title}`,
    stages: "Etapes de l'embut",
    stageWithCount: (name, n) => `${name}, ${plural('ca', n, { one: '{n} oportunitat', other: '{n} oportunitats' })}`,
    empty: 'No hi ha oportunitats en aquesta etapa',
    loadMore: "Carrega'n més",
  },
  de: {
    health: { 'on-track': 'Im Plan', 'at-risk': 'Gefährdet', stalled: 'Stockt' },
    stalledFor: (duration) => `Stockt seit ${duration}`,
    move: (title) => `${title} verschieben`,
    stages: 'Pipeline-Phasen',
    stageWithCount: (name, n) => `${name}, ${plural('de', n, { one: '{n} Deal', other: '{n} Deals' })}`,
    empty: 'Keine Deals in dieser Phase',
    loadMore: 'Mehr laden',
  },
  fr: {
    health: { 'on-track': 'En bonne voie', 'at-risk': 'À risque', stalled: 'Bloqué' },
    stalledFor: (duration) => `Bloqué depuis ${duration}`,
    move: (title) => `Déplacer ${title}`,
    stages: 'Étapes du pipeline',
    stageWithCount: (name, n) => `${name}, ${plural('fr', n, { one: '{n} affaire', other: '{n} affaires' })}`,
    empty: 'Aucune affaire à cette étape',
    loadMore: 'Charger plus',
  },
  it: {
    health: { 'on-track': 'In linea', 'at-risk': 'A rischio', stalled: 'In stallo' },
    stalledFor: (duration) => `In stallo da ${duration}`,
    move: (title) => `Sposta ${title}`,
    stages: 'Fasi della pipeline',
    stageWithCount: (name, n) => `${name}, ${plural('it', n, { one: '{n} trattativa', other: '{n} trattative' })}`,
    empty: 'Nessuna trattativa in questa fase',
    loadMore: 'Carica altro',
  },
  pt: {
    health: { 'on-track': 'No prazo', 'at-risk': 'Em risco', stalled: 'Parado' },
    stalledFor: (duration) => `Parado há ${duration}`,
    move: (title) => `Mover ${title}`,
    stages: 'Etapas do funil',
    stageWithCount: (name, n) => `${name}, ${plural('pt', n, { one: '{n} negócio', other: '{n} negócios' })}`,
    empty: 'Nenhum negócio nesta etapa',
    loadMore: 'Carregar mais',
  },
  ru: {
    health: { 'on-track': 'По плану', 'at-risk': 'Под угрозой', stalled: 'Застряла' },
    stalledFor: (duration) => `Без движения: ${duration}`,
    move: (title) => `Переместить «${title}»`,
    stages: 'Этапы воронки',
    stageWithCount: (name, n) =>
      `${name}, ${plural('ru', n, { one: '{n} сделка', few: '{n} сделки', many: '{n} сделок', other: '{n} сделки' })}`,
    empty: 'На этом этапе нет сделок',
    loadMore: 'Загрузить ещё',
  },
  tr: {
    health: { 'on-track': 'Yolunda', 'at-risk': 'Risk altında', stalled: 'Durdu' },
    stalledFor: (duration) => `${duration} süredir duruyor`,
    move: (title) => `${title} fırsatını taşı`,
    stages: 'Satış hattı aşamaları',
    stageWithCount: (name, n) => `${name}, ${n} fırsat`,
    empty: 'Bu aşamada fırsat yok',
    loadMore: 'Daha fazla yükle',
  },
  ja: {
    health: { 'on-track': '順調', 'at-risk': '要注意', stalled: '停滞中' },
    stalledFor: (duration) => `${duration}停滞中`,
    move: (title) => `「${title}」を移動`,
    stages: 'パイプラインのステージ',
    stageWithCount: (name, n) => `${name}、商談${n}件`,
    empty: 'このステージに商談はありません',
    loadMore: 'さらに読み込む',
  },
  zh: {
    health: { 'on-track': '进展顺利', 'at-risk': '有风险', stalled: '停滞' },
    stalledFor: (duration) => `已停滞 ${duration}`,
    move: (title) => `移动“${title}”`,
    stages: '销售管道阶段',
    stageWithCount: (name, n) => `${name}，${n} 个商机`,
    empty: '此阶段没有商机',
    loadMore: '加载更多',
  },
  ar: {
    health: { 'on-track': 'على المسار', 'at-risk': 'معرّضة للخطر', stalled: 'متوقفة' },
    stalledFor: (duration) => `متوقفة منذ ${duration}`,
    move: (title) => `نقل ${title}`,
    stages: 'مراحل خط المبيعات',
    stageWithCount: (name, n) =>
      `${name}، ${plural('ar', n, { zero: 'لا صفقات', one: 'صفقة واحدة', two: 'صفقتان', few: '{n} صفقات', many: '{n} صفقة', other: '{n} صفقة' })}`,
    empty: 'لا توجد صفقات في هذه المرحلة',
    loadMore: 'تحميل المزيد',
  },
  hi: {
    health: { 'on-track': 'सही दिशा में', 'at-risk': 'जोखिम में', stalled: 'अटकी हुई' },
    stalledFor: (duration) => `${duration} से अटकी हुई`,
    move: (title) => `${title} को ले जाएँ`,
    stages: 'पाइपलाइन चरण',
    stageWithCount: (name, n) => `${name}, ${plural('hi', n, { one: '{n} डील', other: '{n} डील' })}`,
    empty: 'इस चरण में कोई डील नहीं',
    loadMore: 'और लोड करें',
  },
  bn: {
    health: { 'on-track': 'ঠিক পথে', 'at-risk': 'ঝুঁকিতে', stalled: 'আটকে আছে' },
    stalledFor: (duration) => `${duration} ধরে আটকে আছে`,
    move: (title) => `${title} সরান`,
    stages: 'পাইপলাইনের ধাপ',
    stageWithCount: (name, n) => `${name}, ${n}টি ডিল`,
    empty: 'এই ধাপে কোনো ডিল নেই',
    loadMore: 'আরও লোড করুন',
  },
  id: {
    health: { 'on-track': 'Sesuai rencana', 'at-risk': 'Berisiko', stalled: 'Macet' },
    stalledFor: (duration) => `Macet selama ${duration}`,
    move: (title) => `Pindahkan ${title}`,
    stages: 'Tahapan pipeline',
    stageWithCount: (name, n) => `${name}, ${n} kesepakatan`,
    empty: 'Tidak ada kesepakatan di tahap ini',
    loadMore: 'Muat lebih banyak',
  },
};
