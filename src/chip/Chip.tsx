import { useBloomAppearance } from '../appearance';
import { normalizeTagTone } from './shared';
import React, { forwardRef, memo, useMemo } from 'react';
import {
  View,
  Platform,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { borderRadius } from '../styles/tokens';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { NOT_DISABLED, interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { CHIP_GEOMETRY, resolveChipPaint, resolveChipRing } from './shared';
import type { ChipProps } from './types';

/**
 * The chip, five rungs and four fills. The rung table and the paint recipe are
 * in `shared.ts` — including why `inverted` is a different idea rather than a
 * fourth loudness, and why the scale had to grow past 28 (five families had
 * drawn their own pill because it did not).
 *
 * Bloom keeps the full pill, like `Button`, rather than a 6px corner. The icon
 * and close slots are Bloom's own, sized to the rung, with Remix's
 * `close-line` (16) as the close glyph.
 */
const CLOSE_ICON = 16;

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
//  THE RING COLOUR IS THE ACCENT RAMP'S 500, not the chip's own label. It was
//  the label, which is the one colour guaranteed to be invisible on the chip:
//  a solid chip's ring was white on white (measured 1.09:1 in light mode, black
//  on black in dark). Every other ring in the library — sidebar, menus, the map
//  markers, the category bar, the filter pills — is `accent[500]`, and it is a
//  ring on the PAGE, so it must contrast with what is behind the chip rather
//  than with the chip. Nothing in jest can see this: the custom property is
//  present, spelled correctly, and carries a real colour either way.
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
  extraRules: `
/* The rung with a minWidth ("Any", "1", "8+" in a counts row) centres its
   label. The style prop cannot say so: the reset above is an adopted sheet and
   wins over react-native-web's atomic classes, so it has to be said here too. */
[data-bloom-chip][data-bloom-chip-center] {
  justify-content: center;
}
/* An inverted chip answers hover with its BORDER, in JS, because the colour is
   a resolved token. The shared opacity hover would fire as well and fade the
   label of a pill that has no fill to fade. The disabled filter is not optional:
   without it this would undo the 0.5 a disabled chip is dimmed to, on hover. */
[data-bloom-chip][data-bloom-chip-inverted]${NOT_DISABLED}:hover {
  opacity: 1;
}
`,
});

const IS_WEB = Platform.OS === 'web';

