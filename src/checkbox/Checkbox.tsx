import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, Animated, type ViewStyle } from 'react-native';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';

import { useTheme } from '../theme/use-theme';
import { animation, borderRadius, space } from '../styles/tokens';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
import { usePressAnimation } from '../hooks/use-press-animation';
import type { CheckboxProps } from './types';

const SIZE_CONFIG = {
  small: { box: 18, checkmark: 10, fontSize: 14, lineHeight: 20, descFontSize: 12 },
  medium: { box: 22, checkmark: 12, fontSize: 15, lineHeight: 22, descFontSize: 13 },
  large: { box: 26, checkmark: 14, fontSize: 16, lineHeight: 24, descFontSize: 14 },
} as const;

/**
 * How thick the indeterminate bar is, as a fraction of the checkmark box. Its
 * proportion, not a fixed pixel value, so it tracks the three sizes.
 */
const INDETERMINATE_BAR_THICKNESS = 0.18;

/** Deeper than the 0.97 of a text button: the box is small, so the dip has to be. */
const PRESS_SCALE = 0.9;

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
  testID,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;
  // The press dip goes through the shared hook rather than a fourth copy of the
  // same two springs: it is the one place the "reduce motion" and pointer-type
  // suppressions are applied, and an inlined copy honoured neither.
  const {
    scaleAnim: pressAnim,
    onPressIn,
    onPressOut,
  } = usePressAnimation(disabled ? undefined : PRESS_SCALE);
  const sizeConfig = SIZE_CONFIG[size];
  const checkColor = color ?? theme.colors.primary;
  // The checkmark sits on top of `checkColor`. When the box uses the theme
  // primary, use the preset's readable foreground (white for blue, black for
  // yellow). A caller-supplied custom color falls back to white.
  const checkmarkColor = color == null ? theme.colors.primaryForeground : '#fff';

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: checked || indeterminate ? 1 : 0,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      ...animation.spring.snappy,
    }).start();
  }, [checked, indeterminate, scaleAnim]);

  const handlePress = useCallback(() => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  }, [checked, disabled, onCheckedChange]);

  const boxStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      width: sizeConfig.box,
      height: sizeConfig.box,
      borderRadius: borderRadius._2xs + 2,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (checked || indeterminate) {
      base.backgroundColor = checkColor;
      base.borderColor = checkColor;
    } else {
      base.backgroundColor = 'transparent';
      base.borderColor = theme.colors.border;
    }

    return base;
  }, [sizeConfig, checked, indeterminate, checkColor, theme]);

  // The mark is drawn, not typed. It used to be the glyphs `\u2713` and `\u2014`
  // in a `<Text>`, so its shape, weight and vertical centring came from whatever
  // font the platform resolved — and `Check_Stroke2_Corner0_Rounded` was already
  // the answer everywhere else in the library. The indeterminate state is a BAR
  // rather than a second icon: there is no minus in the set, and a rounded rule
  // is what the state means.
  const mark = indeterminate ? (
    <View
      style={{
        width: sizeConfig.checkmark,
        height: Math.max(2, Math.round(sizeConfig.checkmark * INDETERMINATE_BAR_THICKNESS)),
        borderRadius: borderRadius.full,
        backgroundColor: checkmarkColor,
      }}
    />
  ) : (
    <CheckIcon width={sizeConfig.checkmark} height={sizeConfig.checkmark} fill={checkmarkColor} />
  );

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
      accessibilityRole="checkbox"
      // `aria-checked`, not `accessibilityState`: react-native-web's
      // `createDOMProps` never reads `accessibilityState`, so a checkbox that
      // set only that announced no state at all on web — the box was drawn
      // checked while assistive tech saw an unchecked control. React Native's
      // `Pressable` folds `aria-checked` back into `accessibilityState`, so
      // this one prop is the spelling both platforms honour. `disabled`
      // travels on the `disabled` prop above, which both platforms map.
      aria-checked={indeterminate ? 'mixed' : checked}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      testID={testID}
    >
      <Animated.View style={[boxStyle, { transform: [{ scale: pressAnim }] }]}>
        <Animated.View
          style={{
            opacity: scaleAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {mark}
        </Animated.View>
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

export const Checkbox = memo(CheckboxComponent);
Checkbox.displayName = 'Checkbox';
