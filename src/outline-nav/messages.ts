import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the outline-nav family draws or announces, in each Bloom
 * language. `OutlineNav`'s `labels`, `title` and `accessibilityLabel` props
 * still win over these.
 */
export interface OutlineNavMessages {
  /** Names the navigation region and the progress bar, and titles the list. */
  outline: string;
  /** The progress bar's spoken reading, given the position and the total. */
  progress: (at: number, of: number) => string;
}

export const OUTLINE_NAV_MESSAGES: MessageCatalog<OutlineNavMessages> = defineMessages<OutlineNavMessages>('OUTLINE_NAV_MESSAGES', { outline: 'On this page', progress: (at, of) => `Heading ${at} of ${of}` });
