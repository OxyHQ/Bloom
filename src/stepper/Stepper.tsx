import React, { memo, useCallback, useMemo } from 'react';
import { Platform, View, type AccessibilityActionEvent } from 'react-native';

import { Button } from '../button';
import { webDataSet } from '../styles/web-data';
import { useAccessibleNameWarning } from '../hooks/use-accessible-name-warning';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiSubtractLine } from '../icons/remix/RiSubtractLine';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import type { StepperProps, StepperSize } from './types';
import { useFieldMembership } from '../field/membership';

/**
 * Bloom's numeric counter: a round `−` button, the value, a round `+` button.
 *
 *             buttons                  value text        value min width  gap
 *   small     Button small  (32)       body-semibold     24               8
 *   medium    Button medium (36)       headline-semibold 32               12
 *
 * The buttons are Bloom `Button`s (`secondary`, `iconOnly`, full pill) and
 * disable at their bound. The value is tabular and sits in a fixed minimum
 * width, so the row does not shift between 9 and 10.
 *
 * Accessibility: the row is a `group` named by `accessibilityLabel`; the value
 * is the `adjustable` element (react-native-web: `role="slider"`) carrying the
 * flat `aria-value*` props. On web it takes focus and answers ArrowUp/Right
 * (+step), ArrowDown/Left (−step), Home/End (bounds); the buttons stay out of
 * the tab order, being pointer affordances for the same action. On native it
 * answers the `increment`/`decrement` accessibility actions (VoiceOver swipe
 * up/down, TalkBack volume keys).
 */

const IS_WEB = Platform.OS === 'web';

const SIZE_CONFIG: Record<
  StepperSize,
  { button: 'small' | 'medium'; type: TypeScaleVariant; valueWidth: number; height: number; gap: number }
> = {
  small: { button: 'small', type: 'body-semibold', valueWidth: 24, height: 32, gap: 8 },
  medium: { button: 'medium', type: 'headline-semibold', valueWidth: 32, height: 36, gap: 12 },
};

/** Snap to `step` from `min` and clamp, without floating-point drift. */
function stepperClamp(raw: number, min: number, max: number | undefined, step: number): number {
  let next = raw;
  if (step > 0) {
    const snapped = min + Math.round((raw - min) / step) * step;
    const decimals = (String(step).split('.')[1] ?? '').length;
    next = decimals > 0 ? Number(snapped.toFixed(decimals)) : snapped;
  }
  if (max !== undefined) next = Math.min(max, next);
  return Math.max(min, next);
}

const STYLE_ID = 'bloom-stepper-web-css';
const VALUE = '[data-bloom-stepper-value]';
const BLOOM_STEPPER_CSS = interactiveWebCss({
  selector: VALUE,
  varPrefix: 'bloom-stepper',
  // The VALUE is a focusable readout, not a button: no `<button>` reset, no
  // hover rule, no press scale — only focus.
  reset: 'none',
  base: 'cursor: default;',
  transition: 'box-shadow 120ms ease',
  focus: { mode: 'ring' },
  disabled: { opacity: null },
});

function StepperComponent({
  value,
  onValueChange,
  min = 0,
  max,
  step = 1,
  disabled: disabledProp = false,
  size = 'medium',
  formatValue,
  accessibilityLabel,
  decrementLabel = 'Decrease',
  incrementLabel = 'Increase',
  style,
  testID,
}: StepperProps) {
  const theme = useTheme();
  const ringOffset = useRingOffsetStyle();
  // The digits are not a name, so the stepper is named by a prop or by the
  // enclosing `Field` — and the warning has to see the resolved name, or a
  // field-labelled stepper warns anyway.
  const field = useFieldMembership({ accessibilityLabel, disabled: disabledProp });
  const disabled = field.disabled;
  useAccessibleNameWarning('Stepper', field.accessibilityLabel);
  useInteractiveWebCss(STYLE_ID, BLOOM_STEPPER_CSS);
  const config = SIZE_CONFIG[size];

  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && (max === undefined || value < max);

  const change = useCallback(
    (target: number) => {
      if (disabled) return;
      const next = stepperClamp(target, min, max, step);
      if (next !== value) onValueChange(next);
    },
    [disabled, min, max, step, value, onValueChange],
  );

  const decrement = useCallback(() => change(value - step), [change, value, step]);
  const increment = useCallback(() => change(value + step), [change, value, step]);

  const onAccessibilityAction = useCallback(
    (e: AccessibilityActionEvent) => {
      if (e.nativeEvent.actionName === 'increment') increment();
      else if (e.nativeEvent.actionName === 'decrement') decrement();
    },
    [increment, decrement],
  );

  const label = formatValue ? formatValue(value) : String(value);

  const webValueProps: Record<string, unknown> = IS_WEB
    ? {
        tabIndex: disabled ? -1 : 0,
        onKeyDown: (e: { key: string; preventDefault: () => void }) => {
          switch (e.key) {
            case 'ArrowUp':
            case 'ArrowRight':
              e.preventDefault();
              increment();
              break;
            case 'ArrowDown':
            case 'ArrowLeft':
              e.preventDefault();
              decrement();
              break;
            case 'Home':
              e.preventDefault();
              change(min);
              break;
            case 'End':
              if (max !== undefined) {
                e.preventDefault();
                change(max);
              }
              break;
            default:
              break;
          }
        },
      }
    : {};

  const valueStyle: WebCssStyle = {
    minWidth: config.valueWidth,
    height: config.height,
    paddingLeft: 2,
    paddingRight: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    '--bloom-stepper-ring': theme.colors.primary,
    ...ringOffset,
  };

  return (
    <View
      testID={testID}
      role="group"
      nativeID={field.nativeID}
      accessibilityLabel={field.accessibilityLabel}
      aria-describedby={field.describedBy}
      aria-disabled={disabled || undefined}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: config.gap }, style]}
    >
      <Button
        variant="secondary"
        size={config.button}
        iconOnly
        icon={RiSubtractLine}
        onPress={decrement}
        disabled={!canDecrement}
        accessibilityLabel={decrementLabel}
        tabIndex={-1}
        testID={testID ? `${testID}-decrement` : undefined}
      />
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={field.accessibilityLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={label}
        aria-disabled={disabled || undefined}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAccessibilityAction}
        {...webValueProps}
        {...webDataSet({ bloomStepperValue: '' })}
        testID={testID ? `${testID}-value` : undefined}
        style={valueStyle}
      >
        <Text
          variant={config.type}
          numberOfLines={1}
          style={{
            color: disabled ? theme.colors.textTertiary : theme.colors.text,
            fontVariant: ['tabular-nums'],
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </View>
      <Button
        variant="secondary"
        size={config.button}
        iconOnly
        icon={RiAddLine}
        onPress={increment}
        disabled={!canIncrement}
        accessibilityLabel={incrementLabel}
        tabIndex={-1}
        testID={testID ? `${testID}-increment` : undefined}
      />
    </View>
  );
}

export const Stepper = memo(StepperComponent);
Stepper.displayName = 'Stepper';
