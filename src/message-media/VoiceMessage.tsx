import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';

import { webDataSet } from '../checkbox/shared';
import { formatDuration, PlayButton } from '../media-controls';
import { borderRadius, space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaFailure, useHovered, useMessageMediaCss } from './parts';
import {
  formatPlaybackRate,
  IS_WEB,
  MESSAGE_MEDIA_WIDTH,
  nextPlaybackRate,
  playedBarCount,
  resampleWaveform,
  resolveMessageMediaPaint,
  seekPositionAt,
  WAVEFORM_MIN_BAR,
  type MessageMediaPaint,
} from './shared';
import type { VoiceMessageProps, VoicePlaybackRate } from './types';

/** Bar geometry: 2px wide with a 2px gutter, 26px of track. */
const BAR_WIDTH = 2;
const BAR_GAP = 2;
const WAVEFORM_HEIGHT = 26;
/** The pointer target around the 26px of bars — a 2px bar is not a touch target. */
const WAVEFORM_HIT = 32;
/** Seconds an arrow key moves. */
const KEY_STEP = 5;

// ---------------------------------------------------------------------------
//  Waveform
// ---------------------------------------------------------------------------

interface WaveformProps {
  bars: number[];
  playedBars: number;
  position: number;
  duration: number;
  paint: MessageMediaPaint;
  onSeek?: (seconds: number) => void;
  accessibilityLabel: string;
  testID?: string;
}

/**
 * The bars.
 *
 * Played bars take the accent, unplayed ones the rail — NOT the same colour at
 * two opacities. Opacity composites against whatever is behind it, and behind it
 * is the accent bubble half the time, so a "dimmed" bar there is a lighter shade
 * of the fill and disappears. Both colours come from the tone's palette, which
 * derived them against the bubble.
 *
 * Every bar has a FLOOR of 18% of the track height. A voice note has real
 * silence in it, and a sample of 0 drawn at 0 leaves a gap in the middle of the
 * waveform that reads as a rendering hole rather than as quiet.
 *
 * Seeking is a `PanResponder`, the same mechanism `media-controls`' scrubber
 * uses, so a tap and a drag are one gesture on both platforms. On web the track
 * also takes focus and answers the arrow keys, Home and End; on native it
 * answers the `increment` / `decrement` accessibility actions. It is a `slider`
 * (`accessibilityRole="adjustable"`) with FLAT `aria-value*` props — react-native-web
 * drops `accessibilityValue` entirely, so the native spelling alone announces a
 * slider with no position in it.
 */
