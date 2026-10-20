import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type KeyDownEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useControllableState } from '../hooks/use-controllable-state';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { IS_WEB } from '../styles/platform';
import { SIDEBAR_MESSAGES } from './messages';
import type { SidebarPalette } from './palette';
import { SidebarFolder } from './SidebarFolder';
import {
  useMeasureInWindow,
  useTreeDrag,
  useTreeDragging,
  useTreeRowDrag,
  useTreeSectionDrop,
  type TreeDragApi,
} from './SidebarTreeDrag';
import { dropPositionAt, isExpandable, sectionKey, treeMoves, type TreeMove } from './tree';
import type { SidebarTree, SidebarTreeDrop, SidebarTreeFolder, SidebarTreeItem } from './types';

const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.2, 1);
/** One level of nesting: a row's content starts this much further in than its parent's. */
export const TREE_INDENT = 16;
/** The disclosure's square, and the lane every row of a nesting section keeps for it. */
const DISCLOSURE = 20;
/** Long enough that a press opens the row and a swipe still scrolls the sidebar. */
const LIFT_AFTER_MS = 350;
const DRAG_MIME = 'application/x-bloom-sidebar-row';

type TreePress = (item: SidebarTreeItem, folder?: SidebarTreeFolder) => void;

/**
 * One labelled section of the sidebar's tree.
 *
 *   label     body-medium text-secondary, its `actions` at the end. A
 *             `collapsible` section's label is a disclosure (16px chevron,
 *             turning 90° open) that shows and hides the rows (300ms).
 *   status    `loading` / `error` (an alert, in the danger role) / `emptyLabel`,
 *             body-regular, inset 8, in place of rows.
 *   rows      2 apart: direct rows (any depth), then folders 4 apart.
 *
 * A row: radius full, py 5, inset 8 plus 16 per level. In a section where any
 * row nests, every row keeps a 20px lane for the disclosure (a chevron that
 * turns 90° open) so labels align; then the icon or `leading` (20px box, gap
 * 8), the label (body-medium text-secondary, truncating) and the `meta` chip.
 * Hover and selection fill the whole line with background-secondary-hover; the
 * actions sit inside it, at the end, never in the row's press target. Children
 * ease open and shut (300ms) and are only mounted while shown.
 */
export const SidebarTreeSection = memo(function SidebarTreeSection({
  section,
  items,
  folders,
  searching,
  nests,
  selectedTreeItem,
  onTreeItemPress,
  palette,
}: {
  section: SidebarTree;
  /** Its rows after quick search. */
  items: ReadonlyArray<SidebarTreeItem>;
  folders: ReadonlyArray<SidebarTreeFolder>;
  /** A query is set: every row with matches is held open. */
  searching: boolean;
  /** Any row of the section nests, so every row keeps the disclosure lane. */
  nests: boolean;
  selectedTreeItem?: string;
  onTreeItemPress?: TreePress;
  palette: SidebarPalette;
}) {
  const common = useCommonMessages();
  const key = sectionKey(section);
  const [open, setOpen] = useControllableState<boolean>({
    value: section.open,
    defaultValue: section.defaultOpen ?? true,
    onChange: section.onOpenChange,
  });
  const shown = !section.collapsible || open || searching;
  const hasRows = items.length > 0 || folders.length > 0;
  const status = section.loading ? (
    <Text variant="body-regular" style={[statusStyle, { color: palette.textTertiary }]}>
      {`${common.loading}…`}
    </Text>
  ) : section.error ? (
    <Text
      variant="body-regular"
      role="alert"
      accessibilityLiveRegion="polite"
      style={[statusStyle, { color: palette.menu.destructive }]}
    >
      {section.error}
    </Text>
  ) : !hasRows && section.emptyLabel ? (
    <Text variant="body-regular" style={[statusStyle, { color: palette.textTertiary }]}>
      {section.emptyLabel}
    </Text>
  ) : null;

  return (
    <View testID={`sidebar-section-${key}`} style={{ width: '100%', gap: 10 }}>
      <SectionLabel
        section={section}
        open={shown}
        onToggle={section.collapsible ? () => setOpen(!open) : undefined}
        palette={palette}
      />
      <Reveal open={shown}>
        <View
          role="navigation"
          accessibilityLabel={section.label}
          style={{ width: '100%', gap: 4 }}
        >
          {status}
          {items.length > 0 ? (
            <View style={{ width: '100%', gap: 2 }}>
              {items.map((item) => (
                <TreeRow
                  key={item.key}
                  item={item}
                  depth={0}
                  section={section}
                  nests={nests}
                  searching={searching}
                  selectedTreeItem={selectedTreeItem}
                  onTreeItemPress={onTreeItemPress}
                  palette={palette}
                />
              ))}
            </View>
          ) : null}
          {folders.map((folder) => (
            <SidebarFolder
              key={folder.key}
              folder={folder}
              forceOpen={searching}
              selectedItem={selectedTreeItem}
              onItemPress={onTreeItemPress}
              testID={`sidebar-folder-${folder.key}`}
            />
          ))}
        </View>
      </Reveal>
    </View>
  );
});

