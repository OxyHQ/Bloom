import type { MessageCatalog } from '../locale/messages';
import type { PaymentStatusState } from './types';

/**
 * Every fixed string the payment-status family draws or announces, in each
 * Bloom language. A caller's `status`, `labels` and `referenceLabel` still win.
 */
export interface PaymentStatusMessages {
  /** The words each state says — read on their own, so "Payment failed", not "Failed". */
  states: Record<PaymentStatusState, string>;
  /** The word before the reference. */
  reference: string;
}

export const PAYMENT_STATUS_MESSAGES: MessageCatalog<PaymentStatusMessages> = {
  en: {
    states: { authorising: 'Authorising', paid: 'Paid', failed: 'Payment failed', refunded: 'Refunded', pending: 'Payment pending' },
    reference: 'Reference',
  },
  es: {
    states: { authorising: 'Autorizando', paid: 'Pagado', failed: 'Pago fallido', refunded: 'Reembolsado', pending: 'Pago pendiente' },
    reference: 'Referencia',
  },
  ca: {
    states: { authorising: 'Autoritzant', paid: 'Pagat', failed: 'El pagament ha fallat', refunded: 'Reemborsat', pending: 'Pagament pendent' },
    reference: 'Referència',
  },
  de: {
    states: { authorising: 'Wird autorisiert', paid: 'Bezahlt', failed: 'Zahlung fehlgeschlagen', refunded: 'Erstattet', pending: 'Zahlung ausstehend' },
    reference: 'Referenz',
  },
  fr: {
    states: { authorising: 'Autorisation en cours', paid: 'Payé', failed: 'Échec du paiement', refunded: 'Remboursé', pending: 'Paiement en attente' },
    reference: 'Référence',
  },
  it: {
    states: { authorising: 'Autorizzazione in corso', paid: 'Pagato', failed: 'Pagamento non riuscito', refunded: 'Rimborsato', pending: 'Pagamento in sospeso' },
    reference: 'Riferimento',
  },
  pt: {
    states: { authorising: 'Autorizando', paid: 'Pago', failed: 'Falha no pagamento', refunded: 'Reembolsado', pending: 'Pagamento pendente' },
    reference: 'Referência',
  },
  ru: {
    states: { authorising: 'Авторизация', paid: 'Оплачено', failed: 'Платёж не прошёл', refunded: 'Возвращено', pending: 'Платёж в обработке' },
    reference: 'Номер',
  },
  tr: {
    states: { authorising: 'Onaylanıyor', paid: 'Ödendi', failed: 'Ödeme başarısız', refunded: 'İade edildi', pending: 'Ödeme bekleniyor' },
    reference: 'Referans',
  },
  ja: {
    states: { authorising: '承認中', paid: '支払い済み', failed: '支払いに失敗しました', refunded: '返金済み', pending: '支払い保留中' },
    reference: '参照番号',
  },
  zh: {
    states: { authorising: '授权中', paid: '已支付', failed: '支付失败', refunded: '已退款', pending: '支付处理中' },
    reference: '参考号',
  },
  ar: {
    states: { authorising: 'جارٍ التفويض', paid: 'مدفوع', failed: 'فشل الدفع', refunded: 'مسترد', pending: 'الدفع قيد الانتظار' },
    reference: 'المرجع',
  },
  hi: {
    states: { authorising: 'अधिकृत किया जा रहा है', paid: 'भुगतान हो गया', failed: 'भुगतान विफल', refunded: 'रिफ़ंड हो गया', pending: 'भुगतान लंबित' },
    reference: 'संदर्भ',
  },
  bn: {
    states: { authorising: 'অনুমোদন করা হচ্ছে', paid: 'পরিশোধিত', failed: 'পেমেন্ট ব্যর্থ', refunded: 'ফেরত দেওয়া হয়েছে', pending: 'পেমেন্ট অপেক্ষমাণ' },
    reference: 'রেফারেন্স',
  },
  id: {
    states: { authorising: 'Mengotorisasi', paid: 'Lunas', failed: 'Pembayaran gagal', refunded: 'Dikembalikan', pending: 'Pembayaran tertunda' },
    reference: 'Referensi',
  },
};
