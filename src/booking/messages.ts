import type { MessageCatalog } from '../locale/messages';
import type { TripStatus } from './types';

/**
 * Every fixed string the booking family draws or announces, in each Bloom
 * language. A caller's `*Label` props still win over any entry here; prices,
 * dates and guest counts arrive formatted from the app.
 */
export interface BookingMessages {
  checkIn: string;
  checkOut: string;
  guests: string;
  addDate: string;
  reserve: string;
  checkAvailability: string;
  /** The note under the button once both dates are set. */
  notChargedYet: string;
  /** `PriceBreakdown`'s bold last row. */
  total: string;
  tripStatus: Record<TripStatus, string>;
  /**
   * A price's spoken name: "$180 per night, originally $210". `unit` and
   * `originalPrice` are optional; each language places them itself.
   */
  priceName: (price: string, unit?: string, originalPrice?: string) => string;
}

/** Joins a price, its unit and its earlier price with one language's words. */
function priceName(
  per: (price: string, unit: string) => string,
  originally: (spoken: string, originalPrice: string) => string,
): BookingMessages['priceName'] {
  return (price, unit, originalPrice) => {
    const spoken = unit ? per(price, unit) : price;
    return originalPrice ? originally(spoken, originalPrice) : spoken;
  };
}

export const BOOKING_MESSAGES: MessageCatalog<BookingMessages> = {
  en: {
    checkIn: 'Check-in',
    checkOut: 'Checkout',
    guests: 'Guests',
    addDate: 'Add date',
    reserve: 'Reserve',
    checkAvailability: 'Check availability',
    notChargedYet: "You won't be charged yet",
    total: 'Total',
    tripStatus: { confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', completed: 'Completed' },
    priceName: priceName((p, u) => `${p} per ${u}`, (s, o) => `${s}, originally ${o}`),
  },
  es: {
    checkIn: 'Llegada',
    checkOut: 'Salida',
    guests: 'Huéspedes',
    addDate: 'Añadir fecha',
    reserve: 'Reservar',
    checkAvailability: 'Comprobar disponibilidad',
    notChargedYet: 'Todavía no se te cobrará nada',
    total: 'Total',
    tripStatus: { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada', completed: 'Completada' },
    priceName: priceName((p, u) => `${p} por ${u}`, (s, o) => `${s}, antes ${o}`),
  },
  ca: {
    checkIn: 'Arribada',
    checkOut: 'Sortida',
    guests: 'Hostes',
    addDate: 'Afegeix una data',
    reserve: 'Reserva',
    checkAvailability: 'Consulta la disponibilitat',
    notChargedYet: 'Encara no se’t cobrarà res',
    total: 'Total',
    tripStatus: { confirmed: 'Confirmada', pending: 'Pendent', cancelled: 'Cancel·lada', completed: 'Completada' },
    priceName: priceName((p, u) => `${p} per ${u}`, (s, o) => `${s}, abans ${o}`),
  },
  de: {
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Gäste',
    addDate: 'Datum hinzufügen',
    reserve: 'Reservieren',
    checkAvailability: 'Verfügbarkeit prüfen',
    notChargedYet: 'Noch wird dir nichts berechnet',
    total: 'Gesamt',
    tripStatus: { confirmed: 'Bestätigt', pending: 'Ausstehend', cancelled: 'Storniert', completed: 'Abgeschlossen' },
    priceName: priceName((p, u) => `${p} pro ${u}`, (s, o) => `${s}, vorher ${o}`),
  },
  fr: {
    checkIn: 'Arrivée',
    checkOut: 'Départ',
    guests: 'Voyageurs',
    addDate: 'Ajouter une date',
    reserve: 'Réserver',
    checkAvailability: 'Vérifier la disponibilité',
    notChargedYet: 'Aucun montant ne vous sera débité pour le moment',
    total: 'Total',
    tripStatus: { confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé', completed: 'Terminé' },
    priceName: priceName((p, u) => `${p} par ${u}`, (s, o) => `${s}, au lieu de ${o}`),
  },
  it: {
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Ospiti',
    addDate: 'Aggiungi data',
    reserve: 'Prenota',
    checkAvailability: 'Verifica disponibilità',
    notChargedYet: 'Non ti verrà ancora addebitato nulla',
    total: 'Totale',
    tripStatus: { confirmed: 'Confermato', pending: 'In attesa', cancelled: 'Cancellato', completed: 'Completato' },
    priceName: priceName((p, u) => `${p} a ${u}`, (s, o) => `${s}, invece di ${o}`),
  },
  pt: {
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Hóspedes',
    addDate: 'Adicionar data',
    reserve: 'Reservar',
    checkAvailability: 'Verificar disponibilidade',
    notChargedYet: 'Você ainda não será cobrado',
    total: 'Total',
    tripStatus: { confirmed: 'Confirmada', pending: 'Pendente', cancelled: 'Cancelada', completed: 'Concluída' },
    priceName: priceName((p, u) => `${p} por ${u}`, (s, o) => `${s}, antes ${o}`),
  },
  ru: {
    checkIn: 'Заезд',
    checkOut: 'Выезд',
    guests: 'Гости',
    addDate: 'Добавить дату',
    reserve: 'Забронировать',
    checkAvailability: 'Проверить наличие мест',
    notChargedYet: 'Пока с вас ничего не спишут',
    total: 'Итого',
    tripStatus: { confirmed: 'Подтверждено', pending: 'Ожидает', cancelled: 'Отменено', completed: 'Завершено' },
    priceName: priceName((p, u) => `${p} за ${u}`, (s, o) => `${s}, раньше ${o}`),
  },
  tr: {
    checkIn: 'Giriş',
    checkOut: 'Çıkış',
    guests: 'Misafirler',
    addDate: 'Tarih ekle',
    reserve: 'Rezervasyon yap',
    checkAvailability: 'Müsaitliği kontrol et',
    notChargedYet: 'Henüz sizden ücret alınmayacak',
    total: 'Toplam',
    tripStatus: { confirmed: 'Onaylandı', pending: 'Beklemede', cancelled: 'İptal edildi', completed: 'Tamamlandı' },
    priceName: priceName((p, u) => `${u} başına ${p}`, (s, o) => `${s}, önceki fiyat ${o}`),
  },
  ja: {
    checkIn: 'チェックイン',
    checkOut: 'チェックアウト',
    guests: 'ゲスト',
    addDate: '日付を追加',
    reserve: '予約する',
    checkAvailability: '空室状況を確認',
    notChargedYet: 'まだ料金は発生しません',
    total: '合計',
    tripStatus: { confirmed: '確定', pending: '保留中', cancelled: 'キャンセル済み', completed: '完了' },
    priceName: priceName((p, u) => `${u}あたり${p}`, (s, o) => `${s}（元の価格 ${o}）`),
  },
  zh: {
    checkIn: '入住',
    checkOut: '退房',
    guests: '房客',
    addDate: '添加日期',
    reserve: '预订',
    checkAvailability: '查看空房',
    notChargedYet: '目前还不会向你收费',
    total: '总计',
    tripStatus: { confirmed: '已确认', pending: '待处理', cancelled: '已取消', completed: '已完成' },
    priceName: priceName((p, u) => `每${u} ${p}`, (s, o) => `${s}，原价 ${o}`),
  },
  ar: {
    checkIn: 'تسجيل الوصول',
    checkOut: 'تسجيل المغادرة',
    guests: 'الضيوف',
    addDate: 'إضافة تاريخ',
    reserve: 'احجز',
    checkAvailability: 'تحقق من التوفر',
    notChargedYet: 'لن يتم تحصيل أي مبلغ منك بعد',
    total: 'الإجمالي',
    tripStatus: { confirmed: 'مؤكد', pending: 'قيد الانتظار', cancelled: 'ملغى', completed: 'مكتمل' },
    priceName: priceName((p, u) => `${p} لكل ${u}`, (s, o) => `${s}، بدلاً من ${o}`),
  },
  hi: {
    checkIn: 'चेक-इन',
    checkOut: 'चेक-आउट',
    guests: 'मेहमान',
    addDate: 'तारीख जोड़ें',
    reserve: 'आरक्षित करें',
    checkAvailability: 'उपलब्धता देखें',
    notChargedYet: 'अभी आपसे कोई शुल्क नहीं लिया जाएगा',
    total: 'कुल',
    tripStatus: { confirmed: 'पुष्ट', pending: 'लंबित', cancelled: 'रद्द', completed: 'पूरा हुआ' },
    priceName: priceName((p, u) => `${p} प्रति ${u}`, (s, o) => `${s}, पहले ${o}`),
  },
  bn: {
    checkIn: 'চেক-ইন',
    checkOut: 'চেক-আউট',
    guests: 'অতিথি',
    addDate: 'তারিখ যোগ করুন',
    reserve: 'সংরক্ষণ করুন',
    checkAvailability: 'প্রাপ্যতা দেখুন',
    notChargedYet: 'এখনই আপনার কাছ থেকে কোনো টাকা নেওয়া হবে না',
    total: 'মোট',
    tripStatus: { confirmed: 'নিশ্চিত', pending: 'অপেক্ষমাণ', cancelled: 'বাতিল', completed: 'সম্পন্ন' },
    priceName: priceName((p, u) => `প্রতি ${u} ${p}`, (s, o) => `${s}, আগে ${o}`),
  },
  id: {
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Tamu',
    addDate: 'Tambahkan tanggal',
    reserve: 'Pesan',
    checkAvailability: 'Periksa ketersediaan',
    notChargedYet: 'Anda belum akan dikenai biaya',
    total: 'Total',
    tripStatus: { confirmed: 'Dikonfirmasi', pending: 'Menunggu', cancelled: 'Dibatalkan', completed: 'Selesai' },
    priceName: priceName((p, u) => `${p} per ${u}`, (s, o) => `${s}, sebelumnya ${o}`),
  },
};
