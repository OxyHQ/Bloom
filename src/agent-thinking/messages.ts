import { defineMessages, type MessageCatalog } from '../locale/messages';

/** `AgentThinking`'s default status label in each Bloom language; a `label` prop still wins. */
export interface AgentThinkingMessages {
  thinking: string;
}

export const AGENT_THINKING_MESSAGES: MessageCatalog<AgentThinkingMessages> = defineMessages<AgentThinkingMessages>('AGENT_THINKING_MESSAGES', { thinking: 'Thinking' });
