import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useScreenContext } from './context';

/** Where a scroller is, and how to move it. */
export interface ScreenScroller {
  offset(): number;
  scrollToOffset(offset: number): void;
}

/**
 * What reselecting a screen — pressing the place the reader is already on —
 * means for it. Only `refresh` is usual: where the top is belongs to the
 * scroller in front. A screen that drives its own (a reel, whose top is its
 * first slide) supplies `isAtTop` and `scrollToTop` as well.
 */
export interface ScreenReselectHandler {
  refresh?: () => unknown;
  isAtTop?: () => boolean;
  scrollToTop?: () => void;
}

/** Within this many points of the top, the reader is at the top. */
export const RESELECT_TOP_THRESHOLD = 4;

interface ReselectRegistry {
  registerScroller(read: () => ScreenScroller, fallback?: boolean): () => void;
  registerHandler(read: () => ScreenReselectHandler): () => void;
  frontScroller(): ScreenScroller | null;
  reselect(): void;
}

/**
 * The latest live registration wins, and a cleanup removes only its own: when
 * the screen pushed on top leaves, the one beneath answers again without having
 * to register anew (it never stopped being active underneath).
 */
function useSlot<T>() {
  const live = useRef(new Map<number, () => T>());
  const counter = useRef(0);
  const register = useCallback((read: () => T) => {
    const id = ++counter.current;
    live.current.set(id, read);
    return () => {
      live.current.delete(id);
    };
  }, []);
  const read = useCallback(() => {
    const reads = [...live.current.values()];
    return reads[reads.length - 1]?.() ?? null;
  }, []);
  return [register, read] as const;
}

const ScreenReselectContext = createContext<ReselectRegistry | null>(null);

/**
 * A reselect scope: the screens and scrollers under it answer one `reselect`.
 * `AppShell` mounts one, and every panel with navigation of its own gets
 * another; mount one yourself only for a separate stack of screens.
 */
export function ScreenReselectScope({ children }: { children: ReactNode }) {
  const [registerList, readList] = useSlot<ScreenScroller>();
  const [registerDocument, readDocument] = useSlot<ScreenScroller>();
  const [registerHandler, readHandler] = useSlot<ScreenReselectHandler>();
  const registry = useMemo<ReselectRegistry>(() => {
    const frontScroller = () => readList() ?? readDocument();
    return {
      registerScroller: (read, fallback = false) =>
        fallback ? registerDocument(read) : registerList(read),
      registerHandler,
      frontScroller,
      reselect() {
        const handler = readHandler();
        const scroller = frontScroller();
        // Away from the top a press only scrolls; at the top it also reloads,
        // and the scroll keeps what arrives in view. A screen with nothing to
        // scroll cannot be anywhere but its top.
        const atTop = handler?.isAtTop
          ? handler.isAtTop()
          : (scroller?.offset() ?? 0) <= RESELECT_TOP_THRESHOLD;
        if (handler?.scrollToTop) handler.scrollToTop();
        else scroller?.scrollToOffset(0);
        if (atTop) void handler?.refresh?.();
      },
    };
  }, [registerList, readList, registerDocument, readDocument, registerHandler, readHandler]);
  return (
    <ScreenReselectContext.Provider value={registry}>{children}</ScreenReselectContext.Provider>
  );
}

const NOOP = () => {};
const NO_SCROLLER = () => null;

/** Reselect the screen in front: back to its top, or a reload when it is already there. */
export function useScreenReselect(): () => void {
  return useContext(ScreenReselectContext)?.reselect ?? NOOP;
}

/** The scroller in front — a list, else the web document — to move it elsewhere. */
export function useFrontScroller(): () => ScreenScroller | null {
  return useContext(ScreenReselectContext)?.frontScroller ?? NO_SCROLLER;
}

/**
 * Declare what reselecting the enclosing Screen means. It answers only while
 * that Screen is the active one: a pager keeps every page mounted, and a page
 * behind must never answer for the one in front. A component that renders the
 * Screen itself passes the same handler as its `reselect` prop instead.
 */
export function useScreenReselectHandler(handler: ScreenReselectHandler): void {
  useRegisterReselectHandler(handler, useScreenContext()?.active ?? false);
}

/** The registration behind `useScreenReselectHandler` and `Screen reselect`. */
export function useRegisterReselectHandler(
  handler: ScreenReselectHandler | undefined,
  active: boolean,
): void {
  const register = useContext(ScreenReselectContext)?.registerHandler;
  const latest = useRef(handler);
  latest.current = handler;
  const present = handler !== undefined;
  useEffect(() => {
    if (!active || !present || !register) return;
    return register(() => latest.current as ScreenReselectHandler);
  }, [active, present, register]);
}

/**
 * A scroller answers for its screen while it is active. Bloom's own scrollers
 * register themselves; the web document registers as the fallback, so a list
 * scrolling inside the page always wins over it.
 */
export function useRegisterScreenScroller(
  scroller: ScreenScroller | null,
  active: boolean,
  fallback = false,
): void {
  const register = useContext(ScreenReselectContext)?.registerScroller;
  const latest = useRef(scroller);
  latest.current = scroller;
  const present = scroller !== null;
  useEffect(() => {
    if (!active || !present || !register) return;
    return register(() => latest.current as ScreenScroller, fallback);
  }, [active, present, register, fallback]);
}
