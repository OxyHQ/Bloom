import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type KeyDownEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';
import { moveItem } from '../hooks/list-reorder';
import { useMessages } from '../locale/messages';
import { SORTABLE_CHIP_ROW_MESSAGES } from './messages';
import { nearestChipIndex, type ChipRect } from './reorder';
import type { SortableChipItem, SortableChipRowProps } from './types';

/** Pointer travel (px) before a press becomes a drag, so taps still reach the chip. */
const DRAG_THRESHOLD = 6;
const GAP = 8;
const NO_RECT: ChipRect = { x: 0, y: 0, width: 0, height: 0 };

/**
 * A reorderable row of chips, wrapped as the profile's links are. Press and
 * drag a chip to move it (past a small threshold, so a tap still opens it);
 * the arrow keys on web and the screen reader's "move earlier / later" actions
 * move it by one. Only the order changes: the caller keeps the chips' data.
 */
export function SortableChipRow({
  items,
  onReorder,
  trailing,
  onDragStateChange,
  disabled = false,
  accessibilityLabel,
  testID,
}: SortableChipRowProps) {
  const { messages } = useMessages(SORTABLE_CHIP_ROW_MESSAGES);
  const keys = useMemo(() => items.map((item) => item.key), [items]);
  const rects = useRef(new Map<string, ChipRect>());
  const [drag, setDrag] = useState<{ key: string; dx: number; dy: number } | null>(null);
  const dragging = useRef<{ key: string; origin: ChipRect; over: number } | null>(null);

  const commit = useCallback(
    (from: number, to: number) => {
      if (from < 0 || to === from) return;
      onReorder(moveItem(keys, from, to));
    },
    [keys, onReorder],
  );

  const moveBy = useCallback(
    (key: string, delta: -1 | 1) => {
      const from = keys.indexOf(key);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= keys.length) return;
      commit(from, to);
    },
    [keys, commit],
  );

  const startDrag = useCallback(
    (key: string) => {
      const origin = rects.current.get(key);
      if (!origin || disabled) return;
      dragging.current = { key, origin, over: keys.indexOf(key) };
      setDrag({ key, dx: 0, dy: 0 });
      onDragStateChange?.(true);
    },
    [disabled, keys, onDragStateChange],
  );

  const moveDrag = useCallback(
    (dx: number, dy: number) => {
      const current = dragging.current;
      if (!current) return;
      const centreX = current.origin.x + current.origin.width / 2 + dx;
      const centreY = current.origin.y + current.origin.height / 2 + dy;
      current.over = nearestChipIndex(
        keys.map((key) => rects.current.get(key) ?? NO_RECT),
        centreX,
        centreY,
      );
      setDrag({ key: current.key, dx, dy });
    },
    [keys],
  );

  const endDrag = useCallback(() => {
    const current = dragging.current;
    dragging.current = null;
    setDrag(null);
    if (!current) return;
    commit(keys.indexOf(current.key), current.over);
    onDragStateChange?.(false);
  }, [keys, commit, onDragStateChange]);

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: GAP }}
    >
      {items.map((item) => (
        <ChipSlot
          key={item.key}
          item={item}
          disabled={disabled}
          moveEarlierLabel={messages.moveEarlier(item.label)}
          moveLaterLabel={messages.moveLater(item.label)}
          isDragging={drag?.key === item.key}
          dx={drag?.key === item.key ? drag.dx : 0}
          dy={drag?.key === item.key ? drag.dy : 0}
          onLayoutRect={(rect) => rects.current.set(item.key, rect)}
          onDragStart={() => startDrag(item.key)}
          onDragMove={moveDrag}
          onDragEnd={endDrag}
          onMoveBy={(delta) => moveBy(item.key, delta)}
        />
      ))}
      {trailing}
    </View>
  );
}

interface ChipSlotProps {
  item: SortableChipItem;
  disabled: boolean;
  moveEarlierLabel: string;
  moveLaterLabel: string;
  isDragging: boolean;
  dx: number;
  dy: number;
  onLayoutRect: (rect: ChipRect) => void;
  onDragStart: () => void;
  onDragMove: (dx: number, dy: number) => void;
  onDragEnd: () => void;
  onMoveBy: (delta: -1 | 1) => void;
}

/**
 * One chip's slot. The pan handlers read the latest callbacks through a ref,
 * so the responder made once never goes stale as the order changes.
 */
const ChipSlot = memo(function ChipSlot(props: ChipSlotProps) {
  const latest = useRef(props);
  latest.current = props;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_event: GestureResponderEvent, gesture) =>
          !latest.current.disabled && Math.abs(gesture.dx) + Math.abs(gesture.dy) > DRAG_THRESHOLD,
        onPanResponderGrant: () => latest.current.onDragStart(),
        onPanResponderMove: (_event, gesture: PanResponderGestureState) =>
          latest.current.onDragMove(gesture.dx, gesture.dy),
        onPanResponderRelease: () => latest.current.onDragEnd(),
        onPanResponderTerminate: () => latest.current.onDragEnd(),
      }),
    [],
  );

  const { item, disabled, isDragging, dx, dy, moveEarlierLabel, moveLaterLabel } = props;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    props.onLayoutRect({ x, y, width, height });
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (disabled) return;
    if (event.nativeEvent.actionName === 'moveEarlier') props.onMoveBy(-1);
    if (event.nativeEvent.actionName === 'moveLater') props.onMoveBy(1);
  };

  const handleKeyDown = (event: KeyDownEvent) => {
    if (disabled) return;
    const key = event.nativeEvent.key;
    if (key === 'ArrowLeft' || key === 'ArrowUp') props.onMoveBy(-1);
    if (key === 'ArrowRight' || key === 'ArrowDown') props.onMoveBy(1);
  };

  return (
    <View
      {...responder.panHandlers}
      testID={`sortable-chip-${item.key}`}
      onLayout={handleLayout}
      onKeyDown={handleKeyDown}
      focusable={!disabled}
      accessibilityActions={
        disabled
          ? []
          : [
              { name: 'moveEarlier', label: moveEarlierLabel },
              { name: 'moveLater', label: moveLaterLabel },
            ]
      }
      onAccessibilityAction={handleAccessibilityAction}
      style={{
        opacity: isDragging ? 0.85 : 1,
        transform: [{ translateX: dx }, { translateY: dy }],
        zIndex: isDragging ? 10 : 0,
      }}
    >
      {item.node}
    </View>
  );
});
