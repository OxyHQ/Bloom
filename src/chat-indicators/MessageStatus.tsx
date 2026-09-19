import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiCheckDoubleLine } from '../icons/remix/RiCheckDoubleLine';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiErrorWarningFill } from '../icons/remix/RiErrorWarningFill';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { useTheme } from '../theme/use-theme';
import { MESSAGE_STATUS_LABELS, resolveChatIndicatorPaint } from './shared';
import type { MessageStatusProps } from './types';

/**
 * The delivery ticks on an OUTGOING message.
 *
 *   sending    a clock outline, muted     — queued, not yet acknowledged
 *   sent       one tick, muted            — the server has it
 *   delivered  two ticks, muted           — the device has it
 *   read       two ticks, ACCENT          — the person opened it
 *   failed     a filled error circle      — negative, never repainted
 *
 * `read` differs from `delivered` by colour alone, which is why the accessible
 * name is not optional: the whole distinction is invisible to a screen reader
 * and to anyone who cannot separate the two hues.
 *
 * Accessibility: one `img` named per status. Pass `label=""` inside a bubble
 * whose own text already reports delivery.
 */

function MessageStatusComponent({
  status,
  size = 14,
  color,
  label,
  style,
  testID,
}: MessageStatusProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatIndicatorPaint(theme), [theme]);

  const name = label ?? MESSAGE_STATUS_LABELS[status];
  const hidden = name === '';

  // `failed` ignores `color`: an error repainted to match the bubble it sits in
  // stops reading as an error.
  const fill =
    status === 'failed'
      ? paint.failed
      : (color ?? (status === 'read' ? paint.tickRead : paint.tick));

  // Two ticks are drawn at the same optical weight as one, so a row of bubbles
  // does not jump when a message goes from sent to delivered.
  const glyph = (() => {
    switch (status) {
      case 'sending':
        return <RiTimeLine width={size} height={size} fill={fill} />;
      case 'sent':
        return <RiCheckLine width={size} height={size} fill={fill} />;
      case 'delivered':
      case 'read':
        return <RiCheckDoubleLine width={size} height={size} fill={fill} />;
      case 'failed':
      default:
        return <RiErrorWarningFill width={size} height={size} fill={fill} />;
    }
  })();

  return (
    <View
      accessible={!hidden}
      aria-hidden={hidden || undefined}
      role={hidden ? undefined : 'img'}
      accessibilityLabel={hidden ? undefined : name}
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
      testID={testID}
    >
      {glyph}
    </View>
  );
}

export const MessageStatus = memo(MessageStatusComponent);
MessageStatus.displayName = 'MessageStatus';
