import type { StyleProp, ViewStyle } from 'react-native';

import type { AccentTone } from '../theme/accent-colors';

/**
 * The two shapes one note takes in a list.
 *
 *   `grid`  the masonry/board preview — a tall excerpt, the tag row under it,
 *           the metadata trail last. What a board of captures looks like.
 *   `row`   the dense list line — one line of excerpt with the metadata trail
 *           folded in after it, tags after that on the same line.
 *
 * They are ONE component and not two, because everything but the arrangement is
 * the same decision: which fields a note shows, how it is tinted, what selection
 * looks like. A second component is where the two drift.
 */
export type NoteCardDensity = 'grid' | 'row';

/** One line of a checklist preview. Read-only: the card previews, it does not edit. */
export interface NoteChecklistItem {
  /** Stable key for the row. */
  id: string;
  /** The item as written. One line, truncated. */
  label: string;
  /** Whether it is ticked. */
  done?: boolean;
}

/**
 * The trail a note carries under its body: when it was touched, where it lives,
 * what is attached to it, whether it is sealed.
 *
 * Every value is PRE-FORMATTED by the app — Bloom does not know the reader's
 * locale, the app's relative-time vocabulary or what a notebook is called.
 */
export interface NoteCardMeta {
  /** When it was last written to, as drawn ("2 min ago", "14 Mar"). */
  edited?: string;
  /** The notebook it sits in ("Field notes"). Drawn with a folder glyph. */
  notebook?: string;
  /** How many files hang off it. `0` and `undefined` both draw nothing. */
  attachments?: number;
  /** A protected note draws a lock and hides nothing else — the excerpt is the app's to withhold. */
  locked?: boolean;
}

/** The English words `NoteCard` composes, for an app that is not in English. */
export interface NoteCardLabels {
  /** Names the pin marker. Default `"Pinned"`. */
  pinned?: string;
  /** Names the lock marker. Default `"Protected"`. */
  locked?: string;
  /** Names the attachment count, given the count. Default ``(n) => `${n} attachments` ``. */
  attachments?: (count: number) => string;
  /** Names the selection checkbox. Default `"Select note"`. */
  select?: string;
  /** The checked state of a previewed checklist item. Default `"Done"`. */
  checklistDone?: string;
  /** The unchecked state. Default `"To do"`. */
  checklistTodo?: string;
  /** The "+N" overflow under a truncated checklist, given the remainder. Default ``(n) => `${n} more` ``. */
  more?: (count: number) => string;
}

export interface NoteCardProps {
  /** The note's title. One line in `row`, two in `grid`; truncated, never wrapped away. */
  title: string;
  /**
   * The opening of the body, as plain text. Clamped — four lines in `grid`, one
   * in `row`. Ignored when `checklist` is given: a checklist note previews as a
   * checklist, because a flattened one reads as a paragraph of fragments.
   */
  excerpt?: string;
  /**
   * The note's body when it IS a checklist. The first few items with their
   * ticked state, drawn in `Checkbox`'s own box — read-only, so nothing here
   * takes a press.
   */
  checklist?: ReadonlyArray<NoteChecklistItem>;
  /**
   * How many items the checklist has in total, when `checklist` is only its
   * head. Drives the "+N more" line. Defaults to `checklist.length`.
   */
  checklistTotal?: number;
  /** The note's tags, as drawn. Rendered as `Chip`s; the overflow becomes "+N". */
  tags?: ReadonlyArray<string>;
  /** How many tags to draw before the "+N" pill. Default `3` in `grid`, `2` in `row`. */
  maxTags?: number;
  /** The metadata trail. Every member is optional and an absent one draws nothing. */
  meta?: NoteCardMeta;
  /** Draws the pin marker in the corner (`grid`) or before the title (`row`). */
  pinned?: boolean;
  /**
   * The note's colour, from Bloom's accent tones — the card is washed in that
   * tone's subtle tint and every quiet line is re-measured against the WASH, not
   * against the page. There is no hex here on purpose: a note colour picked by
   * eye is the one that disappears in dark mode.
   */
  tone?: AccentTone;
  /** Default `grid`. */
  density?: NoteCardDensity;
  /** Marks the card as the current one (a board's focused note, a split view's open note). */
  selected?: boolean;
  /**
   * Turns on multi-select: a checkbox takes the leading slot and a press on the
   * card TOGGLES rather than opens. This is the state a notes app spends its bulk
   * actions in, so it is a mode of the card rather than a second component.
   */
  selectable?: boolean;
  /** Called with the next selected state while `selectable`. */
  onSelectedChange?: (selected: boolean) => void;
  /** Called when the card is opened. Not called while `selectable`. */
  onPress?: () => void;
  /** A long press — the app's shortcut into selection mode or a sheet. */
  onLongPress?: () => void;
  /** Draws the skeleton in the same geometry. See `NoteCardSkeleton`. */
  loading?: boolean;
  /**
   * Replaces the composed accessible name ("Harbour notes, Pinned, 3 items, 2
   * min ago"), which is English.
   */
  accessibilityLabel?: string;
  /** Replaces the English words above. */
  labels?: NoteCardLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface NoteCardSkeletonProps {
  /** Match the card it stands in for. Default `grid`. */
  density?: NoteCardDensity;
  /** How many excerpt lines to draw. Default `3` in `grid`, `1` in `row`. */
  lines?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
