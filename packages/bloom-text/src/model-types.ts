/**
 * The rich text model's types: platform-free, so a server can read them
 * without React Native's (`types.ts` adds the input component's).
 */
/** A mention: who or what it points at, and the character that opened it. */
export interface MentionMark {
  /** The trigger character, e.g. `@` for people or `[[` for pages. */
  indicator: string;
  /** Application data carried with the mention (an id, a kind). */
  attributes: Record<string, string>;
}

/**
 * Inline marks on a run of text. `color` and `background` are colour NAMES the
 * application resolves (e.g. `"blue"`), never raw CSS.
 */
export interface TextMarks {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  color?: string;
  background?: string;
  link?: string;
  mention?: MentionMark;
}

/** One run of text with the same marks. A rich text value is a `Segment[]`. */
export interface Segment extends TextMarks {
  text: string;
}

/**
 * One contiguous edit between two strings: replace `deleteCount` UTF-16 code
 * units at `index` with `insert`.
 */
export interface TextEdit {
  index: number;
  deleteCount: number;
  insert: string;
}

/** Selection in UTF-16 offsets over the plain text; collapsed when equal. */
export interface TextSelection {
  start: number;
  end: number;
}

/** A key press with its modifiers. `mod` is Cmd on Apple platforms, Ctrl elsewhere. */
export interface KeyCommand {
  key: string;
  shift: boolean;
  alt: boolean;
  mod: boolean;
}

/** The marks a user can toggle on a selection. */
export type ToggleableMark = 'bold' | 'italic' | 'underline' | 'strike' | 'code';

/** Which toggleable marks are active at the selection. */
export type ActiveMarks = Record<ToggleableMark | 'link' | 'mention', boolean>;

export interface RichTextChange {
  segments: Segment[];
  text: string;
  /** The text edit that produced this change; null when only marks changed. */
  edit: TextEdit | null;
}
