import { defineMessages, type MessageCatalog } from '../locale/messages';
import { thoughtFor } from './message-helpers';

/** Every fixed string `Reasoning` draws or announces, in each Bloom language. */
export interface ReasoningMessages {
  /** The header once the model has finished: "Thought for 1 min 5 s". */
  thoughtFor: (minutes: number, seconds: number) => string;
  /** The header when it finished in under half a second. */
  thoughtBriefly: string;
  /** The header when no duration is known. */
  reasoning: string;
}

export const REASONING_MESSAGES: MessageCatalog<ReasoningMessages> =
  defineMessages<ReasoningMessages>('REASONING_MESSAGES', {
    thoughtFor: thoughtFor('Thought for {time}', ' min', ' s'),
    thoughtBriefly: 'Thought for a moment',
    reasoning: 'Reasoning',
  });
