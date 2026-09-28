import type { MessageCatalog } from '../locale/messages';

/** `TextFieldLabel`'s words, in each Bloom language. */
export interface TextFieldMessages {
  /** The name of the required asterisk. */
  required: string;
}

export const TEXT_FIELD_MESSAGES: MessageCatalog<TextFieldMessages> = {
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
