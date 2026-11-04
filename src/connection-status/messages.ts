import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The connection toast's three states, in each Bloom language. The
 * `offlineMessage` / `reconnectingMessage` / `restoredMessage` props still win.
 */
export interface ConnectionStatusMessages {
  /** Shown as soon as the device reports no connection. */
  offline: string;
  /** Replaces `offline` once the outage has lasted a while. */
  reconnecting: string;
  /** Shown briefly when the connection comes back. */
  restored: string;
}

export const CONNECTION_STATUS_MESSAGES: MessageCatalog<ConnectionStatusMessages> =
  defineMessages<ConnectionStatusMessages>('CONNECTION_STATUS_MESSAGES', {
    offline: 'No internet connection',
    reconnecting: 'Reconnecting…',
    restored: 'Back online',
  });
