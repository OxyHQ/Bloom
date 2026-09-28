import type { MessageCatalog } from '../locale/messages';

/**
 * The questionnaire's own strings in each Bloom language. Previous, Next, Done
 * and Dismiss are the common words (`COMMON_MESSAGES`). A caller's `labels` and
 * a question's `stepLabel` still win.
 */
export interface QuestionnaireMessages {
  /** The free-text row's title, and its placeholder. */
  other: string;
  otherPlaceholder: string;
  /** Names the step pill group. */
  steps: string;
  /** A step pill with no `stepLabel`. */
  step: (n: number) => string;
}

export const QUESTIONNAIRE_MESSAGES: MessageCatalog<QuestionnaireMessages> = {
  en: { other: 'Other', otherPlaceholder: 'Enter your custom answer here', steps: 'Steps', step: (n) => `Step ${n}` },
  es: { other: 'Otra', otherPlaceholder: 'Escribe aquí tu respuesta', steps: 'Pasos', step: (n) => `Paso ${n}` },
  ca: { other: 'Una altra', otherPlaceholder: 'Escriu aquí la teva resposta', steps: 'Passos', step: (n) => `Pas ${n}` },
  de: { other: 'Sonstiges', otherPlaceholder: 'Gib hier deine eigene Antwort ein', steps: 'Schritte', step: (n) => `Schritt ${n}` },
  fr: { other: 'Autre', otherPlaceholder: 'Saisissez votre réponse ici', steps: 'Étapes', step: (n) => `Étape ${n}` },
  it: { other: 'Altro', otherPlaceholder: 'Scrivi qui la tua risposta', steps: 'Passaggi', step: (n) => `Passaggio ${n}` },
  pt: { other: 'Outra', otherPlaceholder: 'Digite sua resposta aqui', steps: 'Etapas', step: (n) => `Etapa ${n}` },
  ru: { other: 'Другое', otherPlaceholder: 'Введите свой ответ', steps: 'Шаги', step: (n) => `Шаг ${n}` },
  tr: { other: 'Diğer', otherPlaceholder: 'Kendi yanıtınızı buraya yazın', steps: 'Adımlar', step: (n) => `Adım ${n}` },
  ja: { other: 'その他', otherPlaceholder: '回答を入力してください', steps: 'ステップ', step: (n) => `ステップ ${n}` },
  zh: { other: '其他', otherPlaceholder: '在此输入你的答案', steps: '步骤', step: (n) => `第 ${n} 步` },
  ar: { other: 'أخرى', otherPlaceholder: 'اكتب إجابتك هنا', steps: 'الخطوات', step: (n) => `الخطوة ${n}` },
  hi: { other: 'अन्य', otherPlaceholder: 'अपना जवाब यहाँ लिखें', steps: 'चरण', step: (n) => `चरण ${n}` },
  bn: { other: 'অন্যান্য', otherPlaceholder: 'আপনার উত্তর এখানে লিখুন', steps: 'ধাপ', step: (n) => `ধাপ ${n}` },
  id: { other: 'Lainnya', otherPlaceholder: 'Tulis jawabanmu di sini', steps: 'Langkah', step: (n) => `Langkah ${n}` },
};
