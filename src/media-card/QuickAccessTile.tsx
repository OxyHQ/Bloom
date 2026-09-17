import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiMusic2Fill } from '../icons/remix/RiMusic2Fill';
import { NowPlayingIndicator, PlayButton } from '../media-controls';
import { Box as SkeletonBox } from '../skeleton';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Artwork, CardLink, useMediaCardCss } from './parts';
import {
  composeName,
  IS_WEB,
  QUICK_TILE_HEIGHT,
  QUICK_TILE_RADIUS,
  resolveMediaCardPaint,
  resolvePlayVisibility,
  webData,
} from './shared';
import type { QuickAccessTileProps } from './types';

/**
 * The compact home-screen shortcut, laid out 2–4 to a row.
 *
 *   56 tall, radius 6, clipped; the cover flush left (56 square — or a 40
 *   round photo inset 8 for an artist), 12 to the title (body-semibold, up to
 *   2 lines), then one 32 slot at the trailing edge: the accent play button,
 *   revealed on hover (web). While `current` the slot shows the now-playing
 *   bars instead, swapped for the pause button under the pointer or focus on
 *   web; native shows the button (or the bars without `onPlay`).
 *
 *   rest    text over background at 7% (dark 10%)
 *   hover   at 12% (dark 16%) — colour only
 *
 * It stretches to its column: give it a width through `style` or its parent.
 *
 * Name: "Late Hours, Playlist".
 */
function QuickAccessTileComponent({
  title,
  artwork,
  artworkVariant,
  artworkColor,
  round = false,
  typeLabel,
  onPress,
  href,
  onPlay,
  playing = false,
  loading = false,
  current = false,
  selected = false,
  skeleton = false,
  accessibilityLabel,
  style,
  testID,
}: QuickAccessTileProps) {
  const theme = useTheme();
  useMediaCardCss();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);

  if (skeleton) {
    return (
      <View aria-busy accessibilityLabel="Loading" style={style} testID={testID}>
        <SkeletonBox width="100%" height={QUICK_TILE_HEIGHT} borderRadius={QUICK_TILE_RADIUS} />
      </View>
    );
  }

  const visibility = resolvePlayVisibility({ hasOnPlay: Boolean(onPlay), playing, loading, current });
  // On web the current tile shows the bars at rest and swaps them for the
  // pause button under the pointer or keyboard focus — one slot, never both.
  const swap = IS_WEB && current && visibility !== 'none' && !loading;
  const name = accessibilityLabel ?? composeName([title, typeLabel, current && playing ? 'Now playing' : undefined]);

  const rootStyle: WebCssStyle = {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: QUICK_TILE_HEIGHT,
    borderRadius: QUICK_TILE_RADIUS,
    overflow: 'hidden',
    backgroundColor: selected ? paint.selected : paint.tile,
    '--bloom-media-card-hover': paint.tileHover,
  };

  return (
    <View
      {...webData({ bloomMediaCard: 'quick', ...(onPress || href ? { bloomMediaCardHover: '' } : null) })}
      style={[rootStyle, style]}
      testID={testID}
    >
      <CardLink name={name} onPress={onPress} href={href} selected={selected} radius={QUICK_TILE_RADIUS} paint={paint} testID={testID} />
      <View pointerEvents="none" style={{ paddingLeft: round ? 8 : 0 }}>
        <Artwork
          source={artwork}
          variant={artworkVariant}
          color={artworkColor}
          width={round ? 40 : QUICK_TILE_HEIGHT}
          height={round ? 40 : QUICK_TILE_HEIGHT}
          round={round}
          radius={0}
          icon={RiMusic2Fill}
          paint={paint}
          testID={testID ? `${testID}-artwork` : undefined}
        />
      </View>
      <View pointerEvents="none" style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 }}>
        <Text variant="body-semibold" numberOfLines={2} style={{ color: current ? paint.accent : paint.text }}>
          {title}
        </Text>
      </View>
      {current || visibility !== 'none' ? (
        <View
          style={{ width: 32, height: 32, marginRight: 12, alignItems: 'center', justifyContent: 'center' }}
          pointerEvents="box-none"
        >
          {current && (swap || visibility === 'none') ? (
            <View pointerEvents="none" {...webData(swap ? { bloomMediaCardConceal: '' } : {})}>
              <NowPlayingIndicator playing={playing} size={14} testID={testID ? `${testID}-now-playing` : undefined} />
            </View>
          ) : null}
          {visibility !== 'none' ? (
            <View
              {...webData(swap || visibility === 'hover' ? { bloomMediaCardReveal: 'hover' } : {})}
              style={{ position: 'absolute', top: 0, left: 0 }}
              testID={testID ? `${testID}-play` : undefined}
            >
              <PlayButton playing={playing} loading={loading} onPress={onPlay} subject={title} size="small" />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export const QuickAccessTile = memo(QuickAccessTileComponent);
QuickAccessTile.displayName = 'QuickAccessTile';
