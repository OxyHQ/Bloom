import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Platform, Pressable, Animated, type ViewStyle } from 'react-native';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { useTheme } from '../theme/use-theme';
import { animation, borderRadius, space } from '../styles/tokens';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { usePressAnimation } from '../hooks/use-press-animation';
import { useInteractionState } from '../hooks/use-interaction-state';
import { pressedSurface } from '../theme/press-colors';
import type { CheckboxProps } from './types';

/**
 * `medium` IS react-native-reusables' checkbox: `size-4` (16px) holding a 12px
 * check, beside a `text-sm font-medium` label and a `text-muted-foreground
 * text-sm` description. It used to be a 22px box with a 15px label — half again
 * as large as shadcn's in a vocabulary where the control is deliberately small
 * next to its text. `small` and `large` step around it; upstream has only the
 * one size.
 */
const SIZE_CONFIG = {
  small: { box: 14, checkmark: 10, fontSize: 12, lineHeight: 16, descFontSize: 12 },
  medium: { box: 16, checkmark: 12, fontSize: 14, lineHeight: 20, descFontSize: 14 },
  large: { box: 20, checkmark: 14, fontSize: 16, lineHeight: 24, descFontSize: 14 },
} as const;

/** `rounded-[4px]` — an explicit pixel radius, not a rung of shadcn's ramp. */
const BOX_RADIUS = 4;

/** `border` — one pixel, where Bloom's box drew two. */
const BOX_BORDER_WIDTH = 1;

/** `gap-3` between the box and its label, and `gap-2` under the label. */
const LABEL_GAP = space.md;
const DESCRIPTION_GAP = space.sm;

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
    onPressIn: onScaleIn,
    onPressOut: onScaleOut,
  } = usePressAnimation(disabled ? undefined : animation.pressScale);
  // Driven separately from the scale — see `Chip` for why. The BOX answers the
  // press, not the row: a wash across a checkbox and its label would read as a
  // list-row press rather than as a control.
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } = useInteractionState();
  const onPressIn = () => { onScaleIn(); onPressedIn(); };
  const onPressOut = () => { onScaleOut(); onPressedOut(); };
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
      gap: LABEL_GAP,
      // `opacity-50` — upstream's disabled treatment, and the same number
      // `Item` and every menu row already use.
      opacity: disabled ? 0.5 : 1,
      // The `:focus-visible` ring colour, read by the adopted sheet. A custom
      // property because the value is a resolved theme token the static sheet
      // cannot know; native has no such style key and ignores it.
      '--bloom-checkbox-ring': color ?? theme.colors.primary,
    }),
    [disabled, color, theme],
  );

  const boxStyle = useMemo((): ViewStyle & { backgroundColor: string } => {
    // `border-input size-4 shrink-0 rounded-[4px] border shadow-sm
    //  shadow-black/5`, plus `border-primary` and the `bg-primary` indicator
    //  once checked.
    const base: ViewStyle & { backgroundColor: string } = {
      width: sizeConfig.box,
      height: sizeConfig.box,
      borderRadius: BOX_RADIUS,
      borderWidth: BOX_BORDER_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
      ...bloomShadowStyle('s'),
      // Narrowed to a required `string` so the press resolver can read the REST
      // fill straight off it. It sits AFTER the shadow spread, whose `ViewStyle`
      // would otherwise widen it back to `ColorValue`.
      backgroundColor: 'transparent',
    };

    if (checked || indeterminate) {
      base.backgroundColor = checkColor;
      base.borderColor = checkColor;
    } else {
      base.borderColor = theme.colors.border;
    }

    return base;
  }, [sizeConfig, checked, indeterminate, checkColor, theme]);

  // Unchecked the box has no fill, so the press IS the fill and it takes the
  // neutral wash; checked it keeps `checkColor` and gains a state layer of the
  // checkmark's own colour, so the held state cannot be read as unchecked.
  const pressedBackground = useMemo(
    () => pressedSurface(theme.colors, boxStyle.backgroundColor, checkmarkColor),
    [theme.colors, boxStyle.backgroundColor, checkmarkColor],
  );

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
      <Animated.View
        style={[
          boxStyle,
          pressed && !disabled && { backgroundColor: pressedBackground },
          { transform: [{ scale: pressAnim }] },
        ]}
      >
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
                // `gap-2` in upstream's label column, not a 2px hairline.
                marginTop: DESCRIPTION_GAP,
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
