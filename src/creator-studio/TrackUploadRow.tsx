import React, { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '../button';
import { formatFileSize } from '../file-upload/FileUpload';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { RiFileMusicLine } from '../icons/remix/RiFileMusicLine';
import { RiRefreshLine } from '../icons/remix/RiRefreshLine';
import { Meter } from '../stat-bar';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  clampProgress,
  CREATOR_STUDIO_CSS,
  CREATOR_STUDIO_STYLE_ID,
  indeterminateDataSet,
  IS_WEB,
  placeholderWaveform,
  resolveCreatorStudioPaint,
  uploadBarKind,
  type CreatorStudioPaint,
} from './shared';
import type { TrackUploadRowLabels, TrackUploadRowProps } from './types';

/**
 * `TrackUploadRow`: one audio file on its way into a release.
 *
 *   row       radius 12, padding 12 (longhands), background-secondary, 12 gap
 *   tile      40px, radius 10: a music-file glyph on the card-inner fill;
 *             ready → accent fill + check; failed → error tint + warning glyph
 *   name      `body-medium` truncating, size `caption-1-regular` text-tertiary
 *   status    queued     "Queued" text-secondary
 *             uploading  4px bar (track / accent) + "42% · About 20 s left",
 *                        tabular; a `Meter` named "Uploading <file>"
 *             processing a 40%-wide segment sweeping the track every 1.4s
 *                        (static under reduced motion) + "Transcoding…"
 *             ready      a placeholder waveform (bars from the file name) +
 *                        "Ready · 3:42"
 *             failed     the message in the error colour + a "Retry" button
 *   remove    secondary icon button, "Remove <file>"
 */

export const TRACK_UPLOAD_LABELS: TrackUploadRowLabels = {
  queued: 'Queued',
  processing: 'Transcoding…',
  ready: 'Ready',
  failed: 'Upload failed',
  retry: 'Retry',
  remove: (name) => `Remove ${name}`,
  progress: (name) => `Uploading ${name}`,
};

const BAR_HEIGHT = 4;
const WAVE_HEIGHT = 20;
const WAVE_BAR = 2;
const WAVE_GAP = 2;
const SWEEP_MS = 1400;

function IndeterminateBar({ paint, testID }: { paint: CreatorStudioPaint; testID?: string }) {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (IS_WEB || reducedMotion || width === 0) return;
    x.value = 0;
    x.value = withRepeat(withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.ease) }), -1, false);
    return () => cancelAnimation(x);
  }, [reducedMotion, width, x]);

  const animated = useAnimatedStyle(() => {
    // Native: from fully left of the track to past its right edge.
    const segment = width * 0.4;
    return { transform: [{ translateX: -segment + x.value * (width + segment) }] };
  }, [width, x]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      aria-hidden
      style={[styles.bar, { backgroundColor: paint.track }]}
    >
      {IS_WEB ? (
        <View
          {...indeterminateDataSet()}
          style={[styles.segment, { backgroundColor: paint.accent }]}
        />
      ) : (
        <Animated.View
          style={[
            styles.segment,
            { backgroundColor: paint.accent },
            reducedMotion ? { transform: [{ translateX: width * 0.3 }] } : animated,
          ]}
        />
      )}
    </View>
  );
}

function Waveform({ seed, color, testID }: { seed: string; color: string; testID?: string }) {
  const [width, setWidth] = useState(0);
  const count = Math.max(0, Math.floor((width + WAVE_GAP) / (WAVE_BAR + WAVE_GAP)));
  const bars = useMemo(() => placeholderWaveform(seed, count), [seed, count]);
  return (
    <View
      testID={testID}
      aria-hidden
      onLayout={(event) => setWidth(Math.min(240, event.nativeEvent.layout.width))}
      style={styles.wave}
    >
      {bars.map((h, i) => (
        <View
          key={i}
          style={{ width: WAVE_BAR, height: Math.max(3, Math.round(h * WAVE_HEIGHT)), borderRadius: 1, backgroundColor: color }}
        />
      ))}
    </View>
  );
}

