import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar/Avatar';
import { Button } from '../button';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiMicLine } from '../icons/remix/RiMicLine';
import { RiMicOffFill } from '../icons/remix/RiMicOffFill';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CALL_CONTROL_LABELS, CALL_UI_RADIUS, resolveCallPaint } from './shared';
import type { GroupCallBarProps } from './types';

/**
 * `GroupCallBar`: the strip that says a group call is happening, wherever you
 * are in the app — a chat header, a channel, a list row.
 *
 *   an IN-APP surface, so it takes the theme and flips with the mode
 *   a live dot + "Ana is speaking" when someone is, else the quiet
 *   `statusText` ("4 on the call")
 *   overlapping avatars (−10px each, the newest under the one before it) with
 *   a `+N` mark
 *   a Join / Leave button, and a mute toggle once you have joined
 *
 * The speaking line replaces the status line rather than sitting beside it.
 * Two lines in a 56px strip is a strip that scrolls, and "who is talking" is
 * the only thing on it that changes second to second.
 */

const AVATAR = 28;
const OVERLAP = 10;

function GroupCallBarComponent({
  title,
  speakingName,
  statusText,
  participants = [],
  maxAvatars = 4,
  joined = false,
  onJoin,
  onLeave,
  muted = false,
  onMutedChange,
  onPress,
  labels,
  style,
  testID,
}: GroupCallBarProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();

  const speakingLabel = labels?.speaking ?? ((name: string) => `${name} is speaking`);
  const line =
    speakingName !== undefined && speakingName !== ''
      ? speakingLabel(speakingName)
      : (statusText ?? '');
  const shown = participants.slice(0, maxAvatars);
  const rest = Math.max(0, participants.length - shown.length);

  const body = (
    <>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {title === undefined ? null : (
          <Text variant="body-2-medium" numberOfLines={1} style={{ color: paint.text }}>
            {title}
          </Text>
        )}
        {line === '' ? null : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {speakingName === undefined || speakingName === '' ? null : (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: paint.speaking,
                }}
              />
            )}
            <Text
              variant="caption-1-regular"
              numberOfLines={1}
              style={{ color: paint.textSecondary, flexShrink: 1 }}
              testID={testID ? `${testID}-status` : undefined}
            >
              {line}
            </Text>
          </View>
        )}
      </View>

      {shown.length === 0 ? null : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {shown.map((participant, index) => (
            <View
              key={participant.id}
              style={{
                marginLeft: index === 0 ? 0 : -OVERLAP,
                borderRadius: AVATAR / 2,
                borderWidth: 2,
                borderColor: paint.surfaceRaised,
                zIndex: shown.length - index,
              }}
            >
              <Avatar
                source={participant.avatar}
                variant={participant.avatarVariant}
                name={participant.name}
                size={AVATAR}
              />
            </View>
          ))}
          {rest === 0 ? null : (
            <View
              style={{
                marginLeft: -OVERLAP,
                width: AVATAR,
                height: AVATAR,
                borderRadius: AVATAR / 2,
                borderWidth: 2,
                borderColor: paint.surfaceRaised,
                backgroundColor: paint.rowSelected,
                alignItems: 'center',
                justifyContent: 'center',
                // ON TOP of the stack, not under it. The avatars overlap
                // first-over-next, so the last item's LEFT edge is covered —
                // which clips a centred "+2" to "2".
                zIndex: shown.length + 1,
              }}
              testID={testID ? `${testID}-more` : undefined}
            >
              <Text variant="caption-2-semibold" style={{ color: paint.textSecondary }}>
                {`+${rest}`}
              </Text>
            </View>
          )}
        </View>
      )}
    </>
  );

  const shell = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
    minWidth: 0,
    borderRadius: CALL_UI_RADIUS.card - 6,
    backgroundColor: hovered && onPress !== undefined ? paint.rowSelected : 'transparent',
    paddingTop: 4,
    paddingRight: 6,
    paddingBottom: 4,
    paddingLeft: 6,
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: CALL_UI_RADIUS.card,
          borderWidth: 1,
          borderColor: paint.border,
          backgroundColor: paint.surfaceRaised,
          paddingTop: 10,
          paddingRight: 10,
          paddingBottom: 10,
          paddingLeft: 12,
        },
        style,
      ]}
      testID={testID}
    >
      {onPress === undefined ? (
        <View style={shell}>{body}</View>
      ) : (
        <Pressable
          role="button"
          accessibilityLabel={title ?? line}
          onPress={onPress}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={shell}
          testID={testID ? `${testID}-open` : undefined}
        >
          {body}
        </Pressable>
      )}

      {joined && onMutedChange !== undefined ? (
        <Pressable
          role="button"
          accessibilityLabel={
            muted
              ? (labels?.unmute ?? CALL_CONTROL_LABELS.unmute)
              : (labels?.mute ?? CALL_CONTROL_LABELS.mute)
          }
          aria-pressed={muted}
          accessibilityState={{ selected: muted }}
          onPress={() => onMutedChange(!muted)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: muted ? paint.negative : paint.border,
            backgroundColor: muted ? paint.rowSelected : 'transparent',
          }}
          testID={testID ? `${testID}-mute` : undefined}
        >
          {muted ? (
            <RiMicOffFill width={16} height={16} fill={paint.negative} />
          ) : (
            <RiMicLine width={16} height={16} fill={paint.textSecondary} />
          )}
        </Pressable>
      ) : null}

      {joined ? (
        onLeave === undefined ? null : (
          <Button
            variant="destructive"
            size="small"
            onPress={onLeave}
            testID={testID ? `${testID}-leave` : undefined}
          >
            {labels?.leave ?? 'Leave'}
          </Button>
        )
      ) : onJoin === undefined ? null : (
        <Button
          variant="primary"
          size="small"
          onPress={onJoin}
          testID={testID ? `${testID}-join` : undefined}
        >
          {labels?.join ?? 'Join'}
        </Button>
      )}
    </View>
  );
}

export const GroupCallBar = memo(GroupCallBarComponent);
GroupCallBar.displayName = 'GroupCallBar';
