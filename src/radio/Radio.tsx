import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation, space } from '../styles/tokens';
import { usePressAnimation } from '../hooks/use-press-animation';
import { RadioIndicator } from '../radio-indicator';
import type { RadioGroupProps, RadioProps } from './types';

/**
 * The size ramp, matching `Checkbox` rung for rung so a form mixing the two
 * lines up. The indicator is a circle, so its rung is a DIAMETER where the
 * checkbox's is a box side — the same number, meaning the same thing.
 */
const SIZE_CONFIG = {
  small: { indicator: 18, fontSize: 14, lineHeight: 20, descFontSize: 12 },
  medium: { indicator: 22, fontSize: 15, lineHeight: 22, descFontSize: 13 },
  large: { indicator: 26, fontSize: 16, lineHeight: 24, descFontSize: 14 },
} as const;

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

const RadioComponent = function Radio<Value extends string = string>({
  value,
  selected,
  onSelect,
  label,
  description,
  size = 'medium',
  disabled = false,
  color,
  style,
  labelStyle,
  accessibilityLabel,
  testID,
}: RadioProps<Value>) {
  const theme = useTheme();
  const sizeConfig = SIZE_CONFIG[size];
  // The shared press hook, which is where the reduced-motion and pointer-type
  // suppressions live — the same dip `Checkbox` applies to its box.
  const { scaleAnim, onPressIn, onPressOut } = usePressAnimation(
    disabled ? undefined : animation.pressScale,
  );

  const handlePress = useCallback(() => {
    // Re-choosing the chosen option is a no-op. A radio, unlike a checkbox, has
    // no "off" — firing here would make a group's `onValueChange` report a
    // change that did not happen.
    if (disabled || selected) return;
    onSelect(value);
  }, [disabled, selected, onSelect, value]);

  return (
    <Pressable
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: space.sm,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="radio"
      // `aria-checked`, not `accessibilityState`: react-native-web never reads
      // the latter, so an option that set only it announced no state at all.
      // React Native folds `aria-checked` back into `accessibilityState`, so
      // this one prop is the spelling both platforms honour, and `disabled`
      // travels on the `disabled` prop, which both map.
      aria-checked={selected}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={HIT_SLOP}
      testID={testID}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <RadioIndicator
          selected={selected}
          size={sizeConfig.indicator}
          selectedColor={color}
        />
      </Animated.View>

      {(label || description) && (
        <View style={{ flex: 1, paddingTop: 1 }}>
          {label && (
            <Text
              style={[
                {
                  fontSize: sizeConfig.fontSize,
                  lineHeight: sizeConfig.lineHeight,
                  color: theme.colors.text,
                  fontWeight: '500',
                },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          )}
          {description && (
            <Text
              style={{
                fontSize: sizeConfig.descFontSize,
                color: theme.colors.textSecondary,
                lineHeight: sizeConfig.descFontSize + 6,
                marginTop: 2,
              }}
            >
              {description}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

export const Radio = memo(RadioComponent) as typeof RadioComponent;

/**
 * A set of radios that own one value between them.
 *
 * The group exists because a lone radio cannot express the thing that makes a
 * radio a radio: exactly one of N. Rendering the options from data is also what
 * lets the group carry `role="radiogroup"` and its accessible name — a
 * screen reader announces "2 of 4" only when the options are inside one.
 */
const RadioGroupComponent = function RadioGroup<Value extends string = string>({
  label,
  value,
  onValueChange,
  options,
  size = 'medium',
  disabled = false,
  color,
  style,
  labelStyle,
  testID,
}: RadioGroupProps<Value>) {
  return (
    <View
      style={[{ gap: space.sm }, style]}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      aria-label={label}
      testID={testID}
    >
      {options.map((option) => (
        <Radio
          key={option.value}
          value={option.value}
          selected={option.value === value}
          onSelect={onValueChange}
          label={option.label}
          description={option.description}
          size={size}
          disabled={disabled || option.disabled === true}
          color={color}
          labelStyle={labelStyle}
          testID={option.testID}
        />
      ))}
    </View>
  );
};

export const RadioGroup = memo(RadioGroupComponent) as typeof RadioGroupComponent;
