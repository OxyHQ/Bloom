import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Avatar } from '../avatar/Avatar';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiMore2Line } from '../icons/remix/RiMore2Line';
import { RiSendPlaneLine } from '../icons/remix/RiSendPlaneLine';
import { RiVolumeMuteLine } from '../icons/remix/RiVolumeMuteLine';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';
import { TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { StoryProgressBars } from './StoryProgressBars';
import { STORY_DURATION_MS, STORY_VIEWER_LABELS, resolveChatPeoplePaint } from './shared';
import type { StoryViewerProps } from './types';

/**
 * `StoryViewer`: one story, full bleed.
 *
 *   top      `StoryProgressBars`, then the header — avatar, name, time, mute,
 *            more, close
 *   middle   the media, with a BACK zone over the left third and a FORWARD zone
 *            over the rest
 *   bottom   a reply field and the quick reactions
 *
 * THE TAP ZONES ARE NOT SYMMETRIC. Forward is what a reader means nine times
 * out of ten and it must not require aim, so it gets two thirds; back is a
 * correction and gets one. Both are real `button`s with names ("Previous
 * story", "Next story"), because a tap zone that is only a gesture is a story
 * set a keyboard user cannot get through.
 *
 * HOLD-TO-PAUSE IS THE APP'S. A long press has to compete with whatever
 * scrolling, swiping and dismissing the surface around the viewer does, and a
 * component that claims it in isolation fights its own host. Bind your gesture
 * and pass `paused` — the strip is controlled by that one boolean, and the
 * `docs` page shows the three-line version.
 *
 * `index` is CONTROLLED. The viewer never advances itself; `onNext` fires from
 * the tap zone and from the progress strip running out, and the app decides
 * whether that means the next story, the next person, or closing.
 */


/**
 * A scrim pinned to one edge of the story, transparent at the far end.
 *
 * The chrome sits over a photo Bloom does not own, and a name in white over a
 * beach at noon is a name nobody can read. The alpha is carried in
 * `stopOpacity`, never inside `stopColor`: react-native-svg DISCARDS the alpha
 * in a stop colour while CSS keeps it, so an `rgba()` stop renders correctly on
 * web and fully OPAQUE on native — a letterbox over the media it exists to
 * protect.
 */
let storyScrimId = 0;

function StoryScrim({
  color,
  edge,
  height,
  opacity,
}: {
  color: string;
  edge: 'top' | 'bottom';
  height: number;
  opacity: number;
}) {
  const id = useMemo(() => `bloom-story-scrim-${storyScrimId++}`, []);
  const from = edge === 'top' ? opacity : 0;
  const to = edge === 'top' ? 0 : opacity;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height,
        ...(edge === 'top' ? { top: 0 } : { bottom: 0 }),
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={from} />
            <Stop offset="1" stopColor={color} stopOpacity={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function StoryViewerComponent({
  stories,
  index,
  onNext,
  onPrevious,
  onClose,
  paused = false,
  duration = STORY_DURATION_MS,
  progress,
  name,
  avatar,
  avatarVariant,
  time,
  muted = false,
  onMutedChange,
  onMore,
  replyValue,
  onReplyChange,
  onReplySend,
  composer,
  reactions,
  onReact,
  height,
  labels,
  style,
  testID,
}: StoryViewerProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const l = { ...STORY_VIEWER_LABELS, ...labels };
  const current = stories[index];
  const storyDuration = current?.duration ?? duration;

  const iconButton = (
    key: string,
    label: string,
    glyph: React.ReactNode,
    onPress?: () => void,
    pressed?: boolean,
  ) =>
    onPress === undefined ? null : (
      <Pressable
        key={key}
        role="button"
        accessibilityLabel={label}
        aria-pressed={pressed}
        accessibilityState={pressed === undefined ? undefined : { selected: pressed }}
        onPress={onPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        testID={testID ? `${testID}-${key}` : undefined}
      >
        {glyph}
      </Pressable>
    );

  return (
    <View
      style={[
        {
          flex: 1,
          minHeight: 480,
          height,
          backgroundColor: paint.stage,
          borderRadius: 20,
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
    >
      {current?.media === undefined ? null : (
        <View style={StyleSheet.absoluteFill} testID={testID ? `${testID}-media` : undefined}>
          {current.media}
        </View>
      )}

      <StoryScrim color={paint.stage} edge="top" height={132} opacity={0.72} />
      <StoryScrim color={paint.stage} edge="bottom" height={176} opacity={0.7} />

      {/* Tap zones sit UNDER the chrome, so a press on the close button is not
          also a press on "next". */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={{ flex: 1, flexDirection: 'row' }} pointerEvents="box-none">
          <Pressable
            role="button"
            accessibilityLabel={l.previous}
            onPress={onPrevious}
            disabled={onPrevious === undefined}
            style={{ flex: 1 }}
            testID={testID ? `${testID}-previous` : undefined}
          />
          <Pressable
            role="button"
            accessibilityLabel={l.next}
            onPress={onNext}
            disabled={onNext === undefined}
            style={{ flex: 2 }}
            testID={testID ? `${testID}-next` : undefined}
          />
        </View>
      </View>

      <View
        style={{ paddingTop: 12, paddingRight: 12, paddingLeft: 12, gap: 10 }}
        pointerEvents="box-none"
      >
        <StoryProgressBars
          count={stories.length}
          index={index}
          progress={progress}
          duration={storyDuration}
          paused={paused}
          onComplete={onNext}
          accessibilityLabel={l.progress(index, stories.length)}
          testID={testID ? `${testID}-progress` : undefined}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar source={avatar} variant={avatarVariant} name={name} size={32} />
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              variant="body-semibold"
              numberOfLines={1}
              style={{ color: paint.onStage, flexShrink: 1 }}
              testID={testID ? `${testID}-name` : undefined}
            >
              {name}
            </Text>
            <Text variant="caption-1-regular" style={{ color: paint.onStageMuted }}>
              {time}
            </Text>
          </View>
          {iconButton(
            'mute',
            muted ? l.unmute : l.mute,
            muted ? (
              <RiVolumeMuteLine width={18} height={18} fill={paint.onStage} />
            ) : (
              <RiVolumeUpLine width={18} height={18} fill={paint.onStage} />
            ),
            onMutedChange === undefined ? undefined : () => onMutedChange(!muted),
            muted,
          )}
          {iconButton(
            'more',
            l.more,
            <RiMore2Line width={18} height={18} fill={paint.onStage} />,
            onMore,
          )}
          {iconButton(
            'close',
            l.close,
            <RiCloseLine width={20} height={20} fill={paint.onStage} />,
            onClose,
          )}
        </View>
      </View>

      <View style={{ flex: 1 }} pointerEvents="box-none" />

      <View
        style={{ gap: 10, paddingRight: 12, paddingBottom: 14, paddingLeft: 12 }}
        pointerEvents="box-none"
      >
        {reactions === undefined || reactions.length === 0 ? null : (
          <View
            style={{ flexDirection: 'row', gap: 8 }}
            testID={testID ? `${testID}-reactions` : undefined}
          >
            {reactions.map((emoji) => (
              <Pressable
                key={emoji}
                role="button"
                accessibilityLabel={l.react(emoji)}
                onPress={onReact === undefined ? undefined : () => onReact(emoji)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: paint.stageControl,
                }}
                testID={testID ? `${testID}-react-${emoji}` : undefined}
              >
                <Text variant="title-3-regular" style={{ color: paint.onStage }}>
                  {emoji}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {composer !== undefined ? (
          composer
        ) : onReplyChange === undefined ? null : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TextFieldInput
                label={l.replyPlaceholder}
                placeholder={l.replyPlaceholder}
                value={replyValue ?? ''}
                onChangeText={onReplyChange}
                testID={testID ? `${testID}-reply` : undefined}
              />
            </View>
            <Pressable
              role="button"
              accessibilityLabel={l.send}
              onPress={onReplySend}
              disabled={onReplySend === undefined}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: paint.stageControl,
              }}
              testID={testID ? `${testID}-send` : undefined}
            >
              <RiSendPlaneLine width={18} height={18} fill={paint.onStage} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export const StoryViewer = memo(StoryViewerComponent);
StoryViewer.displayName = 'StoryViewer';
