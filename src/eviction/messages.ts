import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { EvictionStatus } from './types';

/**
 * Every fixed string the eviction family draws or announces, in each Bloom
 * language. A caller's `*Label` props and `formatSource` still win.
 */
export interface EvictionMessages {
  /** The status badge's word. */
  status: Record<EvictionStatus, string>;
  /** The attendance toggle ("I'll be there"). */
  attend: string;
  share: string;
  contactSupport: string;
  verified: string;
  /** Names `EvictionTimeline`'s list. */
  caseHistory: string;
  /** A history entry's source, beside its date. */
  source: (source: string) => string;
}

export const EVICTION_MESSAGES: MessageCatalog<EvictionMessages> = defineMessages<EvictionMessages>('EVICTION_MESSAGES', {
  status: {
    scheduled: 'Scheduled',
    postponed: 'Postponed',
    suspended: 'Suspended',
    executed: 'Executed',
    cancelled: 'Cancelled',
  },
  attend: "I'll be there",
  share: 'Share',
  contactSupport: 'Contact support group',
  verified: 'Community verified',
  caseHistory: 'Case history',
  source: (source) => `Source: ${source}`,
});
