import React, { memo, useEffect, useMemo } from 'react';
import { Image, Pressable, View } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import { useImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import { ExplicitBadge } from '../media-controls/ExplicitBadge';
import { NowPlayingIndicator } from '../media-controls/NowPlayingIndicator';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  IS_WEB,
  QUEUE_COVER_SIZE,
  QUEUE_PANEL_CSS,
  QUEUE_PANEL_STYLE_ID,
  QUEUE_ROW_HEIGHT,
  resolveQueuePanelPaint,
} from './shared';
import type { QueuePanelRowProps } from './types';

/**
 * One track row, 56 tall:
 *
 *   8 · cover 40 (radius 6) · 12 · title body-medium / artists caption-1-regular · meta · trailing · 8
 *
 * The cover and text are ONE pressable (named "Play <title>"); `trailing`
 * controls sit beside it rather than inside, so no button is nested in a
 * button. Hover paints the row's highlight (web); the current row's title turns
 * accent and the now-playing bars replace the meta.
 */

export function QueueCover({ cover, size = QUEUE_COVER_SIZE }: { cover?: string; size?: number }) {
  const theme = useTheme();
  const paint = useMemo(() => resolveQueuePanelPaint(theme), [theme]);
  const resolver = useImageResolver();
  const uri = cover ? (isImageUrl(cover) ? cover : resolver?.(cover, 'thumb')) : undefined;
  const box = {
    width: size,
    height: size,
    borderRadius: 6,
    backgroundColor: paint.placeholder,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  return (
    <View style={box}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
      ) : (
        <RiMusic2Line width={size / 2} height={size / 2} fill={paint.placeholderGlyph} />
      )}
    </View>
  );
}

export function useQueuePanelCss() {
  useEffect(() => {
    adoptStyleSheet(QUEUE_PANEL_STYLE_ID, QUEUE_PANEL_CSS);
  }, []);
}

function QueuePanelRowComponent({
  track,
  onPress,
  current = false,
  playing = true,
  accessibilityLabel,
  trailing,
  highlighted = false,
  webState,
  style,
  testID,
}: QueuePanelRowProps & { webState?: 'active' | 'dragging' }) {
  const theme = useTheme();
  useQueuePanelCss();
  const paint = useMemo(() => resolveQueuePanelPaint(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();

  const rowStyle: WebCssStyle = {
    height: QUEUE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingRight: 8,
    backgroundColor: hovered || highlighted ? paint.rowHover : 'transparent',
    '--bloom-queue-ring': paint.ring,
  };

  return (
    <View
      {...webDataSet({ bloomQueueRow: webState ?? (highlighted ? 'active' : '') })}
      onPointerEnter={IS_WEB ? onIn : undefined}
      onPointerLeave={IS_WEB ? onOut : undefined}
      style={[rowStyle, style]}
      testID={testID}
    >
      <Pressable
        {...webDataSet({ bloomQueueFocusable: '' })}
        role="button"
        accessibilityLabel={accessibilityLabel ?? `Play ${track.title}`}
        onPress={onPress}
        style={{
          flex: 1,
          minWidth: 0,
          alignSelf: 'stretch',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 8,
          borderRadius: 8,
        }}
        testID={testID ? `${testID}-play` : undefined}
      >
        <QueueCover cover={track.cover} />
        <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 }}>
          <Text
            variant="body-medium"
            numberOfLines={1}
            style={{ color: current ? paint.accent : paint.text }}
          >
            {track.title}
          </Text>
          {track.artists || track.explicit ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 }}>
              {track.explicit ? <ExplicitBadge size="small" /> : null}
              {track.artists ? (
                <Text
                  variant="caption-1-regular"
                  numberOfLines={1}
                  style={{ color: paint.textSecondary, flexShrink: 1 }}
                >
                  {track.artists}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        {current ? (
          <NowPlayingIndicator playing={playing} size={14} testID={testID ? `${testID}-indicator` : undefined} />
        ) : track.meta ? (
          <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textSecondary }}>
            {track.meta}
          </Text>
        ) : null}
      </Pressable>
      {trailing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4, gap: 2 }}>{trailing}</View>
      ) : null}
    </View>
  );
}

export const QueuePanelRow = memo(QueuePanelRowComponent);
QueuePanelRow.displayName = 'QueuePanelRow';
