import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaTrack } from './MediaTrack';
import { formatDuration, resolveMediaControlsPaint } from './shared';
import type { PlaybackProgressProps } from './types';

/**
 * The thin scrubber under a player: rail, buffered segment, progress fill and a
 * thumb that shows on hover (web), keyboard focus and while dragging.
 *
 *   rail     4px pill, hit area 16 tall
 *   times    caption-1-medium, tabular, muted; `inline` sits them either side
 *            of the rail (8px gap, 40px min width); `below` under its two ends
 *
 * Seeking: `onSeekPreview(seconds)` fires while dragging (the fill and the
 * elapsed time follow the pointer), `onSeek(seconds)` once on release. Arrow
 * keys (web) and the native `increment`/`decrement` actions call `onSeek`
 * directly, ±`keyboardStep` seconds; Home/End jump to the ends.
 *
 * Accessibility: a `slider` (`role="slider"`), named "Seek" by default, with
 * `aria-valuemin` 0, `aria-valuemax` the duration, `aria-valuenow` the position
 * and `aria-valuetext` "1:23 of 3:45". The drawn times are hidden — the value
 * text already says them.
 */
function PlaybackProgressComponent({
  value,
  duration,
  buffered,
  onSeek,
  onSeekPreview,
  showTimes = false,
  showRemaining = false,
  timesPosition = 'inline',
  keyboardStep = 5,
  disabled = false,
  accessibilityLabel = 'Seek',
  formatValueText,
  style,
  testID,
}: PlaybackProgressProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const valueText = useCallback(
    (seconds: number) =>
      formatValueText
        ? formatValueText(seconds, duration)
        : `${formatDuration(seconds)} of ${formatDuration(duration)}`,
    [formatValueText, duration],
  );

  const track = (
    <MediaTrack
      value={value}
      max={duration}
      buffered={buffered}
      onPreview={onSeekPreview}
      onCommit={onSeek}
      onDragChange={setDragValue}
      step={keyboardStep}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      valueText={valueText}
      style={{ flexGrow: 1, flexShrink: 1 }}
      testID={testID ? `${testID}-track` : undefined}
    />
  );

  if (!showTimes) {
    return (
      <View style={[{ flexDirection: 'row', minWidth: 0 }, style]} testID={testID}>
        {track}
      </View>
    );
  }

  const position = Math.min(Math.max(0, dragValue ?? value), Math.max(0, duration));
  const elapsed = formatDuration(position);
  const right = showRemaining
    ? `−${formatDuration(Math.max(0, duration - position))}`
    : formatDuration(duration);

  const timeStyle = {
    color: paint.textMuted,
    fontVariant: ['tabular-nums' as const],
  };
  const label = (text: string, align: 'left' | 'right') => (
    <Text
      variant="caption-1-medium"
      numberOfLines={1}
      importantForAccessibility="no"
      accessibilityElementsHidden
      aria-hidden
      style={[timeStyle, { textAlign: align }, timesPosition === 'inline' ? { minWidth: 40 } : null]}
    >
      {text}
    </Text>
  );

  if (timesPosition === 'below') {
    return (
      <View style={[{ minWidth: 0 }, style]} testID={testID}>
        <View style={{ flexDirection: 'row' }}>{track}</View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          {label(elapsed, 'left')}
          {label(right, 'right')}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }, style]}
      testID={testID}
    >
      {label(elapsed, 'right')}
      {track}
      {label(right, 'left')}
    </View>
  );
}

export const PlaybackProgress = memo(PlaybackProgressComponent);
PlaybackProgress.displayName = 'PlaybackProgress';
