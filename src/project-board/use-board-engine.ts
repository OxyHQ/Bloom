import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react';
import {
  AccessibilityInfo,
  Platform,
  type ScrollView,
  type View,
  type ViewStyle,
} from 'react-native';
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useMessages } from '../locale/messages';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { boardDropTarget, boardOccurrence, projectBoardMove } from './board-engine';
import type { BoardColumn, BoardMove } from './types';
import type { BoardRect } from './shared';

type Origin = { itemId: string; fromColumnId: string };
type Target = { columnId: string; index: number; beforeItemId?: string };
export interface BoardEngine<Item> {
  renderedColumns: readonly BoardColumn<Item>[];
  active: { item: Item; origin: Origin; pointer: boolean } | null;
  droppingKey: string | null;
  over: Target | null;
  origin: RefObject<Origin | null>;
  columnNodes: RefObject<Record<string, ComponentRef<typeof View> | null>>;
  itemNodes: RefObject<Record<string, ComponentRef<typeof View> | null>>;
  columnRects: RefObject<Record<string, BoardRect>>;
  itemRects: RefObject<Record<string, BoardRect>>;
  boardNode: RefObject<ComponentRef<typeof View> | null>;
  scrollView: RefObject<ComponentRef<typeof ScrollView> | null>;
  scrollX: RefObject<number>;
  columnScrolls: RefObject<Record<string, ComponentRef<typeof ScrollView> | null>>;
  columnScrollY: RefObject<Record<string, number>>;
  measure: () => void;
  overlayStyle: AnimatedStyle<ViewStyle>;
  beginDrag: (from: Origin, x: number, y: number) => void;
  dragOver: (x: number, y: number) => void;
  endDrag: (success: boolean) => void;
  nativeId: (columnId: string, itemId: string) => string;
  accessibleMove: (from: Origin, action: 'up' | 'down' | 'next' | 'previous') => void;
  suppressOpen: () => boolean;
  canMove: boolean;
  allowReorder: boolean;
}

