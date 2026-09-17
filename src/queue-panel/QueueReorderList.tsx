import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dragShift, dragTarget } from '../hooks/list-reorder';
import {
  PanResponder,
  View,
  type AccessibilityActionEvent,
  type PanResponderGestureState,
} from 'react-native';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { RiArrowDownLine } from '../icons/remix/RiArrowDownLine';
import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiDraggable } from '../icons/remix/RiDraggable';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { QueueIconButton } from './QueueIconButton';
import { QueuePanelRow } from './QueuePanelRow';
import {
  IS_WEB,
  QUEUE_ROW_HEIGHT,
  resolveQueuePanelPaint,
  type QueuePanelPaint,
} from './shared';
import type { QueuePanelLabels, QueueSection, QueueTrack } from './types';

/**
 * A reorderable section of the queue.
 *
 * Three ways to move a row, all ending in one `onReorder(section, from, to)`:
 *
 *   drag      the handle (hover-revealed on web, always drawn on touch). The
 *             row lifts under the pointer and its neighbours slide to show
 *             where it lands; rows are a fixed 56 tall, so the landing index
 *             is `from + round(dy / 56)` with no measuring.
 *   keyboard  the focused handle answers ArrowUp / ArrowDown; native exposes
 *             the same as "Move up" / "Move down" accessibility actions.
 *   menu      the row's "More options" menu: Move up, Move down, Remove.
 *
 * Every move is announced ("Night Drive moved to position 2 of 5").
 */

interface DragState {
  from: number;
  dy: number;
}

export interface QueueReorderListProps {
  section: QueueSection;
  tracks: QueueTrack[];
  labels: QueuePanelLabels;
  onReorder?: (section: QueueSection, from: number, to: number) => void;
  onRemove?: (section: QueueSection, index: number, track: QueueTrack) => void;
  onPlay?: (section: QueueSection, index: number, track: QueueTrack) => void;
  /** Tells the panel a drag is live, so its scroll view stops scrolling. */
  onDragActiveChange?: (active: boolean) => void;
  /** Called with the text to announce after a move. */
  onAnnounce?: (message: string) => void;
  /** Draw the direct remove button beside the menu. The `sheet` variant leaves it to the menu, for width. */
  removeButton?: boolean;
  testID?: string;
}

interface RowProps {
  track: QueueTrack;
  index: number;
  count: number;
  section: QueueSection;
  labels: QueuePanelLabels;
  paint: QueuePanelPaint;
  drag: DragState | null;
  target: number;
  move?: (from: number, to: number) => void;
  onRemove?: (section: QueueSection, index: number, track: QueueTrack) => void;
  onPlay?: (section: QueueSection, index: number, track: QueueTrack) => void;
  onDragStart: (index: number) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: (commit: boolean) => void;
  registerHandle: (id: string, node: View | null) => void;
  removeButton: boolean;
  testID?: string;
}

