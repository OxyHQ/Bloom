import type { StyleProp, ViewStyle } from 'react-native';
import type {
  ActiveMarks,
  KeyCommand,
  MentionMark,
  RichTextChange,
  Segment,
  TextEdit,
  TextMarks,
  TextSelection,
  ToggleableMark,
} from './model-types';

export type {
  ActiveMarks,
  KeyCommand,
  MentionMark,
  RichTextChange,
  Segment,
  TextEdit,
  TextMarks,
  TextSelection,
  ToggleableMark,
} from './model-types';

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
  /**
   * Images pasted into the input (a screenshot, a copied picture), for the
   * app to upload: a `blob:` URL on web, a file URI on native. Without it
   * the input does not take pasted images.
   */
  onPasteImages?: (images: PastedImage[]) => void;
  /**
   * Web: a paste, before the input acts on it, with what the clipboard holds
   * as HTML and as plain text. Return true to claim it: the input then pastes
   * nothing. Pasted image files go to `onPasteImages` instead. Native inputs
   * paste on their own and never call it.
   */
  onPaste?: (paste: PasteData) => boolean;
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
  /** Web: forwarded to the actual editable surface, not its wrapper. */
  'aria-controls'?: string;
  'aria-activedescendant'?: string;
  'aria-expanded'?: boolean;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
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
  /**
   * Where stretches of the text are drawn, for marking them over the input
   * (a collaborator's selection, a commented passage): for each range, its
   * boxes relative to the input's top-left corner — one per line it is drawn
   * on, or one of no width where a collapsed range (a caret) is.
   *
   * Web only. Null on native, where `react-native-enriched-html` exposes no
   * text layout, and whenever the input does not show the current `value`
   * (a value given a moment ago and not yet applied): a box is never drawn
   * where the text it marks is not.
   */
  measureRanges(ranges: readonly TextSelection[]): TextRect[][] | null;
}

/** A box in the input's coordinates. */
export interface TextRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** An image pasted into the input. */
export interface PastedImage {
  /** A `blob:` URL on web (revoke it when done), a file URI on native. */
  uri: string;
  /** Its media type, e.g. `image/png`. */
  type: string;
  width: number;
  height: number;
}

/** What a paste carries: the clipboard's HTML (empty when it has none) and plain text. */
export interface PasteData {
  html: string;
  text: string;
}
