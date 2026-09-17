import React, {
  forwardRef,
  Fragment,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PanResponder,
  Pressable,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';

import { mergeRefs } from '../hooks/merge-refs';
import { RiArrowDownLine } from '../icons/remix/RiArrowDownLine';
import { RiArrowDownCircleFill } from '../icons/remix/RiArrowDownCircleFill';
import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiDraggable } from '../icons/remix/RiDraggable';
import { ExplicitBadge, formatDuration, LikeButton, NowPlayingIndicator, PlayButton } from '../media-controls';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TrackCover, TrackMenu } from './parts';
import {
  CELL,
  DEFAULT_LABELS,
  IS_WEB,
  isNarrow,
  resolveTrackListPaint,
  ROLE_GRIDCELL,
  resolveVisibleColumns,
  rowGeometry,
  TRACK_LIST_CSS,
  TRACK_LIST_STYLE_ID,
} from './shared';
import type { TrackMenuItem, TrackRowPressEvent, TrackRowProps } from './types';

/**
 * One track in a table: the row `TrackList` maps, usable on its own inside a
 * virtualised list.
 *
 *                 comfortable   compact   narrow (< 640)
 *   height        56            40        64 / 48
 *   radius        6             4         6 / 4
 *   cover         40            28        48 / 40
 *   padding x     16            12        8
 *
 *   rest       transparent
 *   hover      neutral-100 (dark 800) — the index swaps to a plain play
 *              button, the like, more and drag-handle controls appear
 *   selected   neutral-200 (dark 700)
 *   current    title in the accent; index shows the bars (playing) or an
 *              accent number (paused)
 *   unavailable  content at 50%, no play button, not playable
 *
 * Colour change only — no scale. Controls that "appear on hover" are MOUNTED on
 * hover or when focus is inside the row, so a hidden button is never a Tab stop.
 *
 * Accessibility (web): `role="row"` with `aria-selected` and `aria-rowindex`
 * inside `TrackList`'s `role="grid"`; each cell is a `gridcell`. The row is
 * named "<title>, <artists>" (plus "Unavailable"). Native gets the same name and
 * `accessibilityState.selected`.
 */

const INDEX_GLYPH = 14;

function readPress(event: GestureResponderEvent | undefined): TrackRowPressEvent & { keyboard: boolean } {
  const native = (event?.nativeEvent ?? {}) as {
    type?: string;
    shiftKey?: boolean;
    metaKey?: boolean;
    ctrlKey?: boolean;
    detail?: number;
  };
  return {
    keyboard: native.type === 'keyup' || native.type === 'keydown',
    shiftKey: native.shiftKey === true,
    toggleKey: native.metaKey === true || native.ctrlKey === true,
    clickCount: IS_WEB && typeof native.detail === 'number' && native.detail > 0 ? native.detail : 1,
  };
}

