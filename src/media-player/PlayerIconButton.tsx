import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { Pressable, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';

import { webDataSet } from '../checkbox/shared';
import {
  MEDIA_CONTROLS_CSS,
  MEDIA_CONTROLS_STYLE_ID,
  resolveMediaControlsPaint,
} from '../media-controls/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
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
  'aria-haspopup'?: boolean | 'menu' | 'dialog' | 'listbox' | 'tree' | 'grid' | 'true' | 'false';
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
  useEffect(() => {
    adoptStyleSheet(MEDIA_CONTROLS_STYLE_ID, MEDIA_CONTROLS_CSS);
  }, []);
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const [hovered, setHovered] = useState(false);
  const lit = pressed === true || active === true;
  const hover = hovered && !disabled;
  const color = lit ? (hover ? paint.accentHover : paint.accent) : hover ? paint.text : (restColor ?? paint.textMuted);

  const rootStyle: WebCssStyle = {
    minWidth: box,
    height: box,
    paddingLeft: text ? 6 : 0,
    paddingRight: text ? 6 : 0,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hover ? paint.wash : undefined,
    opacity: disabled ? 0.5 : 1,
    '--bloom-media-ring': paint.ring,
  };

  const toggle = pressed !== undefined;

  return (
    <Pressable
      ref={ref}
      {...webDataSet({ bloomMediaFocusable: '', bloomPlayerButton: lit ? 'active' : '' })}
      role="button"
      accessibilityLabel={accessibilityLabel}
      aria-pressed={toggle ? pressed : undefined}
      accessibilityState={toggle ? { selected: pressed, disabled } : { disabled }}
      aria-disabled={disabled || undefined}
      aria-expanded={aria['aria-expanded']}
      aria-haspopup={aria['aria-haspopup']}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={[rootStyle, style]}
      testID={testID}
    >
      <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
        {Icon ? (
          <Icon width={glyph} height={glyph} fill={color} />
        ) : (
          <Text variant={glyph >= 20 ? 'body-semibold' : 'caption-1-semibold'} style={{ color }}>
            {text ?? ''}
          </Text>
        )}
      </View>
      {lit ? (
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
      ) : null}
    </Pressable>
  );
});
