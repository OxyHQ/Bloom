import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar/Avatar';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiArrowLeftDownLine } from '../icons/remix/RiArrowLeftDownLine';
import { RiArrowRightUpLine } from '../icons/remix/RiArrowRightUpLine';
import { RiPhoneLine } from '../icons/remix/RiPhoneLine';
import { RiVideoOnLine } from '../icons/remix/RiVideoOnLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CALL_HISTORY_LABELS, isNegativeDirection, resolveCallPaint } from './shared';
import type { CallDirection, CallGlyph, CallHistoryRowProps } from './types';

/**
 * `CallHistoryRow`: one entry in the call log.
 *
 *   44 avatar · name (`body-medium`; MISSED and DECLINED are drawn in the
 *   negative colour, because the log is scanned, not read) · the direction
 *   glyph and `meta` under it · a call-back button on the right
 *
 * DIRECTION IS TWO SIGNALS, NOT ONE. The arrow says which way the call went
 * (down-left arrived, up-right left) and the COLOUR says whether it connected.
 * A missed call told apart from a received one by hue alone is a distinction
 * one reader in twelve cannot make, so the second line names it in words
 * ("Missed · Yesterday, 18:40") and the row's accessible name carries it too.
 *
 * `meta` arrives pre-formatted: the app owns "Yesterday", the locale and how
 * long 4 minutes 32 seconds is written.
 */

const DIRECTION_GLYPH: Record<CallDirection, CallGlyph> = {
  incoming: RiArrowLeftDownLine,
  outgoing: RiArrowRightUpLine,
  missed: RiArrowLeftDownLine,
  declined: RiArrowRightUpLine,
};

function CallHistoryRowComponent({
  name,
  avatar,
  avatarVariant,
  direction,
  mode = 'voice',
  meta,
  count,
  onPress,
  onCallBack,
  selected = false,
  labels,
  style,
  textStyle,
  testID,
}: CallHistoryRowProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const l = { ...CALL_HISTORY_LABELS, ...labels };
  const negative = isNegativeDirection(direction);
  const DirectionGlyph = DIRECTION_GLYPH[direction];
  const CallBackGlyph = mode === 'video' ? RiVideoOnLine : RiPhoneLine;
  const directionName = l[direction];

  const body = (
    <>
      <Avatar source={avatar} variant={avatarVariant} name={name} size={44} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text
            variant="body-medium"
            numberOfLines={1}
            style={[{ color: negative ? paint.negative : paint.text, flexShrink: 1 }, textStyle]}
            testID={testID ? `${testID}-name` : undefined}
          >
            {name}
          </Text>
          {count === undefined || count <= 1 ? null : (
            <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
              {`(${count})`}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <DirectionGlyph
            width={14}
            height={14}
            fill={negative ? paint.negative : paint.textSecondary}
          />
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            style={{ color: paint.textSecondary, flexShrink: 1 }}
            testID={testID ? `${testID}-meta` : undefined}
          >
            {`${directionName} · ${meta}`}
          </Text>
        </View>
      </View>
    </>
  );

  const shell = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    backgroundColor:
      selected || (hovered && onPress !== undefined) ? paint.rowSelected : 'transparent',
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
  };

  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }, style]}
      testID={testID}
    >
      {onPress === undefined ? (
        <View style={shell}>{body}</View>
      ) : (
        <Pressable
          role="button"
          accessibilityLabel={`${name}, ${directionName.toLowerCase()}, ${meta}`}
          onPress={onPress}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={shell}
          testID={testID ? `${testID}-open` : undefined}
        >
          {body}
        </Pressable>
      )}
      {onCallBack === undefined ? null : (
        <Pressable
          role="button"
          accessibilityLabel={l.callBack(name)}
          onPress={onCallBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          testID={testID ? `${testID}-callback` : undefined}
        >
          <CallBackGlyph width={20} height={20} fill={paint.accent} />
        </Pressable>
      )}
    </View>
  );
}

export const CallHistoryRow = memo(CallHistoryRowComponent);
CallHistoryRow.displayName = 'CallHistoryRow';