const TrackRowComponent = forwardRef<View, TrackRowProps>(function TrackRow(
  {
    track,
    index,
    columns,
    width,
    density = 'comfortable',
    current = false,
    playing = false,
    selected = false,
    onPlay,
    onPause,
    onPress,
    onLongPress,
    onLikedChange,
    onArtistPress,
    onAlbumPress,
    menuItems,
    reorderable = false,
    onMoveUp,
    onMoveDown,
    onDrag,
    onNavigate,
    showDownloaded = false,
    rowIndex,
    tabIndex,
    labels: labelsProp,
    style,
    testID,
  },
  ref,
) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(TRACK_LIST_STYLE_ID, TRACK_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveTrackListPaint(theme), [theme]);
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const window = useWindowDimensions();
  const layoutWidth = width ?? window.width;
  const narrow = isNarrow(layoutWidth);
  const visible = columns ?? resolveVisibleColumns(undefined, layoutWidth);
  const has = (column: (typeof visible)[number]) => visible.includes(column);
  const geo = rowGeometry(density, narrow);
  const compact = density === 'compact';

  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = hovered || focusWithin || menuOpen;
  const hostRef = useRef<View | null>(null);
  // Focus moving from the row into one of its own buttons fires blur first; a
  // render in between would unmount the button focus is moving to.
  const blurToOutside = (event: { nativeEvent?: unknown; relatedTarget?: unknown }) => {
    const related =
      (event as { relatedTarget?: unknown }).relatedTarget ??
      (event.nativeEvent as { relatedTarget?: unknown } | undefined)?.relatedTarget;
    const host = hostRef.current as unknown as { contains?: (node: unknown) => boolean } | null;
    if (related && typeof host?.contains === 'function' && host.contains(related)) return;
    setFocusWithin(false);
  };
  const unavailable = track.unavailable === true;
  const liked = track.liked === true;

  const artistNames = track.artists.map((artist) => artist.name).join(', ');
  const name = [track.title, artistNames, unavailable ? labels.unavailable : null]
    .filter(Boolean)
    .join(', ');

  const play = () => {
    if (unavailable) return;
    if (current && playing) (onPause ?? onPlay)?.(track, index);
    else onPlay?.(track, index);
  };

  const items: Array<TrackMenuItem | 'separator'> = [...(menuItems?.(track, index) ?? [])];
  if (reorderable) {
    if (items.length > 0) items.push('separator');
    items.push(
      {
        key: 'move-up',
        label: labels.moveUp,
        icon: RiArrowUpLine,
        onPress: () => onMoveUp?.(index),
        disabled: onMoveUp === undefined,
      },
      {
        key: 'move-down',
        label: labels.moveDown,
        icon: RiArrowDownLine,
        onPress: () => onMoveDown?.(index),
        disabled: onMoveDown === undefined,
      },
    );
  }
  const hasMenu = items.length > 0;

  // A drag ends with a click on the handle's row; it must not select.
  const suppressPress = useRef(false);
  const dragRef = useRef({ onDrag, index });
  dragRef.current = { onDrag, index };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => dragRef.current.onDrag?.('start', dragRef.current.index, 0),
        onPanResponderMove: (_event, gesture) =>
          dragRef.current.onDrag?.('move', dragRef.current.index, gesture.dy),
        onPanResponderRelease: (_event, gesture) => {
          suppressPress.current = true;
          setTimeout(() => {
            suppressPress.current = false;
          }, 0);
          dragRef.current.onDrag?.('end', dragRef.current.index, gesture.dy);
        },
        onPanResponderTerminate: (_event, gesture) =>
          dragRef.current.onDrag?.('cancel', dragRef.current.index, gesture.dy),
      }),
    [],
  );

  const handlePress = (event: GestureResponderEvent) => {
    if (suppressPress.current) return;
    const press = readPress(event);
    // Enter and Space are handled on keydown; react-native-web also reports
    // Enter as a press on keyup, which would play twice.
    if (press.keyboard) return;
    if (!IS_WEB) {
      if (onPress) onPress(track, index, press);
      else play();
      return;
    }
    if (press.clickCount >= 2) {
      play();
      return;
    }
    onPress?.(track, index, press);
  };

  const handleLongPress = () => {
    if (onLongPress) onLongPress(track, index);
    else if (hasMenu) setMenuOpen(true);
  };

  const handleKeyDown = (event: {
    key: string;
    shiftKey?: boolean;
    altKey?: boolean;
    target?: unknown;
    currentTarget?: unknown;
    preventDefault?: () => void;
  }) => {
    // Keys pressed inside the row's own buttons (or its portaled menu, whose
    // events bubble through React) belong to them.
    if (event.target !== event.currentTarget) return;
    const stop = () => event.preventDefault?.();
    const extend = event.shiftKey === true;
    switch (event.key) {
      case 'ArrowUp':
        stop();
        if (event.altKey) {
          if (reorderable) onMoveUp?.(index);
        } else onNavigate?.(index, 'previous', extend);
        return;
      case 'ArrowDown':
        stop();
        if (event.altKey) {
          if (reorderable) onMoveDown?.(index);
        } else onNavigate?.(index, 'next', extend);
        return;
      case 'Home':
        stop();
        onNavigate?.(index, 'first', extend);
        return;
      case 'End':
        stop();
        onNavigate?.(index, 'last', extend);
        return;
      case 'Enter':
      case ' ':
        stop();
        play();
        return;
      case 'ContextMenu':
        stop();
        if (hasMenu) setMenuOpen(true);
        return;
      case 'F10':
        if (event.shiftKey && hasMenu) {
          stop();
          setMenuOpen(true);
        }
        return;
      default:
    }
  };

  let background = 'transparent';
  if (selected) background = hovered ? paint.rowSelectedHover : paint.rowSelected;
  else if (hovered || menuOpen) background = paint.rowHover;

  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    height: geo.height,
    paddingLeft: geo.paddingX,
    paddingRight: geo.paddingX,
    borderRadius: geo.radius,
    backgroundColor: background,
    '--bloom-track-ring': paint.ring,
    '--bloom-track-link-hover': paint.text,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '100ms' } : null),
  };
  const dim = unavailable ? 0.5 : 1;
  const textColor = current && !unavailable ? paint.accent : paint.text;
  const cellGap = { marginLeft: geo.gap };

  // Web-only focus-within tracking. react-native-web's Pressable only reports
  // focus on itself, so the cells' wrapper listens for its descendants.
  const focusWithinProps = IS_WEB
    ? {
        onFocus: () => setFocusWithin(true),
        onBlur: blurToOutside,
      }
    : null;

  const indexCell = has('index') && !narrow && (
    <View
      role={ROLE_GRIDCELL}
      style={{ width: CELL.index, height: 32, alignItems: 'center', justifyContent: 'center' }}
    >
      {IS_WEB && active && !unavailable && onPlay ? (
        <PlayButton
          variant="plain"
          size="small"
          playing={current && playing}
          subject={track.title}
          onPress={play}
          testID={testID ? `${testID}-play` : undefined}
        />
      ) : current && playing && !unavailable ? (
        <NowPlayingIndicator size={INDEX_GLYPH} playing />
      ) : (
        <Text
          {...webDataSet({ bloomTrackNumber: '' })}
          variant="body-2-regular"
          numberOfLines={1}
          style={{
            color: current && !unavailable ? paint.accent : paint.textMuted,
            opacity: dim,
            fontVariant: ['tabular-nums'],
          }}
        >
          {String(track.number ?? index + 1)}
        </Text>
      )}
    </View>
  );

  const artists = (
    <Text
      variant={compact && !narrow ? 'caption-1-regular' : narrow ? 'body-2-regular' : 'caption-1-regular'}
      numberOfLines={1}
      style={{ color: paint.textMuted, flexShrink: 1 }}
    >
      {track.artists.map((artist, i) => (
        <Fragment key={`${artist.id ?? artist.name}-${i}`}>
          {i > 0 ? ', ' : ''}
          {onArtistPress && !narrow ? (
            <Text
              {...webDataSet({ bloomTrackLink: '' })}
              role="link"
              accessibilityLabel={artist.name}
              onPress={() => onArtistPress(artist, track)}
              style={{ color: paint.textMuted }}
            >
              {artist.name}
            </Text>
          ) : (
            artist.name
          )}
        </Fragment>
      ))}
    </Text>
  );

  const titleCell = has('title') && (
    <View
      role={ROLE_GRIDCELL}
      style={[
        {
          flex: CELL.flex.title,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
        },
        has('index') && !narrow ? cellGap : null,
      ]}
    >
      <TrackCover cover={track.cover} size={geo.cover} radius={geo.coverRadius} dimmed={unavailable} />
      <View style={{ flex: 1, minWidth: 0, marginLeft: compact ? 10 : 12, opacity: dim }}>
        <Text
          variant={compact ? 'body-2-medium' : 'body-medium'}
          numberOfLines={1}
          style={{ color: textColor }}
        >
          {track.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
          {narrow && current && !unavailable ? (
            <NowPlayingIndicator size={12} playing={playing} style={{ marginRight: 6 }} />
          ) : null}
          {showDownloaded && track.downloaded ? (
            <View
              role="img"
              accessibilityLabel={labels.downloaded}
              style={{ marginRight: 4, width: 14, height: 14 }}
            >
              <RiArrowDownCircleFill width={14} height={14} fill={paint.accent} />
            </View>
          ) : null}
          {track.explicit ? <ExplicitBadge size="small" style={{ marginRight: 6 }} /> : null}
          {artists}
        </View>
      </View>
    </View>
  );

  const mutedCell = (
    key: 'album' | 'dateAdded' | 'plays',
    value: string | undefined,
    flexOrWidth: { flex: number } | { width: number },
    press?: () => void,
  ) => (
    <View
      key={key}
      role={ROLE_GRIDCELL}
      style={[{ minWidth: 0, opacity: dim }, flexOrWidth, cellGap]}
    >
      {value ? (
        press ? (
          <Text
            {...webDataSet({ bloomTrackLink: '' })}
            variant="body-2-regular"
            numberOfLines={1}
            role="link"
            accessibilityLabel={value}
            onPress={press}
            style={{ color: paint.textMuted, alignSelf: 'flex-start', maxWidth: '100%' }}
          >
            {value}
          </Text>
        ) : (
          <Text
            variant="body-2-regular"
            numberOfLines={1}
            style={{
              color: paint.textMuted,
              textAlign: key === 'plays' ? 'right' : 'left',
              fontVariant: key === 'plays' ? ['tabular-nums'] : undefined,
            }}
          >
            {value}
          </Text>
        )
      ) : null}
    </View>
  );

  const showLikeSlot = has('actions') && onLikedChange !== undefined && !narrow;
  const showLike = showLikeSlot && (liked || (IS_WEB ? active && !unavailable : false));
  const showMore = has('actions') && hasMenu && (narrow || !IS_WEB || active || selected);

  const menuLabel = `${labels.moreOptions} for ${track.title}`;

  return (
    <Pressable
      ref={mergeRefs([hostRef, ref])}
      {...webDataSet({ bloomTrackRow: '' })}
      role="row"
      aria-selected={selected}
      aria-rowindex={rowIndex}
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      tabIndex={tabIndex}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={blurToOutside}
      {...(IS_WEB
        ? {
            onKeyDown: handleKeyDown,
            onContextMenu: (event: { preventDefault?: () => void }) => {
              if (!hasMenu) return;
              event.preventDefault?.();
              setMenuOpen(true);
            },
          }
        : null)}
      style={[rowStyle, style]}
      testID={testID}
    >
      <View
        {...focusWithinProps}
        style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', height: '100%' }}
      >
        {reorderable && !narrow ? (
          <View
            {...webDataSet({ bloomTrackHandle: '' })}
            {...pan.panHandlers}
            aria-hidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: CELL.handle,
              height: 32,
              marginRight: 4,
              marginLeft: -8,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !IS_WEB || active ? 1 : 0,
            }}
            testID={testID ? `${testID}-handle` : undefined}
          >
            <RiDraggable width={16} height={16} fill={paint.textMuted} />
          </View>
        ) : null}
        {indexCell}
        {titleCell}
        {has('album') ? mutedCell('album', track.album, { flex: CELL.flex.album }, onAlbumPress ? () => onAlbumPress(track) : undefined) : null}
        {has('dateAdded') ? mutedCell('dateAdded', track.dateAdded, { flex: CELL.flex.dateAdded }) : null}
        {has('plays') ? mutedCell('plays', track.plays, { width: CELL.plays }) : null}
        {showLikeSlot ? (
          <View style={[{ width: CELL.button, alignItems: 'center' }, cellGap]}>
            {showLike ? (
              <LikeButton
                size="small"
                liked={liked}
                disabled={unavailable}
                onLikedChange={(next) => onLikedChange?.(track, next)}
                testID={testID ? `${testID}-like` : undefined}
              />
            ) : null}
          </View>
        ) : null}
        {has('duration') && !narrow ? (
          <View role={ROLE_GRIDCELL} style={[{ width: CELL.duration, opacity: dim }, showLikeSlot ? { marginLeft: 8 } : cellGap]}>
            <Text
              variant="body-2-regular"
              numberOfLines={1}
              style={{ color: paint.textMuted, textAlign: 'right', fontVariant: ['tabular-nums'] }}
            >
              {formatDuration(track.duration)}
            </Text>
          </View>
        ) : null}
        {has('actions') && (menuItems !== undefined || reorderable) ? (
          <View
            role={ROLE_GRIDCELL}
            style={[{ width: CELL.button, alignItems: 'center' }, narrow ? { marginLeft: 4 } : { marginLeft: 8 }]}
          >
            {showMore ? (
              <TrackMenu
                items={items}
                label={menuLabel}
                open={menuOpen}
                onOpenChange={setMenuOpen}
                testID={testID ? `${testID}-more` : undefined}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

export const TrackRow = memo(TrackRowComponent);
TrackRow.displayName = 'TrackRow';
