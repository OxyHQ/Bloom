import { useCallback, useEffect, useRef, useState } from 'react';
import { visibilityThreshold } from './geometry';
import type { InViewOptions } from './types';

/** The browser owns ancestor clipping, scrolling and resize observation. */
export function useInView({ threshold: requestedThreshold, once = false }: InViewOptions = {}) {
  const threshold = visibilityThreshold(requestedThreshold);
  const [node, setNode] = useState<Element | null>(null);
  const [inView, setInView] = useState(false);
  const entered = useRef(false);
  const ref = useCallback((value: unknown) => {
    if (value != null && !(value instanceof Element))
      throw new Error('Bloom useInView ref must point to a web host element.');
    setNode(value as Element | null);
  }, []);
  useEffect(() => {
    if (!node || (once && entered.current)) return;
    // Unsupported environments remain unobserved, never pretend mount is visible.
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target !== node || (once && entered.current)) continue;
          const visible =
            entry.boundingClientRect.width > 0 &&
            entry.boundingClientRect.height > 0 &&
            entry.isIntersecting &&
            entry.intersectionRatio > 0 &&
            entry.intersectionRatio >= threshold;
          if (visible) entered.current = true;
          setInView(visible);
          if (visible && once) observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold, once]);
  const onLayout = useCallback(() => {}, []);
  return { inView, targetProps: { ref, onLayout } };
}
