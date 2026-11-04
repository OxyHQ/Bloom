import React, { useMemo, useRef } from 'react';
import { View, type ViewStyle } from 'react-native';

import { Button } from '../button';
import { resolveButtonPalette } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';
import type { RowActionButtonProps } from './types';

/** The glyph, at the small icon button's size. */
const ICON_SIZE = 16;
/** A hover waits this long before the tooltip shows; keyboard focus shows it at once. */
const TOOLTIP_DELAY_MS = 200;

/**
 * A row's icon button: Bloom's `Button` at `sm` (32×32, a pill) with a 16px glyph, named by
 * `label`, which is also its `md` tooltip on web. `active` paints the pressed state while a menu
 * it opened is showing.
 */
export function RowActionButton({
  icon: Icon,
  label,
  active = false,
  tooltip = true,
  appearance = 'plain',
  accessibilityLabel,
  style,
  ...buttonProps
}: RowActionButtonProps) {
  const theme = useTheme();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: focused, onIn: onFocusIn, onOut: onFocusOut } = useInteractionState();
  const pointerDown = useRef(false);

  const activeStyle = useMemo((): WebCssStyle | ViewStyle | undefined => {
    if (!active) return undefined;
    const paint = resolveButtonPalette(appearance, theme, 'neutral').active;
    return IS_WEB
      ? {
          '--bloom-btn-bg': paint.background,
          '--bloom-btn-bg-hover': paint.background,
          '--bloom-btn-border': paint.border,
          '--bloom-btn-border-hover': paint.border,
        }
      : { backgroundColor: paint.background, borderColor: paint.border };
  }, [active, appearance, theme]);

  // Painted `currentColor` on web so the glyph follows the button's state
  // colours; native has no inherited colour, so it takes the label colour.
  const fill = IS_WEB ? 'currentColor' : theme.colors.text;

  const button = (
    <Button
      {...buttonProps}
      size="sm"
      accessibilityLabel={accessibilityLabel ?? label}
      leading={<Icon width={ICON_SIZE} height={ICON_SIZE} fill={fill} />}
      style={[activeStyle, style]}
      appearance={appearance}
      tone="neutral"
    />
  );

  if (!tooltip || !IS_WEB) return button;

  return (
    <Tooltip
      position="top"
      visible={(hovered || focused) && !active}
      delay={focused ? 0 : TOOLTIP_DELAY_MS}
      onVisibleChange={(visible) => {
        if (visible) return;
        onHoverOut();
        onFocusOut();
      }}
    >
      <TooltipTrigger>
        <View
          onPointerEnter={onHoverIn}
          onPointerLeave={onHoverOut}
          onPointerDown={() => {
            // A press closes the tooltip, and a press-focus is not a keyboard
            // focus — only the latter opens it.
            pointerDown.current = true;
            onHoverOut();
          }}
          onFocus={() => {
            if (!pointerDown.current) onFocusIn();
            pointerDown.current = false;
          }}
          onBlur={onFocusOut}
        >
          {button}
        </View>
      </TooltipTrigger>
      <TooltipTextBubble size="md">{label}</TooltipTextBubble>
    </Tooltip>
  );
}