const Waveform = memo(function Waveform({
  bars,
  playedBars,
  position,
  duration,
  paint,
  onSeek,
  accessibilityLabel,
  testID,
}: WaveformProps) {
  useMessageMediaCss();
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  const stateRef = useRef({ width, duration, seekable: Boolean(onSeek) });
  stateRef.current = { width, duration, seekable: Boolean(onSeek) };
  const seekRef = useRef(onSeek);
  seekRef.current = onSeek;
  const dragRef = useRef({ startX: 0, current: position });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => stateRef.current.seekable,
        onMoveShouldSetPanResponder: () => stateRef.current.seekable,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const s = stateRef.current;
          const x = e.nativeEvent.locationX;
          dragRef.current = { startX: x, current: seekPositionAt(x, s.width, s.duration) };
          setDragging(true);
          seekRef.current?.(dragRef.current.current);
        },
        onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          const s = stateRef.current;
          const next = seekPositionAt(dragRef.current.startX + g.dx, s.width, s.duration);
          if (next === dragRef.current.current) return;
          dragRef.current.current = next;
          seekRef.current?.(next);
        },
        onPanResponderRelease: () => setDragging(false),
        onPanResponderTerminate: () => setDragging(false),
      }),
    [],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  const stepTo = useCallback(
    (target: number) => {
      if (!onSeek || !(duration > 0)) return;
      onSeek(Math.min(duration, Math.max(0, target)));
    },
    [onSeek, duration],
  );

  const onAccessibilityAction = useCallback(
    (e: AccessibilityActionEvent) => {
      if (e.nativeEvent.actionName === 'increment') stepTo(position + KEY_STEP);
      else if (e.nativeEvent.actionName === 'decrement') stepTo(position - KEY_STEP);
    },
    [stepTo, position],
  );

  const webProps: Record<string, unknown> =
    IS_WEB && onSeek
      ? {
          tabIndex: 0,
          onKeyDown: (e: { key: string; preventDefault: () => void }) => {
            switch (e.key) {
              case 'ArrowRight':
              case 'ArrowUp':
                e.preventDefault();
                stepTo(position + KEY_STEP);
                break;
              case 'ArrowLeft':
              case 'ArrowDown':
                e.preventDefault();
                stepTo(position - KEY_STEP);
                break;
              case 'Home':
                e.preventDefault();
                stepTo(0);
                break;
              case 'End':
                e.preventDefault();
                stepTo(duration);
                break;
              default:
                break;
            }
          },
        }
      : {};

  const rootStyle: WebCssStyle = {
    height: WAVEFORM_HIT,
    justifyContent: 'center',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    '--bloom-message-media-ring': paint.ring,
    ...(IS_WEB && onSeek ? { touchAction: 'none', cursor: 'pointer' } : null),
  };

  return (
    <View
      {...panResponder.panHandlers}
      {...webProps}
      {...webDataSet({ bloomMessageMediaTrack: '' })}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, duration)}
      aria-valuenow={Math.min(Math.max(0, position), Math.max(0, duration))}
      aria-valuetext={`${formatDuration(position)} of ${formatDuration(duration)}`}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
      onLayout={onLayout}
      style={rootStyle}
      testID={testID}
    >
      <View
        pointerEvents="none"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: WAVEFORM_HEIGHT,
          gap: BAR_GAP,
          opacity: dragging ? 0.85 : 1,
        }}
      >
        {bars.map((sample, index) => (
          <View
            key={index}
            style={{
              width: BAR_WIDTH,
              height: Math.max(
                WAVEFORM_HEIGHT * WAVEFORM_MIN_BAR,
                Math.round(sample * WAVEFORM_HEIGHT),
              ),
              borderRadius: borderRadius.full,
              backgroundColor: index < playedBars ? paint.accent : paint.rail,
            }}
          />
        ))}
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
//  Speed pill
// ---------------------------------------------------------------------------

