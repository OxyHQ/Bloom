import React, { memo, useCallback, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  CHECKBOX_GLYPH_CSS,
  CHECKBOX_GLYPH_STYLE_ID,
  CHECKBOX_SIZE_CONFIG,
  CheckboxGlyph,
  checkboxLabelLineHeight,
  resolveCheckboxPaint,
} from './shared';
import { useFieldMembership } from '../field/membership';
import type { CheckboxProps } from './types';

/**
 * The checkbox. Colours are Bloom's theme run through the shared recipe
 * (`button/shared.ts` ramps). The box itself is `CheckboxGlyph` (`./shared`),
 * shared with `CheckboxCard`.
 *
 *              small           medium        large
 *   box        14              16            20
 *   label      body-2-medium   body-medium   headline-medium
 *   gap        6               8             8
 *
 * `large` extends the ramp beyond the standard two sizes.
 *
 * Hover lightens the box (border, or the gradient when marked); disabled dims
 * the BOX only — the label stays at full strength; keyboard focus rings the box.
 * The check draws itself in over 200ms, skipped under reduced motion. No press
 * scale.
 */

/** Space between the label and the description under it. */
const DESCRIPTION_GAP = 2;

/**
 * The smallest comfortable touch target, in dp. The box is 16dp, so without
 * slack a bare checkbox's target is 16dp. `hitSlop` grows the target without
 * growing the drawing, derived per size so all three reach the same floor.
 */
const MIN_TOUCH_TARGET = 44;

const IS_WEB = Platform.OS === 'web';

// The row's reset. The focus ring and the box's motion live in the glyph's
// sheet (`./shared`), which `CheckboxCard` adopts too.
const STYLE_ID = 'bloom-checkbox-web-css';
const ROW = '[data-bloom-checkbox]';

const BLOOM_CHECKBOX_CSS = interactiveWebCss({
  selector: ROW,
  varPrefix: 'bloom-checkbox',
  // Puts the LAYOUT half of the shared reset back. That reset is written for a
  // raw `<button>`, and an adopted stylesheet applies after the document's own,
  // so left alone its `display: inline-flex` / `align-items: center` would win
  // over react-native-web's `View` classes and re-align the row.
  base: `
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    box-sizing: border-box;
  `,
  transition: 'none',
  hover: { declarations: 'opacity: 1;' },
  outlineOffset: 2,
  extraRules: `${ROW}:disabled,
${ROW}[aria-disabled="true"] {
  opacity: 1;
  cursor: not-allowed;
}
${ROW}:focus-visible {
  outline: none;
}`,
});

const CheckboxComponent: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  size = 'medium',
  disabled = false,
  indeterminate = false,
  color,
  style,
  labelStyle,
  accessibilityLabel,
  nativeID,
  testID,
}) => {
  const theme = useTheme();
  // The label is ADJACENT — the words beside the box ARE the control, so they
  // name it and a `Field` around it only supplies what is missing. `disabled`
  // is the other direction: the field's constrains, so it is OR-ed in.
  const field = useFieldMembership({
    accessibilityLabel,
    label,
    labelPlacement: 'adjacent',
    disabled,
    nativeID,
  });
  const isDisabled = field.disabled;
  useInteractiveWebCss(STYLE_ID, BLOOM_CHECKBOX_CSS);
  useInteractiveWebCss(CHECKBOX_GLYPH_STYLE_ID, CHECKBOX_GLYPH_CSS);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  // Native has no hover, so a held press borrows the hover paint — the
  // only other state the design defines. No press scale.
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const sizeConfig = CHECKBOX_SIZE_CONFIG[size];
  const paint = useMemo(() => resolveCheckboxPaint(theme, color), [theme, color]);
  const highlighted = !isDisabled && (hovered || pressed);

  const handlePress = useCallback(() => {
    if (!isDisabled) {
      onCheckedChange(!checked);
    }
  }, [checked, isDisabled, onCheckedChange]);

  const hasText = Boolean(label || description);

  const rowStyle = useMemo(
    (): WebCssStyle => ({
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: sizeConfig.gap,
      // Disabled dims the BOX only; the inline value also outranks
      // the shared recipe's `[aria-disabled] { opacity: .5 }`.
      opacity: 1,
    }),
    [sizeConfig],
  );

  const slop = Math.max(8, Math.ceil((MIN_TOUCH_TARGET - sizeConfig.box) / 2));

  return (
    <Pressable
      // The DOM hooks the adopted sheets hang off. Through `dataSet`, because
      // react-native-web drops any prop outside its own fixed list — a literal
      // `'data-bloom-checkbox'` prop never reaches the DOM. See the longer note
      // in `chip/Chip.tsx`, where this was measured.
      {...(IS_WEB
        ? ({ dataSet: { bloomCheckbox: '', bloomCheckboxFocusable: '' } } as Record<string, unknown>)
        : {})}
      style={[rowStyle, style]}
      onPress={handlePress}
      onPressIn={isDisabled ? undefined : onPressIn}
      onPressOut={isDisabled ? undefined : onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      disabled={isDisabled}
      nativeID={field.nativeID}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      accessibilityRole="checkbox"
      // `aria-checked`, not `accessibilityState`: react-native-web's
      // `createDOMProps` never reads `accessibilityState`, so a checkbox that
      // set only that announced no state at all on web — the box was drawn
      // checked while assistive tech saw an unchecked control. React Native's
      // `Pressable` folds `aria-checked` back into `accessibilityState`, so
      // this one prop is the spelling both platforms honour. `disabled`
      // travels on the `disabled` prop above, which both platforms map.
      aria-checked={indeterminate ? 'mixed' : checked}
      accessibilityLabel={field.accessibilityLabel}
      hitSlop={{ top: slop, bottom: slop, left: slop, right: slop }}
      testID={testID}
    >
      <CheckboxGlyph
        size={size}
        checked={checked}
        indeterminate={indeterminate}
        disabled={isDisabled}
        highlighted={highlighted}
        paint={paint}
        // Centre the box on the label's first line box.
        marginTop={hasText ? (checkboxLabelLineHeight(size) - sizeConfig.box) / 2 : 0}
      />

      {hasText && (
        <View style={{ flex: 1 }}>
          {label && (
            <Text variant={sizeConfig.label} style={[{ color: paint.text }, labelStyle]}>
              {label}
            </Text>
          )}
          {description && (
            <Text
              variant={sizeConfig.description}
              style={{ color: paint.description, marginTop: label ? DESCRIPTION_GAP : 0 }}
            >
              {description}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

export const Checkbox = memo(CheckboxComponent);
Checkbox.displayName = 'Checkbox';
