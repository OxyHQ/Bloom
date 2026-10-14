import { defineMessages, type MessageCatalog } from '../locale/messages';

/** The words of an agent's reply that are Bloom's own, in each Bloom language. */
export interface AgentReplyMessages {
  /** The status shown while the agent works on its reply. */
  thinking: string;
  /** Names the identity row while the agent works: "Lumi is thinking". `{0}` is the name. */
  agentThinking: string;
  helpfulResponse: string;
  unhelpfulResponse: string;
  copyResponse: string;
}

export const AGENT_REPLY_MESSAGES: MessageCatalog<AgentReplyMessages> =
  defineMessages<AgentReplyMessages>('AGENT_REPLY_MESSAGES', {
    thinking: 'Thinking…',
    agentThinking: '{0} is thinking',
    helpfulResponse: 'Helpful response',
    unhelpfulResponse: 'Unhelpful response',
    copyResponse: 'Copy response',
  });
