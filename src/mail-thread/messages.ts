import { COMMON_MESSAGES } from '../locale/common-messages';
import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { MailThreadStrings } from './types';

/**
 * Every fixed string the mail-thread family draws or announces, in each Bloom
 * language. `more` is the common word (`COMMON_MESSAGES`), not a second copy.
 * A caller's `strings` prop still wins over any entry here.
 */
export type MailThreadMessages = MailThreadStrings;

export const MAIL_THREAD_MESSAGES: MessageCatalog<MailThreadMessages> = defineMessages<MailThreadMessages>('MAIL_THREAD_MESSAGES', {
  to: 'To',
  cc: 'Cc',
  bcc: 'Bcc',
  reply: 'Reply',
  replyAll: 'Reply all',
  forward: 'Forward',
  more: COMMON_MESSAGES.en.more,
  moreAddresses: (n) => `${n} more`,
  earlierMessages: (n) => plural('en', n, { one: '{n} earlier message', other: '{n} earlier messages' }),
  showTrimmed: 'Show trimmed content',
  hideTrimmed: 'Hide trimmed content',
  unread: 'Unread',
  starred: 'Starred',
  star: 'Star',
  attachments: 'Attachments',
  attachmentCount: (n) => plural('en', n, { one: '{n} attachment', other: '{n} attachments' }),
  expand: 'Expand message',
  collapse: 'Collapse message',
});
