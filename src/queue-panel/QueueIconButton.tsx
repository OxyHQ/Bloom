import React, { forwardRef, useMemo } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { resolveQueuePanelPaint } from './shared';

type Glyph = React.ComponentType<{ width?: number; height?: number; fill?: string }>;

export interface QueueIconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: Glyph;
  accessibilityLabel: string;
  /** Diameter. Default `32`; the glyph is half of it. */
  size?: number;
  style?: WebCssStyle;
}

/**
 * A quiet round glyph button: no fill at rest, a neutral wash one step above
 * the row highlight under the pointer or finger, glyph in the secondary text
 * colour turning primary. Colour change only. Props beyond its own pass
 * through to the `Pressable`, which is what lets a menu trigger compose onto
 * it with `asChild`.
 */
export const QueueIconButton = forwardRef<View, QueueIconButtonProps>(function QueueIconButton(
  { icon: Icon, accessibilityLabel, size = 32, style, onHoverIn, onHoverOut, onPressIn, onPressOut, ...rest },
  ref,
) {
  const theme = useTheme();
  const paint = useMemo(() => resolveQueuePanelPaint(theme), [theme]);
  const hover = useInteractionState();
  const press = useInteractionState();
  const active = !rest.disabled && (hover.state || press.state);
  const glyph = Math.round(size / 2);
  const buttonStyle: WebCssStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: active ? paint.buttonHover : 'transparent',
    '--bloom-queue-ring': paint.ring,
    ...style,
  };

  return (
    <Pressable
      ref={ref}
      {...webDataSet({ bloomQueueFocusable: '' })}
      role="button"
      accessibilityLabel={accessibilityLabel}
      {...rest}
      onHoverIn={(e) => {
        hover.onIn();
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        hover.onOut();
        onHoverOut?.(e);
      }}
      onPressIn={(e) => {
        press.onIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onOut();
        onPressOut?.(e);
      }}
      style={buttonStyle}
    >
      <Icon width={glyph} height={glyph} fill={active ? paint.text : paint.textSecondary} />
    </Pressable>
  );
});
