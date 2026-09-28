import type { MessageCatalog } from '../locale/messages';
import type { PaymentMethodState } from './types';

/**
 * Every fixed string the payment-method family draws or announces, in each
 * Bloom language. Card scheme names are the app's. A caller's `defaultLabel`,
 * `stateMessage`, `addLabel`, `emptyTitle` and `accessibilityLabel` still win.
 */
export interface PaymentMethodMessages {
  /** What a row says under itself when its state has no message of its own. `ok` says nothing. */
  states: Record<Exclude<PaymentMethodState, 'ok'>, string>;
  /** The badge on the default method. */
  default: string;
  /** The add row. */
  add: string;
  /** An empty list's title. */
  emptyTitle: string;
  /** The list's name when neither the caller nor a `Field` gives one. */
  paymentMethods: string;
}

export const PAYMENT_METHOD_MESSAGES: MessageCatalog<PaymentMethodMessages> = {
  en: { states: { expired: 'Expired', declined: 'Declined' }, default: 'Default', add: 'Add a payment method', emptyTitle: 'No saved payment methods', paymentMethods: 'Payment methods' },
  es: { states: { expired: 'Caducada', declined: 'Rechazada' }, default: 'Predeterminada', add: 'Añadir un método de pago', emptyTitle: 'No hay métodos de pago guardados', paymentMethods: 'Métodos de pago' },
  ca: { states: { expired: 'Caducada', declined: 'Rebutjada' }, default: 'Predeterminada', add: 'Afegeix un mètode de pagament', emptyTitle: 'No hi ha mètodes de pagament desats', paymentMethods: 'Mètodes de pagament' },
  de: { states: { expired: 'Abgelaufen', declined: 'Abgelehnt' }, default: 'Standard', add: 'Zahlungsmethode hinzufügen', emptyTitle: 'Keine gespeicherten Zahlungsmethoden', paymentMethods: 'Zahlungsmethoden' },
  fr: { states: { expired: 'Expirée', declined: 'Refusée' }, default: 'Par défaut', add: 'Ajouter un moyen de paiement', emptyTitle: 'Aucun moyen de paiement enregistré', paymentMethods: 'Moyens de paiement' },
  it: { states: { expired: 'Scaduta', declined: 'Rifiutata' }, default: 'Predefinita', add: 'Aggiungi un metodo di pagamento', emptyTitle: 'Nessun metodo di pagamento salvato', paymentMethods: 'Metodi di pagamento' },
  pt: { states: { expired: 'Expirado', declined: 'Recusado' }, default: 'Padrão', add: 'Adicionar forma de pagamento', emptyTitle: 'Nenhuma forma de pagamento salva', paymentMethods: 'Formas de pagamento' },
  ru: { states: { expired: 'Срок истёк', declined: 'Отклонено' }, default: 'Основной', add: 'Добавить способ оплаты', emptyTitle: 'Нет сохранённых способов оплаты', paymentMethods: 'Способы оплаты' },
  tr: { states: { expired: 'Süresi doldu', declined: 'Reddedildi' }, default: 'Varsayılan', add: 'Ödeme yöntemi ekle', emptyTitle: 'Kayıtlı ödeme yöntemi yok', paymentMethods: 'Ödeme yöntemleri' },
  ja: { states: { expired: '有効期限切れ', declined: '拒否されました' }, default: 'デフォルト', add: '支払い方法を追加', emptyTitle: '保存された支払い方法はありません', paymentMethods: '支払い方法' },
  zh: { states: { expired: '已过期', declined: '已拒绝' }, default: '默认', add: '添加付款方式', emptyTitle: '没有已保存的付款方式', paymentMethods: '付款方式' },
  ar: { states: { expired: 'منتهية الصلاحية', declined: 'مرفوضة' }, default: 'افتراضية', add: 'إضافة طريقة دفع', emptyTitle: 'لا توجد طرق دفع محفوظة', paymentMethods: 'طرق الدفع' },
  hi: { states: { expired: 'समाप्त', declined: 'अस्वीकृत' }, default: 'डिफ़ॉल्ट', add: 'भुगतान का तरीका जोड़ें', emptyTitle: 'कोई सहेजा गया भुगतान तरीका नहीं', paymentMethods: 'भुगतान के तरीके' },
  bn: { states: { expired: 'মেয়াদোত্তীর্ণ', declined: 'প্রত্যাখ্যাত' }, default: 'ডিফল্ট', add: 'পেমেন্ট পদ্ধতি যোগ করুন', emptyTitle: 'কোনো সংরক্ষিত পেমেন্ট পদ্ধতি নেই', paymentMethods: 'পেমেন্ট পদ্ধতি' },
  id: { states: { expired: 'Kedaluwarsa', declined: 'Ditolak' }, default: 'Utama', add: 'Tambah metode pembayaran', emptyTitle: 'Belum ada metode pembayaran tersimpan', paymentMethods: 'Metode pembayaran' },
};
