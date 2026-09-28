import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { MessageDeliveryStatus, PresenceStatus } from './types';

/**
 * Every fixed string the chat-indicators family announces, in each Bloom
 * language. A caller's `label` / `accessibilityLabel` / `formatLabel` prop
 * still wins over any entry here.
 */
export interface ChatIndicatorsMessages {
  /** A presence dot's name per status. */
  presence: Record<PresenceStatus, string>;
  /** A delivery tick's name per status. */
  status: Record<MessageDeliveryStatus, string>;
  /** An unread badge's name with no count. */
  unread: string;
  /** An unread badge's name for a count: "3 unread messages". */
  unreadCount: (count: number) => string;
}

export const CHAT_INDICATORS_MESSAGES: MessageCatalog<ChatIndicatorsMessages> = defineMessages<ChatIndicatorsMessages>('CHAT_INDICATORS_MESSAGES', {
  presence: { online: 'Online', idle: 'Away', offline: 'Offline', busy: 'Busy' },
  status: { sending: 'Sending…', sent: 'Sent', delivered: 'Delivered', read: 'Read', failed: 'Not sent' },
  unread: 'Unread',
  unreadCount: (n) => plural('en', n, { one: '{n} unread message', other: '{n} unread messages' }),
});
