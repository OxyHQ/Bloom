import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Platform } from 'react-native';
import {
  useReducedMotion,
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useMessages } from '../locale/messages';
import { APP_SHELL_MESSAGES } from './messages';
import { reorderPanelIds, panelReorderPreview, type PanelReorderGeometry } from './panel-reorder';
import type { AppShellPanelLayout } from './panel-layout-types';
import type { ResolvedPanelTrack } from './panel-layout';

export interface PanelReorderPoint {
  x: number;
  y: number;
}
export interface PanelReorderRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface PanelReorderHost {
  motion?: { offset: SharedValue<number>; layer: SharedValue<number> };
  measure(): Promise<PanelReorderRect | null>;
  preview(delta: number, dragged: boolean, reducedMotion: boolean): void;
  settle(delta: number, reducedMotion: boolean): Promise<boolean>;
  reset(): void;
}
export interface PanelReorderScroll {
  measure(): Promise<PanelReorderRect | null>;
  offset(): PanelReorderPoint;
  scrollBy(delta: PanelReorderPoint): void;
}
interface Item extends PanelReorderHost {
  id: string;
  start: number;
  size: number;
}
interface ScrollOwner {
  offset(): number;
  bounds(): { start: number; end: number };
  scrollBy(delta: number): void;
}
interface Drag {
  id: string;
  target: string;
  start: number;
  current: number;
  items: Item[];
  owner: ScrollOwner | null;
  scrollStart: number;
  vertical: boolean;
  direction: number;
  ids: string[];
  movable: string[];
  ready: boolean;
  finishing?: boolean;
  onChange: AppShellPanelLayout['onPanelOrderChange'];
}

