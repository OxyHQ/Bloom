import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The questionnaire's own strings in each Bloom language. Previous, Next, Done
 * and Dismiss are the common words (`COMMON_MESSAGES`). A caller's `labels` and
 * a question's `stepLabel` still win.
 */
export interface QuestionnaireMessages {
  /** The free-text row's title, and its placeholder. */
  other: string;
  otherPlaceholder: string;
  /** Names the step pill group. */
  steps: string;
  /** A step pill with no `stepLabel`. */
  step: (n: number) => string;
}

export const QUESTIONNAIRE_MESSAGES: MessageCatalog<QuestionnaireMessages> = defineMessages<QuestionnaireMessages>('QUESTIONNAIRE_MESSAGES', { other: 'Other', otherPlaceholder: 'Enter your custom answer here', steps: 'Steps', step: (n) => `Step ${n}` });
