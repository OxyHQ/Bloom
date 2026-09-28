import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  BUTTON_SHADOW,
} from '../button/shared';
import {
  MONO_FONT_FAMILY,
  TEXT_FIELD_RADIUS,
  TEXT_FIELD_TRANSITION_MS,
} from '../text-field/shared';
import { TYPE_SCALE } from '../typography/scale';
import { useMessages } from '../locale/messages';
import { INPUT_OTP_MESSAGES } from './messages';
import type { InputOtpProps, InputOtpType } from './types';
import { useFieldMembership } from '../field/membership';

/**
 * `InputOtp`: one box per digit, side by side, behaving as ONE value.
 *
 *   box     48 × 48, radius 10, 1px border, shadow-xs; narrower (never
 *           wider) when the row does not fit its container
 *   digit   mono, title-3-medium 18/26 500, centred, tabular numerals
 *   gap     8 between boxes, +12 before each `groupEvery` group
 *   focus   accent-500 border + 2px accent-500 ring (outside the border)
 *
 * The two views have to stay in step in every direction:
 *
 *   type      fills a box and advances
 *   Backspace clears the box, or steps back when the box is already empty
 *   arrows    move between boxes without changing anything (web / hardware keys)
 *   paste     distributes across the boxes from the box that received it
 *   autofill  the OS hands the whole code to one box at once
 *
 * That last one is why every box carries the one-time-code autocomplete hint
 * and why a change may carry more than one character: iOS and Chrome both
 * deliver the full code into whichever box has focus, and a box that only
 * accepted one character would silently drop the rest of it.
 *
 * Digits are monospace so the boxes stay optically even — in a proportional
 * face a `1` is visibly narrower than an `8`.
 *
 * `type="alphanumeric"` is the same field for codes that carry letters: every
 * character is upper-cased, anything outside `A`–`Z`/`0`–`9` is dropped (so a
 * code printed as `ABCDE-12345` pastes whole), and the keyboard is a letters
 * one with auto-capitalisation instead of the number pad.
 *
 * Focus paints on EVERY focus, not only keyboard focus: a text input matches
 * `:focus-visible` on a pointer focus too, so the ring shows on click, and
 * state (not CSS) carries it here so native paints the same ring.
 */

const NOT_DIGIT = /\D/g;
/** Filtered BEFORE upper-casing: `'ß'.toUpperCase()` is `SS`, `'ı'` becomes `I`. */
const NOT_ALPHANUMERIC = /[^A-Za-z0-9]/g;
const BOX_SIZE = 48;
const BOX_GAP = 8;
const GROUP_GAP = 12;
const RING_WIDTH = 2;
/** `text-title-3-medium`. */
const DIGIT_TEXT = TYPE_SCALE['title-3-medium'];
const IS_WEB = Platform.OS === 'web';

export interface InputOtpPalette {
  /** `background-primary-default`. */
  background: string;
  /** `background-primary-disabled`. */
  backgroundDisabled: string;
  /** `background-tertiary-error`. */
  backgroundInvalid: string;
  /** `border-button-default`. */
  border: string;
  /** `border-button-hover`. */
  borderHover: string;
  /** `border-error-default`. */
  borderInvalid: string;
  /** `border-focus-ring` (accent-500). */
  ring: string;
  /** `text-primary`. */
  text: string;
  /** `text-tertiary` — a disabled digit. */
  textDisabled: string;
  /** `foreground-icon-error` — an invalid digit. */
  textInvalid: string;
  /** Tailwind `shadow-xs`, and its dark override. */
  shadow: string;
}

/** Resolve the OTP box's tokens against a Bloom theme. Pure. */
export function resolveInputOtpPalette(theme: Theme): InputOtpPalette {
  const c = theme.colors;
  return {
    background: c.backgroundSecondary,
    backgroundDisabled: c.backgroundSecondary,
    backgroundInvalid: c.errorSubtle,
    border: c.borderLight,
    borderHover: c.border,
    borderInvalid: c.errorSubtleForeground,
    ring: c.primary,
    text: c.text,
    textDisabled: c.textTertiary,
    textInvalid: c.errorSubtleForeground,
    shadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
  };
}

export interface InputOtpBoxState {
  hovered: boolean;
  focused: boolean;
  invalid: boolean;
  disabled: boolean;
}

/** One box's paint, in the state precedence below. Pure. */
export function resolveInputOtpBoxPaint(
  palette: InputOtpPalette,
  { hovered, focused, invalid, disabled }: InputOtpBoxState,
): { backgroundColor: string; borderColor: string; color: string; boxShadow: string } {
  const interactive = !disabled;
  // `focus-visible:` and `hover:` are variants, emitted after the plain
  // `border-border-error-default` — focus wins over the red edge, while an
  // invalid box pins `hover:border-border-error-default` so hover does not.
  const borderColor =
    focused && interactive
      ? palette.ring
      : invalid
        ? palette.borderInvalid
        : hovered && interactive
          ? palette.borderHover
          : palette.border;
  const backgroundColor = disabled
    ? palette.backgroundDisabled
    : invalid
      ? palette.backgroundInvalid
      : palette.background;
  const color = disabled ? palette.textDisabled : invalid ? palette.textInvalid : palette.text;
  const boxShadow = disabled
    ? 'none'
    : focused
      ? `0 0 0 ${RING_WIDTH}px ${palette.ring}, ${palette.shadow}`
      : palette.shadow;
  return { backgroundColor, borderColor, color, boxShadow };
}