/** One gesture/order controller. Only measurement, scroll ownership and paint differ by renderer. */
export function usePanelReorder({
  layout,
  tracks,
  vertical,
  documentHorizontal,
  scope,
  rootRef,
  nativeScroll,
}: {
  layout: AppShellPanelLayout;
  tracks: readonly Pick<ResolvedPanelTrack, 'id' | 'visible' | 'floating'>[];
  vertical: boolean;
  documentHorizontal: boolean;
  scope: string | null;
  rootRef: RefObject<unknown>;
  nativeScroll?: PanelReorderScroll;
}) {
  const rtl = useIsRtl();
  const reducedMotion = useReducedMotion();
  const { messages } = useMessages(APP_SHELL_MESSAGES);
  const [announcement, setAnnouncement] = useState({ text: '', sequence: 0 });
  const movable = layout.panels
    .filter(
      (panel, index) =>
        panel.reorderable &&
        panel.visible !== false &&
        tracks[index]?.visible &&
        !tracks[index]?.floating,
    )
    .map((p) => p.id);
  const ids = layout.panels.map((p) => p.id);
  const latest = useRef({
    layout,
    movable,
    ids,
    vertical,
    documentHorizontal,
    rtl,
    messages,
    reducedMotion,
    nativeScroll,
  });
  latest.current = {
    layout,
    movable,
    ids,
    vertical,
    documentHorizontal,
    rtl,
    messages,
    reducedMotion,
    nativeScroll,
  };
  const pointer = useSharedValue({ x: 0, y: 0 });
  const nativeModel = useSharedValue<null | {
    id: string;
    ids: string[];
    movable: string[];
    items: PanelReorderGeometry[];
    start: number;
    vertical: boolean;
    direction: number;
  }>(null);
  const nativeMotion = useSharedValue<
    Array<{ id: string; offset: SharedValue<number>; layer: SharedValue<number> }>
  >([]);
  const nativeTarget = useSharedValue('');
  const nativeBounds = useSharedValue<{ start: number; end: number; vertical: boolean } | null>(
    null,
  );
  const nativeScrollDelta = useSharedValue(0);
  useAnimatedReaction(
    () => ({ model: nativeModel.value, point: pointer.value, scroll: nativeScrollDelta.value }),
    ({ model, point, scroll }) => {
      if (!model) return;
      const delta = (model.vertical ? point.y : point.x) - model.start + scroll;
      const result = panelReorderPreview(
        model.ids,
        model.movable,
        model.items,
        model.id,
        delta,
        model.direction,
      );
      const changed = nativeTarget.value !== result.target;
      nativeTarget.value = result.target;
      for (const shift of result.shifts) {
        const motion = nativeMotion.value.find((motion) => motion.id === shift.id);
        if (!motion) continue;
        const dragged = shift.id === model.id;
        motion.layer.value = dragged ? 3 : 1;
        if (dragged || changed)
          motion.offset.value =
            dragged || reducedMotion ? shift.delta : withTiming(shift.delta, { duration: 150 });
      }
    },
    [nativeModel, pointer, nativeScrollDelta, nativeTarget, nativeMotion, reducedMotion],
  );
  const hosts = useRef(new Map<string, PanelReorderHost>());
  const register = useCallback((id: string, host: PanelReorderHost) => {
    hosts.current.set(id, host);
    return () => {
      if (hosts.current.get(id) === host) hosts.current.delete(id);
    };
  }, []);
  const rootElement = useCallback(
    () => (Platform.OS === 'web' ? (rootRef.current as unknown as HTMLElement | null) : null),
    [rootRef],
  );
  const previousOrder = useRef(ids);
  const ordering =
    previousOrder.current.filter((id) => ids.includes(id)).join('\0') !==
    ids.filter((id) => previousOrder.current.includes(id)).join('\0');
  const pendingFocus = useRef<string | null>(null);
  const drag = useRef<Drag | null>(null);
  const frame = useRef<number | null>(null);
  const reset = useCallback(() => {
    const previous = drag.current;
    drag.current = null;
    nativeModel.value = null;
    nativeMotion.value = [];
    nativeTarget.value = '';
    nativeBounds.value = null;
    nativeScrollDelta.value = 0;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    rootElement()?.removeAttribute('data-bloom-panel-reordering');
    previous?.items.forEach((item) => item.reset());
  }, [rootElement]);
  const signature = JSON.stringify([
    ids,
    movable,
    vertical,
    documentHorizontal,
    layout.widths,
    layout.heights,
    layout.panels.map(({ width, height, minWidth, maxWidth, minHeight, maxHeight, span }) => [
      width,
      height,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      span,
    ]),
  ]);
  const previousSignature = useRef(signature);
  useLayoutEffect(() => {
    previousOrder.current = ids;
    const root = rootElement();
    if (root?.hasAttribute('data-bloom-panel-ordering')) {
      // Commit moved hosts at their resting geometry, not @starting-style.
      for (const panel of Array.from(
        root.querySelectorAll<HTMLElement>('[data-bloom-panel-index]'),
      ))
        panel.getBoundingClientRect();
      root.removeAttribute('data-bloom-panel-ordering');
    }
    if (previousSignature.current !== signature) reset();
    previousSignature.current = signature;
    if (pendingFocus.current) {
      Array.from(root?.querySelectorAll<HTMLElement>('[data-bloom-panel-reorder]') ?? [])
        .find(
          (node) =>
            node.dataset.bloomPanelReorder === pendingFocus.current &&
            node.closest('[data-bloom-panel-group]') === root,
        )
        ?.focus({ preventScroll: true });
      pendingFocus.current = null;
    }
  });
  const commit = useCallback(
    (id: string, target: string, onChange = latest.current.layout.onPanelOrderChange) => {
      const state = latest.current;
      if (
        !onChange ||
        id === target ||
        !state.movable.includes(id) ||
        !state.movable.includes(target)
      )
        return;
      const order = reorderPanelIds(state.ids, state.movable, id, target);
      pendingFocus.current = id;
      rootElement()?.setAttribute('data-bloom-panel-ordering', 'true');
      onChange(order);
      const label = state.layout.panels.find((p) => p.id === id)?.reorderLabel ?? id;
      setAnnouncement((previous) => ({
        text: state.messages.panelMoved(
          label,
          order.filter((key) => state.movable.includes(key)).indexOf(id) + 1,
          state.movable.length,
        ),
        sequence: previous.sequence + 1,
      }));
    },
    [rootElement],
  );
  const move = useCallback(
    (id: string, delta: number) => {
      const state = latest.current;
      const index = state.movable.indexOf(id);
      if (index < 0) return;
      const target = state.movable[Math.max(0, Math.min(state.movable.length - 1, index + delta))];
      if (target) commit(id, target);
    },
    [commit],
  );
  const preview = useCallback(() => {
    const current = drag.current;
    if (!current?.ready || current.finishing) return;
    const delta =
      current.current - current.start + (current.owner?.offset() ?? 0) - current.scrollStart;
    const result = panelReorderPreview(
      current.ids,
      current.movable,
      current.items,
      current.id,
      delta,
      current.direction,
    );
    current.target = result.target;
    for (const shift of result.shifts) {
      current.items
        .find((item) => item.id === shift.id)
        ?.preview(shift.delta, shift.id === current.id, latest.current.reducedMotion);
    }
  }, []);
  const tick = useCallback(
    function tick() {
      frame.current = null;
      const current = drag.current;
      if (!current?.ready || !current.owner) return;
      if (Platform.OS !== 'web')
        current.current = current.vertical ? pointer.value.y : pointer.value.x;
      const { start, end } = current.owner.bounds();
      const distance =
        current.current < start + 48
          ? -Math.min(24, (start + 48 - current.current) / 2)
          : current.current > end - 48
            ? Math.min(24, (current.current - end + 48) / 2)
            : 0;
      if (!distance) return;
      current.owner.scrollBy(distance);
      if (Platform.OS === 'web') preview();
      else nativeScrollDelta.value = current.owner.offset() - current.scrollStart;
      frame.current = requestAnimationFrame(tick);
    },
    [preview],
  );
  const update = useCallback(
    (x: number, y: number) => {
      const current = drag.current;
      if (!current || current.finishing) return;
      current.current = current.vertical ? y : x;
      preview();
      if (frame.current === null) frame.current = requestAnimationFrame(tick);
    },
    [preview, tick],
  );
  useAnimatedReaction(
    () => {
      const bounds = nativeBounds.value;
      if (!bounds) return null;
      const point = pointer.value;
      const axis = bounds.vertical ? point.y : point.x;
      return axis < bounds.start + 48 || axis > bounds.end - 48 ? point : null;
    },
    (point, previous) => {
      if (point && !previous) runOnJS(update)(point.x, point.y);
    },
    [nativeBounds, pointer, update],
  );
  const start = useCallback(
    async (id: string, x: number, y: number) => {
      reset();
      const state = latest.current;
      if (
        !state.layout.onPanelOrderChange ||
        !state.movable.includes(id) ||
        state.movable.length < 2
      )
        return;
      const current: Drag = {
        id,
        target: id,
        start: state.vertical ? y : x,
        current: state.vertical ? y : x,
        items: [],
        owner: null,
        scrollStart: 0,
        vertical: state.vertical,
        direction: state.vertical || !state.rtl ? 1 : -1,
        ids: state.ids,
        movable: state.movable,
        ready: false,
        onChange: state.layout.onPanelOrderChange,
      };
      drag.current = current;
      const root = rootElement();
      if (root && scope) {
        const nodes = Array.from(
          root.querySelectorAll<HTMLElement>(
            `[data-bloom-panel-owner="${scope}"][data-bloom-panel-index]`,
          ),
        );
        current.items = nodes.flatMap((node) => {
          const panel = state.layout.panels[Number(node.dataset.bloomPanelIndex)];
          if (!panel || panel.visible === false || getComputedStyle(node).display === 'none')
            return [];
          const rect = node.getBoundingClientRect();
          let landing: Animation | null = null;
          const original = {
            transform: node.style.transform,
            transition: node.style.transition,
            zIndex: node.style.zIndex,
          };
          return [
            {
              id: panel.id,
              start: state.vertical ? rect.top : rect.left,
              size: state.vertical ? rect.height : rect.width,
              measure: async () => rect,
              preview: (delta: number, dragged: boolean, reduced: boolean) => {
                node.style.transition = dragged || reduced ? 'none' : 'transform 150ms ease';
                node.style.transform = `${original.transform === 'none' ? '' : original.transform} translate${state.vertical ? 'Y' : 'X'}(${delta}px)`;
                node.style.zIndex = dragged ? '3' : '1';
              },
              settle: (delta: number, reduced: boolean) => {
                const from = getComputedStyle(node).transform;
                const to = `${original.transform === 'none' ? '' : original.transform} translate${state.vertical ? 'Y' : 'X'}(${delta}px)`;
                node.style.transition = 'none';
                node.style.transform = to;
                if (reduced || typeof node.animate !== 'function') return Promise.resolve(true);
                return new Promise<boolean>((resolve) => {
                  const animation = node.animate([{ transform: from }, { transform: to }], {
                    duration: 150,
                    easing: 'cubic-bezier(.4,0,.2,1)',
                  });
                  landing = animation;
                  animation.onfinish = () => {
                    landing = null;
                    resolve(true);
                  };
                  animation.oncancel = () => {
                    landing = null;
                    resolve(false);
                  };
                });
              },
              reset: () => {
                landing?.cancel();
                landing = null;
                Object.assign(node.style, original);
              },
            },
          ];
        });
        const handle = Array.from(
          root.querySelectorAll<HTMLElement>('[data-bloom-panel-reorder]'),
        ).find(
          (node) =>
            node.dataset.bloomPanelReorder === id &&
            node.closest('[data-bloom-panel-group]') === root,
        );
        handle?.focus({ preventScroll: true });
        let owner: Window | HTMLElement = window;
        if (!state.documentHorizontal) {
          let node = root.querySelector<HTMLElement>('[data-bloom-panel-row]')?.parentElement;
          while (node && node !== root.parentElement) {
            if (
              /auto|scroll/.test(
                state.vertical
                  ? getComputedStyle(node).overflowY
                  : getComputedStyle(node).overflowX,
              )
            ) {
              owner = node;
              break;
            }
            node = node.parentElement;
          }
        }
        const element = owner === window ? null : (owner as HTMLElement);
        current.owner = {
          offset: () =>
            element
              ? state.vertical
                ? element.scrollTop
                : element.scrollLeft
              : state.vertical
                ? window.scrollY
                : window.scrollX,
          bounds: () => {
            const rect = element?.getBoundingClientRect();
            return {
              start: state.vertical ? (rect?.top ?? 0) : (rect?.left ?? 0),
              end: state.vertical
                ? (rect?.bottom ?? window.innerHeight)
                : (rect?.right ?? window.innerWidth),
            };
          },
          scrollBy: (delta) =>
            owner.scrollBy(
              state.vertical
                ? { top: delta, behavior: 'instant' }
                : { left: delta, behavior: 'instant' },
            ),
        };
        root.setAttribute('data-bloom-panel-reordering', 'true');
      } else {
        const measured = await Promise.all(
          state.ids.map(async (key) => {
            const host = hosts.current.get(key);
            if (!host || state.layout.panels.find((p) => p.id === key)?.visible === false)
              return null;
            const rect = await host.measure();
            return rect
              ? {
                  ...host,
                  id: key,
                  start: state.vertical ? rect.y : rect.x,
                  size: state.vertical ? rect.height : rect.width,
                }
              : null;
          }),
        );
        if (drag.current !== current) return;
        current.items = measured.filter((item): item is Item => item !== null);
        if (state.nativeScroll) {
          const scroll = state.nativeScroll;
          const rect = await scroll.measure();
          if (drag.current !== current) return;
          if (rect)
            current.owner = {
              offset: () => (state.vertical ? scroll.offset().y : scroll.offset().x),
              bounds: () => ({
                start: state.vertical ? rect.y : rect.x,
                end: state.vertical ? rect.y + rect.height : rect.x + rect.width,
              }),
              scrollBy: (delta) =>
                scroll.scrollBy(state.vertical ? { x: 0, y: delta } : { x: delta, y: 0 }),
            };
        }
      }
      if (Platform.OS !== 'web') {
        nativeBounds.value = current.owner
          ? { ...current.owner.bounds(), vertical: current.vertical }
          : null;
        nativeMotion.value = current.items.flatMap((item) =>
          item.motion ? [{ id: item.id, ...item.motion }] : [],
        );
        nativeModel.value = {
          id,
          ids: current.ids,
          movable: current.movable,
          items: current.items.map(({ id, start, size }) => ({ id, start, size })),
          start: current.start,
          vertical: current.vertical,
          direction: current.direction,
        };
      }
      current.scrollStart = current.owner?.offset() ?? 0;
      current.ready = true;
      preview();
    },
    [reset, rootElement, scope, preview],
  );
  const finish = useCallback(
    async (success: boolean, x: number, y: number) => {
      const current = drag.current;
      if (!current || current.finishing) return;
      update(x, y);
      if (!success || !current.ready) {
        reset();
        return;
      }
      current.finishing = true;
      nativeModel.value = null;
      nativeBounds.value = null;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      const delta =
        current.current - current.start + (current.owner?.offset() ?? 0) - current.scrollStart;
      const result = panelReorderPreview(
        current.ids,
        current.movable,
        current.items,
        current.id,
        delta,
        current.direction,
        false,
      );
      const source = current.items.find((item) => item.id === current.id);
      const position = result.shifts.find((item) => item.id === current.id);
      const landed =
        source && position
          ? await source.settle(position.delta, latest.current.reducedMotion)
          : true;
      if (drag.current !== current) return;
      reset();
      if (landed) commit(current.id, result.target, current.onChange);
    },
    [update, reset, commit],
  );
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return reset;
    const root = rootElement();
    if (!root) return reset;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && drag.current) {
        event.preventDefault();
        reset();
        return;
      }
      const handle = (event.target as Element | null)?.closest<HTMLElement>(
        '[data-bloom-panel-reorder]',
      );
      const id = handle?.dataset.bloomPanelReorder;
      const state = latest.current;
      if (
        !handle ||
        !root?.contains(handle) ||
        handle.closest('[data-bloom-panel-group]') !== root ||
        !id ||
        !state.movable.includes(id)
      )
        return;
      const delta =
        event.key === 'Home'
          ? -state.movable.length
          : event.key === 'End'
            ? state.movable.length
            : event.key === (state.vertical ? 'ArrowUp' : state.rtl ? 'ArrowRight' : 'ArrowLeft')
              ? -1
              : event.key ===
                  (state.vertical ? 'ArrowDown' : state.rtl ? 'ArrowLeft' : 'ArrowRight')
                ? 1
                : 0;
      if (!delta) return;
      event.preventDefault();
      event.stopPropagation();
      move(id, delta);
    };
    window.addEventListener('keydown', key, true);
    window.addEventListener('blur', reset);
    window.addEventListener('resize', reset);
    return () => {
      reset();
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('blur', reset);
      window.removeEventListener('resize', reset);
    };
  }, [rootElement, move, reset]);
  const measure = useCallback(
    async (id: string): Promise<PanelReorderRect | null> => {
      if (Platform.OS !== 'web') return hosts.current.get(id)?.measure() ?? null;
      const index = latest.current.ids.indexOf(id);
      const rect = rootElement()
        ?.querySelector(`[data-bloom-panel-owner="${scope}"][data-bloom-panel-index="${index}"]`)
        ?.getBoundingClientRect();
      return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
    },
    [rootElement, scope],
  );
  return {
    measure,
    announcement: announcement.text,
    ordering,
    move,
    start,
    update,
    pointer,
    finish,
    register,
    cancel: reset,
    canReorder: (id: string) =>
      !!layout.onPanelOrderChange && movable.length > 1 && movable.includes(id),
  };
}
