import { defineMessages, type MessageCatalog } from '../locale/messages';
import { thoughtFor } from './message-helpers';

/** `AgentThinking`'s fixed strings in each Bloom language; a `label` prop still wins. */
export interface AgentThinkingMessages {
  /** The default status label while the model is working. */
  thinking: string;
  /** The finished header: "Thought for 1 min 5 s". */
  thoughtFor: (minutes: number, seconds: number) => string;
  /** The finished header when it took under half a second. */
  thoughtBriefly: string;
  /** The finished header when no duration is known. */
  reasoning: string;
}

export const AGENT_THINKING_MESSAGES: MessageCatalog<AgentThinkingMessages> =
  defineMessages<AgentThinkingMessages>('AGENT_THINKING_MESSAGES', {
    thinking: 'Thinking',
    thoughtFor: thoughtFor('Thought for {time}', ' min', ' s'),
    thoughtBriefly: 'Thought for a moment',
    reasoning: 'Reasoning',
  });
