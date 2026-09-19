import React, { memo, useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { RiStarFill } from '../icons/remix/RiStarFill';
import { RiStarLine } from '../icons/remix/RiStarLine';
import { focusRingShadow, interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { DISABLED_OPACITY } from '../styles/tokens';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import type { RatingInputProps, RatingInputSize } from './types';
import { useFieldMembership } from '../field/membership';

/**
 * The star PICKER — `Rating`'s counterpart for a review form. `Rating` draws a
 * rating that exists; this one is how a rating comes to exist.
 *
 *              star   gap
 *   small      24     4
 *   medium     32     6
 *   large      40     8
 *
 * Chosen stars are filled with the ACCENT, the rest are outlines in the
 * neutral ramp — the same reasoning as `RatingBar`'s fill: a chosen star is a
 * choice the person made, and text-primary reads as ink rather than as an
 * answer. Under a pointer the stars up to the hovered one fill as a preview,
 * which never touches `value`.
 *
 * Accessibility: a `radiogroup` named by `accessibilityLabel`, holding one
 * `radio` per star named by `formatStarLabel` ("4 stars"). Exactly one of N is
 * what a rating is, so `radio` is the role rather than a `slider` — it is also
 * the only one that gives each star its own touch target and its own name.
 * Roving tab stop: the chosen star (the first when nothing is chosen) is the
 * one in the tab order, and ArrowRight/Up, ArrowLeft/Down, Home and End move
 * AND choose, which is how an ARIA radio group behaves. The focus ring is drawn
 * on the star itself.
 *
 * **No half stars, and no clearing.** Half a star doubles the keyboard stops
 * and halves the target — 16px of a 32px star, under any touch floor — and the
 * icon set has no half-star glyph, so the state could not be drawn honestly
 * either. Clearing is left out for the reason `Radio` re-choosing is a no-op: a
 * radio has no "off", and a form that needs "no rating yet" holds `null` and
 * does not render a cleared state the group cannot express. `Rating` still
 * DISPLAYS fractional values — a display has no target and no keyboard.
 */

const SIZE_CONFIG: Record<RatingInputSize, { star: number; gap: number }> = {
  small: { star: 24, gap: 4 },
  medium: { star: 32, gap: 6 },
  large: { star: 40, gap: 8 },
};

const IS_WEB = Platform.OS === 'web';

const HIT_SLOP = { top: 6, bottom: 6, left: 2, right: 2 } as const;

const STYLE_ID = 'bloom-rating-input-web-css';
const STAR = '[data-bloom-rating-star]';

const BLOOM_RATING_INPUT_CSS = interactiveWebCss({
  selector: STAR,
  varPrefix: 'bloom-rating-input',
  // A star is a `View`-based press target, not a `<button>`: the button reset's
  // `inline-flex` changes an RNW `View`'s layout.
  reset: 'none',
  base: 'border-radius: 6px;',
  transition: 'box-shadow 120ms ease',
  disabled: { opacity: null },
  extraRules: `${STAR}:focus-visible {
  outline: none;
  box-shadow: ${focusRingShadow('--bloom-rating-input-ring')};
}`,
});

/** `1 star`, `4 stars`. English — `formatStarLabel` replaces it. */
export function defaultStarLabel(value: number): string {
  return value === 1 ? '1 star' : `${value} stars`;
}

function RatingInputComponent({
  value,
  onChange,
  max = 5,
  size = 'medium',
  disabled: disabledProp = false,
  accessibilityLabel,
  formatStarLabel = defaultStarLabel,
  style,
  testID,
}: RatingInputProps) {
  const theme = useTheme();
  // A row of stars draws no words, so the `radiogroup`'s name is a prop or the
  // enclosing `Field`'s label; the field's `disabled` freezes the whole row.
  const field = useFieldMembership({ accessibilityLabel, disabled: disabledProp });
  const disabled = field.disabled;
  const ringOffset = useRingOffsetStyle();
  useInteractiveWebCss(STYLE_ID, BLOOM_RATING_INPUT_CSS);
  const { accent, neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const config = SIZE_CONFIG[size];
  const [hovered, setHovered] = useState<number | null>(null);

  const total = Math.max(1, Math.round(max));
  const chosen = value == null ? null : Math.min(total, Math.max(1, Math.round(value)));
  // The hover preview never survives a disabled group.
  const shown = disabled ? chosen : (hovered ?? chosen);

  const choose = useCallback(
    (next: number) => {
      if (disabled) return;
      const clamped = Math.min(total, Math.max(1, next));
      // Re-choosing the chosen star is a no-op, as on `Radio`: firing would
      // report a change that did not happen.
      if (clamped === chosen) return;
      onChange(clamped);
    },
    [disabled, total, chosen, onChange],
  );

  const onKeyDown = useCallback(
    (e: { key: string; preventDefault: () => void }) => {
      const from = chosen ?? 0;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          choose(Math.min(total, from + 1));
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          choose(Math.max(1, from - 1));
          break;
        case 'Home':
          e.preventDefault();
          choose(1);
          break;
        case 'End':
          e.preventDefault();
          choose(total);
          break;
        default:
          break;
      }
    },
    [chosen, total, choose],
  );

  // The roving tab stop: the chosen star, or the first one while nothing is
  // chosen, so a keyboard reaches the group in one Tab either way.
  const tabStop = chosen ?? 1;
  const emptyColor = theme.isDark ? neutral[600] : neutral[300];

  const starStyle: WebCssStyle = {
    padding: 2,
    borderRadius: 6,
    '--bloom-rating-input-ring': accent[500],
    ...ringOffset,
  };

  return (
    <View
      testID={testID}
      accessibilityRole="radiogroup"
      nativeID={field.nativeID}
      accessibilityLabel={field.accessibilityLabel}
      aria-label={field.accessibilityLabel}
      aria-describedby={field.describedBy}
      aria-disabled={disabled || undefined}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: config.gap,
          opacity: disabled ? DISABLED_OPACITY : 1,
        },
        style,
      ]}
    >
      {Array.from({ length: total }, (_, index) => {
        const star = index + 1;
        const filled = shown != null && star <= shown;
        const Glyph = filled ? RiStarFill : RiStarLine;
        const name = formatStarLabel(star, total);
        const webProps: Record<string, unknown> = IS_WEB
          ? { tabIndex: disabled || star !== tabStop ? -1 : 0, onKeyDown }
          : {};
        return (
          <Pressable
            key={star}
            accessibilityRole="radio"
            // `aria-checked`, not `accessibilityState`: react-native-web never
            // reads the latter. React Native folds this one back, so it is the
            // spelling both platforms honour.
            aria-checked={star === chosen}
            accessibilityLabel={name}
            disabled={disabled}
            onPress={() => choose(star)}
            onHoverIn={() => setHovered(star)}
            onHoverOut={() => setHovered((current) => (current === star ? null : current))}
            hitSlop={HIT_SLOP}
            {...webProps}
            {...webDataSet({ bloomRatingStar: '' })}
            testID={testID ? `${testID}-star-${star}` : undefined}
            style={starStyle}
          >
            <Glyph
              width={config.star}
              height={config.star}
              fill={filled ? accent[500] : emptyColor}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export const RatingInput = memo(RatingInputComponent);
RatingInput.displayName = 'RatingInput';
