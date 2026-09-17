import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '../button';
import { webDataSet } from '../checkbox/shared';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Cover } from './Cover';
import { IS_WEB, MUSIC_LIBRARY_CSS, MUSIC_LIBRARY_STYLE_ID, resolveMusicLibraryPaint, type MusicLibraryPaint } from './shared';
import type { RecentSearchEntry, RecentSearchesProps } from './types';

/**
 * The recent-searches list on an empty search page.
 *
 *   heading   title-3-semibold, 8 below
 *   row       8 padding, 8 radius · 48 cover (circle when `round`) · 12 ·
 *             title body-medium over a caption meta · the × button (32 round)
 *   hover     the row fills (colour only); the × stays visible so touch and
 *             keyboard reach it too
 *   clear     a secondary small `Button`, 16 below the list
 *
 * The row and its × are SIBLING controls — a remove button nested inside the
 * row's own button is not reachable as a control of its own.
 */

function RecentRow({
  item,
  paint,
  onPress,
  onRemove,
  removeLabel,
  testID,
}: {
  item: RecentSearchEntry;
  paint: MusicLibraryPaint;
  onPress?: (item: RecentSearchEntry) => void;
  onRemove?: (item: RecentSearchEntry) => void;
  removeLabel: string;
  testID?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [removeHovered, setRemoveHovered] = useState(false);
  const name = [item.title, item.meta].filter(Boolean).join(', ');
  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: hovered ? paint.hover : 'transparent',
    paddingRight: 8,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '120ms' } : null),
  };
  const openStyle: WebCssStyle = {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 8,
    '--bloom-music-ring': paint.ring,
  };
  const removeStyle: WebCssStyle = {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: removeHovered ? paint.selected : 'transparent',
    '--bloom-music-ring': paint.ring,
  };
  return (
    <View
      onPointerEnter={IS_WEB ? () => setHovered(true) : undefined}
      onPointerLeave={IS_WEB ? () => setHovered(false) : undefined}
      style={rowStyle}
      testID={testID}
    >
      <Pressable
        {...webDataSet({ bloomMusicFocusable: '' })}
        role="button"
        accessibilityLabel={name}
        onPress={onPress ? () => onPress(item) : undefined}
        style={openStyle}
        testID={testID ? `${testID}-open` : undefined}
      >
        <Cover
          source={item.cover}
          size={48}
          round={item.round}
          kind={item.round ? 'artist' : 'song'}
          placeholder={paint.placeholder}
          glyphColor={paint.textMuted}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
            {item.title}
          </Text>
          {item.meta ? (
            <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textMuted }}>
              {item.meta}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable
          {...webDataSet({ bloomMusicFocusable: '' })}
          role="button"
          accessibilityLabel={removeLabel}
          onPress={() => onRemove(item)}
          onHoverIn={() => setRemoveHovered(true)}
          onHoverOut={() => setRemoveHovered(false)}
          style={removeStyle}
          testID={testID ? `${testID}-remove` : undefined}
        >
          <RiCloseLine width={20} height={20} fill={paint.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function RecentSearchesComponent({
  items,
  onItemPress,
  onRemove,
  onClearAll,
  title = 'Recent searches',
  clearAllLabel = 'Clear recent searches',
  removeLabel = (item) => `Remove ${item.title}`,
  style,
  testID,
}: RecentSearchesProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MUSIC_LIBRARY_STYLE_ID, MUSIC_LIBRARY_CSS);
  }, []);
  const paint = useMemo(() => resolveMusicLibraryPaint(theme), [theme]);

  return (
    <View style={[{ gap: 8 }, style]} testID={testID}>
      {title ? (
        <Text variant="title-3-semibold" role="heading" style={{ color: paint.text }}>
          {title}
        </Text>
      ) : null}
      <View role="list">
        {items.map((item) => (
          <View key={item.id} role="listitem">
            <RecentRow
              item={item}
              paint={paint}
              onPress={onItemPress}
              onRemove={onRemove}
              removeLabel={removeLabel(item)}
              testID={testID ? `${testID}-${item.id}` : undefined}
            />
          </View>
        ))}
      </View>
      {onClearAll && items.length > 0 ? (
        <Button
          variant="secondary"
          size="small"
          onPress={onClearAll}
          style={{ alignSelf: 'flex-start', marginTop: 8 }}
          testID={testID ? `${testID}-clear-all` : undefined}
        >
          {clearAllLabel}
        </Button>
      ) : null}
    </View>
  );
}

export const RecentSearches = memo(RecentSearchesComponent);
RecentSearches.displayName = 'RecentSearches';
