/**
 * The bar while a voice message is being recorded, and after: a live meter
 * (`recording`), a hands-free one with explicit buttons (`locked`), and the
 * playable result (`preview`).
 *
 * Purely presentational, and deliberately so — the elapsed time, the levels and
 * the playback position all arrive as props. A recorder that owned a timer
 * would be reading the clock inside a component, which is the one thing every
 * relative time in this fleet is forbidden to do; it also makes the three
 * states impossible to screenshot.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { RiArrowLeftSLine } from '../icons/remix/RiArrowLeftSLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiLockLine } from '../icons/remix/RiLockLine';
import { RiPauseFill } from '../icons/remix/RiPauseFill';
import { RiPlayFill } from '../icons/remix/RiPlayFill';
import { RiSendPlaneLine } from '../icons/remix/RiSendPlaneLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ComposerIconButton } from './ComposerIconButton';
import {
  BAR_PADDING,
  BAR_RADIUS,
  CONTROL_SIZE,
  VOICE_RECORDER_LABELS,
  WAVE_BAR_GAP,
  WAVE_BAR_WIDTH,
  WAVE_HEIGHT,
  formatRecordingTime,
  resolveChatComposerPalette,
  waveformBars,
} from './shared';
import type { VoiceRecorderProps } from './types';
import { IS_WEB, dataHook, useChatComposerWebCss } from './web-hooks';

const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

/** The live "we are recording" dot. CSS keyframes on web, a reanimated loop on native. */
function RecordDot({ color, active }: { color: string; active: boolean }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (IS_WEB || !active || reducedMotion) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 500, easing: EASE_IN_OUT }),
        withTiming(1, { duration: 500, easing: EASE_IN_OUT }),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [active, reducedMotion, opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);

  const base = { width: 8, height: 8, borderRadius: 4, backgroundColor: color };
  if (IS_WEB) {
    const web: WebCssStyle =
      active && !reducedMotion
        ? { ...base, animation: 'bloom-chat-composer-pulse 1000ms ease-in-out infinite' }
        : base;
    return <View style={web} />;
  }
  return <Animated.View style={[base, animated]} />;
}

/**
 * The meter. Bars are laid out from a MEASURED width rather than a fixed count,
 * so the same recorder reads correctly in a 390px column and a 900px one; the
 * oldest samples fall off the left as the array grows.
 */
