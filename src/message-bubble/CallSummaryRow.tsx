import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import {
  RiArrowRightDownLine,
  RiArrowRightUpLine,
  RiPhoneLine,
  RiVideoLine,
} from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  BUBBLE_PADDING_X,
  bubbleAccessibleName,
  bubbleRadii,
  resolveMessageBubblePaint,
  sidePaint,
} from './shared';
import type { CallSummaryRowProps } from './types';

/**
 * A call in the transcript, in the same bubble as a message: the call glyph,
 * what happened, and how long it lasted.
 *
 *   incoming   an arrow pointing down-right, the quiet meta colour
 *   outgoing   an arrow pointing up-right, the quiet meta colour
 *   missed     the same down-right arrow in the ERROR colour
 *
 * The arrow says direction and the colour says outcome, and those are two
 * different axes on purpose: a missed INCOMING call and a missed OUTGOING call
 * are different events, and one red glyph for both would lose that. `title` and
 * `duration` are pre-formatted — this component does not know what "4 min"
 * is in the reader's language.
 */
function CallSummaryRowComponent({
  direction,
  outcome,
  title,
  duration,
  time,
  video = false,
  onPress,
  position = 'single',
  style,
  testID,
}: CallSummaryRowProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMessageBubblePaint(theme), [theme]);
  const side = sidePaint(paint, direction);
  const outgoing = direction === 'outgoing';
  const missed = outcome === 'missed';
  const glyphColor = missed ? paint.failed : side.meta;
  const Arrow = outcome === 'outgoing' ? RiArrowRightUpLine : RiArrowRightDownLine;
  const Glyph = video ? RiVideoLine : RiPhoneLine;

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        ...bubbleRadii(direction, position),
        backgroundColor: side.fill,
        borderWidth: side.border === undefined ? 0 : 1,
        borderColor: side.border,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: BUBBLE_PADDING_X,
        paddingRight: BUBBLE_PADDING_X,
      }}
    >
      <Glyph width={18} height={18} fill={side.text} />
      <View style={{ flexShrink: 1, gap: 1 }}>
        <Text variant="body-regular" style={{ color: side.text }}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Arrow width={12} height={12} fill={glyphColor} />
          <Text variant="caption-1-regular" style={{ color: missed ? paint.failed : side.meta }}>
            {duration ?? time ?? ''}
          </Text>
          {duration !== undefined && time !== undefined ? (
            <Text variant="caption-1-regular" style={{ color: side.meta }}>
              {time}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  const name = bubbleAccessibleName({ text: title, time, extras: [duration] });

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          paddingTop: 1,
          paddingBottom: 1,
          paddingLeft: 2,
          paddingRight: 2,
          justifyContent: outgoing ? 'flex-end' : 'flex-start',
        },
        style,
      ]}
      testID={testID}
    >
      {onPress === undefined ? (
        <View accessible accessibilityLabel={name} style={{ maxWidth: '78%' }}>
          {body}
        </View>
      ) : (
        <Pressable
          role="button"
          accessibilityLabel={name}
          onPress={onPress}
          style={{ maxWidth: '78%' }}
        >
          {body}
        </Pressable>
      )}
    </View>
  );
}

export const CallSummaryRow = memo(CallSummaryRowComponent);
CallSummaryRow.displayName = 'CallSummaryRow';
