import { pickMessages, type MessageCatalog } from '../../locale/messages';
import type { BloomLanguage } from '../../locale/languages';

/**
 * A catalog's strings in `language`. Catalogs hold English only; the other
 * languages are registered for every suite by `__mocks__/setup.ts`.
 */
export function messagesIn<M>(catalog: MessageCatalog<M>, language: BloomLanguage): M {
  return pickMessages(catalog, language);
}
