import type { MessageCatalog } from '../locale/messages';

/**
 * The phone input's names, in each Bloom language. Country names stay the
 * vendored English data (`countries.ts`); `label`, `accessibilityLabel` and
 * `countrySelectLabel` still win.
 */
export interface PhoneInputMessages {
  /** The number field's name when there is no visible label. */
  phoneNumber: string;
  /** The country-code select's name. */
  countryCode: string;
}

export const PHONE_INPUT_MESSAGES: MessageCatalog<PhoneInputMessages> = {
  en: { phoneNumber: 'Phone number', countryCode: 'Country code' },
  es: { phoneNumber: 'Número de teléfono', countryCode: 'Código de país' },
  ca: { phoneNumber: 'Número de telèfon', countryCode: 'Codi de país' },
  de: { phoneNumber: 'Telefonnummer', countryCode: 'Ländervorwahl' },
  fr: { phoneNumber: 'Numéro de téléphone', countryCode: 'Indicatif du pays' },
  it: { phoneNumber: 'Numero di telefono', countryCode: 'Prefisso internazionale' },
  pt: { phoneNumber: 'Número de telefone', countryCode: 'Código do país' },
  ru: { phoneNumber: 'Номер телефона', countryCode: 'Код страны' },
  tr: { phoneNumber: 'Telefon numarası', countryCode: 'Ülke kodu' },
  ja: { phoneNumber: '電話番号', countryCode: '国番号' },
  zh: { phoneNumber: '电话号码', countryCode: '国家/地区代码' },
  ar: { phoneNumber: 'رقم الهاتف', countryCode: 'رمز البلد' },
  hi: { phoneNumber: 'फ़ोन नंबर', countryCode: 'देश कोड' },
  bn: { phoneNumber: 'ফোন নম্বর', countryCode: 'দেশের কোড' },
  id: { phoneNumber: 'Nomor telepon', countryCode: 'Kode negara' },
};
