import type { MessageCatalog } from '../locale/messages';

/**
 * The stepper's button names, in each Bloom language. `decrementLabel` and
 * `incrementLabel` still win; the trash button says the common "Remove".
 */
export interface StepperMessages {
  decrease: string;
  increase: string;
}

export const STEPPER_MESSAGES: MessageCatalog<StepperMessages> = {
  en: { decrease: 'Decrease', increase: 'Increase' },
  es: { decrease: 'Disminuir', increase: 'Aumentar' },
  ca: { decrease: 'Redueix', increase: 'Augmenta' },
  de: { decrease: 'Verringern', increase: 'Erhöhen' },
  fr: { decrease: 'Diminuer', increase: 'Augmenter' },
  it: { decrease: 'Diminuisci', increase: 'Aumenta' },
  pt: { decrease: 'Diminuir', increase: 'Aumentar' },
  ru: { decrease: 'Уменьшить', increase: 'Увеличить' },
  tr: { decrease: 'Azalt', increase: 'Artır' },
  ja: { decrease: '減らす', increase: '増やす' },
  zh: { decrease: '减少', increase: '增加' },
  ar: { decrease: 'إنقاص', increase: 'زيادة' },
  hi: { decrease: 'घटाएँ', increase: 'बढ़ाएँ' },
  bn: { decrease: 'কমান', increase: 'বাড়ান' },
  id: { decrease: 'Kurangi', increase: 'Tambah' },
};
