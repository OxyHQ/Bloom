import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the code family announces, in each Bloom language.
 * `CodeBlock`'s `labels` prop still wins over these.
 */
export interface CodeMessages {
  /** The copy button's name. */
  copy: string;
  /** Its name for the moment after a copy. */
  copied: string;
}

export const CODE_MESSAGES: MessageCatalog<CodeMessages> = defineMessages<CodeMessages>('CODE_MESSAGES', { copy: 'Copy code', copied: 'Code copied' });
