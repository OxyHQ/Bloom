import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '../avatar/Avatar';
import { RiCastLine } from '../icons/remix/RiCastLine';
import { RiMicOffFill } from '../icons/remix/RiMicOffFill';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CALL_SPEAKING_PULSE_MS, CALL_UI_RADIUS, resolveCallPaint } from './shared';
import type { GroupCallTileProps } from './types';

/**
 * `GroupCallTile`: one participant in a group call.
 *
 *   the video frame, or the avatar centred on a raised wash of the stage
 *   a name pill bottom-left (the tile's own fill at 45%, so it survives both a
 *   bright frame and a dark one), with the muted glyph inside it
 *   a speaking RING drawn as an overlay, never as the tile's own border —
 *   a border that appears changes the content box, so every tile would shift
 *   by 3px each time somebody started talking
 *
 * The ring PULSES by opacity on a 900ms loop and holds still at full opacity
 * under reduced motion. Opacity is the right channel: it composites, so the
 * pulse costs nothing on either platform and it cannot move the layout.
 */

const RING_WIDTH = 3;

function SpeakingRing({ color, radius }: { color: string; radius: number }) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(0.4, { duration: CALL_SPEAKING_PULSE_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduced, pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }), [pulse]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: radius,
          borderWidth: RING_WIDTH,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

function GroupCallTileComponent({
  participant,
  width,
  height,
  onPress,
  formatMuted,
  prominent = false,
  style,
  testID,
}: GroupCallTileProps) {
  const theme = useTheme();
  const paint = useMemo(
    () => resolveCallPaint(theme, participant.accentColor),
    [theme, participant.accentColor],
  );
  const { id, name, avatar, avatarVariant, video, muted, speaking, presenting, label } = participant;
  const caption = label ?? name;
  const avatarSize = Math.max(28, Math.min(prominent ? 112 : 64, Math.floor(Math.min(width, height) * 0.42)));
  const accessibleName = muted === true ? (formatMuted ?? ((n: string) => `${n}, muted`))(caption) : caption;

  const content = (
    <>
      {video === undefined ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Avatar source={avatar} variant={avatarVariant} name={name} size={avatarSize} />
        </View>
      ) : (
        <View style={StyleSheet.absoluteFill}>{video}</View>
      )}

      <View
        style={{
          position: 'absolute',
          left: 6,
          bottom: 6,
          right: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            maxWidth: '100%',
            borderRadius: 999,
            backgroundColor: paint.tilePill,
            paddingTop: 2,
            paddingRight: 8,
            paddingBottom: 2,
            paddingLeft: 8,
          }}
        >
          {presenting === true ? (
            <RiCastLine width={12} height={12} fill={paint.onStage} />
          ) : null}
          <Text
            variant={prominent ? 'body-2-medium' : 'caption-1-medium'}
            numberOfLines={1}
            style={{ color: paint.onStage, flexShrink: 1 }}
          >
            {caption}
          </Text>
          {muted === true ? (
            <RiMicOffFill
              width={12}
              height={12}
              fill={paint.negativeOnStage}
              testID={testID ? `${testID}-muted` : undefined}
            />
          ) : null}
        </View>
      </View>

      {speaking === true ? (
        <SpeakingRing color={paint.speaking} radius={CALL_UI_RADIUS.tile} />
      ) : null}
    </>
  );

  const shell = {
    width,
    height,
    borderRadius: CALL_UI_RADIUS.tile,
    backgroundColor: paint.tile,
    overflow: 'hidden' as const,
  };

  if (onPress === undefined) {
    return (
      <View style={[shell, style]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      role="button"
      accessibilityLabel={accessibleName}
      onPress={() => onPress(id)}
      style={[shell, style]}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}

export const GroupCallTile = memo(GroupCallTileComponent);
GroupCallTile.displayName = 'GroupCallTile';
