import React, { Children, memo, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { mixColor } from '../button/shared';
import { useImageResolver } from '../image-resolver/context';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { isUrl } from './Cover';
import {
  IS_WEB,
  MUSIC_LIBRARY_CSS,
  MUSIC_LIBRARY_STYLE_ID,
  TILE_LIGHT_TEXT,
  browseTilePaint,
  gridColumns,
  resolveMusicLibraryPaint,
} from './shared';
import type { BrowseGridProps, BrowseTile } from './types';

/**
 * The browse page's grid of genre and mood tiles.
 *
 *   columns   as many as fit at `minTileWidth` (default 128), from the
 *             measured width; 16 gap (12 under 480 wide)
 *   tile      12 radius, 1.6 : 1, the tile's own colour; 16 padding;
 *             title title-2-bold, top-left, two lines at most
 *   image     40% of the tile's height, 6 radius, tilted 25° and tucked into
 *             the bottom-right corner, clipped by the tile
 *   hover     the fill moves 12% toward the title colour's opposite (colour only)
 *
 * The title is white or near-black, whichever clears 4.5:1 on the tile colour;
 * a mid-grey that neither clears is darkened until white does
 * (`browseTilePaint`), so any backend colour stays readable. Children replace the colour tiles: each child is one cell.
 */

const TILE_RATIO = 1.6;

function Tile({
  item,
  width,
  onPress,
  testID,
}: {
  item: BrowseTile;
  width: number;
  onPress?: (item: BrowseTile) => void;
  testID?: string;
}) {
  const theme = useTheme();
  const libraryPaint = useMemo(() => resolveMusicLibraryPaint(theme), [theme]);
  const resolver = useImageResolver();
  const [hovered, setHovered] = useState(false);
  const paint = useMemo(
    () => browseTilePaint(item.color, { background: libraryPaint.selected, text: libraryPaint.text }),
    [item.color, libraryPaint],
  );
  const height = Math.round(width / TILE_RATIO);
  const imageSize = Math.round(height * 0.4 * 1.15);
  const uri = item.image ? (isUrl(item.image) ? item.image : resolver?.(item.image) ?? undefined) : undefined;
  const hoverFill = mixColor(paint.background, paint.text === TILE_LIGHT_TEXT ? '#000000' : '#ffffff', 0.12);

  const style: WebCssStyle = {
    width,
    height,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 16,
    backgroundColor: hovered ? hoverFill : paint.background,
    '--bloom-music-ring': libraryPaint.ring,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '150ms' } : null),
  };

  return (
    <Pressable
      {...webDataSet({ bloomMusicFocusable: '' })}
      role="button"
      accessibilityLabel={item.title}
      onPress={onPress ? () => onPress(item) : undefined}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}
      testID={testID}
    >
      <Text
        variant={width < 180 ? 'headline-bold' : 'title-2-bold'}
        numberOfLines={2}
        style={{ color: paint.text, paddingRight: imageSize * 0.35 }}
      >
        {item.title}
      </Text>
      {uri ? (
        <Image
          source={{ uri }}
          aria-hidden
          style={{
            position: 'absolute',
            width: imageSize,
            height: imageSize,
            right: -Math.round(imageSize * 0.18),
            bottom: -Math.round(imageSize * 0.08),
            borderRadius: 6,
            transform: [{ rotate: '25deg' }],
          }}
          resizeMode="cover"
        />
      ) : null}
    </Pressable>
  );
}

function BrowseGridComponent({
  items,
  children,
  onItemPress,
  minTileWidth = 128,
  gap: gapProp,
  title,
  style,
  testID,
}: BrowseGridProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MUSIC_LIBRARY_STYLE_ID, MUSIC_LIBRARY_CSS);
  }, []);
  const [width, setWidth] = useState(0);
  const gap = gapProp ?? (width > 0 && width < 480 ? 12 : 16);
  const columns = gridColumns(width, minTileWidth, gap);
  const cell = width > 0 ? Math.floor((width - gap * (columns - 1)) / columns) : minTileWidth;

  const cells = children
    ? Children.toArray(children).map((child, index) => (
        <View key={index} style={{ width: cell }}>
          {child}
        </View>
      ))
    : (items ?? []).map((item) => (
        <Tile
          key={item.id}
          item={item}
          width={cell}
          onPress={onItemPress}
          testID={testID ? `${testID}-${item.id}` : undefined}
        />
      ));

  return (
    <View style={[{ gap: 16 }, style]} testID={testID}>
      {title ? (
        <Text variant="title-2-bold" role="heading" style={{ color: theme.colors.text }}>
          {title}
        </Text>
      ) : null}
      <View
        onLayout={(event) => setWidth(Math.floor(event.nativeEvent.layout.width))}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}
        testID={testID ? `${testID}-grid` : undefined}
      >
        {cells}
      </View>
    </View>
  );
}

export const BrowseGrid = memo(BrowseGridComponent);
BrowseGrid.displayName = 'BrowseGrid';
