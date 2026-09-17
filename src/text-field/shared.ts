import { Platform, type ViewStyle } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';

import {
  DANGER_TABLE,
  colorRamp,
  mixColor,
  resolveButtonRamps,
} from '../button/shared';
import type { Theme } from '../theme/types';
import { TYPE_SCALE } from '../typography/scale';

/**
 * The geometry and palette the `Input` shell paints, shared by `TextField`,
 * `Textarea` and `InputGroup` so a stacked input and textarea line up to the
 * pixel and change colour together.
 *
 *                 medium          small
 *   height        36              32
 *   shell px      8               6
 *   input pl      4               4
 *   text          14/20 400       14/20 400
 *   icon          20              20
 *   radius        10              10
 *
 * The shell is a FILLED surface with an inset 2px ring rather than a border:
 * transparent at rest, `border-button-hover` on hover, `border-button-active`
 * on focus, and no ring at all once the field is invalid or disabled — the
 * tinted fill carries those states. The focus ring on a text field is
 * NEUTRAL, not the accent; the accent ring belongs to the OTP boxes.
 */

export type TextFieldSize = 'medium' | 'small';

export interface TextFieldGeometry {
  height: number;
  paddingHorizontal: number;
}

export const TEXT_FIELD_GEOMETRY: Record<TextFieldSize, TextFieldGeometry> = {
  medium: { height: 36, paddingHorizontal: 8 },
  small: { height: 32, paddingHorizontal: 6 },
};

/**
 * The shell's side padding with a `leadingAddon` (`fieldWithAddonSize`):
 * `pl-1 pr-2` on medium, `pl-1 pr-1.5` on small. Longhands, because that is what
 * the shell spells them in, so a caller's `paddingLeft` still wins on web.
 */
export const TEXT_FIELD_ADDON_PADDING: Record<
  TextFieldSize,
  { paddingLeft: number; paddingRight: number }
> = {
  medium: { paddingLeft: 4, paddingRight: 8 },
  small: { paddingLeft: 4, paddingRight: 6 },
};

/** `rounded-2lg`. */
export const TEXT_FIELD_RADIUS = 10;
/** Width of the inset ring (`ring-2 ring-inset`). */
export const TEXT_FIELD_RING_WIDTH = 2;
/** `pl-1` on the control. */
export const TEXT_FIELD_INPUT_INSET = 4;
/** `size-5` adornments. */
export const TEXT_FIELD_ICON_SIZE = 20;
/** `gap-0.5` between a leading icon and the control. */
export const TEXT_FIELD_LEADING_GAP = 2;
/** `gap-2` between the control and a trailing adornment. */
export const TEXT_FIELD_TRAILING_GAP = 8;
/** `gap-1` between label, shell and hint. */
export const TEXT_FIELD_STACK_GAP = 4;
/** `--input-transition-ms`. */
export const TEXT_FIELD_TRANSITION_MS = 150;

/** `text-body-regular` — the control. */
export const TEXT_FIELD_TEXT = TYPE_SCALE['body-regular'];
/** `text-body-medium` — the label. */
export const TEXT_FIELD_LABEL_TEXT = TYPE_SCALE['body-medium'];
/** `text-caption-1-medium` — hint and counter. */
export const TEXT_FIELD_HINT_TEXT = TYPE_SCALE['caption-1-medium'];

/** Bloom's sans family, as the typography primitives resolve it. */
export const SANS_FONT_FAMILY =
  Platform.OS === 'web' ? 'var(--bloom-font-sans)' : 'Inter';
/** Bloom's mono family (`font-mono`). */
export const MONO_FONT_FAMILY =
  Platform.OS === 'web' ? 'var(--bloom-font-mono)' : 'JetBrains Mono';

/** Web-only colour transition on the shell; inert on native. */
const TEXT_FIELD_TRANSITION_STYLE: WebCssStyle = {
  transitionProperty: 'background-color, border-color, box-shadow, color',
  transitionDuration: `${TEXT_FIELD_TRANSITION_MS}ms`,
  transitionTimingFunction: 'ease',
};

export const TEXT_FIELD_WEB_TRANSITION: ViewStyle | undefined =
  Platform.OS === 'web' ? TEXT_FIELD_TRANSITION_STYLE : undefined;

