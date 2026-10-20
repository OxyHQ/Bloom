import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { AccessibilityInfo, type ScrollView, View } from 'react-native';

import { Text } from '../typography';
import { IS_WEB } from '../styles/platform';
import { canDrop, dropPositionAt, indexTree, sectionKey, type TreePlace } from './tree';
import type { SidebarTree, SidebarTreeDrop } from './types';

/**
 * Dragging tree rows: one engine for every section, so a row dragged out of
 * one section can land in another.
 *
 * Web rows are HTML drag sources and targets (`SidebarTreeSection`); the
 * browser draws the drag image and scrolls the viewport near its edges. On
 * touch a long press lifts a row; this engine reads every row's frame once,
 * when the drag starts, hit-tests the finger against them as it moves, and
 * scrolls the sidebar while the finger rests near its top or bottom edge,
 * offsetting the frames by what it scrolled.
 *
 * What a row draws while a drag is on (lifted, or where the row would land)
 * is a per-row subscription to a small store, so a move re-renders the two
 * rows it changes, not the tree.
 */

export interface TreeHover {
  /** The row it would land on; absent for a section's label. */
  key?: string;
  section: string;
  position: SidebarTreeDrop['position'];
}

interface TreeDragState {
  dragging: string | null;
  hover: TreeHover | null;
}

interface Frame {
  y: number;
  height: number;
}

type Measure = () => Promise<Frame | null>;

interface Target {
  key?: string;
  section: string;
  measure: Measure;
  /** Whether rows can go inside it (a row's `droppable`, or a section label). */
  inside: boolean;
  /** Whether rows can land before and after it (a row's `dropBeside`); a label takes none. */
  beside: boolean;
}

export interface TreeDragApi {
  /** Rows of every section by key: where each sits, for the drop rules. */
  places: () => Map<string, TreePlace>;
  sections: () => Map<string, SidebarTree>;
  /** Reports a drop, if the rules allow it, and announces it. */
  commit: (drop: SidebarTreeDrop) => void;
  /** The drop a hover names, or undefined when it is not allowed. */
  resolve: (source: string, hover: TreeHover) => SidebarTreeDrop | undefined;
  subscribe: (listener: () => void) => () => void;
  getState: () => TreeDragState;
  /** Web: a drag started, moved over a target, or ended. */
  setDragging: (key: string | null) => void;
  setHover: (hover: TreeHover | null) => void;
  /** Touch: a row or a section label offers itself as a target. */
  register: (id: string, target: Target) => () => void;
  begin: (key: string) => void;
  move: (y: number) => void;
  /** `drop` lands the row on the target under the finger; otherwise the drag is dropped. */
  end: (drop: boolean) => void;
}

const TreeDragContext = createContext<TreeDragApi | null>(null);

/** The engine, while the sidebar takes drops. */
export function useTreeDrag(): TreeDragApi | null {
  return useContext(TreeDragContext);
}

const IDLE: TreeDragState = { dragging: null, hover: null };
const noopSubscribe = () => () => undefined;

/** What one row draws: whether it is the lifted row, and where a drop on it would land. */
export function useTreeRowDrag(key: string): {
  dragging: boolean;
  indicator: SidebarTreeDrop['position'] | null;
} {
  const drag = useTreeDrag();
  const dragging = useSyncExternalStore(
    drag?.subscribe ?? noopSubscribe,
    () => (drag?.getState() ?? IDLE).dragging === key,
    () => false,
  );
  const indicator = useSyncExternalStore(
    drag?.subscribe ?? noopSubscribe,
    () => {
      const hover = (drag?.getState() ?? IDLE).hover;
      return hover?.key === key ? hover.position : null;
    },
    () => null,
  );
  return { dragging, indicator };
}

/** Whether a drop on the section's label is on now. */
export function useTreeSectionDrop(section: string): boolean {
  const drag = useTreeDrag();
  return useSyncExternalStore(
    drag?.subscribe ?? noopSubscribe,
    () => {
      const hover = (drag?.getState() ?? IDLE).hover;
      return hover != null && hover.key === undefined && hover.section === section;
    },
    () => false,
  );
}

