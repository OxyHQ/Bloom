import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { webDataSet } from '../checkbox/shared';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../context-menu';
import { RiArrowDownCircleFill } from '../icons/remix/RiArrowDownCircleFill';
import { RiPushpinFill } from '../icons/remix/RiPushpinFill';
import { NowPlayingIndicator } from '../media-controls';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';
import { Text } from '../typography';
import { Cover } from './Cover';
import {
  DEFAULT_KIND_LABELS,
  IS_WEB,
  MUSIC_LIBRARY_CSS,
  MUSIC_LIBRARY_STYLE_ID,
  libraryMeta,
  resolveMusicLibraryPaint,
} from './shared';
import type { LibraryItemProps } from './types';

/**
 * One entry of Your Library.
 *
 *   list      8 padding · 48 cover · 12 · title body-medium over a caption meta
 *             line ("Playlist · Maya") led by the pinned and downloaded glyphs
 *             (14, accent) · the now-playing bars (14) on the right
 *   compact   6/8 padding · title · meta on one line, no cover
 *   grid      a tile: square cover filling the width · title · meta
 *   rail      the 48 cover alone (the now-playing bars on its corner); on web a
 *             tooltip names it on hover
 *
 * Covers are 4px rounded squares, circles for artists. Rows are 8px rounded;
 * hover and press fill them (a colour change only), the open page keeps a
 * stronger fill. The playing context's title turns accent.
 *
 * Accessibility: a `button` whose name is the whole row read aloud —
 * "Night Drive, Playlist · Maya, Pinned, Downloaded, Now playing" — since the
 * glyphs carry state no text does. The open page is `aria-current="page"` on
 * web and `accessibilityState.selected` on native. With `contextMenu` the row
 * is also a context-menu trigger (right-click / long press).
 */

const LIST_COVER = 48;
const INLINE_GLYPH = 14;

function LibraryItemComponent({
  item,
  variant = 'list',
  selected = false,
  nowPlaying = false,
  paused = false,
  onPress,
  contextMenu,
  kindLabels,
  pinnedLabel = 'Pinned',
  downloadedLabel = 'Downloaded',
  nowPlayingLabel = 'Now playing',
  style,
  testID,
}: LibraryItemProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MUSIC_LIBRARY_STYLE_ID, MUSIC_LIBRARY_CSS);
  }, []);
  const paint = useMemo(() => resolveMusicLibraryPaint(theme), [theme]);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [tileWidth, setTileWidth] = useState(0);

  const labels = useMemo(() => ({ ...DEFAULT_KIND_LABELS, ...kindLabels }), [kindLabels]);
  const meta = libraryMeta(item, labels);
  const round = item.kind === 'artist';
  const name = [
    item.title,
    meta,
    item.pinned ? pinnedLabel : null,
    item.downloaded ? downloadedLabel : null,
    nowPlaying ? nowPlayingLabel : null,
  ]
    .filter(Boolean)
    .join(', ');

  const fill = selected ? paint.selected : hovered || pressed ? paint.hover : 'transparent';
  const titleColor = nowPlaying ? paint.accent : paint.text;

  const flags =
    item.pinned || item.downloaded ? (
      <>
        {item.pinned ? (
          <RiPushpinFill width={INLINE_GLYPH} height={INLINE_GLYPH} fill={paint.accent} />
        ) : null}
        {item.downloaded ? (
          <RiArrowDownCircleFill width={INLINE_GLYPH} height={INLINE_GLYPH} fill={paint.accent} />
        ) : null}
      </>
    ) : null;

  const indicator = nowPlaying ? (
    <NowPlayingIndicator playing={!paused} size={14} label={nowPlayingLabel} />
  ) : null;

  const cover = (size: number) => (
    <Cover
      source={item.cover}
      size={size}
      round={round}
      radius={variant === 'grid' ? 6 : 4}
      kind={item.kind}
      placeholder={paint.placeholder}
      glyphColor={paint.textMuted}
      testID={testID ? `${testID}-cover` : undefined}
    />
  );

  let body: React.ReactNode;
  const rowStyle: WebCssStyle = {
    borderRadius: 8,
    backgroundColor: fill,
    '--bloom-music-ring': paint.ring,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '120ms' } : null),
  };

  if (variant === 'rail') {
    Object.assign(rowStyle, { padding: 8, alignSelf: 'flex-start' } satisfies ViewStyle);
    body = (
      <>
        {cover(LIST_COVER)}
        {nowPlaying ? (
          // The rail has no title to turn accent, so the bars sit on the cover's
          // corner in a surface-coloured disc.
          <View
            style={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: paint.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {indicator}
          </View>
        ) : null}
      </>
    );
  } else if (variant === 'grid') {
    Object.assign(rowStyle, { padding: 8, gap: 8 } satisfies ViewStyle);
    body = (
      <>
        <View
          style={{ width: '100%', aspectRatio: 1 }}
          onLayout={(event) => setTileWidth(Math.round(event.nativeEvent.layout.width))}
        >
          {tileWidth > 0 ? cover(tileWidth) : null}
        </View>
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="body-medium" numberOfLines={1} style={{ color: titleColor, flexShrink: 1 }}>
              {item.title}
            </Text>
            {indicator}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {flags}
            <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textMuted, flexShrink: 1 }}>
              {meta}
            </Text>
          </View>
        </View>
      </>
    );
  } else if (variant === 'compact') {
    Object.assign(rowStyle, {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 8,
      paddingRight: 8,
    } satisfies ViewStyle);
    body = (
      <>
        {flags}
        <Text variant="body-medium" numberOfLines={1} style={{ color: titleColor, flexShrink: 1 }}>
          {item.title}
        </Text>
        <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textMuted, flexShrink: 100 }}>
          {`· ${meta}`}
        </Text>
        <View style={{ flexGrow: 1 }} />
        {indicator}
      </>
    );
  } else {
    Object.assign(rowStyle, {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 8,
    } satisfies ViewStyle);
    body = (
      <>
        {cover(LIST_COVER)}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: titleColor }}>
            {item.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {flags}
            <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textMuted, flexShrink: 1 }}>
              {meta}
            </Text>
          </View>
        </View>
        {indicator}
      </>
    );
  }

  let node = (
    <Pressable
      {...webDataSet({ bloomMusicFocusable: '', bloomLibraryItem: variant })}
      {...(IS_WEB && selected ? { 'aria-current': 'page' } : null)}
      role="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      onPress={onPress ? () => onPress(item) : undefined}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[rowStyle, style]}
      testID={testID}
    >
      {body}
    </Pressable>
  );

  if (contextMenu) {
    node = (
      <ContextMenu>
        <ContextMenuTrigger asChild style={{ alignSelf: variant === 'rail' ? 'flex-start' : 'stretch' }}>
          {node}
        </ContextMenuTrigger>
        <ContextMenuContent label={item.title}>{contextMenu}</ContextMenuContent>
      </ContextMenu>
    );
  }

  if (variant === 'rail' && IS_WEB) {
    return (
      <Tooltip visible={hovered} onVisibleChange={setHovered} position="bottom">
        <TooltipTrigger>{node}</TooltipTrigger>
        <TooltipTextBubble>{`${item.title} · ${meta}`}</TooltipTextBubble>
      </Tooltip>
    );
  }

  return node;
}

export const LibraryItem = memo(LibraryItemComponent);
LibraryItem.displayName = 'LibraryItem';
