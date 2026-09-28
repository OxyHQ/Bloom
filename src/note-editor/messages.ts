import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { NoteEditorHeaderLabels, NoteEditorToolbarLabels } from './types';

/**
 * Every fixed string the note-editor family draws or announces, in each Bloom
 * language. A caller's `labels`, `placeholder` and `accessibilityLabel` props
 * still win over any entry here.
 */
export interface NoteEditorMessages {
  header: Required<NoteEditorHeaderLabels>;
  /** The empty title's placeholder. */
  untitled: string;
  /** Names the header region. */
  note: string;
  toolbar: Required<NoteEditorToolbarLabels>;
}

export const NOTE_EDITOR_MESSAGES: MessageCatalog<NoteEditorMessages> = defineMessages<NoteEditorMessages>('NOTE_EDITOR_MESSAGES', {
  header: {
    saved: 'Saved',
    saving: 'Saving…',
    offline: 'Offline — changes are held',
    error: 'Not saved',
    words: (n) => plural('en', n, { one: '{n} word', other: '{n} words' }),
    title: 'Title',
  },
  untitled: 'Untitled',
  note: 'Note',
  toolbar: { more: 'More formatting', moreMenu: 'More formatting' },
});
