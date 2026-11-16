import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button } from '../button';
import { PageHeader } from '../page-header';
import { ScrollArea } from '../layout/ScrollArea';
import type { ButtonIconComponent } from '../button/types';
import { Avatar } from '../avatar/Avatar';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiMore2Line } from '../icons/remix/RiMore2Line';
import { RiSendPlaneLine } from '../icons/remix/RiSendPlaneLine';
import { RiVolumeMuteLine } from '../icons/remix/RiVolumeMuteLine';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';
import { TextFieldInput } from '../text-field';
import { useMessages } from '../locale/messages';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { StoryProgressBars } from './StoryProgressBars';
import { STORY_DURATION_MS, resolveChatPeoplePaint } from './shared';
import type { StoryViewerProps } from './types';
import { CHAT_PEOPLE_MESSAGES } from './messages';

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
  const { messages } = useMessages(CHAT_PEOPLE_MESSAGES);
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const l = { ...messages.story, ...labels };
  const current = stories[index];
  const storyDuration = current?.duration ?? duration;

  const iconButton = (
    key: string,
    label: string,
    icon: ButtonIconComponent,
    onPress?: () => void,
    pressed?: boolean,
  ) =>
    onPress === undefined ? null : (
      <Button
        tone="neutral"
        appearance="outline"
        key={key}
        iconOnly
        leadingIcon={icon}
        accessibilityLabel={label}
        pressed={pressed}
        onPress={onPress}
        testID={testID ? `${testID}-${key}` : undefined}
      />
    );

  return (
    <View
      style={[
        {
          flex: 1,
          minHeight: 0,
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

      <PageHeader
        onBack={null}
        sticky={false}
        safeArea={false}
        tone="onImage"
        scrim="always"
        overline={
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
        }
        title={
          <Text
            variant="body-semibold"
            numberOfLines={1}
            style={{ color: paint.onStage }}
            testID={testID ? `${testID}-name` : undefined}
          >
            {name}
          </Text>
        }
        subtitle={time}
        titleVisual={<Avatar source={avatar} variant={avatarVariant} name={name} size={32} />}
        actions={
          onMutedChange || onMore || onClose ? (
            <Button.Group>
              {iconButton(
                'mute',
                muted ? l.unmute : l.mute,
                muted ? RiVolumeMuteLine : RiVolumeUpLine,
                onMutedChange === undefined ? undefined : () => onMutedChange(!muted),
                muted,
              )}
              {iconButton('more', l.more, RiMore2Line, onMore)}
              {iconButton('close', l.close, RiCloseLine, onClose)}
            </Button.Group>
          ) : undefined
        }
        testID={testID ? `${testID}-header` : undefined}
      />

      <View style={{ flex: 1, minHeight: 0 }} pointerEvents="box-none" />

      <ScrollArea
        style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}
        contentContainerStyle={{ gap: 10, paddingRight: 12, paddingBottom: 14, paddingLeft: 12 }}
        keyboardShouldPersistTaps="handled"
        testID={testID ? `${testID}-composer-scroll` : undefined}
      >
        {reactions === undefined || reactions.length === 0 ? null : (
          <View
            style={{ flexDirection: 'row', gap: 8 }}
            testID={testID ? `${testID}-reactions` : undefined}
          >
            {reactions.map((emoji) => (
              <Button
                tone="neutral"
                appearance="outline"
                key={emoji}
                iconOnly
                accessibilityLabel={l.react(emoji)}
                onPress={onReact === undefined ? undefined : () => onReact(emoji)}
                disabled={onReact === undefined}
                testID={testID ? `${testID}-react-${emoji}` : undefined}
              >
                {emoji}
              </Button>
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
            <Button
              tone="neutral"
              appearance="outline"
              iconOnly
              leadingIcon={RiSendPlaneLine}
              accessibilityLabel={l.send}
              onPress={onReplySend}
              disabled={onReplySend === undefined}
              testID={testID ? `${testID}-send` : undefined}
            />
          </View>
        )}
      </ScrollArea>
    </View>
  );
}

export const StoryViewer = memo(StoryViewerComponent);
StoryViewer.displayName = 'StoryViewer';
