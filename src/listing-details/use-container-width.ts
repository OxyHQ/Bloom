import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * The width a part was laid out at, or `null` before the first layout.
 *
 * Parts measure THEMSELVES rather than the window, so a listing page split
 * into a content column and a booking column picks its layout from the space
 * it actually has.
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
