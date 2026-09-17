import React, { forwardRef, useMemo } from 'react';
import { View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';

import { GlyphButton } from '../button';
import { resolveMediaControlsPaint } from '../media-controls/shared';
import type { WebAriaProps } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';

/** A glyph component (any `Ri*` icon). */
export type PlayerGlyph = React.ComponentType<{ width?: number; height?: number; fill?: string }>;

/** The dot under an active glyph. */
export const ACTIVE_DOT = 4;

export interface PlayerIconButtonProps {
  icon?: PlayerGlyph;
  /** Draws text instead of a glyph ("1.5×"). */
  text?: string;
  glyph: number;
  box: number;
  accessibilityLabel?: string;
  onPress?: (event: GestureResponderEvent) => void;
  /**
   * A TOGGLE: carries `aria-pressed` (web) and `accessibilityState.selected`
   * (native), and paints accent + dot when true. Leave undefined for a plain
   * button.
   */
  pressed?: boolean;
  /** Accent + dot without toggle semantics (a menu trigger whose menu has a value set). */
  active?: boolean;
  disabled?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: WebAriaProps['aria-haspopup'];
  /** Foreground at rest. Default the family's muted neutral. */
  restColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The glyph-only button every player control uses: shuffle, repeat, previous,
 * next, lyrics, queue, devices, fullscreen, the speed and sleep triggers.
 *
 *   rest     muted neutral glyph (`restColor` for previous / next: the text colour)
 *   hover    text colour on a neutral-100 (dark neutral-800) round wash
 *   active   accent glyph + a 4px accent dot under it
 *   disabled 50% opacity
 *
 * `button/GlyphButton` with this family's wash and two things only it has: the
 * ACTIVE DOT (its `decoration`) and a TEXT glyph ("1.5×"), which is what `grow`
 * is for — the box becomes a minimum width and the control widens to its label.
 *
 * `lit` is `pressed || active`, so the accent reaches a menu TRIGGER that is not
 * itself a toggle; that is why the lit colours are handed over as
 * `color`/`hoverColor` rather than left to `GlyphButton`'s `pressed` default.
 *
 * Colour change only. Forwards the trigger props `asChild` hands it
 * (`aria-expanded`, `aria-haspopup`, `onPress`, the name).
 */
export const PlayerIconButton = forwardRef<View, PlayerIconButtonProps>(function PlayerIconButton(
  {
    icon: Icon,
    text,
    glyph,
    box,
    accessibilityLabel,
    onPress,
    pressed,
    active,
    disabled = false,
    restColor,
    style,
    testID,
    ...aria
  },
  ref,
) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const lit = pressed === true || active === true;

  return (
    <GlyphButton
      ref={ref}
      icon={Icon}
      size={box}
      glyphSize={glyph}
      grow={text !== undefined}
      accessibilityLabel={accessibilityLabel ?? ''}
      disabled={disabled}
      pressed={pressed}
      color={lit ? paint.accent : (restColor ?? paint.textMuted)}
      hoverColor={lit ? paint.accentHover : paint.text}
      activeColor={paint.accent}
      activeHoverColor={paint.accentHover}
      fill="transparent"
      hoverFill={paint.wash}
      ring={paint.ring}
      aria-expanded={aria['aria-expanded']}
      aria-haspopup={aria['aria-haspopup']}
      onPress={onPress}
      style={style}
      testID={testID}
      decoration={
        lit ? (
          <View
            pointerEvents="none"
            testID={testID ? `${testID}-dot` : undefined}
            style={{
              position: 'absolute',
              bottom: box >= 40 ? 2 : 0,
              width: ACTIVE_DOT,
              height: ACTIVE_DOT,
              borderRadius: ACTIVE_DOT / 2,
              backgroundColor: paint.accent,
            }}
          />
        ) : null
      }
    >
      {Icon
        ? undefined
        : (foreground: string) => (
            <Text
              variant={glyph >= 20 ? 'body-semibold' : 'caption-1-semibold'}
              style={{ color: foreground }}
            >
              {text ?? ''}
            </Text>
          )}
    </GlyphButton>
  );
});
