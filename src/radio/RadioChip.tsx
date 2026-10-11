import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { useBloomAppearance } from '../appearance';
import { resolveBloomColors } from '../appearance/colors';
import { useFieldMembership } from '../field/membership';
import { useInteractionState } from '../hooks/use-interaction-state';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { RadioHost, RadioLabel } from './RadioHost';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { DISABLED_OPACITY, borderRadius } from '../styles/tokens';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { pressedSurface } from '../theme/press-colors';
import { useTheme } from '../theme/use-theme';
import { useRadioGroupItem } from './use-radio-group-item';
import type { RadioChipProps, RadioSize } from './types';

const HEIGHT: Record<RadioSize, number> = { xs: 32, sm: 36, md: 40, lg: 44 };
const CSS = interactiveWebCss({
  selector: '[data-bloom-radio-chip]',
  varPrefix: 'bloom-radio-chip',
  reset: 'none',
  transition: 'background-color 120ms ease, border-color 120ms ease',
  disabled: { opacity: null },
  extraRules:
    '@media (prefers-reduced-motion: reduce) { [data-bloom-radio-chip] { transition: none !important; } }',
});

function RadioChipComponent<Value extends string = string>({
  value,
  checked = false,
  onValueChange,
  label,
  labelContent,
  description,
  accessibilityLabel,
  nativeID,
  disabled: disabledProp = false,
  size: sizeProp,
  tone: toneProp,
  appearance = 'outline',
  className,
  labelClassName,
  style,
  labelStyle,
  testID,
}: RadioChipProps<Value>) {
  const theme = useTheme();
  const field = useFieldMembership({
    accessibilityLabel,
    label,
    labelPlacement: 'adjacent',
    disabled: disabledProp,
    nativeID,
  });
  const disabled = field.disabled;
  const { size, tone } = useBloomAppearance(
    { size: sizeProp, tone: toneProp },
    { size: 'md', tone: 'neutral' },
  );
  const height = HEIGHT[size];
  const resolved = resolveBloomColors(theme.colors, tone, appearance);
  const selected =
    tone === 'neutral' && (appearance === 'outline' || appearance === 'plain')
      ? {
          ...resolved,
          foreground: theme.colors.text,
          border: appearance === 'outline' ? theme.colors.text : 'transparent',
        }
      : resolved;
  const foreground = checked ? selected.foreground : theme.colors.text;
  const background = checked ? selected.background : 'transparent';
  const border =
    appearance === 'plain' ? 'transparent' : checked ? selected.border : theme.colors.borderLight;
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const highlighted = !disabled && (hovered || pressed);
  const ringOffset = useRingOffsetStyle();
  useInteractiveWebCss('bloom-radio-chip-web-css', CSS);
  const activate = useCallback(() => {
    if (!disabled && !checked) onValueChange?.(value);
  }, [checked, disabled, onValueChange, value]);
  const groupItem = useRadioGroupItem(value, disabled, activate);
  const defaultStyle: WebCssStyle = {
    ...(!className
      ? ({
          minHeight: height,
          minWidth: height,
          borderRadius: borderRadius.full,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: highlighted
            ? pressedSurface(theme.colors, background, foreground)
            : background,
          paddingLeft: size === 'xs' ? 10 : 14,
          paddingRight: size === 'xs' ? 10 : 14,
          paddingTop: 6,
          paddingBottom: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
          flexShrink: 0,
          opacity: disabled ? DISABLED_OPACITY : 1,
        } as const)
      : {}),
    '--bloom-radio-chip-ring': theme.colors.primary,
    ...ringOffset,
  };
  return (
    <RadioHost
      {...groupItem}
      {...webDataSet({ bloomRadioChip: '' })}
      className={className}
      style={[defaultStyle, style]}
      onPress={activate}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      disabled={disabled}
      accessibilityRole="radio"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-invalid={field.invalid || undefined}
      accessibilityLabel={field.accessibilityLabel}
      accessibilityHint={description}
      nativeID={field.nativeID}
      aria-describedby={field.describedBy}
      testID={testID}
      hitSlop={Math.max(0, (44 - height) / 2)}
    >
      {labelContent != null ? (
        <View
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {labelContent}
        </View>
      ) : (
        <RadioLabel
          className={labelClassName}
          variant={size === 'xs' || size === 'sm' ? 'body-2-medium' : 'body-medium'}
          style={[
            !labelClassName && {
              color: foreground,
              ...(checked && appearance === 'plain'
                ? { textDecorationLine: 'underline' as const }
                : {}),
            },
            labelStyle,
          ]}
        >
          {label}
        </RadioLabel>
      )}
    </RadioHost>
  );
}

export const RadioChip = memo(RadioChipComponent) as typeof RadioChipComponent;
