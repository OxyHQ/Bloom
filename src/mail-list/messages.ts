import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { MailStrings } from './types';

/**
 * Every fixed string the mail-list family draws or announces, in each Bloom
 * language: the `MailStrings` set plus the list's own name. A caller's
 * `strings` and `accessibilityLabel` props still win over any entry here.
 */
export interface MailListMessages extends MailStrings {
  /** Names the list region. */
  list: string;
}

export const MAIL_LIST_MESSAGES: MessageCatalog<MailListMessages> =
  defineMessages<MailListMessages>('MAIL_LIST_MESSAGES', {
    draft: 'Draft:',
    unread: 'Unread',
    starred: 'Starred',
    star: 'Star',
    attachment: 'Has attachment',
    select: 'Select',
    threadCount: (n) => plural('en', n, { one: '{n} message', other: '{n} messages' }),
    moreLabels: (n) => plural('en', n, { one: '{n} more label', other: '{n} more labels' }),
    selectedCount: (n) => `${n} selected`,
    selectAll: 'Select all',
    clearSelection: 'Clear selection',
    emptyTitle: 'Nothing here',
    emptyDescription: 'New mail lands in this folder.',
    today: 'Today',
    yesterday: 'Yesterday',
    list: 'Mail',
  });
