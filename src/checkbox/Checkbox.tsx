import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Platform, Pressable, Animated, type ViewStyle } from 'react-native';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';

import { useTheme } from '../theme/use-theme';
import { animation, borderRadius, space } from '../styles/tokens';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { usePressAnimation } from '../hooks/use-press-animation';
import type { CheckboxProps } from './types';

const SIZE_CONFIG = {
  small: { box: 18, checkmark: 10, fontSize: 14, lineHeight: 20, descFontSize: 12 },
  medium: { box: 22, checkmark: 12, fontSize: 15, lineHeight: 22, descFontSize: 13 },
  large: { box: 26, checkmark: 14, fontSize: 16, lineHeight: 24, descFontSize: 14 },
} as const;

/**
 * The smallest comfortable touch target, in dp. A bare checkbox — no label, no
 * description — is a 22px box, so without slack its target is 22dp: half of
 * what a finger needs. `hitSlop` grows the target without growing the drawing,
 * and is computed per size so all three reach the same floor. RNR reaches for
 * the same fix with a flat `hitSlop={24}`; deriving it from the box means the
 * large size does not overshoot into its neighbour.
 */
const MIN_TOUCH_TARGET = 44;

/**
 * How thick the indeterminate bar is, as a fraction of the checkmark box. Its
 * proportion, not a fixed pixel value, so it tracks the three sizes.
 */
const INDETERMINATE_BAR_THICKNESS = 0.18;

/** Deeper than the 0.97 of a text button: the box is small, so the dip has to be. */
const PRESS_SCALE = 0.9;

// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  Same defect, same fix, same shared recipe as `Chip`: react-native-web makes
//  the control focusable and resets the outline, and no inline style can carry a
//  `:focus-visible` rule — so a keyboard user could tab onto a checkbox with
//  nothing to show for it. The hook is a `data-*` attribute because a class
//  never reaches the DOM here (react-native-css consumes `className` into
//  `style`), and `adoptStyleSheet` no-ops without a `document`, so the file
//  stays universal.
//
//  The ring goes on the PRESSABLE, which is the box AND its label — that is the
//  element the browser focuses, and ringing anything else would point at
//  something that does not have focus.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-checkbox-web-css';

const BLOOM_CHECKBOX_CSS = interactiveWebCss({
  selector: '[data-bloom-checkbox]',
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
    border-radius: 6px;
  `,
  transition: 'opacity 120ms ease',
  // The box already dips under the pointer through `usePressAnimation`; a second
  // hover treatment on the row would be a state the native fork does not have.
  hover: { declarations: 'opacity: 1;' },
  outlineOffset: 3,
});

const IS_WEB = Platform.OS === 'web';

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
  useInteractiveWebCss(STYLE_ID, BLOOM_CHECKBOX_CSS);
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

  const rowStyle = useMemo(
    (): WebCssStyle => ({
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: space.sm,
      opacity: disabled ? 0.4 : 1,
      // The `:focus-visible` ring colour, read by the adopted sheet. A custom
      // property because the value is a resolved theme token the static sheet
      // cannot know; native has no such style key and ignores it.
      '--bloom-checkbox-ring': color ?? theme.colors.primary,
    }),
    [disabled, color, theme],
  );

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

  const slop = Math.max(8, Math.ceil((MIN_TOUCH_TARGET - sizeConfig.box) / 2));

  return (
    <Pressable
      // The DOM hook the adopted sheet above hangs off. Through `dataSet`,
      // because react-native-web drops any prop outside its own fixed list — a
      // literal `'data-bloom-checkbox'` prop never reaches the DOM. See the
      // longer note in `chip/Chip.tsx`, where this was measured.
      {...(IS_WEB ? ({ dataSet: { bloomCheckbox: '' } } as Record<string, unknown>) : {})}
      style={[
        rowStyle,
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
      hitSlop={{ top: slop, bottom: slop, left: slop, right: slop }}
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
