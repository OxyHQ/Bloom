import React, { memo, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '../avatar/Avatar';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiMessage2Line } from '../icons/remix/RiMessage2Line';
import { RiPhoneFill } from '../icons/remix/RiPhoneFill';
import { RiTimerLine } from '../icons/remix/RiTimerLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CallControlButton } from './CallControls';
import { CallEndGlyph } from './glyphs';
import { CallStageBackdrop } from './parts';
import {
  CALL_UI_RADIUS,
  INCOMING_CALL_LABELS,
  resolveCallPaint,
  slideAnswers,
  type CallPaint,
} from './shared';
import type { CallGlyph, IncomingCallScreenProps } from './types';

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


/**
 * A quiet text action on the stage.
 *
 * Not Bloom's `text` `Button`: that paints its ICON from the accent ramp while
 * the caller can only override the LABEL's colour, so the control ends up two
 * colours on a surface neither of them was chosen for.
 */
function StageAction({
  icon: Icon,
  label,
  color,
  onPress,
  testID,
}: {
  icon: CallGlyph;
  label: string;
  color: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 6,
        paddingRight: 10,
        paddingBottom: 6,
        paddingLeft: 10,
      }}
      testID={testID}
    >
      <Icon width={16} height={16} fill={color} />
      <Text variant="body-medium" style={{ color }}>
        {label}
      </Text>
    </Pressable>
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
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme, accentColor), [theme, accentColor]);
  const reduced = useReducedMotion();
  const l = { ...INCOMING_CALL_LABELS, ...labels };
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
      style={[
        {
          flex: 1,
          minHeight: 520,
          backgroundColor: paint.stage,
          borderRadius: CALL_UI_RADIUS.stage,
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
    >
      <CallStageBackdrop paint={paint} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          paddingTop: 48,
          paddingRight: 24,
          paddingBottom: 24,
          paddingLeft: 24,
        }}
      >
        <Avatar
          source={avatar}
          variant={avatarVariant}
          name={name}
          size={AVATAR_SIZE}
          testID={testID ? `${testID}-avatar` : undefined}
        />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text
            variant="title-1-semibold"
            numberOfLines={1}
            style={{ color: paint.onStage, textAlign: 'center' }}
          >
            {name}
          </Text>
          <Text
            variant="body-medium"
            numberOfLines={1}
            style={{ color: paint.onStageMuted, textAlign: 'center' }}
            testID={testID ? `${testID}-subtitle` : undefined}
          >
            {line}
          </Text>
        </View>
        {children}
      </View>

      <View
        style={{
          gap: 20,
          paddingRight: 24,
          paddingBottom: 40,
          paddingLeft: 24,
        }}
      >
        {answer}
        {secondary.length === 0 ? null : (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {secondary}
          </View>
        )}
      </View>
    </View>
  );
}

export const IncomingCallScreen = memo(IncomingCallScreenComponent);
IncomingCallScreen.displayName = 'IncomingCallScreen';