function SpeedPill({
  rate,
  onPress,
  paint,
  testID,
}: {
  rate: VoicePlaybackRate;
  onPress: () => void;
  paint: MessageMediaPaint;
  testID?: string;
}) {
  const [hovered, handlers] = useHovered();
  const style: WebCssStyle = {
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 7,
    paddingRight: 7,
    borderRadius: borderRadius.full,
    backgroundColor: hovered ? paint.washStrong : paint.wash,
    '--bloom-message-media-ring': paint.ring,
  };
  return (
    <Pressable
      {...webDataSet({ bloomMessageMediaPressable: '' })}
      {...handlers}
      role="button"
      accessibilityLabel={`Playback speed, ${formatPlaybackRate(rate)}`}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      <Text variant="caption-2-medium" style={{ color: paint.text }}>
        {formatPlaybackRate(rate)}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  VoiceMessage
// ---------------------------------------------------------------------------

/**
 * A voice note: play button, waveform, elapsed time, and the three affordances a
 * voice note has grown — speed, an unplayed mark, and a transcript.
 *
 * The TIME shown is the elapsed position once playback has started and the total
 * length before it. Two numbers side by side ("0:00 / 0:14") is the player's
 * idiom, not the message's: in a bubble the second number is chrome, and the one
 * the reader wants is "how long is this" before and "where am I" during.
 *
 * The UNPLAYED dot is a mark on the message, not on the button, because it
 * survives the button changing state — a note you started and abandoned is not
 * unplayed any more even though it is not playing.
 *
 * TRANSCRIPT is a disclosure, controlled or uncontrolled. It is `aria-expanded`
 * on the toggle rather than a second button with a different name: one control,
 * two states, which is the pair a screen reader can act on.
 */
function VoiceMessageComponent({
  samples,
  duration,
  position = 0,
  playing = false,
  onPlayPress,
  onSeek,
  barCount = 42,
  unplayed = false,
  rate,
  onRateChange,
  transcript,
  transcriptOpen,
  onTranscriptOpenChange,
  transcribeLabel = 'Transcribe',
  hideTranscriptLabel = 'Hide transcript',
  width = MESSAGE_MEDIA_WIDTH,
  state = 'idle',
  onRetry,
  accessibilityLabel,
  seekLabel = 'Seek',
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: VoiceMessageProps) {
  const theme = useTheme();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );
  const bars = useMemo(() => resampleWaveform(samples, barCount), [samples, barCount]);
  const played = playedBarCount(position, duration, bars.length);

  const [openState, setOpenState] = useState(false);
  const open = transcriptOpen ?? openState;
  const toggleTranscript = useCallback(() => {
    const next = !open;
    if (transcriptOpen === undefined) setOpenState(next);
    onTranscriptOpenChange?.(next);
  }, [open, transcriptOpen, onTranscriptOpenChange]);

  const started = position > 0;
  const clock = formatDuration(started ? position : duration);
  const name = accessibilityLabel ?? `Voice message, ${formatDuration(duration)}`;

  const [toggleHovered, toggleHandlers] = useHovered();
  const toggleStyle: WebCssStyle = {
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 7,
    paddingRight: 7,
    borderRadius: borderRadius.full,
    backgroundColor: toggleHovered ? paint.washStrong : 'transparent',
    '--bloom-message-media-ring': paint.ring,
  };

  return (
    <View
      role="group"
      accessibilityLabel={name}
      style={[{ width }, style ?? null]}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <PlayButton
          playing={playing}
          size="small"
          variant={tone === 'outgoing' ? 'inverse' : 'accent'}
          subject="voice message"
          onPress={onPlayPress}
          testID={testID ? `${testID}-play` : undefined}
        />
        <Waveform
          bars={bars}
          playedBars={played}
          position={position}
          duration={duration}
          paint={paint}
          onSeek={onSeek}
          accessibilityLabel={seekLabel}
          testID={testID ? `${testID}-waveform` : undefined}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          paddingTop: 4,
          paddingLeft: 44,
        }}
      >
        <Text
          variant="caption-1-regular"
          style={{ color: paint.textMuted, fontVariant: ['tabular-nums'] }}
          testID={testID ? `${testID}-clock` : undefined}
        >
          {clock}
        </Text>
        {unplayed ? (
          <View
            role="img"
            accessibilityLabel="Unplayed"
            style={{
              width: 6,
              height: 6,
              borderRadius: borderRadius.full,
              backgroundColor: paint.accent,
            }}
            testID={testID ? `${testID}-unplayed` : undefined}
          />
        ) : null}
        <View style={{ flexGrow: 1 }} />
        {rate !== undefined && onRateChange ? (
          <SpeedPill
            rate={rate}
            paint={paint}
            onPress={() => onRateChange(nextPlaybackRate(rate))}
            testID={testID ? `${testID}-rate` : undefined}
          />
        ) : null}
        {transcript ? (
          <Pressable
            {...webDataSet({ bloomMessageMediaPressable: '' })}
            {...toggleHandlers}
            role="button"
            accessibilityLabel={open ? hideTranscriptLabel : transcribeLabel}
            aria-expanded={open}
            accessibilityState={{ expanded: open }}
            onPress={toggleTranscript}
            style={toggleStyle}
            testID={testID ? `${testID}-transcribe` : undefined}
          >
            <Text variant="caption-2-medium" style={{ color: paint.accent }}>
              {open ? hideTranscriptLabel : transcribeLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {transcript && open ? (
        <View
          style={{
            marginTop: space.sm,
            paddingTop: space.sm,
            borderTopWidth: 1,
            borderTopColor: paint.border,
          }}
          testID={testID ? `${testID}-transcript` : undefined}
        >
          <Text variant="body-2-regular" style={{ color: paint.text }}>
            {transcript}
          </Text>
        </View>
      ) : null}

      {state === 'failed' ? (
        <MediaFailure paint={paint} onRetry={onRetry} testID={testID ? `${testID}-failed` : undefined} />
      ) : null}
    </View>
  );
}

export const VoiceMessage = memo(VoiceMessageComponent);
VoiceMessage.displayName = 'VoiceMessage';
