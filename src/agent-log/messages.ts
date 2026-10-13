import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * What a tool-call row says in words about its status, so the state is never
 * carried by colour or an icon alone. Announced through the row's live region.
 */
export interface AgentLogMessages {
  running: string;
  done: string;
  failed: string;
}

export const AGENT_LOG_MESSAGES: MessageCatalog<AgentLogMessages> =
  defineMessages<AgentLogMessages>('AGENT_LOG_MESSAGES', {
    running: 'Running',
    done: 'Done',
    failed: 'Failed',
  });
