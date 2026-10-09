import { useBloomAppearance } from '../appearance';
import React, { memo, useCallback } from 'react';
import { Platform, View, type AccessibilityActionEvent } from 'react-native';

import { Button, type ButtonProps } from '../button';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { webDataSet } from '../styles/web-data';
import { useAccessibleNameWarning } from '../hooks/use-accessible-name-warning';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiSubtractLine } from '../icons/remix/RiSubtractLine';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import type { StepperProps, StepperSize } from './types';
import { useFieldMembership } from '../field/membership';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { STEPPER_MESSAGES } from './messages';

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
 *
 * REMOVE AT THE FLOOR is opt-in (`onRemove`). With it, the `−` button at `min`
 * turns into a trash button named `removeLabel` that calls `onRemove` — a
 * basket line that goes from 1 to gone. Without it the button disables at
 * `min`, as it always has. The keyboard and the accessibility actions on the
 * value never remove: an arrow key or a volume-key swipe that deletes is a
 * destructive action behind an arithmetic one. So that a keyboard user can
 * still reach it, the button joins the tab order while it is the remove control.
 */

const IS_WEB = Platform.OS === 'web';

const SIZE_CONFIG: Record<
  StepperSize,
  { button: 'sm' | 'md'; type: TypeScaleVariant; valueWidth: number; height: number; gap: number }
> = {
  sm: { button: 'sm', type: 'body-semibold', valueWidth: 24, height: 32, gap: 8 },
  md: { button: 'md', type: 'headline-semibold', valueWidth: 32, height: 36, gap: 12 },
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
const OUTLINE_ACTION = '.bloom-stepper-outline-action';
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
}) + interactiveWebCss({
  selector: OUTLINE_ACTION,
  varPrefix: 'bloom-stepper-action',
  reset: 'none',
  transition: 'transform 150ms ease, color 150ms ease',
  pressScale: true,
  disabled: { opacity: null },
  extraRules: `
    ${OUTLINE_ACTION}::after { content: ''; position: absolute; inset: -12px; }
    @media (hover: hover) and (pointer: fine) {
      ${OUTLINE_ACTION}:not(:disabled):not([aria-disabled="true"]):hover { transform: scale(1.1); }
      ${OUTLINE_ACTION}:not(:disabled):not([aria-disabled="true"]):active { transform: scale(.95); }
    }
    @media (prefers-reduced-motion: reduce) {
      ${OUTLINE_ACTION} { transition: none; }
      ${OUTLINE_ACTION}:not(:disabled):not([aria-disabled="true"]):hover,
      ${OUTLINE_ACTION}:not(:disabled):not([aria-disabled="true"]):active { transform: none; }
    }
  `,
});

const AnimatedButton = Animated.createAnimatedComponent(Button);

/** Plain actions retain Button's disabled, label and activation contracts. */
function OutlineAction({ size, ...props }: ButtonProps) {
  const { colors } = useTheme();
  const reduced = usePrefersReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: reduced ? 1 : scale.value }] }), [scale, reduced]);
  const setPressed = (pressed: boolean) => {
    if (IS_WEB) return;
    scale.value = reduced ? 1 : withTiming(pressed ? .95 : 1, { duration: 150 });
  };
  const Action = IS_WEB ? Button : AnimatedButton;
  const side = size === 'sm' ? 18 : 20;
  const actionStyle: WebCssStyle = {
    width: side, height: side, paddingLeft: 0, paddingRight: 0,
    backgroundColor: 'transparent', overflow: 'visible',
    '--bloom-stepper-action-ring': colors.primary,
    '--bloom-stepper-action-press-scale': '.95',
  };
  return <Action {...props} size={size} appearance="plain" material="flat"
    colors={{ background: 'transparent', foreground: colors.text }}
    iconSize={side} hitSlop={12}
    className={IS_WEB ? 'bloom-stepper-outline-action' : undefined}
    onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
    style={[actionStyle, !IS_WEB && animated]} />;
}

function StepperComponent({
  value,
  onValueChange,
  min = 0,
  max,
  step = 1,
  disabled: disabledProp = false,
  size: sizeProp,
  appearance = 'separate',
  formatValue,
  accessibilityLabel,
  decrementLabel: decrementLabelProp,
  incrementLabel: incrementLabelProp,
  onRemove,
  removeLabel: removeLabelProp,
  style,
  testID,
}: StepperProps) {
  const { size: inheritedSize } = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'neutral' });
  const size = inheritedSize === 'xs' || inheritedSize === 'sm' ? 'sm' : 'md';
  const common = useCommonMessages();
  const { messages } = useMessages(STEPPER_MESSAGES);
  const decrementLabel = decrementLabelProp ?? messages.decrease;
  const incrementLabel = incrementLabelProp ?? messages.increase;
  const removeLabel = removeLabelProp ?? common.remove;
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
  const outlined = appearance === 'outline';
  const Action = outlined ? OutlineAction : Button;
  const outlineFontSize = size === 'sm' ? 13 : 14;

  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && (max === undefined || value < max);
  // At the floor with `onRemove`, the decrement slot IS the remove control.
  const removes = onRemove !== undefined && !disabled && value <= min;

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
    minWidth: outlined ? outlineFontSize * 2.8 : config.valueWidth,
    height: outlined ? 22 : config.height,
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
      style={[{ flexDirection: 'row', alignItems: 'center', gap: outlined ? 0 : config.gap }, outlined && {
        alignSelf: 'flex-start', height: size === 'sm' ? 36 : 40,
        paddingLeft: 8, paddingRight: 8, borderWidth: 1, borderRadius: 9999,
        borderColor: theme.colors.border, backgroundColor: theme.colors.background,
      }, style]}
    >
      <Action

        size={config.button}
        iconOnly
        icon={removes ? RiDeleteBinLine : RiSubtractLine}
        onPress={removes ? onRemove : decrement}
        disabled={!(canDecrement || removes)}
        accessibilityLabel={removes ? removeLabel : decrementLabel}
        tabIndex={removes ? 0 : -1}
        testID={testID ? `${testID}-decrement` : undefined} tone="neutral" appearance="outline"
      />
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={field.accessibilityLabel}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid || undefined}
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
          variant={outlined ? 'body-semibold' : config.type}
          numberOfLines={1}
          style={{
            ...(outlined ? { fontSize: outlineFontSize, lineHeight: 18 } : null),
            color: disabled ? theme.colors.textTertiary : theme.colors.text,
            fontVariant: ['tabular-nums'],
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </View>
      <Action

        size={config.button}
        iconOnly
        icon={RiAddLine}
        onPress={increment}
        disabled={!canIncrement}
        accessibilityLabel={incrementLabel}
        tabIndex={-1}
        testID={testID ? `${testID}-increment` : undefined} tone="neutral" appearance="outline"
      />
    </View>
  );
}

export const Stepper = memo(StepperComponent);
Stepper.displayName = 'Stepper';