/** The characters `type` accepts, in order; everything else is dropped. Pure. */
export function cleanInputOtpValue(raw: string, type: InputOtpType = 'numeric'): string {
  return type === 'alphanumeric' ? raw.replace(NOT_ALPHANUMERIC, '').toUpperCase() : raw.replace(NOT_DIGIT, '');
}

const clean = (raw: string, length: number, type: InputOtpType) => cleanInputOtpValue(raw, type).slice(0, length);

/**
 * Keyboard and input hints per `type`. The one-time-code autofill hint is
 * shared (below); only what the keyboard offers differs. Android has no
 * `ascii-capable`, and its `visible-password` is the letters keyboard without
 * suggestions or autocorrect — both of which would rewrite a code.
 *
 * Alphanumeric sets `inputMode` on web ONLY: React Native gives `inputMode`
 * precedence over `keyboardType`, so `inputMode: 'text'` on native would open
 * the ordinary keyboard instead of `ascii-capable` / `visible-password`.
 */
const KEYBOARD_PROPS: Record<InputOtpType, Record<string, unknown>> = {
  numeric: { inputMode: 'numeric', keyboardType: 'number-pad' },
  alphanumeric: {
    ...(IS_WEB
      ? { inputMode: 'text' }
      : { keyboardType: Platform.OS === 'android' ? 'visible-password' : 'ascii-capable' }),
    autoCapitalize: 'characters',
    autoCorrect: false,
    spellCheck: false,
  },
};

const WEB_BOX_STYLE: TextStyle | undefined = IS_WEB
  ? ({
      outlineWidth: 0,
      outlineStyle: 'none',
      transitionProperty: 'background-color, border-color, box-shadow',
      transitionDuration: `${TEXT_FIELD_TRANSITION_MS}ms`,
      transitionTimingFunction: 'ease',
    } as unknown as TextStyle)
  : undefined;

