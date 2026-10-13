import { defineMessages, type MessageCatalog } from '../locale/messages';

/** Every fixed string the empty-state family announces, in each Bloom language. */
export interface EmptyStateMessages {
  /** The name of the suggestion pills' group. */
  suggestions: string;
}

export const EMPTY_STATE_MESSAGES: MessageCatalog<EmptyStateMessages> =
  defineMessages<EmptyStateMessages>('EMPTY_STATE_MESSAGES', {
    suggestions: 'Suggestions',
  });