const statusStyle = { paddingLeft: 8, paddingRight: 8 };

function SectionLabel({
  section,
  open,
  onToggle,
  palette,
}: {
  section: SidebarTree;
  open: boolean;
  onToggle?: () => void;
  palette: SidebarPalette;
}) {
  const key = sectionKey(section);
  const drag = useTreeDrag();
  const dropHere = useTreeSectionDrop(key);
  const ref = useRef<ComponentRef<typeof View>>(null);
  const measure = useMeasureInWindow(ref);
  const accepts = drag != null && section.droppable !== false;
  useEffect(() => {
    if (!accepts || !drag || IS_WEB) return;
    return drag.register(`section:${key}`, { section: key, measure, inside: true, beside: false });
  }, [accepts, drag, key, measure]);
  useWebDropTarget(ref, accepts ? drag : null, (_fraction) => ({
    section: key,
    position: 'inside',
  }));

  const label = (
    <Text
      variant="body-medium"
      numberOfLines={1}
      style={{ color: palette.textSecondary, flexShrink: 1 }}
    >
      {section.label}
    </Text>
  );
  return (
    <View
      ref={ref}
      {...(IS_WEB ? { dataSet: { bloomSidebarRow: section.actionsVisibility ?? 'always' } } : {})}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderRadius: borderRadius.full,
        ...(dropHere ? { boxShadow: `inset 0 0 0 2px ${palette.ring}` } : null),
      }}
      testID={`sidebar-tree-label-${key}`}
    >
      {onToggle ? (
        <Pressable
          {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' } } : {})}
          role="button"
          accessibilityLabel={section.label}
          aria-expanded={open}
          accessibilityState={{ expanded: open }}
          onPress={onToggle}
          style={
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              minWidth: 0,
              flexShrink: 1,
              borderRadius: 6,
              '--bloom-sidebar-ring': palette.ring,
            } as WebCssStyle
          }
        >
          {label}
          <Chevron open={open} size={16} color={palette.textTertiary} />
        </Pressable>
      ) : (
        label
      )}
      {section.actions != null ? (
        <View
          {...(IS_WEB ? { dataSet: { bloomSidebarRowActions: 'true' } } : {})}
          style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}
        >
          {section.actions}
        </View>
      ) : null}
    </View>
  );
}

function Chevron({ open, size, color }: { open: boolean; size: number; color: string }) {
  const rtl = useIsRtl();
  const reducedMotion = useReducedMotion();
  const turn = useSharedValue(open ? 90 : 0);
  // The glyph points to the END edge; under RTL it is mirrored, and so is its turn.
  const sign = rtl ? -1 : 1;
  useEffect(() => {
    const target = open ? 90 : 0;
    turn.value = reducedMotion
      ? target
      : withTiming(target, { duration: 200, easing: EASE_IN_OUT });
  }, [open, reducedMotion, turn]);
  const style = useAnimatedStyle(
    () => ({ transform: [{ scaleX: sign }, { rotate: `${turn.value * sign}deg` }] }),
    [turn, sign],
  );
  return (
    <Animated.View style={style}>
      <RiArrowRightSLine width={size} height={size} fill={color} />
    </Animated.View>
  );
}

/**
 * Shows and hides its children: height and opacity ease together (300ms), and
 * once shut the children unmount, so a closed branch of a large tree costs
 * nothing.
 */
function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(open ? 1 : 0);
  const height = useSharedValue(0);
  useEffect(() => {
    if (open) setMounted(true);
    const target = open ? 1 : 0;
    if (reducedMotion) {
      progress.value = target;
      if (!open) setMounted(false);
      return;
    }
    progress.value = withTiming(target, { duration: 300, easing: EASE_IN_OUT }, (finished) => {
      if (finished && target === 0) runOnJS(setMounted)(false);
    });
  }, [open, reducedMotion, progress]);
  const clip = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      height: progress.value >= 1 || height.value === 0 ? 'auto' : height.value * progress.value,
    }),
    [progress, height],
  );
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      height.value = event.nativeEvent.layout.height;
    },
    [height],
  );
  if (!mounted) return null;
  return (
    <Animated.View
      aria-hidden={!open}
      pointerEvents={open ? 'auto' : 'none'}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      {...(IS_WEB && !open ? { inert: true } : {})}
      style={[{ overflow: 'hidden' }, clip]}
    >
      <View onLayout={onLayout}>{children}</View>
    </Animated.View>
  );
}

