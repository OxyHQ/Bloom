import type { MessageCatalog } from '../locale/messages';

/** A range slider's thumb names, in each Bloom language. `thumbLabels` still wins. */
export interface SliderMessages {
  minimum: string;
  maximum: string;
  /** A thumb beyond the named pair: "Value 3". */
  value: (position: number) => string;
}

export const SLIDER_MESSAGES: MessageCatalog<SliderMessages> = {
  en: { minimum: 'Minimum', maximum: 'Maximum', value: (n) => `Value ${n}` },
  es: { minimum: 'Mínimo', maximum: 'Máximo', value: (n) => `Valor ${n}` },
  ca: { minimum: 'Mínim', maximum: 'Màxim', value: (n) => `Valor ${n}` },
  de: { minimum: 'Minimalwert', maximum: 'Maximalwert', value: (n) => `Wert ${n}` },
  fr: { minimum: 'Valeur minimale', maximum: 'Valeur maximale', value: (n) => `Valeur ${n}` },
  it: { minimum: 'Valore minimo', maximum: 'Valore massimo', value: (n) => `Valore ${n}` },
  pt: { minimum: 'Mínimo', maximum: 'Máximo', value: (n) => `Valor ${n}` },
  ru: { minimum: 'Минимум', maximum: 'Максимум', value: (n) => `Значение ${n}` },
  tr: { minimum: 'En düşük', maximum: 'En yüksek', value: (n) => `Değer ${n}` },
  ja: { minimum: '最小値', maximum: '最大値', value: (n) => `値 ${n}` },
  zh: { minimum: '最小值', maximum: '最大值', value: (n) => `值 ${n}` },
  ar: { minimum: 'الحد الأدنى', maximum: 'الحد الأقصى', value: (n) => `القيمة ${n}` },
  hi: { minimum: 'न्यूनतम', maximum: 'अधिकतम', value: (n) => `मान ${n}` },
  bn: { minimum: 'সর্বনিম্ন', maximum: 'সর্বোচ্চ', value: (n) => `মান ${n}` },
  id: { minimum: 'Nilai minimum', maximum: 'Nilai maksimum', value: (n) => `Nilai ${n}` },
};
