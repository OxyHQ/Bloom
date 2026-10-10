import { useCallback, useLayoutEffect, useRef, useState, type Ref } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}
/** DOM anchor ref and the RN onLayout shape, measured only when requested. */
export function useButtonLayout(
  ref: Ref<View> | undefined,
  onLayout?: (event: LayoutChangeEvent) => void,
  childRef?: Ref<HTMLElement>,
) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const callback = useRef(onLayout);
  const measureAfterCommit = useRef<(() => void) | undefined>(undefined);
  callback.current = onLayout;
  const enabled = Boolean(onLayout);
  const setRef = useCallback(
    (element: HTMLElement | null) => {
      if (enabled) setNode(element);
      assignRef(ref, element as unknown as View | null);
      assignRef(childRef, element);
    },
    [ref, childRef, enabled],
  );
  useLayoutEffect(() => {
    if (!node || !enabled) return;
    let last = '';
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const layout = {
        x: node.offsetLeft,
        y: node.offsetTop,
        width: rect.width,
        height: rect.height,
      };
      const key = JSON.stringify(layout);
      if (key === last) return;
      last = key;
      callback.current?.({
        nativeEvent: { layout },
        target: node,
        currentTarget: node,
      } as unknown as LayoutChangeEvent);
    };
    measureAfterCommit.current = measure;
    measure();
    const Resize = node.ownerDocument.defaultView?.ResizeObserver;
    const observer = Resize ? new Resize(measure) : undefined;
    observer?.observe(node);
    node.ownerDocument.defaultView?.addEventListener('resize', measure);
    return () => {
      measureAfterCommit.current = undefined;
      observer?.disconnect();
      node.ownerDocument.defaultView?.removeEventListener('resize', measure);
    };
  }, [node, enabled]);
  // A sibling changing width or order moves this button without resizing it.
  useLayoutEffect(() => {
    measureAfterCommit.current?.();
  });
  return setRef;
}
