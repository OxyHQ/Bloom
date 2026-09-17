import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { RiDiscLine } from '../icons/remix/RiDiscLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  dragShift,
  IS_WEB,
  isNarrow,
  nextSelection,
  reorderTarget,
  resolveTrackListPaint,
  ROLE_GRIDCELL,
  resolveVisibleColumns,
  rowGeometry,
} from './shared';
import { TrackListHeader } from './TrackListHeader';
import { TrackRow } from './TrackRow';
import type { Track, TrackListProps, TrackRowNavigation, TrackRowPressEvent } from './types';

/**
 * The table of tracks for an album, a playlist, the liked songs or a page of
 * search results.
 *
 * Columns collapse by the list's own width (measured, or `width`): album and
 * plays below 768, date added below 1024, and below 640 the table becomes a
 * list of cover, title/artists and the more button, with no header.
 *
 * Selection (web): a click selects one row, Cmd/Ctrl-click toggles, Shift-click
 * selects the range from the last clicked row; a double-click plays. Native: a
 * press plays and a long press opens the row menu (or toggles selection when
 * there is no menu).
 *
 * Keyboard (web): the list is ONE Tab stop (a roving `tabIndex`). Arrow
 * Up/Down and Home/End move focus (with Shift they extend the selection),
 * Enter/Space play, the Menu key or Shift+F10 opens the row menu, and with
 * `reorderable` Alt+Arrow moves the focused row.
 *
 * Reorder: `reorderable` + `onReorder(from, to)` draws a drag handle on hover
 * (rows part to show where the dragged one lands) and adds "Move up"/"Move
 * down" to the row menu, the path for keyboard, screen reader and native users.
 * The app moves the item; the list only reports indexes.
 *
 * Accessibility: `role="grid"` named `accessibilityLabel` ("Tracks"), with
 * `aria-multiselectable` and `aria-rowcount`; a header `row` of
 * `columnheader`s; each track a `row` with `aria-selected` and `aria-rowindex`.
 * `grid` rather than `listbox` because rows hold buttons and links, which an
 * `option` may not contain.
 *
 * It maps every track — fine for a few hundred rows. For longer lists render
 * `TrackListHeader` and `TrackRow` inside a virtualised list (docs).
 */
