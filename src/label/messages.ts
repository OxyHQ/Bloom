import type { MessageCatalog } from '../locale/messages';

/** `Label`'s words, in each Bloom language. */
export interface LabelMessages {
  /** The name of the required asterisk. */
  required: string;
}

export const LABEL_MESSAGES: MessageCatalog<LabelMessages> = {
  en: { required: 'required' },
  es: { required: 'obligatorio' },
  ca: { required: 'obligatori' },
  de: { required: 'erforderlich' },
  fr: { required: 'obligatoire' },
  it: { required: 'obbligatorio' },
  pt: { required: 'obrigatório' },
  ru: { required: 'обязательно' },
  tr: { required: 'zorunlu' },
  ja: { required: '必須' },
  zh: { required: '必填' },
  ar: { required: 'مطلوب' },
  hi: { required: 'आवश्यक' },
  bn: { required: 'আবশ্যক' },
  id: { required: 'wajib diisi' },
};
