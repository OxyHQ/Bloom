import type { MessageCatalog } from '../locale/messages';

/**
 * The built-in surfaces' default button words, in each Bloom language: the
 * confirm button of `confirm()`, and the lone button of an `alert()` with no
 * buttons or of a `prompt()`. "Cancel" is the common word. A caller's
 * `confirmLabel` / `cancelLabel` / button `text` still wins.
 */
export interface SurfacesMessages {
  confirm: string;
  ok: string;
}

export const SURFACES_MESSAGES: MessageCatalog<SurfacesMessages> = {
  en: { confirm: 'Confirm', ok: 'OK' },
  es: { confirm: 'Confirmar', ok: 'Aceptar' },
  ca: { confirm: 'Confirma', ok: "D'acord" },
  de: { confirm: 'Bestätigen', ok: 'Okay' },
  fr: { confirm: 'Confirmer', ok: 'D’accord' },
  it: { confirm: 'Conferma', ok: 'Va bene' },
  pt: { confirm: 'Confirmar', ok: 'Certo' },
  ru: { confirm: 'Подтвердить', ok: 'ОК' },
  tr: { confirm: 'Onayla', ok: 'Tamam' },
  ja: { confirm: '確認', ok: '了解' },
  zh: { confirm: '确认', ok: '确定' },
  ar: { confirm: 'تأكيد', ok: 'حسنًا' },
  hi: { confirm: 'पुष्टि करें', ok: 'ठीक है' },
  bn: { confirm: 'নিশ্চিত করুন', ok: 'ঠিক আছে' },
  id: { confirm: 'Konfirmasi', ok: 'Oke' },
};