function QueueReorderRow({
  track,
  index,
  count,
  section,
  labels,
  paint,
  drag,
  target,
  move,
  onRemove,
  onPlay,
  onDragStart,
  onDragMove,
  onDragEnd,
  registerHandle,
  removeButton,
  testID,
}: RowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dragging = drag?.from === index;
  const canUp = index > 0;
  const canDown = index < count - 1;

  const latest = useRef({ index, onDragStart, onDragMove, onDragEnd, enabled: !!move });
  latest.current = { index, onDragStart, onDragMove, onDragEnd, enabled: !!move };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => latest.current.enabled,
        onMoveShouldSetPanResponder: () => latest.current.enabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => latest.current.onDragStart(latest.current.index),
        onPanResponderMove: (_e, g: PanResponderGestureState) => latest.current.onDragMove(g.dy),
        onPanResponderRelease: () => latest.current.onDragEnd(true),
        onPanResponderTerminate: () => latest.current.onDragEnd(false),
      }),
    [],
  );

  const onKeyDown = useCallback(
    (event: { key: string; preventDefault: () => void }) => {
      if (!move) return;
      if (event.key === 'ArrowUp' && canUp) {
        event.preventDefault();
        move(index, index - 1);
      } else if (event.key === 'ArrowDown' && canDown) {
        event.preventDefault();
        move(index, index + 1);
      }
    },
    [move, index, canUp, canDown],
  );

  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (!move) return;
      if (event.nativeEvent.actionName === 'moveUp' && canUp) move(index, index - 1);
      else if (event.nativeEvent.actionName === 'moveDown' && canDown) move(index, index + 1);
    },
    [move, index, canUp, canDown],
  );

  const offset = drag ? (dragging ? drag.dy : dragShift(index, drag.from, target, QUEUE_ROW_HEIGHT)) : 0;

  const liftStyle: WebCssStyle = {
    transform: [{ translateY: offset }],
    zIndex: dragging ? 1 : 0,
    borderRadius: 8,
    ...(dragging
      ? { backgroundColor: paint.dragSurface, boxShadow: paint.dragShadow }
      : null),
    ...(IS_WEB && drag && !dragging ? { transitionProperty: 'transform', transitionDuration: '120ms' } : null),
  };

  const title = track.title;
  const reveal = (children: React.ReactNode) => (
    <View {...webDataSet({ bloomQueueReveal: '' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {children}
    </View>
  );

  const trailing = reveal(
    <>
      {onRemove && removeButton ? (
        <QueueIconButton
          icon={RiCloseLine}
          accessibilityLabel={`${labels.remove}: ${title}`}
          onPress={() => onRemove(section, index, track)}
          testID={testID ? `${testID}-remove` : undefined}
        />
      ) : null}
      {move || onRemove ? (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild label={labels.moreOptions(title)}>
            <QueueIconButton
              icon={RiMoreFill}
              accessibilityLabel={labels.moreOptions(title)}
              testID={testID ? `${testID}-more` : undefined}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" label={labels.moreOptions(title)}>
            {move ? (
              <>
                <DropdownMenuItem
                  disabled={!canUp}
                  leading={<RiArrowUpLine width={16} height={16} fill={paint.textSecondary} />}
                  onPress={() => move(index, index - 1)}
                  testID={testID ? `${testID}-move-up` : undefined}
                >
                  {labels.moveUp}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canDown}
                  leading={<RiArrowDownLine width={16} height={16} fill={paint.textSecondary} />}
                  onPress={() => move(index, index + 1)}
                  testID={testID ? `${testID}-move-down` : undefined}
                >
                  {labels.moveDown}
                </DropdownMenuItem>
              </>
            ) : null}
            {move && onRemove ? <DropdownMenuSeparator /> : null}
            {onRemove ? (
              <DropdownMenuItem
                variant="destructive"
                leading={<RiDeleteBinLine width={16} height={16} fill={paint.textSecondary} />}
                onPress={() => onRemove(section, index, track)}
                testID={testID ? `${testID}-menu-remove` : undefined}
              >
                {labels.remove}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {move ? (
        <View
          ref={(node) => registerHandle(track.id, node)}
          {...panResponder.panHandlers}
          {...webDataSet({ bloomQueueHandle: '', bloomQueueFocusable: '' })}
          {...(IS_WEB ? { tabIndex: 0, onKeyDown } : null)}
          role="button"
          accessibilityLabel={labels.reorder(title)}
          accessibilityHint={labels.reorderHint}
          accessibilityActions={[
            { name: 'moveUp', label: labels.moveUp },
            { name: 'moveDown', label: labels.moveDown },
          ]}
          onAccessibilityAction={onAccessibilityAction}
          style={{ width: 24, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
          testID={testID ? `${testID}-handle` : undefined}
        >
          <RiDraggable width={16} height={16} fill={paint.textSecondary} />
        </View>
      ) : null}
    </>,
  );

  return (
    <View role="listitem" style={liftStyle}>
      <QueuePanelRow
        track={track}
        highlighted={menuOpen || dragging}
        webState={dragging ? 'dragging' : menuOpen ? 'active' : undefined}
        accessibilityLabel={`${labels.play} ${title}`}
        onPress={onPlay ? () => onPlay(section, index, track) : undefined}
        trailing={trailing}
        testID={testID}
      />
    </View>
  );
}

function QueueReorderListComponent({
  section,
  tracks,
  labels,
  onReorder,
  onRemove,
  onPlay,
  onDragActiveChange,
  onAnnounce,
  removeButton = true,
  testID,
}: QueueReorderListProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveQueuePanelPaint(theme), [theme]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const count = tracks.length;
  const target = drag ? dragTarget(drag.from, drag.dy, QUEUE_ROW_HEIGHT, count) : -1;

  const handles = useRef(new Map<string, View>());
  const pendingFocus = useRef<string | null>(null);
  const registerHandle = useCallback((id: string, node: View | null) => {
    if (node) handles.current.set(id, node);
    else handles.current.delete(id);
  }, []);

  // A keyboard move re-orders the DOM, which blurs the moved handle; put focus back.
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    const node = handles.current.get(id) as unknown as { focus?: () => void } | undefined;
    node?.focus?.();
  }, [tracks]);

  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  const move = useCallback(
    (from: number, to: number) => {
      const list = tracksRef.current;
      const track = list[from];
      if (!onReorder || !track || to < 0 || to >= list.length || to === from) return;
      pendingFocus.current = track.id;
      onReorder(section, from, to);
      onAnnounce?.(labels.moved(track.title, to + 1, list.length));
    },
    [onReorder, onAnnounce, labels, section],
  );

  const dragRef = useRef<DragState | null>(null);
  const onDragStart = useCallback(
    (index: number) => {
      dragRef.current = { from: index, dy: 0 };
      setDrag(dragRef.current);
      onDragActiveChange?.(true);
    },
    [onDragActiveChange],
  );
  const onDragMove = useCallback((dy: number) => {
    if (!dragRef.current) return;
    // The row travels no further than the first and last slot of its own section.
    const { from } = dragRef.current;
    const max = (tracksRef.current.length - 1 - from) * QUEUE_ROW_HEIGHT;
    const clamped = Math.min(max, Math.max(-from * QUEUE_ROW_HEIGHT, dy));
    dragRef.current = { ...dragRef.current, dy: clamped };
    setDrag(dragRef.current);
  }, []);
  const onDragEnd = useCallback(
    (commit: boolean) => {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      onDragActiveChange?.(false);
      if (!commit || !current) return;
      const to = dragTarget(current.from, current.dy, QUEUE_ROW_HEIGHT, tracksRef.current.length);
      if (to !== current.from) {
        pendingFocus.current = null;
        const track = tracksRef.current[current.from];
        onReorder?.(section, current.from, to);
        if (track) onAnnounce?.(labels.moved(track.title, to + 1, tracksRef.current.length));
      }
    },
    [onDragActiveChange, onReorder, onAnnounce, labels, section],
  );

  return (
    <View role="list" testID={testID}>
      {tracks.map((track, index) => (
        <QueueReorderRow
          key={track.id}
          track={track}
          index={index}
          count={count}
          section={section}
          labels={labels}
          paint={paint}
          drag={drag}
          target={target}
          move={onReorder ? move : undefined}
          onRemove={onRemove}
          onPlay={onPlay}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          registerHandle={registerHandle}
          removeButton={removeButton}
          testID={testID ? `${testID}-row-${index}` : undefined}
        />
      ))}
    </View>
  );
}

export const QueueReorderList = memo(QueueReorderListComponent);
QueueReorderList.displayName = 'QueueReorderList';
