import type { MessageCatalog } from '../locale/messages';
import type { EarningsPayoutState } from './types';

/**
 * Every fixed string the earnings family draws or announces, in each Bloom
 * language. Amounts arrive formatted. A caller's `labels`, `title` and
 * `accessibilityLabel` still win.
 */
export interface EarningsMessages {
  /** Over the figure. */
  earned: string;
  /** Names the period switch. */
  period: string;
  /** Over the breakdown. */
  breakdown: string;
  /** Over the payout row. */
  payout: string;
  payoutState: Record<EarningsPayoutState, string>;
  /** Names the chart: "This week earnings, by period". */
  chart: (label: string) => string;
  /** The empty period's line. */
  empty: string;
  /** Names the summary panel. */
  earnings: string;
}

export const EARNINGS_MESSAGES: MessageCatalog<EarningsMessages> = {
  en: {
    earned: 'Earned',
    period: 'Earnings period',
    breakdown: 'What it came from',
    payout: 'Next payout',
    payoutState: { scheduled: 'Scheduled', processing: 'On its way', paid: 'Paid', held: 'On hold', failed: 'Failed' },
    chart: (label) => `${label} earnings, by period`,
    empty: 'Nothing earned yet',
    earnings: 'Earnings',
  },
  es: {
    earned: 'Ganado',
    period: 'Periodo de ganancias',
    breakdown: 'De dónde viene',
    payout: 'Próximo pago',
    payoutState: { scheduled: 'Programado', processing: 'En camino', paid: 'Pagado', held: 'Retenido', failed: 'Fallido' },
    chart: (label) => `Ganancias: ${label}, por periodo`,
    empty: 'Aún no has ganado nada',
    earnings: 'Ganancias',
  },
  ca: {
    earned: 'Guanyat',
    period: 'Període de guanys',
    breakdown: "D'on ve",
    payout: 'Proper pagament',
    payoutState: { scheduled: 'Programat', processing: 'En camí', paid: 'Pagat', held: 'Retingut', failed: 'Fallit' },
    chart: (label) => `Guanys: ${label}, per període`,
    empty: 'Encara no has guanyat res',
    earnings: 'Guanys',
  },
  de: {
    earned: 'Verdient',
    period: 'Zeitraum der Einnahmen',
    breakdown: 'Woher es kommt',
    payout: 'Nächste Auszahlung',
    payoutState: { scheduled: 'Geplant', processing: 'Unterwegs', paid: 'Ausgezahlt', held: 'Zurückgehalten', failed: 'Fehlgeschlagen' },
    chart: (label) => `Einnahmen ${label}, nach Zeitraum`,
    empty: 'Noch nichts verdient',
    earnings: 'Einnahmen',
  },
  fr: {
    earned: 'Gagné',
    period: 'Période de revenus',
    breakdown: "D'où ça vient",
    payout: 'Prochain versement',
    payoutState: { scheduled: 'Programmé', processing: 'En route', paid: 'Versé', held: 'En attente', failed: 'Échec' },
    chart: (label) => `Revenus ${label}, par période`,
    empty: "Rien de gagné pour l'instant",
    earnings: 'Revenus',
  },
  it: {
    earned: 'Guadagnato',
    period: 'Periodo dei guadagni',
    breakdown: 'Da dove arriva',
    payout: 'Prossimo pagamento',
    payoutState: { scheduled: 'Programmato', processing: 'In arrivo', paid: 'Pagato', held: 'Sospeso', failed: 'Non riuscito' },
    chart: (label) => `Guadagni ${label}, per periodo`,
    empty: 'Ancora nessun guadagno',
    earnings: 'Guadagni',
  },
  pt: {
    earned: 'Ganho',
    period: 'Período de ganhos',
    breakdown: 'De onde veio',
    payout: 'Próximo repasse',
    payoutState: { scheduled: 'Agendado', processing: 'A caminho', paid: 'Pago', held: 'Retido', failed: 'Falhou' },
    chart: (label) => `Ganhos ${label}, por período`,
    empty: 'Nenhum ganho ainda',
    earnings: 'Ganhos',
  },
  ru: {
    earned: 'Заработано',
    period: 'Период заработка',
    breakdown: 'Из чего складывается',
    payout: 'Следующая выплата',
    payoutState: { scheduled: 'Запланирована', processing: 'В пути', paid: 'Выплачено', held: 'Задержана', failed: 'Не удалась' },
    chart: (label) => `Заработок: ${label}, по периодам`,
    empty: 'Пока ничего не заработано',
    earnings: 'Заработок',
  },
  tr: {
    earned: 'Kazanılan',
    period: 'Kazanç dönemi',
    breakdown: 'Nereden geldi',
    payout: 'Sonraki ödeme',
    payoutState: { scheduled: 'Planlandı', processing: 'Yolda', paid: 'Ödendi', held: 'Bekletiliyor', failed: 'Başarısız' },
    chart: (label) => `${label} kazançları, döneme göre`,
    empty: 'Henüz kazanç yok',
    earnings: 'Kazançlar',
  },
  ja: {
    earned: '収益',
    period: '収益の期間',
    breakdown: '内訳',
    payout: '次回の支払い',
    payoutState: { scheduled: '予定', processing: '送金中', paid: '支払い済み', held: '保留中', failed: '失敗' },
    chart: (label) => `${label}の収益（期間別）`,
    empty: 'まだ収益はありません',
    earnings: '収益',
  },
  zh: {
    earned: '已赚取',
    period: '收入周期',
    breakdown: '收入来源',
    payout: '下次打款',
    payoutState: { scheduled: '已安排', processing: '打款中', paid: '已支付', held: '已暂扣', failed: '失败' },
    chart: (label) => `${label}收入（按周期）`,
    empty: '还没有收入',
    earnings: '收入',
  },
  ar: {
    earned: 'الأرباح',
    period: 'فترة الأرباح',
    breakdown: 'مصدر الأرباح',
    payout: 'الدفعة التالية',
    payoutState: { scheduled: 'مجدولة', processing: 'في الطريق', paid: 'مدفوعة', held: 'معلّقة', failed: 'فشلت' },
    chart: (label) => `أرباح ${label} حسب الفترة`,
    empty: 'لا أرباح بعد',
    earnings: 'الأرباح',
  },
  hi: {
    earned: 'कमाई',
    period: 'कमाई की अवधि',
    breakdown: 'कहाँ से आई',
    payout: 'अगला भुगतान',
    payoutState: { scheduled: 'निर्धारित', processing: 'रास्ते में', paid: 'भुगतान हो गया', held: 'रोका गया', failed: 'विफल' },
    chart: (label) => `${label} की कमाई, अवधि के अनुसार`,
    empty: 'अभी तक कोई कमाई नहीं',
    earnings: 'कमाई',
  },
  bn: {
    earned: 'আয়',
    period: 'আয়ের সময়কাল',
    breakdown: 'কোথা থেকে এসেছে',
    payout: 'পরবর্তী পেআউট',
    payoutState: { scheduled: 'নির্ধারিত', processing: 'পথে আছে', paid: 'পরিশোধিত', held: 'আটকে আছে', failed: 'ব্যর্থ' },
    chart: (label) => `${label}-এর আয়, সময়কাল অনুযায়ী`,
    empty: 'এখনও কোনো আয় নেই',
    earnings: 'আয়',
  },
  id: {
    earned: 'Diperoleh',
    period: 'Periode pendapatan',
    breakdown: 'Sumbernya',
    payout: 'Pencairan berikutnya',
    payoutState: { scheduled: 'Terjadwal', processing: 'Dalam proses', paid: 'Dibayar', held: 'Ditahan', failed: 'Gagal' },
    chart: (label) => `Pendapatan ${label}, per periode`,
    empty: 'Belum ada pendapatan',
    earnings: 'Pendapatan',
  },
};
