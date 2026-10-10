import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { ViewportContext, type ViewportScope } from './context';
import { intersectionRatio, visibilityThreshold, type VisibilityRect } from './geometry';
import type { InViewOptions, VisibilityHandle, ViewportHandle } from './types';

/** Native visibility is measured against every bound ancestor viewport. */
export function useInView({ threshold: requestedThreshold, once = false }: InViewOptions = {}) {
  const threshold = visibilityThreshold(requestedThreshold);
  const scope = useContext(ViewportContext);
  if (!scope) throw new Error('Bloom useInView requires a bound ViewportProvider on native.');
  const [node, setNode] = useState<VisibilityHandle | null>(null);
  const [inView, setInView] = useState(false);
  const entered = useRef(false);
  const scheduleRef = useRef<() => void>(() => {});
  const ref = useCallback((value: unknown) => {
    const target = value as VisibilityHandle | null;
    if (target && typeof target.measureInWindow !== 'function')
      throw new Error('Bloom useInView ref must point to a native View with measureInWindow.');
    setNode(target);
  }, []);
  const onLayout = useCallback(() => scheduleRef.current(), []);
  useEffect(() => {
    if (!node || (once && entered.current)) return;
    let disposed = false,
      frame: ReturnType<typeof requestAnimationFrame> | null = null,
      generation = 0;
    const scopes: ViewportScope[] = [];
    for (let current: ViewportScope | null = scope; current; current = current.parent)
      scopes.push(current);
    const measure = (
      source: ViewportHandle | null,
      complete: (rect: VisibilityRect | null) => void,
    ) => {
      const handle =
        source && 'getNativeScrollRef' in source ? source.getNativeScrollRef() : source;
      if (!handle) {
        complete(null);
        return;
      }
      handle.measureInWindow((x, y, width, height) => complete({ x, y, width, height }));
    };
    const read = () => {
      frame = null;
      const ticket = ++generation;
      const window = Dimensions.get('window');
      const clips: VisibilityRect[] = [{ x: 0, y: 0, width: window.width, height: window.height }];
      let pending = scopes.length + 1,
        target: VisibilityRect | null = null,
        missing = false;
      const finish = () => {
        if (--pending || disposed || ticket !== generation) return;
        const ratio = !missing && target ? intersectionRatio(target, clips) : 0;
        const visible = ratio > 0 && ratio >= threshold;
        if (visible) entered.current = true;
        setInView(visible);
      };
      measure(node, (rect) => {
        target = rect;
        finish();
      });
      scopes.forEach((owner) =>
        measure(owner.getNode?.() ?? null, (rect) => {
          if (rect) clips.push(rect);
          else missing = true;
          finish();
        }),
      );
    };
    const schedule = () => {
      if (disposed || frame !== null) return;
      // A newer event invalidates asynchronous native measurements immediately.
      generation++;
      frame = requestAnimationFrame(read);
    };
    scheduleRef.current = schedule;
    scopes.forEach((owner) => owner.listeners.add(schedule));
    const subscription = Dimensions.addEventListener('change', schedule);
    schedule();
    return () => {
      disposed = true;
      generation++;
      if (frame !== null) cancelAnimationFrame(frame);
      scopes.forEach((owner) => owner.listeners.delete(schedule));
      subscription.remove();
      scheduleRef.current = () => {};
    };
  }, [node, scope, threshold, once, inView]);
  return { inView, targetProps: { ref, onLayout, collapsable: false as const } };
}