function Waveform({
  amplitudes,
  color,
  dimColor,
  progress,
  testID,
}: {
  amplitudes: ReadonlyArray<number>;
  color: string;
  dimColor: string;
  /** 0–1 playhead, for `preview`. Bars past it paint in `dimColor`. */
  progress?: number;
  testID?: string;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const slot = WAVE_BAR_WIDTH + WAVE_BAR_GAP;
  const count = width > 0 ? Math.max(1, Math.floor(width / slot)) : 0;
  const bars = count > 0 ? waveformBars(amplitudes, count) : [];
  const played = progress === undefined ? bars.length : Math.round(bars.length * progress);

  return (
    <View
      onLayout={onLayout}
      style={{
        flexGrow: 1,
        flexShrink: 1,
        height: WAVE_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: WAVE_BAR_GAP,
        overflow: 'hidden',
      }}
      testID={testID}>
      {bars.map((level, index) => (
        <View
          key={index}
          style={{
            width: WAVE_BAR_WIDTH,
            height: Math.max(2, Math.round(level * WAVE_HEIGHT)),
            borderRadius: WAVE_BAR_WIDTH,
            backgroundColor: index < played ? color : dimColor,
          }}
        />
      ))}
    </View>
  );
}

export function VoiceRecorder({
  state,
  seconds,
  duration,
  amplitudes = [],
  playing = false,
  onPlayToggle,
  onCancel,
  onDelete,
  onSend,
  onLock,
  slideToCancel = !IS_WEB,
  labels: labelOverrides,
  style,
  testID,
  accessibilityLabel,
}: VoiceRecorderProps) {
  const theme = useTheme();
  const palette = resolveChatComposerPalette(theme);
  useChatComposerWebCss();
  const labels = { ...VOICE_RECORDER_LABELS, ...labelOverrides };
  const preview = state === 'preview';
  const total = duration ?? seconds;

  const bar: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: CONTROL_SIZE + BAR_PADDING * 2,
    borderRadius: BAR_RADIUS,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingLeft: 12,
    paddingRight: BAR_PADDING,
    paddingTop: BAR_PADDING,
    paddingBottom: BAR_PADDING,
    '--bloom-chat-composer-ring': palette.focusRing,
  };

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? labels.recording}
      style={[bar, style]}
      testID={testID}>
      {preview ? (
        <>
          {onDelete ? (
            <ComposerIconButton
              icon={RiDeleteBinLine}
              accessibilityLabel={labels.delete}
              onPress={onDelete}
              size={32}
              iconSize={18}
              style={{ marginLeft: -6 }}
              testID={testID ? `${testID}-delete` : undefined}
            />
          ) : null}
          <ComposerIconButton
            icon={playing ? RiPauseFill : RiPlayFill}
            accessibilityLabel={playing ? labels.pause : labels.play}
            onPress={onPlayToggle}
            size={32}
            iconSize={18}
            style={{ backgroundColor: palette.inset }}
            testID={testID ? `${testID}-play` : undefined}
          />
        </>
      ) : (
        <RecordDot color={palette.destructive} active />
      )}

      <Text
        variant="body-2-medium"
        style={{ color: palette.text, minWidth: 40 }}
        testID={testID ? `${testID}-time` : undefined}>
        {formatRecordingTime(seconds)}
      </Text>

      <Waveform
        amplitudes={amplitudes}
        color={preview ? palette.accent : palette.destructive}
        dimColor={palette.border}
        progress={preview && total > 0 ? Math.min(1, seconds / total) : undefined}
        testID={testID ? `${testID}-wave` : undefined}
      />

      {preview ? (
        <Text variant="caption-1-regular" style={{ color: palette.textSecondary }}>
          {formatRecordingTime(total)}
        </Text>
      ) : null}

      {state === 'recording' && slideToCancel ? (
        <Pressable
          {...dataHook('bloomChatComposerControl')}
          accessibilityRole="button"
          accessibilityLabel={labels.cancel}
          onPress={onCancel}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
          testID={testID ? `${testID}-slide` : undefined}>
          <RiArrowLeftSLine width={16} height={16} fill={palette.textSecondary} />
          <Text variant="caption-1-regular" style={{ color: palette.textSecondary }}>
            {labels.slideToCancel}
          </Text>
        </Pressable>
      ) : null}

      {state === 'recording' && !slideToCancel && onCancel ? (
        <ComposerIconButton
          icon={RiCloseLine}
          accessibilityLabel={labels.cancel}
          onPress={onCancel}
          size={32}
          iconSize={18}
          testID={testID ? `${testID}-cancel` : undefined}
        />
      ) : null}

      {state === 'recording' && onLock ? (
        <ComposerIconButton
          icon={RiLockLine}
          accessibilityLabel={labels.lock}
          onPress={onLock}
          size={32}
          iconSize={16}
          style={{ backgroundColor: palette.inset }}
          testID={testID ? `${testID}-lock` : undefined}
        />
      ) : null}

      {state !== 'recording' && onCancel ? (
        <ComposerIconButton
          icon={RiCloseLine}
          accessibilityLabel={labels.cancel}
          onPress={onCancel}
          size={32}
          iconSize={18}
          testID={testID ? `${testID}-cancel` : undefined}
        />
      ) : null}

      {onSend && state !== 'recording' ? (
        <ComposerIconButton
          icon={RiSendPlaneLine}
          tone="accent"
          accessibilityLabel={labels.send}
          onPress={onSend}
          iconSize={18}
          testID={testID ? `${testID}-send` : undefined}
        />
      ) : null}
    </View>
  );
}
