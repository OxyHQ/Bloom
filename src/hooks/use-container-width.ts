import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * The width a component was laid out at, or `null` before the first layout.
 *
 * A component measures ITSELF rather than the window, so a page split into a
 * content column and a side column picks its layout from the space it actually
 * has. Spread `onLayout` onto the node whose width you want and branch on
 * `width`; the state only changes when the rounded width does, so a resize that
 * lands on the same pixel does not re-render.
 */
export function useContainerWidth(): {
  width: number | null;
  onLayout: (event: LayoutChangeEvent) => void;
} {
  const [width, setWidth] = useState<number | null>(null);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((prev) => (prev === next ? prev : next));
  }, []);
  return { width, onLayout };
}