function TrackUploadRowComponent({
  fileName,
  size,
  status,
  progress,
  remaining,
  duration,
  error,
  onRetry,
  onRemove,
  labels: labelOverrides,
  style,
  testID,
}: TrackUploadRowProps) {
  const theme = useTheme();
  useInteractiveWebCss(CREATOR_STUDIO_STYLE_ID, CREATOR_STUDIO_CSS);
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const labels = { ...TRACK_UPLOAD_LABELS, ...labelOverrides };
  const bar = uploadBarKind(status);
  const percent = clampProgress(progress);
  const sizeLabel = typeof size === 'number' ? formatFileSize(size) : size;

  const tile =
    status === 'ready' ? (
      <View style={[styles.tile, { backgroundColor: paint.accent }]}>
        <RiCheckLine width={20} height={20} fill={paint.onAccent} />
      </View>
    ) : status === 'failed' ? (
      <View style={[styles.tile, { backgroundColor: paint.errorSurface }]}>
        <RiErrorWarningLine width={20} height={20} fill={paint.error} />
      </View>
    ) : (
      <View style={[styles.tile, { backgroundColor: paint.inner }]}>
        <RiFileMusicLine width={20} height={20} fill={paint.textSecondary} />
      </View>
    );

  let statusLine: React.ReactNode;
  if (status === 'uploading') {
    statusLine = (
      <Text variant="caption-1-regular" numberOfLines={1} style={[styles.tabular, { color: paint.textSecondary }]}>
        {remaining ? `${percent}% · ${remaining}` : `${percent}%`}
      </Text>
    );
  } else if (status === 'processing') {
    statusLine = (
      <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textSecondary }}>
        {labels.processing}
      </Text>
    );
  } else if (status === 'ready') {
    statusLine = (
      <Text variant="caption-1-regular" numberOfLines={1} style={[styles.tabular, { color: paint.textSecondary }]}>
        {duration ? `${labels.ready} · ${duration}` : labels.ready}
      </Text>
    );
  } else if (status === 'failed') {
    statusLine = (
      <Text variant="caption-1-regular" numberOfLines={2} style={{ color: paint.error }}>
        {error ?? labels.failed}
      </Text>
    );
  } else {
    statusLine = (
      <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textSecondary }}>
        {labels.queued}
      </Text>
    );
  }

  return (
    <View
      testID={testID}
      aria-busy={status === 'uploading' || status === 'processing'}
      style={[styles.row, { backgroundColor: paint.surface }, style]}
    >
      {tile}
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text variant="body-medium" numberOfLines={1} style={[styles.name, { color: paint.text }]}>
            {fileName}
          </Text>
          <Text variant="caption-1-regular" numberOfLines={1} style={[styles.tabular, styles.size, { color: paint.textTertiary }]}>
            {sizeLabel}
          </Text>
        </View>
        {bar === 'determinate' ? (
          <Meter
            value={percent}
            max={100}
            height={BAR_HEIGHT}
            fill={paint.accent}
            track={paint.track}
            accessibilityLabel={labels.progress(fileName)}
            valueText={`${percent}%`}
            testID={testID ? `${testID}-progress` : undefined}
          />
        ) : bar === 'indeterminate' ? (
          <IndeterminateBar paint={paint} testID={testID ? `${testID}-processing` : undefined} />
        ) : status === 'ready' ? (
          <Waveform seed={fileName} color={paint.textTertiary} testID={testID ? `${testID}-waveform` : undefined} />
        ) : null}
        <View testID={testID ? `${testID}-status` : undefined} aria-live="polite">
          {statusLine}
        </View>
      </View>
      <View style={styles.actions}>
        {status === 'failed' && onRetry ? (
          <Button
            variant="secondary"
            size="xs"
            leadingIcon={RiRefreshLine}
            onPress={onRetry}
            testID={testID ? `${testID}-retry` : undefined}
          >
            {labels.retry}
          </Button>
        ) : null}
        {onRemove ? (
          <Button
            variant="secondary"
            size="small"
            iconOnly
            leadingIcon={RiCloseLine}
            accessibilityLabel={labels.remove(fileName)}
            onPress={onRemove}
            testID={testID ? `${testID}-remove` : undefined}
          />
        ) : null}
      </View>
    </View>
  );
}

export const TrackUploadRow = memo(TrackUploadRowComponent);
TrackUploadRow.displayName = 'TrackUploadRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    minWidth: 0,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  name: { flexShrink: 1, minWidth: 0 },
  size: { flexShrink: 0 },
  tabular: { fontVariant: ['tabular-nums'] },
  bar: { width: '100%', height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, overflow: 'hidden' },
  fill: { height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2 },
  segment: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%', borderRadius: BAR_HEIGHT / 2 },
  wave: { width: '100%', height: WAVE_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: WAVE_GAP, overflow: 'hidden' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
});
