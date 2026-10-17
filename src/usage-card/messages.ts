import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `UsageCard` draws or announces, in each Bloom
 * language. A caller's `labels` prop still wins over any entry here.
 */
export interface UsageCardMessages {
  usage: string;
  freeSpace: string;
  planUsageLimits: string;
  managePlan: string;
}

export const USAGE_CARD_MESSAGES: MessageCatalog<UsageCardMessages> =
  defineMessages<UsageCardMessages>('USAGE_CARD_MESSAGES', {
    usage: 'Usage',
    freeSpace: 'Free space',
    planUsageLimits: 'Plan usage limits',
    managePlan: 'Manage plan',
  });
