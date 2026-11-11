import { useCallback, useRef, type ComponentRef } from 'react';
import { Platform, type LayoutChangeEvent, type View } from 'react-native';

type Size = { width: number; height: number };

/** Read size, not position: web resize entries already contain the measured box. */
export function useBorderBoxSize(onSize: (size: Size) => void) {
  const callback = useRef(onSize);
  callback.current = onSize;
  const observer = useRef<ResizeObserver | null>(null);
  const observe = Platform.OS === 'web' && typeof ResizeObserver !== 'undefined';
  const ref = useCallback(
    (view: ComponentRef<typeof View> | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!observe || !view) return;
      const node = view as unknown as HTMLElement;
      const current = new ResizeObserver((entries) => {
        if (observer.current !== current) return;
        const entry = entries.find((candidate) => candidate.target === node);
        if (!entry) return;
        const box = entry.borderBoxSize?.[0];
        callback.current(
          box
            ? { width: box.inlineSize, height: box.blockSize }
            : { width: node.offsetWidth, height: node.offsetHeight },
        );
      });
      observer.current = current;
      current.observe(node, { box: 'border-box' });
    },
    [observe],
  );
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    callback.current(event.nativeEvent.layout);
  }, []);
  return { ref: observe ? ref : undefined, onLayout: observe ? undefined : onLayout };
}