/**
 * A web drop target: the HTML drag events on `ref`'s node, turned into hovers
 * on the engine. `at(fraction)` names the place a pointer at that fraction of
 * the node's height means.
 */
function useWebDropTarget(
  ref: React.RefObject<ComponentRef<typeof View> | null>,
  drag: TreeDragApi | null,
  at: (fraction: number) => {
    key?: string;
    section: string;
    position: SidebarTreeDrop['position'];
  },
) {
  const latest = useRef(at);
  latest.current = at;
  useEffect(() => {
    if (!IS_WEB || !drag) return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const hoverAt = (event: DragEvent) => {
      const source = drag.getState().dragging;
      if (!source) return null;
      const rect = node.getBoundingClientRect();
      const hover = latest.current((event.clientY - rect.top) / Math.max(1, rect.height));
      return drag.resolve(source, hover) ? hover : null;
    };
    const onOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes(DRAG_MIME)) return;
      const hover = hoverAt(event);
      if (!hover) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'move';
      drag.setHover(hover);
    };
    const onLeave = (event: DragEvent) => {
      if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return;
      const hover = drag.getState().hover;
      const mine = latest.current(0);
      if (hover && hover.key === mine.key && hover.section === mine.section) drag.setHover(null);
    };
    const onDrop = (event: DragEvent) => {
      const hover = hoverAt(event);
      const source = drag.getState().dragging;
      event.preventDefault();
      event.stopPropagation();
      drag.setDragging(null);
      if (!hover || !source) return;
      const resolved = drag.resolve(source, hover);
      if (resolved) drag.commit(resolved);
    };
    node.addEventListener('dragover', onOver);
    node.addEventListener('dragleave', onLeave);
    node.addEventListener('drop', onDrop);
    return () => {
      node.removeEventListener('dragover', onOver);
      node.removeEventListener('dragleave', onLeave);
      node.removeEventListener('drop', onDrop);
    };
  }, [drag, ref]);
}

const MOVE_KEYS: Record<string, TreeMove> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowRight: 'in',
  ArrowLeft: 'out',
};

