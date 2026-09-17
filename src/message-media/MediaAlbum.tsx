import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { formatDuration } from '../media-controls';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  MediaFailure,
  MediaImage,
  MediaOverlay,
  MediaPill,
  MediaPressable,
  MediaProgressRing,
  SpoilerCover,
} from './parts';
import {
  ALBUM_GAP,
  albumLayout,
  MAX_ALBUM_TILES,
  MESSAGE_MEDIA_RADIUS,
  MESSAGE_MEDIA_WIDTH,
  resolveMessageMediaPaint,
} from './shared';
import type { MediaAlbumItem, MediaAlbumProps } from './types';

/**
 * The packed photo/video grid, 2–10 cells.
 *
 * The geometry is `albumLayout()` — absolute rectangles with integer widths that
 * sum to the frame exactly. Absolute positioning rather than nested flex rows
 * because the two have to agree pixel for pixel: a flex row rounds each child
 * independently and the last cell in a row of three ends up one pixel short of
 * the edge, which on a ROUNDED group reads as a rendering fault. The layout
 * function is also the thing the tests can read without a renderer.
 *
 * Only the group's four outer corners are rounded; a cell in the middle of the
 * grid is square on every side. Each cell carries the radii for its own position
 * (`radii`), so no cell has to know how many cells there are.
 */
function AlbumCell({
  item,
  index,
  total,
  rect,
  paint,
  onPress,
  overflow,
  formatOverflow,
  testID,
}: {
  item: MediaAlbumItem;
  index: number;
  total: number;
  rect: ReturnType<typeof albumLayout>['cells'][number];
  paint: ReturnType<typeof resolveMessageMediaPaint>;
  onPress?: (index: number) => void;
  overflow: number;
  formatOverflow: (remaining: number) => string;
  testID?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const hidden = Boolean(item.spoiler) && !revealed;
  const isVideo = item.kind === 'video';
  const duration =
    item.durationLabel ?? (typeof item.duration === 'number' ? formatDuration(item.duration) : undefined);

  const name =
    item.accessibilityLabel ?? `${isVideo ? 'Video' : 'Photo'} ${index + 1} of ${total}`;

  const handlePress = useCallback(() => {
    if (hidden) {
      setRevealed(true);
      return;
    }
    onPress?.(index);
  }, [hidden, index, onPress]);

  const cellStyle: WebCssStyle = {
    position: 'absolute',
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    overflow: 'hidden',
    borderTopLeftRadius: rect.radii.topLeft,
    borderTopRightRadius: rect.radii.topRight,
    borderBottomLeftRadius: rect.radii.bottomLeft,
    borderBottomRightRadius: rect.radii.bottomRight,
  };

  return (
    <MediaPressable
      accessibilityLabel={overflow > 0 ? `${name}, ${formatOverflow(overflow)}` : name}
      onPress={onPress || hidden ? handlePress : undefined}
      ring={paint.ring}
      style={cellStyle}
      testID={testID}
    >
      <MediaImage
        source={item.source}
        sourceVariant={item.sourceVariant}
        radii={rect.radii}
        placeholder={item.placeholderColor ?? paint.placeholder}
      />
      {hidden ? <SpoilerCover label="Tap to view" paint={paint} radii={rect.radii} /> : null}
      {!hidden && isVideo && duration ? (
        <MediaPill label={duration} paint={paint} leadingPlay position={{ left: 6, bottom: 6 }} />
      ) : null}
      {overflow > 0 ? (
        <MediaOverlay scrim="rgba(0, 0, 0, 0.5)">
          <Text variant="title-2-semibold" style={{ color: paint.onScrim }}>
            {formatOverflow(overflow)}
          </Text>
        </MediaOverlay>
      ) : null}
    </MediaPressable>
  );
}

function MediaAlbumComponent({
  items,
  width = MESSAGE_MEDIA_WIDTH,
  radius = MESSAGE_MEDIA_RADIUS,
  gap = ALBUM_GAP,
  maxTiles = MAX_ALBUM_TILES,
  formatOverflow = (remaining) => `+${remaining}`,
  onPress,
  state = 'idle',
  progress,
  onCancel,
  onRetry,
  accessibilityLabel,
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: MediaAlbumProps) {
  const theme = useTheme();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );
  const layout = useMemo(
    () => albumLayout(items.length, width, { gap, radius, maxTiles }),
    [items.length, width, gap, radius, maxTiles],
  );

  const sending = state === 'sending';
  const groupName =
    accessibilityLabel ?? `Album, ${items.length} item${items.length === 1 ? '' : 's'}`;

  return (
    <View style={[{ width }, style ?? null]} testID={testID}>
      <View
        role="group"
        accessibilityLabel={groupName}
        style={{ width, height: layout.height, position: 'relative' }}
      >
        {layout.cells.map((rect) => {
          const item = items[rect.index];
          if (!item) return null;
          const last = rect.index === layout.cells.length - 1;
          return (
            <AlbumCell
              key={item.id}
              item={item}
              index={rect.index}
              total={items.length}
              rect={rect}
              paint={paint}
              onPress={onPress}
              overflow={last ? layout.overflow : 0}
              formatOverflow={formatOverflow}
              testID={testID ? `${testID}-cell-${rect.index}` : undefined}
            />
          );
        })}
        {sending ? (
          <MediaOverlay scrim={paint.scrim}>
            <MediaProgressRing
              progress={progress}
              color={paint.onScrim}
              track="rgba(255, 255, 255, 0.3)"
              fill="rgba(0, 0, 0, 0.35)"
              glyph={onCancel ? 'cancel' : 'none'}
              onPress={onCancel}
              accessibilityLabel={onCancel ? 'Cancel' : 'Sending album'}
              ring={paint.ring}
              testID={testID ? `${testID}-progress` : undefined}
            />
          </MediaOverlay>
        ) : null}
      </View>
      {state === 'failed' ? (
        <MediaFailure
          paint={paint}
          onRetry={onRetry}
          testID={testID ? `${testID}-failed` : undefined}
        />
      ) : null}
    </View>
  );
}

export const MediaAlbum = memo(MediaAlbumComponent);
MediaAlbum.displayName = 'MediaAlbum';
