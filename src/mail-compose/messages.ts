import { COMMON_MESSAGES } from '../locale/common-messages';
import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { MailComposeStrings } from './types';

/**
 * Every fixed string the mail-compose family draws or announces, in each Bloom
 * language. `send` and `close` are the common words (`COMMON_MESSAGES`), not a
 * second copy. A caller's `strings` prop still wins over any entry here.
 */
export type MailComposeMessages = MailComposeStrings;

export const MAIL_COMPOSE_MESSAGES: MessageCatalog<MailComposeMessages> = defineMessages<MailComposeMessages>('MAIL_COMPOSE_MESSAGES', {
  to: 'To',
  cc: 'Cc',
  bcc: 'Bcc',
  subject: 'Subject',
  showCopies: 'Cc Bcc',
  hideCopies: 'Hide Cc and Bcc',
  removeRecipient: (name) => `Remove ${name}`,
  suggestions: 'Contacts',
  send: COMMON_MESSAGES.en.send,
  sending: 'Sending',
  attach: 'Attach a file',
  discard: 'Discard draft',
  minimize: 'Minimize',
  expand: 'Expand',
  close: COMMON_MESSAGES.en.close,
  title: 'New message',
});
