import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { NoteCardLabels } from './types';

/**
 * Every fixed string `NoteCard` draws or announces, in each Bloom language. A
 * caller's `labels` prop still wins over any entry here.
 */
export type NoteCardMessages = Required<NoteCardLabels>;

export const NOTE_CARD_MESSAGES: MessageCatalog<NoteCardMessages> =
  defineMessages<NoteCardMessages>('NOTE_CARD_MESSAGES', {
    pinned: 'Pinned',
    locked: 'Protected',
    attachments: (n) => plural('en', n, { one: '{n} attachment', other: '{n} attachments' }),
    select: 'Select note',
    checklistDone: 'Done',
    checklistTodo: 'To do',
    more: (n) => `${n} more`,
  });