const TreeRow = memo(function TreeRow({
  item,
  depth,
  section,
  nests,
  searching,
  selectedTreeItem,
  onTreeItemPress,
  palette,
}: {
  item: SidebarTreeItem;
  depth: number;
  section: SidebarTree;
  nests: boolean;
  searching: boolean;
  selectedTreeItem?: string;
  onTreeItemPress?: TreePress;
  palette: SidebarPalette;
}) {
  const { messages } = useMessages(SIDEBAR_MESSAGES);
  const rtl = useIsRtl();
  const drag = useTreeDrag();
  const anyDragging = useTreeDragging();
  const { dragging, indicator } = useTreeRowDrag(item.key);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useControllableState<boolean>({
    value: item.open,
    defaultValue: item.defaultOpen ?? false,
    onChange: item.onOpenChange,
  });
  const expandable = isExpandable(item);
  const children = item.items ?? [];
  const expanded = expandable && (open || (searching && children.length > 0));
  const selected = item.selected ?? item.key === selectedTreeItem;
  const canDrag = drag != null && item.draggable === true;
  const accepts =
    drag != null &&
    section.droppable !== false &&
    (item.droppable !== false || item.dropBeside !== false);
  const insideAllowed = item.droppable !== false;
  const besideAllowed = item.dropBeside !== false;
  const key = sectionKey(section);

  const ref = useRef<ComponentRef<typeof View>>(null);
  const measure = useMeasureInWindow(ref);
  useEffect(() => {
    if (!accepts || !drag || IS_WEB) return;
    return drag.register(`row:${item.key}`, {
      key: item.key,
      section: key,
      measure,
      inside: insideAllowed,
      beside: besideAllowed,
    });
  }, [accepts, drag, item.key, key, measure, insideAllowed, besideAllowed]);
  useWebDropTarget(ref, accepts ? drag : null, (fraction) => ({
    key: item.key,
    section: key,
    position: dropPositionAt(fraction, insideAllowed, besideAllowed),
  }));

  // Web: the row is an HTML drag source.
  useEffect(() => {
    if (!IS_WEB || !canDrag || !drag) return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node?.setAttribute) return;
    node.setAttribute('draggable', 'true');
    const onStart = (event: DragEvent) => {
      if (!event.dataTransfer) return;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(DRAG_MIME, item.key);
      drag.setDragging(item.key);
    };
    const onEnd = () => drag.setDragging(null);
    node.addEventListener('dragstart', onStart);
    node.addEventListener('dragend', onEnd);
    return () => {
      node.removeAttribute('draggable');
      node.removeEventListener('dragstart', onStart);
      node.removeEventListener('dragend', onEnd);
    };
  }, [canDrag, drag, item.key]);

  // Keyboard (web) and accessibility actions (native): the same four moves.
  const moves = canDrag && drag ? treeMoves(drag.places(), item.key) : {};
  const moveLabels: Record<TreeMove, string> = {
    up: messages.moveUp,
    down: messages.moveDown,
    in: messages.moveIn,
    out: messages.moveOut,
  };
  const accessibilityActions = canDrag
    ? (Object.keys(moves) as TreeMove[]).map((move) => ({ name: move, label: moveLabels[move] }))
    : undefined;
  const runMove = (move: TreeMove) => {
    const drop = moves[move];
    if (drop && drag) drag.commit(drop);
  };

  const lift = useSharedValue(0);
  const lifted = useAnimatedStyle(
    () => ({ transform: [{ translateY: lift.value }], zIndex: lift.value === 0 ? 0 : 1 }),
    [lift],
  );
  const onLongPress = item.onLongPress;
  const begin = useCallback((rowKey: string) => drag?.begin(rowKey), [drag]);
  const move = useCallback((y: number) => drag?.move(y), [drag]);
  const end = useCallback(
    (success: boolean, still: boolean) => {
      drag?.end(success && !still);
      // Lifted and let go where it was: the long press the row also offers.
      if (still) onLongPress?.();
    },
    [drag, onLongPress],
  );
  // A worklet copies what it reads to the UI runtime: the key, never the row
  // (its `actions` and `leading` are the app's elements — `worklet-captures.test.ts`).
  const rowKey = item.key;
  const pan = Gesture.Pan()
    .enabled(canDrag && !IS_WEB)
    .activateAfterLongPress(LIFT_AFTER_MS)
    .onStart(() => {
      runOnJS(begin)(rowKey);
    })
    .onUpdate((event) => {
      lift.value = event.translationY;
      runOnJS(move)(event.absoluteY);
    })
    .onFinalize((event, success) => {
      lift.value = withTiming(0, { duration: 120 });
      runOnJS(end)(success, Math.abs(event.translationY) < 4);
    });

  const onPress = (event: GestureResponderEvent) => {
    if (anyDragging) return;
    item.onPrefetch?.();
    item.onPress?.();
    if (!onTreeItemPress) return;
    if (IS_WEB && item.href) event.preventDefault();
    onTreeItemPress(item, undefined);
  };

  const inset = 8 + depth * TREE_INDENT;
  const Icon = item.icon;
  const row = (
    <View
      ref={ref}
      collapsable={false}
      {...(IS_WEB ? { dataSet: { bloomSidebarRow: item.actionsVisibility ?? 'always' } } : {})}
      onPointerEnter={() => {
        item.onPrefetch?.();
        if (IS_WEB) setHovered(true);
      }}
      onPointerLeave={IS_WEB ? () => setHovered(false) : undefined}
      onTouchStart={item.onPrefetch}
      style={{
        position: 'relative',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.full,
        // With a disclosure lane the inset comes before it; without one it is
        // part of the row's press target, as a folder's row is.
        paddingInlineStart: nests ? inset : 0,
        paddingInlineEnd: item.actions != null ? 4 : 0,
        backgroundColor:
          indicator === 'inside'
            ? palette.tertiaryHover
            : selected || hovered
              ? palette.rowHover
              : 'transparent',
        opacity: dragging && IS_WEB ? 0.5 : 1,
      }}
      testID={`sidebar-tree-row-${item.key}`}
    >
      {nests ? (
        expandable ? (
          <Pressable
            {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' } } : {})}
            role="button"
            accessibilityLabel={
              expanded ? messages.collapseRow(item.label) : messages.expandRow(item.label)
            }
            aria-expanded={expanded}
            accessibilityState={{ expanded }}
            onPress={() => setOpen(!open)}
            hitSlop={4}
            style={
              {
                width: DISCLOSURE,
                height: DISCLOSURE,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                marginInlineEnd: 4,
                '--bloom-sidebar-ring': palette.ring,
              } as WebCssStyle
            }
            testID={`sidebar-tree-disclosure-${item.key}`}
          >
            <Chevron open={expanded} size={16} color={palette.textTertiary} />
          </Pressable>
        ) : (
          <View style={{ width: DISCLOSURE + 4, flexShrink: 0 }} />
        )
      ) : null}
      <Pressable
        {...(IS_WEB
          ? {
              dataSet: { bloomSidebar: 'ring' },
              ...(item.href ? { href: item.href } : null),
              ...(selected ? { 'aria-current': 'page' } : null),
            }
          : {})}
        role={item.href ? 'link' : 'button'}
        accessibilityLabel={item.meta ? `${item.label}, ${item.meta}` : item.label}
        accessibilityState={{ selected }}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={
          canDrag
            ? (event: AccessibilityActionEvent) => runMove(event.nativeEvent.actionName as TreeMove)
            : undefined
        }
        onKeyDown={
          IS_WEB && canDrag
            ? (event: KeyDownEvent) => {
                const native = event.nativeEvent;
                const name = MOVE_KEYS[native.key];
                if (!name || !native.altKey || !native.shiftKey) return;
                event.preventDefault();
                // The arrows that nest and un-nest follow the reading direction.
                runMove(
                  rtl && (name === 'in' || name === 'out') ? (name === 'in' ? 'out' : 'in') : name,
                );
              }
            : undefined
        }
        onLongPress={canDrag ? undefined : item.onLongPress}
        onPress={onPress}
        style={
          {
            flex: 1,
            minWidth: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingTop: 5,
            paddingBottom: 5,
            paddingInlineStart: nests ? 0 : inset,
            paddingInlineEnd: 8,
            borderRadius: borderRadius.full,
            '--bloom-sidebar-ring': palette.ring,
          } as WebCssStyle
        }
      >
        {Icon || item.leading != null ? (
          <View
            style={{
              width: 20,
              height: 20,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {Icon ? <Icon width={20} height={20} fill={palette.textSecondary} /> : item.leading}
          </View>
        ) : null}
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={{ minWidth: 0, flex: 1, color: selected ? palette.text : palette.textSecondary }}
        >
          {item.label}
        </Text>
        {item.meta ? (
          <View
            style={{
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              backgroundColor: palette.tertiary,
              paddingLeft: 4,
              paddingRight: 4,
              paddingTop: 1,
              paddingBottom: 1,
            }}
          >
            <Text
              variant="caption-1-medium"
              numberOfLines={1}
              style={{ color: palette.textSecondary }}
            >
              {item.meta}
            </Text>
          </View>
        ) : null}
      </Pressable>
      {item.actions != null ? (
        <View
          {...(IS_WEB ? { dataSet: { bloomSidebarRowActions: 'true' } } : {})}
          style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}
        >
          {item.actions}
        </View>
      ) : null}
      {indicator === 'before' || indicator === 'after' ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            insetInlineStart: inset,
            insetInlineEnd: 0,
            height: 2,
            borderRadius: 1,
            backgroundColor: palette.ring,
            ...(indicator === 'before' ? { top: -2 } : { bottom: -2 }),
          }}
        />
      ) : indicator === 'inside' ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: borderRadius.full, borderWidth: 2, borderColor: palette.ring },
          ]}
        />
      ) : null}
    </View>
  );

  return (
    <View style={{ width: '100%' }}>
      {canDrag && !IS_WEB ? (
        <GestureDetector gesture={pan} touchAction="pan-y">
          <Animated.View style={lifted}>{row}</Animated.View>
        </GestureDetector>
      ) : (
        row
      )}
      {expandable ? (
        <Reveal open={expanded}>
          <View style={{ width: '100%', gap: 2, paddingTop: 2 }}>
            {children.length > 0 ? (
              children.map((child) => (
                <TreeRow
                  key={child.key}
                  item={child}
                  depth={depth + 1}
                  section={section}
                  nests={nests}
                  searching={searching}
                  selectedTreeItem={selectedTreeItem}
                  onTreeItemPress={onTreeItemPress}
                  palette={palette}
                />
              ))
            ) : item.emptyLabel ? (
              <Text
                variant="body-regular"
                numberOfLines={1}
                style={{
                  paddingTop: 5,
                  paddingBottom: 5,
                  paddingInlineStart: inset + TREE_INDENT + (nests ? DISCLOSURE + 4 : 0),
                  paddingInlineEnd: 8,
                  color: palette.textTertiary,
                }}
              >
                {item.emptyLabel}
              </Text>
            ) : null}
          </View>
        </Reveal>
      ) : null}
    </View>
  );
});
