import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  Platform,
  Pressable,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation } from '../styles/tokens';
import { resolveAccentColors } from '../theme/accent-colors';
import { usePressAnimation } from '../hooks/use-press-animation';
import { TimesLarge_Stroke2_Corner0_Rounded as TimesIcon } from '../icons/Times';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import type { ChipProps } from './types';

/**
 * `closeIcon` is a rung of the icon scale rather than a pixel height: the close
 * affordance is an `Icons` glyph, and those take `size` from the shared scale
 * (`sm` = 16, `md` = 20).
 */
const SIZE_CONFIG = {
  small: { height: 24, fontSize: 12, paddingHorizontal: 8, iconGap: 4, closeIcon: 'sm' },
  medium: { height: 32, fontSize: 14, paddingHorizontal: 12, iconGap: 6, closeIcon: 'sm' },
  large: { height: 40, fontSize: 16, paddingHorizontal: 16, iconGap: 8, closeIcon: 'md' },
} as const;

// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  A pressable `Chip` is a react-native-web `Pressable`, so the browser gives it
//  `tabindex="0"` and a keyboard user can reach it — with nothing to show for
//  it, because react-native-web resets the outline and no inline style can carry
//  a `:focus-visible` rule. Silent, and only for keyboard users, which is why it
//  survived: it renders perfectly for everyone testing with a mouse.
//
//  The rules come from the SHARED recipe every Bloom control's web CSS is built
//  from — see `styles/interactive-web-css.ts` for why the selector is
//  `:focus-visible` rather than `:focus`, and why injection goes through
//  `adoptStyleSheet` rather than a `<style>` element. The hook is a `data-*`
//  attribute rather than a class because a class never reaches the DOM here:
//  react-native-css consumes `className` into `style` before that could happen.
//
//  `adoptStyleSheet` no-ops without a `document`, so this file stays universal
//  and native pays for a hook call and nothing else.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-chip-web-css';

const BLOOM_CHIP_CSS = interactiveWebCss({
  selector: '[data-bloom-chip]',
  varPrefix: 'bloom-chip',
  // The pill's own geometry is resolved-token inline style, since it has to be
  // identical on native. What `base` does here is put the LAYOUT half of the
  // shared reset back: that reset is written for a raw `<button>`, and an
  // adopted stylesheet is applied after the document's own, so left alone its
  // `display: inline-flex` and `justify-content: center` would win over
  // react-native-web's `View` classes and re-centre every chip's contents.
  // Declarations here are emitted after the reset in the same rule, which is
  // what the `base` option is for.
  base: `
    display: flex;
    align-items: center;
    justify-content: flex-start;
    box-sizing: border-box;
  `,
  transition: 'background-color 120ms ease, border-color 120ms ease, opacity 120ms ease',
  hover: { declarations: 'opacity: 0.9;' },
  outlineOffset: 2,
});

const IS_WEB = Platform.OS === 'web';

const ChipComponent: React.FC<ChipProps> = ({
  children,
  variant = 'outlined',
  color = 'default',
  size = 'medium',
  startIcon,
  endIcon,
  onPress,
  onClose,
  selected = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, BLOOM_CHIP_CSS);
  const { scaleAnim, onPressIn, onPressOut } = usePressAnimation(animation.pressScale);
  // Selection promotes the chip to the brand tone \u2014 the filter-pill behaviour \u2014
  // rather than to a second colour system of its own.
  const colors = resolveAccentColors(theme.colors, selected ? 'primary' : color, variant);
  const sizeConfig = SIZE_CONFIG[size];

  const containerStyle = useMemo((): WebCssStyle => ({
    height: sizeConfig.height,
    borderRadius: sizeConfig.height / 2,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    backgroundColor: colors.background,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeConfig.iconGap,
    alignSelf: 'flex-start',
    // A pill is a fixed-size token. In a flex row of chips (a filter bar, a tag
    // list) the default `flexShrink: 1` lets a long label squeeze its
    // neighbours into ellipsis; shadcn's badge says the same thing as
    // `shrink-0`. `overflow: hidden` keeps the content inside the radius.
    flexShrink: 0,
    overflow: 'hidden',
    // The `:focus-visible` ring colour, read by the adopted sheet. A custom
    // property because the value is a resolved theme token the static sheet
    // cannot know; native has no such style key and ignores it.
    '--bloom-chip-ring': colors.foreground,
  }), [sizeConfig, colors, variant]);

  const labelStyle = useMemo((): TextStyle => ({
    fontSize: sizeConfig.fontSize,
    fontWeight: '500',
    color: colors.foreground,
    // The label yields before the pill does: a chip narrower than its text
    // ellipsises rather than overflowing its own radius.
    flexShrink: 1,
  }), [sizeConfig, colors]);

  // Icons inside the pill are sized to the pill, not to whatever the caller
  // happened to pass \u2014 shadcn's badge pins them with `[&>svg]:size-3`. A slot
  // with a fixed box does the same thing without reaching into the child.
  const iconSlotStyle = useMemo((): ViewStyle => {
    const box = Math.round(sizeConfig.fontSize * 1.15);
    return { width: box, height: box, alignItems: 'center', justifyContent: 'center' };
  }, [sizeConfig]);

  const closeButton = onClose ? (
    <Pressable
      onPress={onClose}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel="Remove"
      accessibilityRole="button"
      style={iconSlotStyle}
    >
      <TimesIcon size={sizeConfig.closeIcon} fill={colors.foreground} />
    </Pressable>
  ) : null;

  const content = (
    <>
      {startIcon != null ? <View style={iconSlotStyle}>{startIcon}</View> : null}
      {typeof children === 'string' ? (
        <Text numberOfLines={1} style={[labelStyle, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
      {endIcon != null ? <View style={iconSlotStyle}>{endIcon}</View> : null}
      {closeButton}
    </>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          // The DOM hook the adopted sheet above hangs off.
          //
          // It MUST go through `dataSet`. react-native-web filters props against
          // a fixed list and drops anything it does not know, so a literal
          // `'data-bloom-chip'` prop never reaches the DOM — measured in a real
          // browser: the attribute was absent, the sheet matched nothing, and
          // the ring that appeared under keyboard focus was Chrome's own default,
          // which is exactly what a working ring looks like from a distance.
          // `dataSet` is the one channel react-native-web turns into `data-*`.
          //
          // A cast because react-native has no type for it (it is a
          // react-native-web prop, inert on native). Same web-only-attribute case
          // as `TextField`'s DOM mouse handlers, registered in
          // `classname-interop.test.ts`'s exemption list. It is NOT a `className`
          // smuggled past `styled()`, which is what that gate forbids.
          {...(IS_WEB ? ({ dataSet: { bloomChip: '' } } as Record<string, unknown>) : {})}
          style={[containerStyle, disabled && { opacity: 0.5 }, style]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          // Both spellings, because neither platform reads the other's and
          // there is no single prop that serves both here: react-native-web
          // ignores `accessibilityState`, while React Native has no
          // `aria-pressed` at all (its `AccessibilityState` is
          // disabled/selected/checked/busy/expanded). `aria-pressed` is also
          // the state ARIA defines for a toggle with `role="button"` —
          // `aria-selected` would be invalid on that role.
          accessibilityState={{ disabled, selected }}
          aria-pressed={selected}
          testID={testID}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View
      style={[containerStyle, disabled && { opacity: 0.5 }, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {content}
    </View>
  );
};

export const Chip = memo(ChipComponent);
Chip.displayName = 'Chip';
