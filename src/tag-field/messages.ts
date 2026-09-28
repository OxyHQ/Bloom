import type { MessageCatalog } from '../locale/messages';

/**
 * `TagField`'s fixed words, in each Bloom language. Each entry of the
 * `labels` prop still wins over its counterpart here.
 */
export interface TagFieldMessages {
  /** A chip's remove button: "Remove design". */
  remove: (tag: string) => string;
  /** The hint once `max` tags are in: "5 maximum". */
  full: (max: number) => string;
  /** The suggestion list's name. */
  suggestions: string;
}

export const TAG_FIELD_MESSAGES: MessageCatalog<TagFieldMessages> = {
  en: { remove: (t) => `Remove ${t}`, full: (n) => `${n} maximum`, suggestions: 'Suggestions' },
  es: { remove: (t) => `Quitar ${t}`, full: (n) => `Máximo ${n}`, suggestions: 'Sugerencias' },
  ca: { remove: (t) => `Treu ${t}`, full: (n) => `Màxim ${n}`, suggestions: 'Suggeriments' },
  de: { remove: (t) => `${t} entfernen`, full: (n) => `Maximal ${n}`, suggestions: 'Vorschläge' },
  fr: { remove: (t) => `Retirer ${t}`, full: (n) => `${n} au maximum`, suggestions: 'Propositions' },
  it: { remove: (t) => `Rimuovi ${t}`, full: (n) => `Massimo ${n}`, suggestions: 'Suggerimenti' },
  pt: { remove: (t) => `Remover ${t}`, full: (n) => `Máximo de ${n}`, suggestions: 'Sugestões' },
  ru: { remove: (t) => `Убрать «${t}»`, full: (n) => `Максимум: ${n}`, suggestions: 'Подсказки' },
  tr: { remove: (t) => `${t} etiketini kaldır`, full: (n) => `En fazla ${n}`, suggestions: 'Öneriler' },
  ja: { remove: (t) => `「${t}」を削除`, full: (n) => `最大${n}個`, suggestions: '候補' },
  zh: { remove: (t) => `移除“${t}”`, full: (n) => `最多 ${n} 个`, suggestions: '建议' },
  ar: { remove: (t) => `إزالة ${t}`, full: (n) => `الحد الأقصى ${n}`, suggestions: 'اقتراحات' },
  hi: { remove: (t) => `${t} हटाएँ`, full: (n) => `अधिकतम ${n}`, suggestions: 'सुझाव' },
  bn: { remove: (t) => `${t} সরান`, full: (n) => `সর্বাধিক ${n}টি`, suggestions: 'পরামর্শ' },
  id: { remove: (t) => `Hapus ${t}`, full: (n) => `Maksimum ${n}`, suggestions: 'Saran' },
};
