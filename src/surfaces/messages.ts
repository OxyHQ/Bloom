import { defineMessages, type MessageCatalog } from '../locale/messages';

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

export const SURFACES_MESSAGES: MessageCatalog<SurfacesMessages> = defineMessages<SurfacesMessages>('SURFACES_MESSAGES', { confirm: 'Confirm', ok: 'OK' });
