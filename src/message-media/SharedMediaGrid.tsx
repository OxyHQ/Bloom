import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { formatDuration } from '../media-controls';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaImage, MediaOverlay, MediaPill, MediaPressable } from './parts';
import { ALBUM_GAP, resolveMessageMediaPaint } from './shared';
import type { SharedMediaGridProps } from './types';

/** `total` split into `parts` integers summing to exactly `total`. */
function split(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * The media tab of a chat's info panel: a tight 3-column grid of everything that
 * has been sent.
 *
 * Column widths are INTEGERS that sum to the grid width, the same arithmetic
 * `albumLayout` uses and for the same reason — a 340px grid divided three ways
 * leaves a remainder, and handing it to the first columns keeps the right edge
 * flush instead of a pixel short.
 *
 * The tiles are square and the radius is 4, not 16. This is a grid, not a row of
 * cards: at three columns a 16px radius on every tile turns the grid into a
 * pattern of gaps, and the grid's own outer corners belong to whatever panel
 * holds it.
 *
 * "+N more" replaces the LAST tile rather than being appended after it, so the
 * grid stays rectangular — a trailing overflow tile on its own row is a row with
 * two holes in it.
 */
function SharedMediaGridComponent({
  items,
  columns = 3,
  width = 340,
  gap = ALBUM_GAP,
  maxItems,
  formatOverflow = (remaining) => `+${remaining} more`,
  radius = 4,
  onPressItem,
  onPressOverflow,
  accessibilityLabel,
  style,
  testID,
}: SharedMediaGridProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMessageMediaPaint(theme, 'incoming'), [theme]);

  const cols = Math.max(1, Math.floor(columns));
  const widths = useMemo(() => split(width - gap * (cols - 1), cols), [width, gap, cols]);
  const tile = widths[0] ?? 0;

  const visible = maxItems === undefined ? items.length : Math.min(items.length, Math.max(0, maxItems));
  const overflow = items.length - visible;
  const shown = items.slice(0, visible);

  const gridName =
    accessibilityLabel ?? `Shared media, ${items.length} item${items.length === 1 ? '' : 's'}`;

  return (
    <View
      role="group"
      accessibilityLabel={gridName}
      style={[{ width, flexDirection: 'row', flexWrap: 'wrap', gap }, style ?? null]}
      testID={testID}
    >
      {shown.map((item, index) => {
        const column = index % cols;
        const tileWidth = widths[column] ?? tile;
        const last = overflow > 0 && index === shown.length - 1;
        const isVideo = item.kind === 'video';
        const duration =
          item.durationLabel ??
          (typeof item.duration === 'number' ? formatDuration(item.duration) : undefined);
        const name =
          item.accessibilityLabel ?? `${isVideo ? 'Video' : 'Photo'} ${index + 1} of ${items.length}`;
        const cell: WebCssStyle = {
          width: tileWidth,
          height: tileWidth,
          borderRadius: radius,
          overflow: 'hidden',
          position: 'relative',
        };
        return (
          <MediaPressable
            key={item.id}
            accessibilityLabel={last ? formatOverflow(overflow) : name}
            onPress={
              last && onPressOverflow
                ? onPressOverflow
                : onPressItem
                  ? () => onPressItem(index)
                  : undefined
            }
            ring={paint.ring}
            style={cell}
            testID={testID ? `${testID}-tile-${index}` : undefined}
          >
            <MediaImage
              source={item.source}
              sourceVariant={item.sourceVariant}
              radius={radius}
              placeholder={item.placeholderColor ?? paint.placeholder}
            />
            {!last && isVideo && duration ? (
              <MediaPill
                label={duration}
                paint={paint}
                leadingPlay
                position={{ left: 4, bottom: 4 }}
              />
            ) : null}
            {last ? (
              <MediaOverlay scrim="rgba(0, 0, 0, 0.55)">
                <Text variant="body-2-medium" style={{ color: paint.onScrim, textAlign: 'center' }}>
                  {formatOverflow(overflow)}
                </Text>
              </MediaOverlay>
            ) : null}
          </MediaPressable>
        );
      })}
    </View>
  );
}

export const SharedMediaGrid = memo(SharedMediaGridComponent);
SharedMediaGrid.displayName = 'SharedMediaGrid';
