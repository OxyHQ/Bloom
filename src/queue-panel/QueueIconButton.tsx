import React, { forwardRef, useMemo } from 'react';
import type { GestureResponderEvent, View } from 'react-native';

import { GlyphButton } from '../button';
import type { ButtonIconComponent } from '../button';
import type { WebAriaProps } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { resolveQueuePanelPaint } from './shared';

export interface QueueIconButtonProps {
  icon: ButtonIconComponent;
  accessibilityLabel: string;
  /** Diameter. Default `32`; the glyph is half of it. */
  size?: number;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: WebCssStyle;
  testID?: string;
  /** Set by a menu/popover trigger composing onto this with `asChild`. */
  'aria-expanded'?: boolean;
  'aria-haspopup'?: WebAriaProps['aria-haspopup'];
}

/**
 * A quiet round glyph button: no fill at rest, a neutral wash one step above
 * the row highlight under the pointer or finger, glyph in the secondary text
 * colour turning primary. Colour change only.
 *
 * `button/GlyphButton` with this family's palette and its 0.5 glyph ratio (the
 * lowest of the five that shared its shape, hence the explicit `glyphSize`).
 * The trigger props a menu composes onto it with `asChild` — `onPress`,
 * `aria-expanded`, `aria-haspopup`, the name — are NAMED here, because a
 * component that destructures a known prop list drops whatever it does not.
 */
export const QueueIconButton = forwardRef<View, QueueIconButtonProps>(function QueueIconButton(
  { icon, accessibilityLabel, size = 32, style, testID, ...rest },
  ref,
) {
  const theme = useTheme();
  const paint = useMemo(() => resolveQueuePanelPaint(theme), [theme]);

  return (
    <GlyphButton
      ref={ref}
      {...rest}
      icon={icon}
      accessibilityLabel={accessibilityLabel}
      size={size}
      glyphSize={Math.round(size / 2)}
      color={paint.textSecondary}
      hoverColor={paint.text}
      fill="transparent"
      hoverFill={paint.buttonHover}
      ring={paint.ring}
      style={style}
      testID={testID}
    />
  );
});
