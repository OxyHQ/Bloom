import type { MessageCatalog } from '../locale/messages';
import type { CardFormLabels } from './types';

/**
 * Every fixed string the card form draws or announces, in each Bloom language.
 * The expiry's `MM/YY` pattern is a format, not copy. A caller's `labels`,
 * `label`, `accessibilityLabel` and `placeholder` still win.
 */
export interface CardFormMessages {
  /** The words above each box. */
  labels: Required<CardFormLabels>;
  /** The country trigger while nothing is chosen. */
  selectCountry: string;
}

export const CARD_FORM_MESSAGES: MessageCatalog<CardFormMessages> = {
  en: {
    labels: { number: 'Card number', expiry: 'Expiry date', securityCode: 'Security code', name: 'Name on card', postcode: 'Postcode', country: 'Country' },
    selectCountry: 'Select a country',
  },
  es: {
    labels: { number: 'Número de tarjeta', expiry: 'Fecha de caducidad', securityCode: 'Código de seguridad', name: 'Nombre en la tarjeta', postcode: 'Código postal', country: 'País' },
    selectCountry: 'Selecciona un país',
  },
  ca: {
    labels: { number: 'Número de targeta', expiry: 'Data de caducitat', securityCode: 'Codi de seguretat', name: 'Nom a la targeta', postcode: 'Codi postal', country: 'País' },
    selectCountry: 'Selecciona un país',
  },
  de: {
    labels: { number: 'Kartennummer', expiry: 'Ablaufdatum', securityCode: 'Sicherheitscode', name: 'Name auf der Karte', postcode: 'Postleitzahl', country: 'Land' },
    selectCountry: 'Land auswählen',
  },
  fr: {
    labels: { number: 'Numéro de carte', expiry: "Date d'expiration", securityCode: 'Code de sécurité', name: 'Nom sur la carte', postcode: 'Code postal', country: 'Pays' },
    selectCountry: 'Choisissez un pays',
  },
  it: {
    labels: { number: 'Numero della carta', expiry: 'Data di scadenza', securityCode: 'Codice di sicurezza', name: 'Nome sulla carta', postcode: 'CAP', country: 'Paese' },
    selectCountry: 'Seleziona un paese',
  },
  pt: {
    labels: { number: 'Número do cartão', expiry: 'Data de validade', securityCode: 'Código de segurança', name: 'Nome no cartão', postcode: 'CEP', country: 'País' },
    selectCountry: 'Selecione um país',
  },
  ru: {
    labels: { number: 'Номер карты', expiry: 'Срок действия', securityCode: 'Код безопасности', name: 'Имя на карте', postcode: 'Почтовый индекс', country: 'Страна' },
    selectCountry: 'Выберите страну',
  },
  tr: {
    labels: { number: 'Kart numarası', expiry: 'Son kullanma tarihi', securityCode: 'Güvenlik kodu', name: 'Kart üzerindeki ad', postcode: 'Posta kodu', country: 'Ülke' },
    selectCountry: 'Ülke seçin',
  },
  ja: {
    labels: { number: 'カード番号', expiry: '有効期限', securityCode: 'セキュリティコード', name: 'カード名義人', postcode: '郵便番号', country: '国' },
    selectCountry: '国を選択',
  },
  zh: {
    labels: { number: '卡号', expiry: '有效期', securityCode: '安全码', name: '持卡人姓名', postcode: '邮政编码', country: '国家/地区' },
    selectCountry: '选择国家/地区',
  },
  ar: {
    labels: { number: 'رقم البطاقة', expiry: 'تاريخ الانتهاء', securityCode: 'رمز الأمان', name: 'الاسم على البطاقة', postcode: 'الرمز البريدي', country: 'الدولة' },
    selectCountry: 'اختر دولة',
  },
  hi: {
    labels: { number: 'कार्ड नंबर', expiry: 'समाप्ति तिथि', securityCode: 'सुरक्षा कोड', name: 'कार्ड पर नाम', postcode: 'पिन कोड', country: 'देश' },
    selectCountry: 'देश चुनें',
  },
  bn: {
    labels: { number: 'কার্ড নম্বর', expiry: 'মেয়াদ শেষের তারিখ', securityCode: 'নিরাপত্তা কোড', name: 'কার্ডে থাকা নাম', postcode: 'পোস্টকোড', country: 'দেশ' },
    selectCountry: 'একটি দেশ বেছে নিন',
  },
  id: {
    labels: { number: 'Nomor kartu', expiry: 'Tanggal kedaluwarsa', securityCode: 'Kode keamanan', name: 'Nama di kartu', postcode: 'Kode pos', country: 'Negara' },
    selectCountry: 'Pilih negara',
  },
};