/** Whether any drag is on (rows suppress their own presses meanwhile). */
export function useTreeDragging(): boolean {
  const drag = useTreeDrag();
  return useSyncExternalStore(
    drag?.subscribe ?? noopSubscribe,
    () => (drag?.getState() ?? IDLE).dragging !== null,
    () => false,
  );
}

/** Touch autoscroll: the band at each edge, and the most it scrolls per frame. */
const EDGE = 48;
const MAX_STEP = 12;

export interface TreeScrollTarget {
  ref: RefObject<ComponentRef<typeof ScrollView> | null>;
  /** The viewport's current offset (the sidebar tracks it from its scroll events). */
  offset: () => number;
}

export function TreeDragProvider({
  sections,
  onDrop,
  movedLabel,
  scroll,
  children,
}: {
  sections: ReadonlyArray<SidebarTree>;
  onDrop: (drop: SidebarTreeDrop) => void;
  /** What a screen reader hears after a move ("Roadmap moved"). */
  movedLabel: (label: string) => string;
  scroll: TreeScrollTarget;
  children: ReactNode;
}) {
  // The latest props, read by callbacks that must stay stable for the rows.
  const latest = useRef({ sections, onDrop, movedLabel, scroll });
  latest.current = { sections, onDrop, movedLabel, scroll };
  const places = useMemo(() => indexTree(sections), [sections]);
  const placesRef = useRef(places);
  placesRef.current = places;
  const sectionMap = useMemo(
    () => new Map(sections.map((section) => [sectionKey(section), section])),
    [sections],
  );
  const sectionsRef = useRef(sectionMap);
  sectionsRef.current = sectionMap;

  const [announcement, setAnnouncement] = useState('');
  const state = useRef<TreeDragState>(IDLE);
  const listeners = useRef(new Set<() => void>());
  const targets = useRef(new Map<string, Target>());
  const session = useRef<{
    key: string;
    frames: Array<Target & Frame>;
    viewport: Frame | null;
    offset0: number;
    pointer: number;
    frame: number | null;
  } | null>(null);

  const api = useMemo<TreeDragApi>(() => {
    const emit = (next: TreeDragState) => {
      if (next.dragging === state.current.dragging && sameHover(next.hover, state.current.hover))
        return;
      state.current = next;
      for (const listener of listeners.current) listener();
    };
    const resolve = (source: string, hover: TreeHover): SidebarTreeDrop | undefined => {
      const section = sectionsRef.current.get(hover.section);
      const place = placesRef.current.get(source);
      if (!section || !place) return undefined;
      if (!canDrop(placesRef.current, source, hover.key, section, hover.position)) return undefined;
      const target = hover.key ? placesRef.current.get(hover.key)?.item : undefined;
      return { item: place.item, from: place.section, target, position: hover.position, section };
    };
    const commit = (drop: SidebarTreeDrop) => {
      if (!canDrop(placesRef.current, drop.item.key, drop.target?.key, drop.section, drop.position))
        return;
      latest.current.onDrop(drop);
      const message = latest.current.movedLabel(drop.item.label);
      if (IS_WEB) setAnnouncement(message);
      else AccessibilityInfo.announceForAccessibility(message);
    };

    const hitTest = (y: number): TreeHover | null => {
      const active = session.current;
      if (!active) return null;
      // Frames were read at the drag's start; what has scrolled since moves them up.
      const scrolled = latest.current.scroll.offset() - active.offset0;
      let best: { target: Target & Frame; distance: number } | null = null;
      for (const target of active.frames) {
        const top = target.y - scrolled;
        const distance = y < top ? top - y : y > top + target.height ? y - top - target.height : 0;
        if (distance <= 8 && (!best || distance < best.distance)) best = { target, distance };
      }
      if (!best) return null;
      const { target } = best;
      const top = target.y - scrolled;
      const fraction = Math.min(1, Math.max(0, (y - top) / Math.max(1, target.height)));
      const hover: TreeHover = {
        key: target.key,
        section: target.section,
        position:
          target.key === undefined
            ? 'inside'
            : dropPositionAt(fraction, target.inside, target.beside),
      };
      return resolve(active.key, hover) ? hover : null;
    };

    const stopScrolling = () => {
      const active = session.current;
      if (active?.frame != null) {
        cancelAnimationFrame(active.frame);
        active.frame = null;
      }
    };
    const scrollStep = () => {
      const active = session.current;
      if (!active?.viewport) return;
      const { y, height } = active.viewport;
      const pointer = active.pointer;
      const step =
        pointer < y + EDGE
          ? -MAX_STEP * Math.min(1, (y + EDGE - pointer) / EDGE)
          : pointer > y + height - EDGE
            ? MAX_STEP * Math.min(1, (pointer - (y + height - EDGE)) / EDGE)
            : 0;
      if (step === 0) {
        active.frame = null;
        return;
      }
      const offset = Math.max(0, latest.current.scroll.offset() + step);
      latest.current.scroll.ref.current?.scrollTo({ y: offset, animated: false });
      emit({ dragging: active.key, hover: hitTest(pointer) });
      active.frame = requestAnimationFrame(scrollStep);
    };

    return {
      places: () => placesRef.current,
      sections: () => sectionsRef.current,
      commit,
      resolve,
      subscribe: (listener) => {
        listeners.current.add(listener);
        return () => listeners.current.delete(listener);
      },
      getState: () => state.current,
      setDragging: (key) => emit({ dragging: key, hover: key ? state.current.hover : null }),
      setHover: (hover) => emit({ dragging: state.current.dragging, hover }),
      register: (id, target) => {
        targets.current.set(id, target);
        return () => {
          if (targets.current.get(id) === target) targets.current.delete(id);
        };
      },
      begin: (key) => {
        const active = {
          key,
          frames: [] as Array<Target & Frame>,
          viewport: null as Frame | null,
          offset0: latest.current.scroll.offset(),
          pointer: 0,
          frame: null as number | null,
        };
        session.current = active;
        emit({ dragging: key, hover: null });
        const viewport = new Promise<Frame | null>((done) => {
          const node = latest.current.scroll.ref.current as unknown as {
            measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
          } | null;
          if (!node?.measureInWindow) return done(null);
          node.measureInWindow((_x, y, _w, height) => done({ y, height }));
        });
        void Promise.all([
          viewport,
          ...[...targets.current.values()].map(async (target) => {
            const frame = await target.measure();
            return frame ? { ...target, ...frame } : null;
          }),
        ]).then(([frame, ...frames]) => {
          if (session.current !== active) return;
          active.viewport = frame as Frame | null;
          active.frames = (frames as Array<(Target & Frame) | null>).filter(
            (entry): entry is Target & Frame => entry !== null,
          );
        });
      },
      move: (y) => {
        const active = session.current;
        if (!active) return;
        active.pointer = y;
        emit({ dragging: active.key, hover: hitTest(y) });
        if (active.frame == null) active.frame = requestAnimationFrame(scrollStep);
      },
      end: (drop) => {
        const active = session.current;
        if (!active) return;
        stopScrolling();
        const hover = state.current.hover;
        session.current = null;
        emit(IDLE);
        if (!drop || !hover) return;
        const resolved = resolve(active.key, hover);
        if (resolved) commit(resolved);
      },
    };
  }, []);

  useEffect(
    () => () => {
      const active = session.current;
      if (active?.frame != null) cancelAnimationFrame(active.frame);
    },
    [],
  );

  return (
    <TreeDragContext.Provider value={api}>
      {children}
      {IS_WEB ? (
        <View
          accessibilityLiveRegion="polite"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
          testID="sidebar-tree-announcer"
        >
          <Text>{announcement}</Text>
        </View>
      ) : null}
    </TreeDragContext.Provider>
  );
}

function sameHover(a: TreeHover | null, b: TreeHover | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.key === b.key && a.section === b.section && a.position === b.position;
}

/** A useCallback'd measure of a view in window coordinates, for `register`. */
export function useMeasureInWindow(ref: RefObject<ComponentRef<typeof View> | null>): Measure {
  return useCallback(
    () =>
      new Promise<Frame | null>((done) => {
        const node = ref.current;
        if (!node) return done(null);
        node.measureInWindow((_x, y, _width, height) => done({ y, height }));
      }),
    [ref],
  );
}