const ChipComponent = forwardRef<View, ChipProps>(function ChipComponent(
  {
    children,
    variant: variantProp = 'subtle',
    appearance,
    tone: toneProp,
    color,
    hue,
    surface,
    size: sizeProp,
    startIcon: startIconProp,
    leading,
    leadingIcon: LeadingIcon,
    endIcon: endIconProp,
    trailing,
    trailingIcon: TrailingIcon,
    onPress,
    onClose,
    closeLabel,
    selected: selectedProp,
    checked,
    onCheckedChange,
    role = 'button',
    disabled = false,
    tabIndex,
    onKeyDown,
    style,
    textStyle,
    accessibilityLabel,
    testID,
  },
  ref,
) {
  const theme = useTheme();
  const scoped = useBloomAppearance({ size: ['xs','sm','md','lg'].includes(sizeProp ?? '') ? sizeProp as import('../appearance').BloomSize : undefined, tone: toneProp ?? (color ? normalizeTagTone(color) : undefined) }, {size: 'md', tone: 'neutral'});
  const size = sizeProp ?? scoped.size;
  const tone = scoped.tone;
  const variant = appearance ?? variantProp;
  const selected = checked ?? selectedProp ?? false;
  const startIcon = leading ?? (LeadingIcon ? <LeadingIcon /> : startIconProp);
  const endIcon = trailing ?? (TrailingIcon ? <TrailingIcon /> : endIconProp);

  useInteractiveWebCss(STYLE_ID, BLOOM_CHIP_CSS);
  // No press scale, like `Button`: a press is the background change alone,
  // which is also the one press affordance that reads under a mouse.
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  // Hover is JS only for the fill that answers it with a border colour; every
  // other fill answers in CSS, and wiring the handlers unconditionally would
  // re-render every chip in a tag list on pointer move for nothing.
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const paint = useMemo(
    () => resolveChipPaint(theme, { tone, variant, selected, hue, surface }),
    [theme, tone, variant, selected, hue, surface],
  );
  const ring = useMemo(() => resolveChipRing(theme), [theme]);
  const geometry = CHIP_GEOMETRY[size];

  const containerStyle = useMemo((): WebCssStyle => ({
    height: geometry.height,
    borderRadius: borderRadius.full,
    paddingHorizontal: geometry.paddingHorizontal,
    backgroundColor: paint.background,
    borderWidth: paint.borderWidth,
    borderColor: paint.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: geometry.iconGap,
    alignSelf: 'flex-start',
    ...(geometry.minWidth ? { minWidth: geometry.minWidth, justifyContent: 'center' } : null),
    // A pill is a fixed-size token. In a flex row of chips (a filter bar, a tag
    // list) the default `flexShrink: 1` lets a long label squeeze its
    // neighbours into ellipsis. `overflow: hidden` keeps the content inside the
    // radius.
    flexShrink: 0,
    overflow: 'hidden',
    // The `:focus-visible` ring colour, read by the adopted sheet. A custom
    // property because the value is a resolved theme token the static sheet
    // cannot know; native has no such style key and ignores it.
    '--bloom-chip-ring': ring,
  }), [geometry, paint, ring]);

  const labelStyle = useMemo((): TextStyle => ({
    color: paint.foreground,
    // The label yields before the pill does: a chip narrower than its text
    // ellipsises rather than overflowing its own radius.
    flexShrink: 1,
  }), [paint]);

  // Icons inside the pill are sized to the RUNG, not to whatever the caller
  // happened to pass. A slot with a fixed box does that without reaching into
  // the child.
  const iconSlotStyle = useMemo(
    (): ViewStyle => ({
      width: geometry.icon,
      height: geometry.icon,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [geometry],
  );

  // A row of removable chips is a row of buttons all called "Remove" otherwise,
  // and a screen reader reading them in sequence says the same word five times
  // with no way to tell which pill goes. The chip names it from its own label
  // when that label is words; `closeLabel` is for the rest.
  const removeLabel = closeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove');
  const closeButton = onClose ? (
    <Pressable
      onPress={onClose}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel={removeLabel}
      accessibilityRole="button"
      style={iconSlotStyle}
    >
      <RiCloseLine width={CLOSE_ICON} height={CLOSE_ICON} fill={paint.foreground} />
    </Pressable>
  ) : null;

  const content = (
    <>
      {startIcon != null ? <View style={iconSlotStyle}>{startIcon}</View> : null}
      {typeof children === 'string' ? (
        <Text variant={geometry.type} numberOfLines={1} style={[labelStyle, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
      {endIcon != null ? <View style={iconSlotStyle}>{endIcon}</View> : null}
      {closeButton}
    </>
  );

  if (onPress || onCheckedChange) {
    // Both spellings of the state, because neither platform reads the other's
    // and there is no single prop that serves both: react-native-web ignores
    // `accessibilityState`, while React Native has no `aria-pressed` at all
    // (its `AccessibilityState` is disabled/selected/checked/busy/expanded).
    // WHICH attribute is a property of the ROLE, not a preference — a `radio`
    // carries `aria-checked` and a `tab` `aria-selected`; `aria-pressed` on
    // either is invalid, and `aria-selected` on a `button` is too.
    const stateProps =
      role === 'radio'
        ? { accessibilityState: { checked: selected, disabled }, 'aria-checked': selected }
        : role === 'tab'
          ? { accessibilityState: { selected, disabled }, 'aria-selected': selected }
          : { accessibilityState: { disabled, selected }, 'aria-pressed': selected };

    return (
      <Pressable
        ref={ref}
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
        {...(IS_WEB
          ? ({
              dataSet: {
                bloomChip: '',
                ...(geometry.minWidth ? { bloomChipCenter: '' } : null),
                ...(variant === 'inverted' ? { bloomChipInverted: '' } : null),
              },
              ...(tabIndex !== undefined ? { tabIndex } : null),
              ...(onKeyDown ? { onKeyDown } : null),
            } as Record<string, unknown>)
          : {})}
        style={[
          containerStyle,
          disabled && { opacity: 0.5 },
          hovered && !disabled && paint.hoveredBorder ? { borderColor: paint.hoveredBorder } : null,
          // Before the caller's `style`, so `style` still wins the array.
          pressed && !disabled && { backgroundColor: paint.pressedBackground },
          style,
        ]}
        onPress={(event) => {
          if (disabled) return;
          onCheckedChange?.(!selected);
          onPress?.();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        {...(paint.hoveredBorder ? { onHoverIn, onHoverOut } : null)}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        role={role}
        {...stateProps}
        aria-disabled={disabled || undefined}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      ref={ref}
      style={[containerStyle, disabled && { opacity: 0.5 }, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {content}
    </View>
  );
});

export const Chip = memo(ChipComponent);
Chip.displayName = 'Chip';
