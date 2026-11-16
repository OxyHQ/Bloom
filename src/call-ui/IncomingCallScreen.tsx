import React, { memo, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ScrollArea } from '../layout/ScrollArea';
import { Avatar } from '../avatar/Avatar';
import { Button } from '../button';
import { useMeasuredSizeClass } from '../hooks/use-width-class';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiMessage2Line } from '../icons/remix/RiMessage2Line';
import { RiPhoneFill } from '../icons/remix/RiPhoneFill';
import { RiTimerLine } from '../icons/remix/RiTimerLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useMessages } from '../locale/messages';
import { CallControlButton } from './CallControls';
import { CallEndGlyph } from './glyphs';
import { CallStageBackdrop } from './parts';
import { CALL_UI_MESSAGES } from './messages';
import { CALL_UI_RADIUS, resolveCallPaint, slideAnswers, type CallPaint } from './shared';
import type { IncomingCallScreenProps } from './types';
import type { BloomIconComponent } from '../icons/icon-component';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

/**
 * `IncomingCallScreen`: the whole screen, for a call arriving on a locked or
 * backgrounded app.
 *
 *   the voice stage's wash, a 132px avatar, the name in `title-1-semibold`
 *   and "Incoming video call" under it
 *   answerMode="buttons"  decline and accept, 56px circles, 64 apart
 *   answerMode="slide"    one 64-tall track: drag the knob past 60% (or just
 *                         PRESS it) to answer
 *   under either          "Message" and "Remind me" as quiet text buttons
 *
 * The slide track answers a PRESS as well as a drag, and that is not a
 * convenience. A drag is a gesture with no keyboard equivalent and nothing for
 * a screen reader to do; the press is the same control's accessible path, so
 * the knob carries `role="button"` and the accept name whichever way it is
 * used. The pan handlers are spread onto it, so they never become the only way
 * to answer.
 *
 * The chevrons behind the knob breathe on a 1.4s loop. Under reduced motion
 * they stand still at full opacity — the hint is the arrows, not the movement.
 */

const AVATAR_SIZE = 132;
const NO_WIDTH_THRESHOLDS: readonly number[] = [];
const IDENTITY_HEIGHT_THRESHOLDS = [480] as const;
const TRACK_HEIGHT = 64;
const KNOB = 56;
const TRACK_PADDING = (TRACK_HEIGHT - KNOB) / 2;
const HINT_PERIOD_MS = 1400;

function SlideHint({ paint, reduced }: { paint: CallPaint; reduced: boolean }) {
  const progress = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, { duration: HINT_PERIOD_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduced, progress]);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + progress.value * 0.5 }), [progress]);
  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {[0, 1, 2].map((i) => (
        <RiArrowRightSLine key={i} width={18} height={18} fill={paint.onStageMuted} />
      ))}
    </Animated.View>
  );
}

/** Secondary stage commands share Button geometry, colour and interaction. */
function StageAction({
  icon: Icon,
  label,
  color,
  onPress,
  testID,
}: {
  icon: BloomIconComponent;
  label: string;
  color: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Button
      appearance="plain"
      tone="neutral"
      icon={Icon}
      color={color}
      hoverColor={color}
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
    >
      {label}
    </Button>
  );
}

