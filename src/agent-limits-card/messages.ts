import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `AgentLimitsCard` draws or announces, in each Bloom
 * language. A caller's `labels` prop still wins over any entry here.
 */
export interface AgentLimitsCardMessages {
  contextWindow: string;
  freeSpace: string;
  planUsageLimits: string;
  managePlan: string;
}

export const AGENT_LIMITS_CARD_MESSAGES: MessageCatalog<AgentLimitsCardMessages> = defineMessages<AgentLimitsCardMessages>('AGENT_LIMITS_CARD_MESSAGES', { contextWindow: 'Context window', freeSpace: 'Free space', planUsageLimits: 'Plan usage limits', managePlan: 'Manage plan' });
