import {
  NoteCard as BloomNoteCard,
  type NoteCardProps,
  NoteCardSkeleton as BloomNoteCardSkeleton,
} from '@oxy.so/bloom/note-card';

import { Node, type ViewModifiers } from '../node';
import type { AccentTone, NoteCardLayout } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** One note as a preview, and its skeleton. */
export type NoteCardKind = 'noteCard' | 'noteCardSkeleton';

/**
 * Bloom `NoteCard`'s data: its excerpt or checklist, tags, metadata, pin,
 * selection (`selected`, `selectable`, `onSelectedChange`) and words.
 */
export type NoteCardOptions = Omit<
  NoteCardProps,
  | 'style'
  | 'testID'
  | 'accessibilityLabel'
  | 'title'
  | 'density'
  | 'tone'
  | 'loading'
  | 'onPress'
  | 'onLongPress'
>;

/** Bloom `NoteCard`; `.onPress()` opens it and `.onLongPress()` is its own. */
export interface NoteCardView extends ViewModifiers<NoteCardView> {
  /** `grid` (default) or `row`. */
  style(value: NoteCardLayout): NoteCardView;
  /** The note's colour: an accent tone, its wash. */
  tint(value: AccentTone): NoteCardView;
  /** The skeleton in the card's geometry. */
  loading(value?: boolean): NoteCardView;
}
/** Bloom `NoteCardSkeleton`. */
export interface NoteCardSkeletonView extends ViewModifiers<NoteCardSkeletonView> {
  style(value: NoteCardLayout): NoteCardSkeletonView;
  /** How many excerpt lines it draws. */
  lines(value: number): NoteCardSkeletonView;
}

export function NoteCard(title: string, options: NoteCardOptions = {}): NoteCardView {
  return new Node('noteCard', { title, options }, []);
}
export function NoteCardSkeleton(): NoteCardSkeletonView {
  return new Node('noteCardSkeleton', {}, []);
}

export const NOTE_CARDS: Record<NoteCardKind, ControlRenderer> = {
  noteCard: product(BloomNoteCard, {
    press: true,
    own: (d) => ({
      density: d.own('style')?.value,
      tone: d.own('tint')?.value,
      loading: d.own('loading')?.value,
    }),
  }),
  noteCardSkeleton: product(BloomNoteCardSkeleton, {
    own: (d) => ({ density: d.own('style')?.value, lines: d.own('lines')?.value }),
  }),
};
