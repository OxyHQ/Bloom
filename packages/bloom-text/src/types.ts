import type { StyleProp, ViewStyle } from 'react-native';

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

export interface RichTextInputProps {
  /**
   * The value. The input owns its content while the user types; a `value`
   * that differs from the one it last reported (a remote or programmatic
   * change) replaces its content.
   */
  value: Segment[];
  onChange: (change: RichTextChange) => void;
  onSelectionChange?: (selection: TextSelection) => void;
  onActiveMarksChange?: (marks: ActiveMarks) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Hardware/soft key presses, e.g. `Enter`, `Backspace`, `Tab`. */
  onKeyPress?: (key: string) => void;
  /**
   * A key with its modifiers, before the input acts on it. Return true to
   * claim it: the input then does nothing with it. On native, modifiers are
   * not reported and the input has already acted (only Backspace, Tab and the
   * like arrive, after the fact).
   */
  onKeyCommand?: (command: KeyCommand) => boolean;
  /**
   * Called on Return instead of inserting a line break. Omit it for a
   * multi-line input where Return inserts a newline.
   */
  onSubmit?: () => void;
  /** Characters that start a mention, e.g. `['@']`. */
  mentionIndicators?: string[];
  onMentionQuery?: (query: { indicator: string; text: string } | null) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  editable?: boolean;
  autoFocus?: boolean;
  /** Visual style of the text: font, size, colour, line height. */
  textStyle?: RichTextStyle;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

/** Typography for the editable text. */
export interface RichTextStyle {
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  fontWeight?: '400' | '500' | '600' | '700';
  linkColor?: string;
  codeColor?: string;
  codeBackgroundColor?: string;
  mentionColor?: string;
  mentionBackgroundColor?: string;
}

export interface RichTextInputHandle {
  focus(): void;
  blur(): void;
  /** Whether the input holds the keyboard focus right now. */
  isFocused(): boolean;
  setSelection(start: number, end: number): void;
  toggleMark(mark: ToggleableMark): void;
  setLink(start: number, end: number, text: string, url: string): void;
  removeLink(start: number, end: number): void;
  /** Start a mention at the caret with `indicator`. */
  startMention(indicator: string): void;
  /** Replace the open mention query with a finished mention. */
  insertMention(indicator: string, text: string, attributes: Record<string, string>): void;
}