export function InputOtp({
  length = 6,
  type = 'numeric',
  value,
  defaultValue = '',
  onChange,
  onComplete,
  invalid: invalidProp,
  isInvalid,
  isDisabled,
  disabled: disabledAlias,
  groupEvery,
  autoFocus = false,
  accessibilityLabel,
  style,
  testID,
}: InputOtpProps) {
  const theme = useTheme();
  const { messages } = useMessages(INPUT_OTP_MESSAGES);
  const palette = useMemo(() => resolveInputOtpPalette(theme), [theme]);
  // SEVERAL controls behind one name: the boxes are the field's `multiple` case
  // (`docs/field.mdx`), so the GROUP takes the field's name and description and
  // each box keeps its own name and its own `aria-invalid`. A caller's own
  // `accessibilityLabel` still wins; the catalog's "One-time code" is the last resort rather
  // than a default that would outrank the field's label.
  const membership = useFieldMembership({
    accessibilityLabel,
    disabled: isDisabled ?? disabledAlias ?? false,
    invalid: invalidProp ?? isInvalid,
  });
  const disabled = membership.disabled;
  const invalid = membership.invalid;
  const groupName = membership.accessibilityLabel ?? messages.oneTimeCode;

  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [internal, setInternal] = useState(() => clean(defaultValue, length, type));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const controlled = value !== undefined;
  const code = clean(controlled ? value : internal, length, type);
  const boxName = type === 'alphanumeric' ? messages.characterOf : messages.digitOf;

  const commit = useCallback(
    (next: string) => {
      // `next` is already cleaned per character (a cleared box is a space
      // placeholder, which `clean` drops along with anything else).
      const cleaned = clean(next, length, type);
      if (!controlled) setInternal(cleaned);
      onChange?.(cleaned);
      if (cleaned.length === length) onComplete?.(cleaned);
    },
    [controlled, length, type, onChange, onComplete],
  );

  const focusBox = useCallback(
    (index: number) => {
      inputsRef.current[Math.max(0, Math.min(index, length - 1))]?.focus();
    },
    [length],
  );

  /** Writes `text` starting at `index`, which covers typing, paste and autofill. */
  const writeFrom = (index: number, text: string) => {
    const incoming = cleanInputOtpValue(text, type);
    if (incoming === '') return;
    const chars = code.padEnd(length, ' ').split('');
    for (let offset = 0; offset < incoming.length && index + offset < length; offset += 1) {
      chars[index + offset] = incoming[offset] as string;
    }
    commit(chars.join('').trimEnd());
    focusBox(index + incoming.length);
  };

  const onKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    const { key } = event.nativeEvent;
    if (key === 'Backspace') {
      event.preventDefault();
      const chars = code.padEnd(length, ' ').split('');
      if (code[index] && code[index] !== ' ') {
        // Clear in place; the caret only steps back on an already-empty box,
        // which is what makes holding Backspace feel right.
        chars[index] = ' ';
        commit(chars.join('').trimEnd());
        return;
      }
      chars[Math.max(0, index - 1)] = ' ';
      commit(chars.join('').trimEnd());
      focusBox(index - 1);
      return;
    }
    if (key === 'ArrowLeft') {
      event.preventDefault();
      focusBox(index - 1);
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  return (
    <View
      role="group"
      accessibilityLabel={groupName}
      aria-describedby={membership.describedBy}
      testID={testID}
      // No `aria-invalid` here: `group` does not support it. Each box carries
      // its own, which is where a screen reader looks anyway.
      style={[{ flexDirection: 'row', alignItems: 'center', gap: BOX_GAP }, style]}>
      {Array.from({ length }, (_, index) => {
        const digit = code[index] ?? '';
        const gapBefore = groupEvery !== undefined && groupEvery > 0 && index > 0 && index % groupEvery === 0;
        const paint = resolveInputOtpBoxPaint(palette, {
          hovered: hoveredIndex === index,
          focused: focusedIndex === index,
          invalid: invalid,
          disabled,
        });

        return (
          <TextInput
            key={index}
            ref={(node) => {
              inputsRef.current[index] = node;
            }}
            {...(IS_WEB
              ? ({
                  disabled,
                  onMouseEnter: () => setHoveredIndex(index),
                  onMouseLeave: () => setHoveredIndex((current) => (current === index ? null : current)),
                } as Record<string, unknown>)
              : {})}
            testID={testID ? `${testID}-${index}` : undefined}
            // Numeric is `text` with a numeric keyboard rather than a number
            // input: a number input brings spinners, accepts `e` and `-`, and
            // reports an empty value for anything it considers malformed.
            {...KEYBOARD_PROPS[type]}
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            textContentType="oneTimeCode"
            autoFocus={autoFocus && index === 0}
            // Long enough to accept a full autofilled or pasted code in one box,
            // separators included: a browser truncates a paste to `maxLength`
            // BEFORE the change handler sees it, so `length` alone lost the
            // last character of `ABCDE-12345`.
            maxLength={length * 2}
            // Typing into a filled box must REPLACE its digit, so the digit is
            // selected on focus. Web's `selectTextOnFocus` does that. Android's
            // does not: it selects on the input's next layout, and focusing a box
            // lays nothing out, so the keystroke landed beside the old digit and
            // `writeFrom` spread both across two boxes. Native selects in
            // `onFocus` instead (see Search, OxyHQ/Mention#1126).
            selectTextOnFocus={IS_WEB}
            caretHidden={false}
            editable={!disabled}
            accessibilityLabel={boxName(index + 1, length)}
            aria-invalid={invalid || undefined}
            aria-disabled={disabled || undefined}
            value={digit === ' ' ? '' : digit}
            onChangeText={(text) => writeFrom(index, text)}
            onKeyPress={(event) => onKeyPress(event, index)}
            onFocus={() => {
              setFocusedIndex(index);
              if (!IS_WEB && digit !== '' && digit !== ' ') inputsRef.current[index]?.setSelection(0, 1);
            }}
            onBlur={() => setFocusedIndex((current) => (current === index ? null : current))}
            keyboardAppearance={theme.isDark ? 'dark' : 'light'}
            style={[
              {
                width: BOX_SIZE,
                // A box shrinks (never grows) when the row is narrower than
                // its natural width, so ten boxes still fit a phone. `minWidth`
                // 0 is what lets it: a flex item's automatic minimum is its
                // specified width, and an `<input>` would otherwise overflow.
                flexShrink: 1,
                minWidth: 0,
                height: BOX_SIZE,
                marginLeft: gapBefore ? GROUP_GAP : 0,
                padding: 0,
                borderRadius: TEXT_FIELD_RADIUS,
                borderWidth: 1,
                textAlign: 'center',
                textAlignVertical: 'center',
                fontFamily: MONO_FONT_FAMILY,
                fontSize: DIGIT_TEXT.fontSize,
                fontWeight: DIGIT_TEXT.fontWeight,
                fontVariant: ['tabular-nums'],
                includeFontPadding: false,
                ...paint,
              },
              IS_WEB ? { lineHeight: DIGIT_TEXT.lineHeight } : undefined,
              IS_WEB && disabled ? ({ cursor: 'not-allowed' } as unknown as TextStyle) : undefined,
              WEB_BOX_STYLE,
            ]}
          />
        );
      })}
    </View>
  );
}