/** The ProjectBoard interaction controller, shared by the template and controlled composition. */
export function useBoardEngine<Item>({
  columns,
  visibleColumns = columns,
  getItemId,
  getItemLabel = getItemId,
  onMove,
  readOnly = false,
  allowReorder = true,
  onBegin,
}: {
  columns: readonly BoardColumn<Item>[];
  visibleColumns?: readonly BoardColumn<Item>[];
  getItemId: (item: Item) => string;
  getItemLabel?: (item: Item) => string;
  onMove?: (move: BoardMove) => void;
  readOnly?: boolean;
  allowReorder?: boolean;
  onBegin?: () => void;
}): BoardEngine<Item> {
  const boardId = useId();
  const rtl = useIsRtl();
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const reducedMotion = useReducedMotion();
  const columnNodes = useRef<Record<string, ComponentRef<typeof View> | null>>({});
  const itemNodes = useRef<Record<string, ComponentRef<typeof View> | null>>({});
  const columnRects = useRef<Record<string, BoardRect>>({});
  const itemRects = useRef<Record<string, BoardRect>>({});
  const scrollView = useRef<ComponentRef<typeof ScrollView>>(null);
  const columnScrolls = useRef<Record<string, ComponentRef<typeof ScrollView> | null>>({});
  const scrollX = useRef(0);
  const columnScrollY = useRef<Record<string, number>>({});
  const boardNode = useRef<ComponentRef<typeof View>>(null);
  const boardRect = useRef<BoardRect | null>(null);
  const origin = useRef<Origin | null>(null);
  const targetRef = useRef<Target | null>(null);
  const keyboardActive = useRef(false);
  const lastDragEnd = useRef(0);
  const [active, setActive] = useState<{ item: Item; origin: Origin; pointer: boolean } | null>(
    null,
  );
  const [droppingKey, setDroppingKey] = useState<string | null>(null);
  const [over, setOver] = useState<Target | null>(null);
  const [preview, setPreview] = useState<BoardMove | null>(null);
  const renderedColumns = useMemo(
    () => projectBoardMove(visibleColumns, getItemId, preview),
    [visibleColumns, getItemId, preview],
  );
  const current = useRef({
    columns,
    renderedColumns,
    getItemId,
    getItemLabel,
    onMove,
    readOnly,
    allowReorder,
    onBegin,
  });
  current.current = {
    columns,
    renderedColumns,
    getItemId,
    getItemLabel,
    onMove,
    readOnly,
    allowReorder,
    onBegin,
  };
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const draggedWidth = useSharedValue(261);
  const fingerOffset = useRef({ x: 0, y: 0 });
  const dropFrame = useRef(0);
  const dropGeneration = useRef(0);
  useEffect(
    () => () => {
      dropGeneration.current++;
      if (dropFrame.current) cancelAnimationFrame(dropFrame.current);
      cancelAnimation(dragX);
      cancelAnimation(dragY);
      cancelAnimation(draggedWidth);
    },
    [dragX, dragY, draggedWidth],
  );
  const finishDrop = useCallback((generation?: number) => {
    if (generation !== undefined && generation !== dropGeneration.current) return;
    setActive(null);
    setDroppingKey(null);
  }, []);
  const overlayStyle = useAnimatedStyle(
    () => ({
      position: 'absolute',
      left: dragX.value,
      top: dragY.value,
      width: draggedWidth.value,
    }),
    [dragX, dragY, draggedWidth],
  );
  const measure = useCallback(() => {
    for (const [id, node] of Object.entries(columnNodes.current)) {
      if (!node) {
        delete columnRects.current[id];
        continue;
      }
      node.measureInWindow((x, y, width, height) => {
        columnRects.current[id] = { x, y, width, height };
      });
    }
    for (const [id, node] of Object.entries(itemNodes.current)) {
      if (!node) {
        delete itemRects.current[id];
        continue;
      }
      node.measureInWindow((x, y, width, height) => {
        itemRects.current[id] = { x, y, width, height };
      });
    }
    boardNode.current?.measureInWindow((x, y, width, height) => {
      boardRect.current = { x, y, width, height };
    });
  }, []);
  const validOrigin = useCallback((from: Origin) => {
    const state = current.current;
    if (state.readOnly || !state.onMove) return null;
    const item = state.columns
      .find((column) => column.id === from.fromColumnId)
      ?.items.find((item) => state.getItemId(item) === from.itemId);
    return item === undefined ? null : { item };
  }, []);
  const moveFor = useCallback(
    (from: Origin, target: Target): BoardMove | null => {
      const state = current.current;
      if (!validOrigin(from) || (!state.allowReorder && from.fromColumnId === target.columnId))
        return null;
      const destination = state.columns.find((column) => column.id === target.columnId);
      if (!destination) return null;
      const items = destination.items.filter((item) => state.getItemId(item) !== from.itemId);
      const index = target.beforeItemId
        ? items.findIndex((item) => state.getItemId(item) === target.beforeItemId)
        : items.length;
      return {
        ...from,
        toColumnId: target.columnId,
        toIndex: index < 0 ? items.length : index,
        beforeItemId: target.beforeItemId,
      };
    },
    [validOrigin],
  );
  const setTarget = useCallback(
    (target: Target | null) => {
      targetRef.current = target;
      setOver(target);
      // Preserve the template's insertion marker for same-column pointer moves.
      // Keyboard moves and cross-column pointers preview their projected layout.
      const from = origin.current;
      setPreview(
        from && target && (keyboardActive.current || target.columnId !== from.fromColumnId)
          ? moveFor(from, target)
          : null,
      );
    },
    [moveFor],
  );
  const begin = useCallback(
    (from: Origin, pointer: boolean, x = 0, y = 0) => {
      const found = validOrigin(from);
      if (!found || origin.current) return;
      const { item } = found;
      measure();
      const rect = itemRects.current[boardOccurrence(from.fromColumnId, from.itemId)];
      origin.current = from;
      keyboardActive.current = !pointer;
      dropGeneration.current++;
      cancelAnimation(dragX);
      cancelAnimation(dragY);
      cancelAnimation(draggedWidth);
      if (dropFrame.current) cancelAnimationFrame(dropFrame.current);
      setDroppingKey(null);
      fingerOffset.current = { x: rect ? x - rect.x : 0, y: rect ? y - rect.y : 0 };
      dragX.value = rect?.x ?? x;
      dragY.value = rect?.y ?? y;
      draggedWidth.value = rect?.width ?? 261;
      current.current.onBegin?.();
      setActive({ item, origin: from, pointer });
      if (!pointer)
        AccessibilityInfo.announceForAccessibility?.(
          `${current.current.getItemLabel(item)}, ${m.keyboardHint}`,
        );
    },
    [validOrigin, measure, dragX, dragY, draggedWidth, m.keyboardHint],
  );
  const dragOver = useCallback(
    (x: number, y: number) => {
      if (!origin.current) return;
      dragX.value = x - fingerOffset.current.x;
      dragY.value = y - fingerOffset.current.y;
      const state = current.current;
      const next = boardDropTarget(
        x,
        y,
        state.renderedColumns,
        columnRects.current,
        itemRects.current,
        state.getItemId,
        origin.current,
      );
      if (
        next?.columnId !== targetRef.current?.columnId ||
        next?.index !== targetRef.current?.index ||
        next?.beforeItemId !== targetRef.current?.beforeItemId
      )
        setTarget(next);
      const board = boardRect.current;
      if (board && (x < board.x + 32 || x > board.x + board.width - 32)) {
        scrollX.current = Math.max(0, scrollX.current + (x < board.x + 32 ? -12 : 12));
        scrollView.current?.scrollTo({ x: scrollX.current, animated: false });
      }
      const rect = next && columnRects.current[next.columnId];
      if (next && rect && (y < rect.y + 56 || y > rect.y + rect.height - 32)) {
        const scroll = Math.max(
          0,
          (columnScrollY.current[next.columnId] ?? 0) + (y < rect.y + 56 ? -10 : 10),
        );
        columnScrollY.current[next.columnId] = scroll;
        columnScrolls.current[next.columnId]?.scrollTo({ y: scroll, animated: false });
      }
    },
    [dragX, dragY, setTarget],
  );
  const endDrag = useCallback(
    (success: boolean) => {
      const from = origin.current;
      if (!from) return;
      const move = success && targetRef.current ? moveFor(from, targetRef.current) : null;
      const wasKeyboard = keyboardActive.current;
      const landingKey = boardOccurrence(move?.toColumnId ?? from.fromColumnId, from.itemId);
      if (move) {
        current.current.onMove?.(move);
        AccessibilityInfo.announceForAccessibility?.(
          current.current.columns.find((column) => column.id === move.toColumnId)?.title ??
            move.toColumnId,
        );
      }
      origin.current = null;
      keyboardActive.current = false;
      lastDragEnd.current = Date.now();
      setTarget(null);
      if (wasKeyboard || reducedMotion) {
        finishDrop();
        if (wasKeyboard)
          requestAnimationFrame(() => {
            if (Platform.OS === 'web' && typeof document !== 'undefined') {
              document.getElementById(`${boardId}-${landingKey}`)?.focus();
            } else {
              itemNodes.current[landingKey]?.focus?.();
            }
          });
        return;
      }
      setDroppingKey(landingKey);
      const generation = ++dropGeneration.current;
      dropFrame.current = requestAnimationFrame(() => {
        const node = itemNodes.current[landingKey];
        if (!node) {
          finishDrop(generation);
          return;
        }
        node.measureInWindow((x, y, width) => {
          if (generation !== dropGeneration.current) return;
          if (![x, y, width].every(Number.isFinite) || width <= 0) {
            finishDrop(generation);
            return;
          }
          const config = { duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1) };
          dragX.value = withTiming(x, config);
          draggedWidth.value = withTiming(width, config);
          dragY.value = withTiming(y, config, (finished) => {
            if (finished) runOnJS(finishDrop)(generation);
          });
        });
      });
    },
    [moveFor, setTarget, reducedMotion, finishDrop, dragX, dragY, draggedWidth, boardId],
  );
  // Revoked permissions, removed source occurrences and removed destinations cancel previews.
  useEffect(() => {
    if (
      origin.current &&
      (!validOrigin(origin.current) ||
        (targetRef.current && !columns.some((column) => column.id === targetRef.current?.columnId)))
    )
      endDrag(false);
  }, [columns, readOnly, onMove, validOrigin, endDrag]);
  const keyboardMove = useCallback(
    (from: Origin, key: string) => {
      if (key === ' ' && !keyboardActive.current) {
        begin(from, false);
        return;
      }
      if (!keyboardActive.current || !origin.current) return;
      if (key === 'Escape' || key === ' ') {
        endDrag(key === ' ');
        return;
      }
      const state = current.current;
      const sourceId = targetRef.current?.columnId ?? from.fromColumnId;
      const shown = state.renderedColumns;
      const sourceIndex = shown.findIndex((column) => column.id === sourceId);
      const source = shown[sourceIndex];
      if (!source) return;
      const index = source.items.findIndex((item) => state.getItemId(item) === from.itemId);
      const horizontalKey = rtl
        ? key === 'ArrowLeft'
          ? 'ArrowRight'
          : key === 'ArrowRight'
            ? 'ArrowLeft'
            : key
        : key;
      const destination =
        horizontalKey === 'ArrowLeft'
          ? shown[sourceIndex - 1]
          : horizontalKey === 'ArrowRight'
            ? shown[sourceIndex + 1]
            : source;
      if (!destination || (!state.allowReorder && destination.id === source.id)) return;
      const items = destination.items.filter((item) => state.getItemId(item) !== from.itemId);
      const position =
        destination.id !== source.id
          ? Math.min(Math.max(index, 0), items.length)
          : key === 'ArrowUp'
            ? Math.max(0, index - 1)
            : Math.min(items.length, index + 1);
      setTarget({
        columnId: destination.id,
        index: position,
        beforeItemId: items[position] ? state.getItemId(items[position]) : undefined,
      });
      AccessibilityInfo.announceForAccessibility?.(`${destination.title}, ${position + 1}`);
    },
    [begin, endDrag, rtl, setTarget],
  );
  const keyboardHandler = useRef(keyboardMove);
  keyboardHandler.current = keyboardMove;
  const nativeId = useCallback(
    (columnId: string, itemId: string) => `${boardId}-${boardOccurrence(columnId, itemId)}`,
    [boardId],
  );
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (
        keyboardActive.current &&
        origin.current &&
        [' ', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        event.preventDefault();
        event.stopPropagation();
        keyboardHandler.current(origin.current, event.key);
        return;
      }
      if (event.key !== ' ' || current.current.readOnly || !current.current.onMove) return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"], [role="checkbox"], [role="combobox"], [role="switch"]',
        )
      )
        return;
      const nodeId = event.target instanceof Element ? event.target.closest('[id]')?.id : undefined;
      for (const column of current.current.columns)
        for (const item of column.items) {
          const itemId = current.current.getItemId(item);
          if (nativeId(column.id, itemId) === nodeId) {
            event.preventDefault();
            event.stopPropagation();
            keyboardHandler.current({ itemId, fromColumnId: column.id }, event.key);
            return;
          }
        }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [nativeId]);
  const accessibleMove = useCallback(
    (from: Origin, action: 'up' | 'down' | 'next' | 'previous') => {
      const state = current.current;
      if (!validOrigin(from)) return;
      const shown = state.renderedColumns;
      const sourceIndex = shown.findIndex((column) => column.id === from.fromColumnId);
      const source = shown[sourceIndex];
      const destination =
        action === 'next'
          ? shown[sourceIndex + 1]
          : action === 'previous'
            ? shown[sourceIndex - 1]
            : source;
      if (!source || !destination || (!state.allowReorder && destination.id === source.id)) return;
      const items = destination.items.filter((item) => state.getItemId(item) !== from.itemId);
      const index = source.items.findIndex((item) => state.getItemId(item) === from.itemId);
      const position =
        source === destination
          ? Math.max(0, Math.min(items.length, index + (action === 'up' ? -1 : 1)))
          : 0;
      const move = moveFor(from, {
        columnId: destination.id,
        index: position,
        beforeItemId: items[position] ? state.getItemId(items[position]) : undefined,
      });
      if (move) state.onMove?.(move);
    },
    [validOrigin, moveFor],
  );
  const suppressOpen = useCallback(
    () => !!origin.current || Date.now() - lastDragEnd.current < 350,
    [],
  );
  return {
    renderedColumns,
    active,
    droppingKey,
    over,
    origin,
    columnNodes,
    itemNodes,
    columnRects,
    itemRects,
    boardNode,
    scrollView,
    scrollX,
    columnScrolls,
    columnScrollY,
    measure,
    overlayStyle,
    beginDrag: (from: Origin, x: number, y: number) => begin(from, true, x, y),
    dragOver,
    endDrag,
    nativeId,
    accessibleMove,
    suppressOpen,
    canMove: !readOnly && !!onMove,
    allowReorder,
  };
}
