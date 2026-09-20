/**
 * `TagField`'s geometry — the numbers that make the field one of `text-field`'s
 * boxes rather than a lookalike, and the suggestion list one of Bloom's menus.
 *
 * They are literals here rather than inline in the component because two of
 * them are CONSEQUENCES of `text-field`'s own table and go wrong in silence if
 * they drift: the shell's vertical inset and the chip rung have to add back up
 * to the rung height the field beside it is, or an empty `TagField` and an
 * empty `TextFieldInput` in the same form are two different heights — which is
 * exactly how this control stopped reading as a field.
 */
import type { ChipSize } from '../chip';
import type { TagFieldSize } from './types';

/**
 * Room above and below a line of chips, inside the shell.
 *
 * The input is `TEXT_FIELD_GEOMETRY[size].height - 2 * this`, so an EMPTY tag
 * field is exactly the text field's rung: 4 + 28 + 4 = 36 on `medium`.
 */
export const TAG_FIELD_SHELL_INSET = 4;

/** Between two chips, and between the last chip and the caret. */
export const TAG_FIELD_GAP = 6;

/**
 * The caret's floor. Below it the input wraps to a line of its own rather than
 * shrinking to a slot too narrow to read what is being typed in.
 */
export const TAG_FIELD_INPUT_MIN_WIDTH = 120;

/**
 * The chip rung that FILLS the shell's inner height: `large` (28) inside the 36
 * rung, `medium` (24) inside the 32 one. Not a smaller pill floating in the
 * box — a chosen thing sits on the same line the caret does, which is what
 * `mail-compose`'s recipient chips do inside their own row.
 */
export const TAG_CHIP_RUNG: Readonly<Record<TagFieldSize, ChipSize>> = {
  medium: 'large',
  small: 'medium',
};

/* -------------------------------------------------------------------------- */
/*  The suggestion list — the menu vocabulary, in normal flow                  */
/* -------------------------------------------------------------------------- */

/** `rounded-radius-16` — the corner every anchored Bloom surface takes. */
export const TAG_FIELD_LIST_RADIUS = 16;
/** `p-space-8` — the listbox panel's inset (`floating/constants.ts`). */
export const TAG_FIELD_LIST_PADDING = 8;
/** The panel's own row rhythm (`gap-space-4`). */
export const TAG_FIELD_LIST_GAP = 4;
/** `rounded-[10px]` — the menu row's corner. */
export const TAG_FIELD_OPTION_RADIUS = 10;
/** `p-space-8` — 8 on every side, which is what makes a one-line row 36 tall. */
export const TAG_FIELD_OPTION_PADDING = 8;
/** `gap-space-8` between a row's label and its meta. */
export const TAG_FIELD_OPTION_GAP = 8;
/** One menu row: 8 + a 20px line box + 8. */
export const TAG_FIELD_OPTION_MIN_HEIGHT = 36;
