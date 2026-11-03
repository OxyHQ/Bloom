import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { useBloomAppearance } from '../appearance';
import { useFieldMembership } from '../field/membership';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { DISABLED_OPACITY } from '../styles/tokens';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { RadioHost } from './RadioHost';
import type { RadioSize, RadioSwatchProps } from './types';
import { useRadioGroupItem } from './use-radio-group-item';

/**
 * `RadioSwatch`: a radio that IS its colour, as a desktop's accent colour
 * picker draws its choices. No label is drawn; `label` (or
 * `accessibilityLabel`) is the colour's name, which a screen reader says.
 *
 *              xs   sm   md   lg
 *   disc       16   18   22   26     the option's `color`, round
 *   dot         6    6    8   10     chosen: `foreground` (white unless given) at the centre
 *
 * In a `RadioGroup variant="swatch"` the swatches sit in a wrapping row 8px
 * apart, and the group is one keyboard stop moved by the arrows (web and a
 * native platform keyboard alike, `use-radio-group-item.ts`). Disabled dims
 * the disc to 50%. On web keyboard focus draws a 2px accent outline 2px off
 * the disc.
 */
const DISC: Record<RadioSize, number> = { xs: 16, sm: 18, md: 22, lg: 26 };
const DOT: Record<RadioSize, number> = { xs: 6, sm: 6, md: 8, lg: 10 };
/** Half the group's 8px gap: neighbouring swatches' targets meet without overlapping. */
const HIT_SLOP = 4;

const CSS = interactiveWebCss({
  selector: '[data-bloom-radio-swatch]',
  varPrefix: 'bloom-radio-swatch',
  reset: 'none',
  transition: 'none',
  disabled: { opacity: null },
});

function RadioSwatchComponent<Value extends string = string>({
  value,
  color,
  foreground = '#FFFFFF',
  checked = false,
  onValueChange,
  label,
  accessibilityLabel,
  description,
  nativeID,
  disabled: disabledProp = false,
  size: sizeProp,
  className,
  style,
  testID,
}: RadioSwatchProps<Value>) {
  const theme = useTheme();
  // The colour's name is the control's name: nothing is drawn beside it.
  const field = useFieldMembership({
    // The card's own description is its hint, said before the field's.
    accessibilityHint: description,
    accessibilityLabel,
    label,
    labelPlacement: 'adjacent',
    disabled: disabledProp,
    nativeID,
  });
  const disabled = field.disabled;
  const { size } = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'accent' });
  const disc = DISC[size];
  const dot = DOT[size];
  const ringOffset = useRingOffsetStyle();
  useInteractiveWebCss('bloom-radio-swatch-web-css', CSS);
  const activate = useCallback(() => {
    if (!disabled && !checked) onValueChange?.(value);
  }, [checked, disabled, onValueChange, value]);
  const groupItem = useRadioGroupItem(value, disabled, activate);
  const discStyle: WebCssStyle = {
    ...(!className
      ? ({
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: disabled ? DISABLED_OPACITY : 1,
        } as const)
      : {}),
    '--bloom-radio-swatch-ring': theme.colors.primary,
    ...ringOffset,
  };
  return (
    <RadioHost
      {...groupItem}
      {...webDataSet({ bloomRadioSwatch: '' })}
      className={className}
      style={[discStyle, style]}
      onPress={activate}
      disabled={disabled}
      accessibilityRole="radio"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-invalid={field.invalid || undefined}
      accessibilityLabel={field.accessibilityLabel}
      nativeID={field.nativeID}
      aria-describedby={field.describedBy}
      accessibilityHint={field.accessibilityHint}
      testID={testID}
      hitSlop={HIT_SLOP}
    >
      {checked ? (
        <View
          pointerEvents="none"
          style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: foreground }}
        />
      ) : null}
    </RadioHost>
  );
}

export const RadioSwatch = memo(RadioSwatchComponent) as typeof RadioSwatchComponent;