function IncomingCallScreenComponent({
  name,
  avatar,
  avatarVariant,
  mode = 'voice',
  subtitle,
  accentColor,
  answerMode = 'buttons',
  onAccept,
  onDecline,
  onMessage,
  onRemind,
  labels,
  children,
  style,
  testID,
}: IncomingCallScreenProps) {
  const { messages } = useMessages(CALL_UI_MESSAGES);
  const directionProps = useDirectionProps();
  const textStart = useIsRtl() ? 'right' : 'left';
  const stage = useMeasuredSizeClass(NO_WIDTH_THRESHOLDS, IDENTITY_HEIGHT_THRESHOLDS);
  const short = stage.height < IDENTITY_HEIGHT_THRESHOLDS[0];
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme, accentColor), [theme, accentColor]);
  const reduced = usePrefersReducedMotion();
  const l = { ...messages.incoming, ...labels };
  const line = subtitle ?? (mode === 'video' ? l.video : l.voice);

  const [offset, setOffset] = useState(0);
  const travel = useRef(0);
  const onTrackLayout = (event: LayoutChangeEvent) => {
    travel.current = Math.max(0, event.nativeEvent.layout.width - KNOB - TRACK_PADDING * 2);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // A press must still reach the knob's `onPress`, so the responder only
        // claims the gesture once it has actually MOVED.
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 4,
        onPanResponderMove: (_event, gesture) => {
          setOffset(Math.min(travel.current, Math.max(0, gesture.dx)));
        },
        onPanResponderRelease: (_event, gesture) => {
          if (slideAnswers(gesture.dx, travel.current)) onAccept?.();
          setOffset(0);
        },
        onPanResponderTerminate: () => setOffset(0),
      }),
    [onAccept],
  );

  const answer =
    answerMode === 'slide' ? (
      <View
        onLayout={onTrackLayout}
        style={{
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          backgroundColor: paint.control,
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: TRACK_PADDING,
          paddingRight: TRACK_PADDING,
          paddingBottom: TRACK_PADDING,
          paddingLeft: TRACK_PADDING,
          gap: 10,
          overflow: 'hidden',
        }}
        testID={testID ? `${testID}-track` : undefined}
      >
        <Pressable
          {...panResponder.panHandlers}
          role="button"
          accessibilityLabel={l.accept}
          onPress={onAccept}
          style={{
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: paint.accept,
            transform: [{ translateX: offset }],
          }}
          testID={testID ? `${testID}-knob` : undefined}
        >
          <RiPhoneFill width={26} height={26} fill={paint.onAccept} />
        </Pressable>
        <SlideHint paint={paint} reduced={reduced} />
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={{ color: paint.onStageMuted, flex: 1 }}
        >
          {l.slideToAnswer}
        </Text>
      </View>
    ) : (
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 64 }}>
        {onDecline === undefined ? null : (
          <CallControlButton
            icon={CallEndGlyph}
            label={l.decline}
            tone="end"
            showLabel
            accentColor={accentColor}
            onPress={onDecline}
            testID={testID ? `${testID}-decline` : undefined}
          />
        )}
        {onAccept === undefined ? null : (
          <CallControlButton
            icon={RiPhoneFill}
            label={l.accept}
            tone="accept"
            showLabel
            accentColor={accentColor}
            onPress={onAccept}
            testID={testID ? `${testID}-accept` : undefined}
          />
        )}
      </View>
    );

  // `slide` has no decline affordance of its own — a track you drag one way
  // cannot also be the way you refuse — so the decline moves down here beside
  // the other quiet actions rather than disappearing.
  const secondary = [
    answerMode !== 'slide' || onDecline === undefined ? null : (
      <StageAction
        key="decline"
        icon={CallEndGlyph}
        label={l.decline}
        color={paint.end}
        onPress={onDecline}
        testID={testID ? `${testID}-decline` : undefined}
      />
    ),
    onMessage === undefined ? null : (
      <StageAction
        key="message"
        icon={RiMessage2Line}
        label={l.message}
        color={paint.onStageMuted}
        onPress={onMessage}
        testID={testID ? `${testID}-message` : undefined}
      />
    ),
    onRemind === undefined ? null : (
      <StageAction
        key="remind"
        icon={RiTimerLine}
        label={l.remind}
        color={paint.onStageMuted}
        onPress={onRemind}
        testID={testID ? `${testID}-remind` : undefined}
      />
    ),
  ].filter((node): node is React.ReactElement => node !== null);

  return (
    <View
      {...directionProps}
      onLayout={stage.onLayout}
      style={[
        {
          flex: 1,
          minHeight: 0,
          backgroundColor: paint.stage,
          borderRadius: CALL_UI_RADIUS.stage,
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
    >
      <CallStageBackdrop paint={paint} />
      <ScrollArea
        style={{ flex: 1, minHeight: 0 }}
        testID={testID ? `${testID}-identity-scroll` : undefined}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          paddingTop: short ? 16 : 48,
          paddingRight: 24,
          paddingBottom: 24,
          paddingLeft: 24,
        }}
      >
        <View
          style={{
            flexDirection: short ? 'row' : 'column',
            alignItems: 'center',
            gap: 20,
            maxWidth: '100%',
          }}
        >
          <Avatar
            source={avatar}
            variant={avatarVariant}
            name={name}
            size={AVATAR_SIZE}
            testID={testID ? `${testID}-avatar` : undefined}
          />
          <View
            style={{
              alignItems: short ? 'flex-start' : 'center',
              gap: 6,
              minWidth: 0,
              flexShrink: 1,
            }}
          >
            <Text
              testID={testID ? `${testID}-name` : undefined}
              variant="title-1-semibold"
              numberOfLines={1}
              style={{ color: paint.onStage, textAlign: short ? textStart : 'center' }}
            >
              {name}
            </Text>
            <Text
              variant="body-medium"
              numberOfLines={1}
              style={{ color: paint.onStageMuted, textAlign: short ? textStart : 'center' }}
              testID={testID ? `${testID}-subtitle` : undefined}
            >
              {line}
            </Text>
          </View>
        </View>
        {children}
      </ScrollArea>

      <ScrollArea
        style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}
        testID={testID ? `${testID}-controls-scroll` : undefined}
        contentContainerStyle={{
          gap: 20,
          paddingRight: 24,
          paddingBottom: 40,
          paddingLeft: 24,
        }}
      >
        {answer}
        {secondary.length === 0 ? null : (
          <View
            style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}
          >
            {secondary}
          </View>
        )}
      </ScrollArea>
    </View>
  );
}

export const IncomingCallScreen = memo(IncomingCallScreenComponent);
IncomingCallScreen.displayName = 'IncomingCallScreen';
