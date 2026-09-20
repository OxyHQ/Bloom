import type { StyleProp, ViewStyle } from 'react-native';

import type { AccentTone } from '../theme/accent-colors';
import type { TextFieldSize } from '../text-field/shared';

/** The field's two heights, borrowed from `text-field` so a form row lines up. */
export type TagFieldSize = TextFieldSize;

/** One offer in the suggestion list. A bare string is shorthand for `{ value }`. */
export interface TagSuggestion {
  /** The value committed when it is chosen. */
  value: string;
  /** What the row reads, when it is not the value ("Design · 24 items"). */
  label?: string;
  /** A count or hint drawn quietly at the end of the row. */
  meta?: string;
}

/** The English words `TagField` composes. */
export interface TagFieldLabels {
  /** Names a tag's × button, given the tag. Default ``(tag) => `Remove ${tag}` ``. */
  remove?: (tag: string) => string;
  /** The hint under a full field, given the max. Default ``(max) => `${max} maximum` ``. */
  full?: (max: number) => string;
  /** Names the suggestion list. Default `"Suggestions"`. */
  suggestions?: string;
}

export interface TagFieldProps {
  /** The committed tags, in order. Controlled — the app owns the list. */
  value: ReadonlyArray<string>;
  /** Called with the next list, on an add and on a remove. */
  onChange: (value: ReadonlyArray<string>) => void;
  /**
   * The text being typed, when the app wants to own it (to drive a remote
   * suggestion query). Omitted, the field keeps it internally.
   */
  inputValue?: string;
  /** Called with every keystroke. Given with `inputValue`, this is the only way the text changes. */
  onInputValueChange?: (text: string) => void;
  /** Drawn while the field is empty. */
  placeholder?: string;
  /**
   * What to offer under the field. Filtered by what has been typed and by what
   * is already committed, so an app can hand over its whole vocabulary.
   */
  suggestions?: ReadonlyArray<string | TagSuggestion>;
  /** How many suggestions to draw. Default `6`. */
  maxSuggestions?: number;
  /**
   * Whether a tag that is not in `suggestions` can be committed. Default
   * `true`. `false` makes the field a picker over a closed vocabulary.
   */
  allowCreate?: boolean;
  /** The ceiling. At the ceiling the input stops accepting and the hint says so. */
  max?: number;
  /** Called when a commit was refused because the field is full. */
  onMaxReached?: () => void;
  /**
   * How a raw string becomes a tag before it is compared and stored — trimmed
   * by default. Comparison is done on the NORMALISED form, so `"  Design "`
   * and `"Design"` are one tag and the second is dropped in silence.
   */
  normalize?: (raw: string) => string;
  /** The tone the committed chips are painted in. Default `default`. */
  tone?: AccentTone;
  /**
   * Default `medium` (36 tall); `small` is 32. Omitted, it is INHERITED from
   * the nearest `ControlSurface` — the same vocabulary `TextField` and
   * `Textarea` take — so a filter row asks for `small` once instead of writing
   * it on five controls.
   */
  size?: TagFieldSize;
  disabled?: boolean;
  /** Paints the error shell. Combined with an enclosing `Field`'s, never replaced. */
  invalid?: boolean;
  /**
   * The control's own name, for a field used outside a `Field`. Inside one the
   * field's label wins — the words above the box and the announced name cannot
   * disagree.
   */
  label?: string;
  /** Always wins, over the control's own label AND over the field's. */
  accessibilityLabel?: string;
  /** An id the caller wired itself. Outranks the one a `Field` supplies. */
  nativeID?: string;
  labels?: TagFieldLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