export interface TextFieldPalette {
  /** `background-tertiary-default`. */
  background: string;
  /** `input-disabled-background`. */
  backgroundDisabled: string;
  /** `background-tertiary-error`. */
  backgroundInvalid: string;
  /** `border-button-hover` — the ring under a parked pointer. */
  ringHover: string;
  /** `border-button-active` — the ring while focused. */
  ringFocus: string;
  /** `text-primary`. */
  text: string;
  /** `input-disabled-text` — value and placeholder of a disabled field. */
  textDisabled: string;
  /** `text-tertiary` — the resting placeholder. */
  placeholder: string;
  /** `text-error-placeholder` — the placeholder of an invalid field. */
  placeholderInvalid: string;
  /** `foreground-icon-tertiary` — adornments. */
  icon: string;
  /** `input-disabled-foreground`. */
  iconDisabled: string;
  /** `foreground-icon-error`. */
  iconInvalid: string;
  /** `text-secondary` — hint text. */
  hint: string;
  /** `text-error-primary` — invalid hint, required asterisk. */
  error: string;
  /** `foreground-icon-quaternary` — the label's info glyph. */
  infoIcon: string;
  /** `text-tertiary` — the character counter. */
  count: string;
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)';
export { TRANSPARENT as TEXT_FIELD_TRANSPARENT };

/**
 * Resolve the input tokens against a Bloom theme, light (`:root`) or dark
 * (`.dark`). Pure, so it can be walked over every preset × mode without
 * rendering.
 *
 * The dark `color-mix(... N%, transparent)` tokens are composited over
 * the theme's page background, which is what they sit on there
 * (`background-full`).
 */
export function resolveTextFieldPalette(theme: Theme): TextFieldPalette {
  const c = theme.colors;
  const { neutral: n } = resolveButtonRamps(theme);
  const red = colorRamp(c.negative, DANGER_TABLE);

  if (theme.isDark) {
    const backgroundDisabled = mixColor(c.background, n[800], 0.3);
    return {
      background: n[800],
      backgroundDisabled,
      backgroundInvalid: mixColor(c.background, red[950], 0.6),
      ringHover: n[500],
      ringFocus: n[600],
      text: c.text,
      textDisabled: mixColor(backgroundDisabled, n[500], 0.4),
      placeholder: n[600],
      placeholderInvalid: red[400],
      icon: n[600],
      iconDisabled: n[600],
      iconInvalid: red[400],
      hint: n[500],
      error: red[400],
      infoIcon: n[700],
      count: n[600],
    };
  }

  return {
    background: n[200],
    backgroundDisabled: n[100],
    backgroundInvalid: red[100],
    ringHover: n[300],
    ringFocus: n[400],
    text: c.text,
    textDisabled: n[300],
    placeholder: n[400],
    placeholderInvalid: red[400],
    icon: n[400],
    iconDisabled: n[300],
    iconInvalid: red[600],
    hint: n[500],
    error: red[500],
    infoIcon: n[300],
    count: n[400],
  };
}

export interface TextFieldState {
  hovered: boolean;
  focused: boolean;
  invalid: boolean;
  disabled: boolean;
}

/** The shell's fill and ring for one interaction state. */
export function resolveShellPaint(
  palette: TextFieldPalette,
  { hovered, focused, invalid, disabled }: TextFieldState,
): { backgroundColor: string; borderColor: string } {
  // Invalid is declared after disabled in the class list, so its fill wins.
  const backgroundColor = invalid
    ? palette.backgroundInvalid
    : disabled
      ? palette.backgroundDisabled
      : palette.background;
  const borderColor =
    invalid || disabled
      ? TRANSPARENT
      : focused
        ? palette.ringFocus
        : hovered
          ? palette.ringHover
          : TRANSPARENT;
  return { backgroundColor, borderColor };
}

/**
 * The placeholder colour. `aria-invalid:` is emitted after `disabled:` and
 * `focus:` in the stylesheet, so invalid wins over both; a focused field
 * darkens its placeholder to `text-primary`.
 */
export function resolvePlaceholderColor(
  palette: TextFieldPalette,
  { focused, invalid, disabled }: TextFieldState,
): string {
  if (invalid) return palette.placeholderInvalid;
  if (disabled) return palette.textDisabled;
  if (focused) return palette.text;
  return palette.placeholder;
}

/** Adornment colour: `foreground-icon-tertiary`, dimmed or reddened by state. */
export function resolveIconColor(
  palette: TextFieldPalette,
  { invalid, disabled }: Pick<TextFieldState, 'invalid' | 'disabled'>,
): string {
  if (invalid) return palette.iconInvalid;
  if (disabled) return palette.iconDisabled;
  return palette.icon;
}
