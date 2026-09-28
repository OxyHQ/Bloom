import { defineMessages, type MessageCatalog } from '../locale/messages';

/** `Label`'s words, in each Bloom language. */
export interface LabelMessages {
  /** The name of the required asterisk. */
  required: string;
}

export const LABEL_MESSAGES: MessageCatalog<LabelMessages> = defineMessages<LabelMessages>('LABEL_MESSAGES', { required: 'required' });
