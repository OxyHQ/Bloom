import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the checkout summary draws or announces, in each Bloom
 * language. A caller's `title`, `label`, `placeholder`, `busyLabel`,
 * `accessibilityHint` and `accessibilityLabel` still win.
 */
export interface CheckoutSummaryMessages {
  /** The heading above the rows. */
  title: string;
  /** Names the group when the heading is turned off. */
  orderSummary: string;
  /** The address row's label. */
  deliverTo: string;
  /** Drawn in place of a row's value while nothing is chosen. */
  notChosen: string;
  /** A pressable row's hint: what pressing it opens. */
  opensPicker: string;
  /** The confirm button, and what it announces while busy. */
  placeOrder: string;
  placingOrder: string;
}

export const CHECKOUT_SUMMARY_MESSAGES: MessageCatalog<CheckoutSummaryMessages> = {
  en: {
    title: 'Review your order',
    orderSummary: 'Order summary',
    deliverTo: 'Deliver to',
    notChosen: 'Not chosen yet',
    opensPicker: 'Opens the picker',
    placeOrder: 'Place order',
    placingOrder: 'Placing your order',
  },
  es: {
    title: 'Revisa tu pedido',
    orderSummary: 'Resumen del pedido',
    deliverTo: 'Entregar en',
    notChosen: 'Sin elegir',
    opensPicker: 'Abre el selector',
    placeOrder: 'Realizar pedido',
    placingOrder: 'Realizando tu pedido',
  },
  ca: {
    title: 'Revisa la comanda',
    orderSummary: 'Resum de la comanda',
    deliverTo: 'Entregar a',
    notChosen: 'Encara no triat',
    opensPicker: 'Obre el selector',
    placeOrder: 'Fes la comanda',
    placingOrder: 'Fent la comanda',
  },
  de: {
    title: 'Bestellung prüfen',
    orderSummary: 'Bestellübersicht',
    deliverTo: 'Lieferung an',
    notChosen: 'Noch nicht gewählt',
    opensPicker: 'Öffnet die Auswahl',
    placeOrder: 'Bestellung aufgeben',
    placingOrder: 'Bestellung wird aufgegeben',
  },
  fr: {
    title: 'Vérifiez votre commande',
    orderSummary: 'Récapitulatif de la commande',
    deliverTo: 'Livrer à',
    notChosen: 'Pas encore choisi',
    opensPicker: 'Ouvre le sélecteur',
    placeOrder: 'Passer la commande',
    placingOrder: 'Commande en cours',
  },
  it: {
    title: 'Controlla il tuo ordine',
    orderSummary: 'Riepilogo ordine',
    deliverTo: 'Consegna a',
    notChosen: 'Non ancora scelto',
    opensPicker: 'Apre il selettore',
    placeOrder: 'Effettua ordine',
    placingOrder: 'Invio del tuo ordine',
  },
  pt: {
    title: 'Revise seu pedido',
    orderSummary: 'Resumo do pedido',
    deliverTo: 'Entregar em',
    notChosen: 'Ainda não escolhido',
    opensPicker: 'Abre o seletor',
    placeOrder: 'Fazer pedido',
    placingOrder: 'Enviando seu pedido',
  },
  ru: {
    title: 'Проверьте заказ',
    orderSummary: 'Сводка заказа',
    deliverTo: 'Адрес доставки',
    notChosen: 'Не выбрано',
    opensPicker: 'Открывает выбор',
    placeOrder: 'Оформить заказ',
    placingOrder: 'Оформляем заказ',
  },
  tr: {
    title: 'Siparişini gözden geçir',
    orderSummary: 'Sipariş özeti',
    deliverTo: 'Teslimat adresi',
    notChosen: 'Henüz seçilmedi',
    opensPicker: 'Seçiciyi açar',
    placeOrder: 'Siparişi ver',
    placingOrder: 'Siparişin veriliyor',
  },
  ja: {
    title: 'ご注文内容の確認',
    orderSummary: '注文の概要',
    deliverTo: 'お届け先',
    notChosen: '未選択',
    opensPicker: '選択画面を開きます',
    placeOrder: '注文を確定する',
    placingOrder: '注文を送信しています',
  },
  zh: {
    title: '核对订单',
    orderSummary: '订单摘要',
    deliverTo: '送至',
    notChosen: '尚未选择',
    opensPicker: '打开选择器',
    placeOrder: '提交订单',
    placingOrder: '正在提交订单',
  },
  ar: {
    title: 'راجع طلبك',
    orderSummary: 'ملخص الطلب',
    deliverTo: 'التوصيل إلى',
    notChosen: 'لم يُختر بعد',
    opensPicker: 'يفتح أداة الاختيار',
    placeOrder: 'تأكيد الطلب',
    placingOrder: 'جارٍ إرسال طلبك',
  },
  hi: {
    title: 'अपना ऑर्डर जाँचें',
    orderSummary: 'ऑर्डर सारांश',
    deliverTo: 'यहाँ डिलीवर करें',
    notChosen: 'अभी चुना नहीं गया',
    opensPicker: 'चयनकर्ता खोलता है',
    placeOrder: 'ऑर्डर करें',
    placingOrder: 'आपका ऑर्डर दिया जा रहा है',
  },
  bn: {
    title: 'আপনার অর্ডার যাচাই করুন',
    orderSummary: 'অর্ডারের সারাংশ',
    deliverTo: 'যেখানে ডেলিভারি হবে',
    notChosen: 'এখনও বাছাই করা হয়নি',
    opensPicker: 'নির্বাচক খোলে',
    placeOrder: 'অর্ডার করুন',
    placingOrder: 'আপনার অর্ডার দেওয়া হচ্ছে',
  },
  id: {
    title: 'Tinjau pesananmu',
    orderSummary: 'Ringkasan pesanan',
    deliverTo: 'Kirim ke',
    notChosen: 'Belum dipilih',
    opensPicker: 'Membuka pemilih',
    placeOrder: 'Buat pesanan',
    placingOrder: 'Memproses pesananmu',
  },
};
