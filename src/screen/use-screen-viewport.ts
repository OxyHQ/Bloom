import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Platform } from 'react-native';
import { useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { animateMotion } from '../motion/recipes';
import type { useScrollRestoration as UseScrollRestoration } from '../scroll/use-scroll-restoration';
import type { ScrollRestorationTarget } from '../scroll/types';
import type { ScreenContextValue } from './context';
import { useOptionalScrollRestorationContext } from '../scroll/context';
import { recordScrollOwnerHandoff } from '../scroll/owner-handoff';
import type { ScreenViewportValue, ScreenHostValue } from './context';
import { useRegisterScreenScroller } from './reselect';

const useNoContentId = () => null;

/** Observes the existing owner for chrome/restoration; never computes layout styles. */
export function useScreenViewportBinding(
  screen: ScreenContextValue,
  enabled: boolean,
  documentFlow: boolean,
  reserved: number,
  host?: ScreenHostValue,
) {
  const restoration = useOptionalScrollRestorationContext();
  const useContentId =
    Platform.OS === 'web'
      ? (restoration?.adapter.useScreenContentId ?? useNoContentId)
      : useNoContentId;
  const contentId = useContentId();
  const ownRef = useRef<unknown>(null);
  const scrollRef = enabled && host?.scrollRef ? host.scrollRef : ownRef;
  const contentRef = useRef<unknown>(null);
  const contentHeight = useSharedValue(-1);
  const viewportHeight = useSharedValue(0);
  const metrics = useMemo(
    () =>
      enabled && host?.metrics
        ? host.metrics
        : { scrollY: screen.scrollY, contentHeight, viewportHeight },
    [enabled, host?.metrics, screen.scrollY, contentHeight, viewportHeight],
  );
  const web = Platform.OS === 'web';
  const restoring = useRef(false);
  const active = useRef(screen.active);
  active.current = screen.active;
  const reducedMotion = useReducedMotion();
  const owner = useRef<{
    documentFlow: boolean;
    active: boolean;
    offset: number;
    contentId: string | null;
  } | null>(null);
  // A layout change can clamp the outgoing document before it dispatches its
  // scroll event. Transfer the last live offset, before paint, rather than
  // reading that now-collapsed owner or relying on a route navigation event.
  useLayoutEffect(() => {
    if (!enabled || !web || typeof window === 'undefined') return;
    const previous = owner.current;
    let releaseHandoff: (() => void) | undefined;
    if (
      previous &&
      previous.contentId === contentId &&
      previous.documentFlow !== documentFlow &&
      previous.active &&
      screen.active
    ) {
      const element = scrollRef.current as HTMLElement | null;
      const target = documentFlow ? window : element;
      if (target) releaseHandoff = recordScrollOwnerHandoff(target, previous.offset);
      if (documentFlow) window.scrollTo({ top: previous.offset, behavior: 'instant' });
      else if (element) element.scrollTop = previous.offset;
    }
    owner.current = {
      contentId,
      documentFlow,
      active: screen.active,
      offset: documentFlow
        ? window.scrollY
        : ((scrollRef.current as HTMLElement | null)?.scrollTop ?? 0),
    };
    // A newly mounted router sidecar can focus on a later commit. Retain the
    // transfer for this active owner lifetime instead of expiring it during
    // the first passive phase. Departure, blur and unmount release it; unrelated
    // screen/metrics renders do not. Restoration consumes it at most once.
    return releaseHandoff;
  }, [enabled, web, documentFlow, screen.active, scrollRef, contentId]);
  useEffect(() => {
    if (!enabled || !web || !screen.active || typeof window === 'undefined') return;
    const element = scrollRef.current as HTMLElement | null;
    const target = documentFlow ? window : element;
    if (!target) return;
    let previous = documentFlow ? window.scrollY : element!.scrollTop;
    const update = () => {
      const node = documentFlow
        ? (document.scrollingElement ?? document.documentElement)
        : element!;
      const y = documentFlow ? window.scrollY : node.scrollTop;
      if (owner.current?.documentFlow === documentFlow) owner.current.offset = Math.max(0, y);
      metrics.scrollY.value = Math.max(0, y);
      metrics.contentHeight.value = node.scrollHeight;
      metrics.viewportHeight.value = Math.max(0, node.clientHeight - (documentFlow ? reserved : 0));
      const delta = y - previous;
      previous = y;
      if (restoring.current) return;
      const collapse = y < 24 ? 0 : delta > 3 ? 1 : delta < -3 ? 0 : screen.collapseTarget.value;
      if (collapse !== screen.collapseTarget.value) {
        screen.collapseTarget.value = collapse;
        animateMotion(screen.collapseProgress, collapse, 'expand', reducedMotion);
      }
    };
    update();
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (element) observer?.observe(element);
    if (contentRef.current instanceof Element) observer?.observe(contentRef.current);
    if (documentFlow) observer?.observe(document.documentElement);
    return () => {
      target.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [enabled, web, screen, documentFlow, reserved, metrics, reducedMotion]);
  const value = useMemo<ScreenViewportValue>(
    () => ({
      kind: !web ? 'native' : documentFlow ? 'document' : 'element',
      scrollRef: documentFlow ? null : scrollRef,
      metrics,
      active: screen.active,
      scrollTo(options) {
        if (!active.current) return;
        if (web) {
          const target = documentFlow ? window : (scrollRef.current as HTMLElement | null);
          target?.scrollTo({
            left: options.x,
            top: options.y,
            behavior: options.animated === false ? 'auto' : 'smooth',
          });
        } else {
          const target = scrollRef.current as {
            scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
            scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
          } | null;
          if (target?.scrollTo) target.scrollTo(options);
          else target?.scrollToOffset?.({ offset: options.y ?? 0, animated: options.animated });
        }
      },
    }),
    [web, documentFlow, metrics, screen.active, scrollRef],
  );
  // The screen's own viewport answers a reselect, as the page: a list scrolling
  // inside it wins.
  useRegisterScreenScroller(
    enabled
      ? { offset: () => metrics.scrollY.value, scrollToOffset: (y) => value.scrollTo({ y }) }
      : null,
    enabled && screen.active,
    true,
  );
  return { value, scrollRef, contentRef, restoring };
}

/** Optional adapter sidecar: an ordinary Screen does not require a router/provider. */
export function createScreenViewportRestoration(useScrollRestoration: typeof UseScrollRestoration) {
  return function ScreenViewportRestoration({
    target,
    active,
    restoring,
  }: {
    target: ScrollRestorationTarget;
    active: boolean;
    restoring: MutableRefObject<boolean>;
  }) {
    const binding = useScrollRestoration(target, { enabled: active });
    useLayoutEffect(() => {
      restoring.current = binding.restorePending;
      return () => {
        restoring.current = false;
      };
    }, [restoring, binding.restorePending]);
    return null;
  };
}
