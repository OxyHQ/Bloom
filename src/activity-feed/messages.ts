import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { ActivityFeedKind } from './types';

/**
 * Every fixed string the activity feed and its filter row draw or announce, in
 * each Bloom language. A caller's `labels`, `emptyLabel`, `formatLoggedBy` and
 * `accessibilityLabel` still win.
 */
export interface ActivityFeedMessages {
  /** Each kind's word: the entry's meta line and the filter chip. */
  kinds: Record<ActivityFeedKind, string>;
  /** What an empty feed says. */
  empty: string;
  /** The trail under an entry. */
  loggedBy: (name: string) => string;
  /** Names the filter row. */
  filterActivity: string;
}

export const ACTIVITY_FEED_MESSAGES: MessageCatalog<ActivityFeedMessages> =
  defineMessages<ActivityFeedMessages>('ACTIVITY_FEED_MESSAGES', {
    kinds: {
      call: 'Call',
      email: 'Email',
      meeting: 'Meeting',
      note: 'Note',
      'stage-change': 'Stage change',
      task: 'Task completed',
    },
    empty: 'Nothing logged yet',
    loggedBy: (name) => `Logged by ${name}`,
    filterActivity: 'Filter activity',
  });