export function TrackList({
  tracks,
  columns,
  density = 'comfortable',
  groups,
  currentTrackId,
  isPlaying = false,
  onPlay,
  onPause,
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  selectable = true,
  onLikedChange,
  onArtistPress,
  onAlbumPress,
  menuItems,
  reorderable = false,
  onReorder,
  showDownloaded,
  showHeader = true,
  stickyHeader = true,
  stickyHeaderOffset = 0,
  headerBackground,
  width,
  accessibilityLabel = 'Tracks',
  labels,
  style,
  testID,
}: TrackListProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveTrackListPaint(theme), [theme]);
  const window = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);
  const layoutWidth = width ?? measured ?? window.width;
  const narrow = isNarrow(layoutWidth);
  const visible = useMemo(() => resolveVisibleColumns(columns, layoutWidth), [columns, layoutWidth]);
  const geo = rowGeometry(density, narrow);
  const canReorder = reorderable && onReorder !== undefined;

  // --- selection -----------------------------------------------------------
  const [innerSelected, setInnerSelected] = useState<string[]>(defaultSelectedIds ?? []);
  const selected = selectedIds ?? innerSelected;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const anchor = useRef<string | null>(null);
  const order = useMemo(() => tracks.map((track) => track.id), [tracks]);
  const commit = (next: string[]) => {
    if (selectedIds === undefined) setInnerSelected(next);
    onSelectionChange?.(next);
  };

  // --- focus ---------------------------------------------------------------
  const [focusIndexRaw, setFocusIndex] = useState(0);
  const focusIndex = Math.max(0, Math.min(focusIndexRaw, tracks.length - 1));
  const rows = useRef(new Map<string, View>());
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    const id = pendingFocus.current;
    if (id === null) return;
    pendingFocus.current = null;
    const node = rows.current.get(id) as unknown as { focus?: () => void } | undefined;
    node?.focus?.();
  });

  const handlePress = (track: Track, index: number, event: TrackRowPressEvent) => {
    setFocusIndex(index);
    if (!selectable) return;
    const mode = event.shiftKey ? 'range' : event.toggleKey ? 'toggle' : 'replace';
    const next = nextSelection(order, { selected, anchor: anchor.current }, track.id, mode);
    anchor.current = next.anchor;
    commit(next.selected);
  };

  const handleNavigate = (index: number, to: TrackRowNavigation, extend: boolean) => {
    const last = tracks.length - 1;
    const target =
      to === 'previous' ? index - 1 : to === 'next' ? index + 1 : to === 'first' ? 0 : last;
    const clamped = Math.max(0, Math.min(last, target));
    if (clamped === index) return;
    const targetTrack = tracks[clamped];
    const fromTrack = tracks[index];
    if (!targetTrack || !fromTrack) return;
    setFocusIndex(clamped);
    pendingFocus.current = targetTrack.id;
    if (extend && selectable) {
      if (anchor.current === null || !order.includes(anchor.current)) anchor.current = fromTrack.id;
      const next = nextSelection(order, { selected, anchor: anchor.current }, targetTrack.id, 'range');
      commit(next.selected);
    }
    // Focus moves in the effect above even when nothing re-renders.
    const node = rows.current.get(targetTrack.id) as unknown as { focus?: () => void } | undefined;
    node?.focus?.();
  };

  const handleLongPress = (track: Track) => {
    if (!selectable) return;
    const next = nextSelection(order, { selected, anchor: anchor.current }, track.id, 'toggle');
    anchor.current = next.anchor;
    commit(next.selected);
  };

  // --- reorder -------------------------------------------------------------
  const [drag, setDrag] = useState<{ from: number; dy: number } | null>(null);
  const move = (from: number, to: number) => {
    const track = tracks[from];
    if (!track || to < 0 || to >= tracks.length || to === from) return;
    setFocusIndex(to);
    pendingFocus.current = track.id;
    onReorder?.(from, to);
  };
  const handleDrag = (phase: 'start' | 'move' | 'end' | 'cancel', index: number, dy: number) => {
    if (phase === 'start') {
      setDrag({ from: index, dy: 0 });
      return;
    }
    if (phase === 'move') {
      setDrag((current) => (current ? { ...current, dy } : current));
      return;
    }
    setDrag(null);
    if (phase === 'end') {
      const to = reorderTarget(index, dy, geo.height, tracks.length);
      if (to !== index) onReorder?.(index, to);
    }
  };
  const dragTarget = drag ? reorderTarget(drag.from, drag.dy, geo.height, tracks.length) : -1;

  // --- layout --------------------------------------------------------------
  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0 && next !== measured) setMeasured(next);
  };

  const groupAt = new Map(
    canReorder ? [] : (groups ?? []).map((group) => [group.startIndex, group] as const),
  );
  const header = showHeader && !narrow;
  let rowNumber = header ? 1 : 0;
  const rowCount = (header ? 1 : 0) + groupAt.size + tracks.length;

  return (
    <View
      role="grid"
      accessibilityLabel={accessibilityLabel}
      aria-multiselectable={selectable || undefined}
      aria-rowcount={rowCount}
      onLayout={width === undefined ? onLayout : undefined}
      {...webDataSet(drag ? { bloomTrackDragging: 'true' } : {})}
      style={[{ width: '100%' }, style]}
      testID={testID}
    >
      {header ? (
        <TrackListHeader
          columns={visible}
          density={density}
          reorderable={canReorder}
          likeable={onLikedChange !== undefined}
          hasMenu={menuItems !== undefined || canReorder}
          sticky={stickyHeader}
          stickyOffset={stickyHeaderOffset}
          background={headerBackground}
          labels={labels}
          testID={testID ? `${testID}-header` : undefined}
        />
      ) : null}
      {tracks.map((track, index) => {
        const group = groupAt.get(index);
        const groupRow = group ? ++rowNumber : 0;
        const trackRow = ++rowNumber;
        const dragged = drag?.from === index;
        const shift = drag && !dragged ? dragShift(index, drag.from, dragTarget, geo.height) : 0;
        const wrapperStyle: WebCssStyle | null = drag
          ? dragged
            ? {
                transform: [{ translateY: drag.dy }],
                zIndex: 2,
                borderRadius: geo.radius,
                backgroundColor: paint.dragSurface,
                boxShadow: paint.dragShadow,
              }
            : { transform: [{ translateY: shift }] }
          : null;
        return (
          <Fragment key={track.id}>
            {group ? (
              <View
                role="row"
                aria-rowindex={groupRow}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 48,
                  paddingLeft: geo.paddingX,
                  paddingRight: geo.paddingX,
                  marginTop: index === 0 ? 0 : 16,
                }}
              >
                <View
                  role={ROLE_GRIDCELL}
                  style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0, flex: 1 }}
                >
                  <View
                    aria-hidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ width: narrow ? 20 : 32, alignItems: narrow ? 'flex-start' : 'center' }}
                  >
                    <RiDiscLine width={18} height={18} fill={paint.textMuted} />
                  </View>
                  <Text
                    variant="body-semibold"
                    numberOfLines={1}
                    style={{ color: paint.textMuted, marginLeft: narrow ? 4 : geo.gap }}
                  >
                    {group.title}
                  </Text>
                </View>
              </View>
            ) : null}
            <View
              {...webDataSet(drag && !dragged ? { bloomTrackShift: '' } : {})}
              style={wrapperStyle}
            >
              <TrackRow
                ref={(node: View | null) => {
                  if (node) rows.current.set(track.id, node);
                  else rows.current.delete(track.id);
                }}
                track={track}
                index={index}
                columns={visible}
                width={layoutWidth}
                density={density}
                current={currentTrackId === track.id}
                playing={currentTrackId === track.id && isPlaying}
                selected={selectedSet.has(track.id)}
                onPlay={onPlay}
                onPause={onPause}
                onPress={IS_WEB ? handlePress : undefined}
                onLongPress={
                  !IS_WEB && menuItems === undefined && !canReorder && selectable
                    ? handleLongPress
                    : undefined
                }
                onLikedChange={onLikedChange}
                onArtistPress={onArtistPress}
                onAlbumPress={onAlbumPress}
                menuItems={menuItems}
                reorderable={canReorder}
                onMoveUp={canReorder && index > 0 ? (i) => move(i, i - 1) : undefined}
                onMoveDown={
                  canReorder && index < tracks.length - 1 ? (i) => move(i, i + 1) : undefined
                }
                onDrag={canReorder ? handleDrag : undefined}
                onNavigate={handleNavigate}
                showDownloaded={showDownloaded}
                rowIndex={trackRow}
                tabIndex={IS_WEB ? (index === focusIndex ? 0 : -1) : undefined}
                labels={labels}
                testID={testID ? `${testID}-row-${index}` : undefined}
              />
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}
