import type { MessageCatalog } from '../locale/messages';

/**
 * `InputOtp`'s names, in each Bloom language. `accessibilityLabel` (or the
 * enclosing `Field`'s label) still names the group.
 */
export interface InputOtpMessages {
  /** The group's name when nothing else names it. */
  oneTimeCode: string;
  /** One box of a numeric code: "Digit 2 of 6". */
  digitOf: (position: number, total: number) => string;
  /** One box of an alphanumeric code: "Character 2 of 6". */
  characterOf: (position: number, total: number) => string;
}

export const INPUT_OTP_MESSAGES: MessageCatalog<InputOtpMessages> = {
  en: {
    oneTimeCode: 'One-time code',
    digitOf: (i, n) => `Digit ${i} of ${n}`,
    characterOf: (i, n) => `Character ${i} of ${n}`,
  },
  es: {
    oneTimeCode: 'Código de un solo uso',
    digitOf: (i, n) => `Dígito ${i} de ${n}`,
    characterOf: (i, n) => `Carácter ${i} de ${n}`,
  },
  ca: {
    oneTimeCode: "Codi d'un sol ús",
    digitOf: (i, n) => `Dígit ${i} de ${n}`,
    characterOf: (i, n) => `Caràcter ${i} de ${n}`,
  },
  de: {
    oneTimeCode: 'Einmalcode',
    digitOf: (i, n) => `Ziffer ${i} von ${n}`,
    characterOf: (i, n) => `Zeichen ${i} von ${n}`,
  },
  fr: {
    oneTimeCode: 'Code à usage unique',
    digitOf: (i, n) => `Chiffre ${i} sur ${n}`,
    characterOf: (i, n) => `Caractère ${i} sur ${n}`,
  },
  it: {
    oneTimeCode: 'Codice monouso',
    digitOf: (i, n) => `Cifra ${i} di ${n}`,
    characterOf: (i, n) => `Carattere ${i} di ${n}`,
  },
  pt: {
    oneTimeCode: 'Código de uso único',
    digitOf: (i, n) => `Dígito ${i} de ${n}`,
    characterOf: (i, n) => `Caractere ${i} de ${n}`,
  },
  ru: {
    oneTimeCode: 'Одноразовый код',
    digitOf: (i, n) => `Цифра ${i} из ${n}`,
    characterOf: (i, n) => `Символ ${i} из ${n}`,
  },
  tr: {
    oneTimeCode: 'Tek kullanımlık kod',
    digitOf: (i, n) => `Rakam ${i}/${n}`,
    characterOf: (i, n) => `Karakter ${i}/${n}`,
  },
  ja: {
    oneTimeCode: 'ワンタイムコード',
    digitOf: (i, n) => `${n}桁中${i}桁目`,
    characterOf: (i, n) => `${n}文字中${i}文字目`,
  },
  zh: {
    oneTimeCode: '一次性验证码',
    digitOf: (i, n) => `第 ${i} 位数字，共 ${n} 位`,
    characterOf: (i, n) => `第 ${i} 个字符，共 ${n} 个`,
  },
  ar: {
    oneTimeCode: 'رمز لمرة واحدة',
    digitOf: (i, n) => `الرقم ${i} من ${n}`,
    characterOf: (i, n) => `الحرف ${i} من ${n}`,
  },
  hi: {
    oneTimeCode: 'वन-टाइम कोड',
    digitOf: (i, n) => `${n} में से अंक ${i}`,
    characterOf: (i, n) => `${n} में से वर्ण ${i}`,
  },
  bn: {
    oneTimeCode: 'এককালীন কোড',
    digitOf: (i, n) => `${n}টির মধ্যে ${i} নম্বর অঙ্ক`,
    characterOf: (i, n) => `${n}টির মধ্যে ${i} নম্বর অক্ষর`,
  },
  id: {
    oneTimeCode: 'Kode sekali pakai',
    digitOf: (i, n) => `Digit ${i} dari ${n}`,
    characterOf: (i, n) => `Karakter ${i} dari ${n}`,
  },
};
