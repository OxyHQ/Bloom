import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The connection animation's accessible name, in each Bloom language. A
 * caller's `accessibilityLabel` still wins.
 */
export interface ConnectionDotsMessages {
  connecting: string;
}

export const CONNECTION_DOTS_MESSAGES: MessageCatalog<ConnectionDotsMessages> = defineMessages<ConnectionDotsMessages>('CONNECTION_DOTS_MESSAGES', {
  connecting: 'Connecting',
});
