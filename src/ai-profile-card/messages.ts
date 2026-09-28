import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string `AiProfileCard` draws or announces, in each Bloom
 * language. The `contributionsLabel`, `activityLabel` and `periods` props
 * still win over these.
 */
export interface AiProfileCardMessages {
  contributions: string;
  activity: string;
  /** Names the period switcher after the activity label ("Activity period"). */
  periodGroup: (activityLabel: string) => string;
  periods: { weekly: string; monthly: string; yearly: string };
}

export const AI_PROFILE_CARD_MESSAGES: MessageCatalog<AiProfileCardMessages> = defineMessages<AiProfileCardMessages>('AI_PROFILE_CARD_MESSAGES', {
  contributions: 'Contributions this year',
  activity: 'Activity',
  periodGroup: (label) => `${label} period`,
  periods: { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' },
});
