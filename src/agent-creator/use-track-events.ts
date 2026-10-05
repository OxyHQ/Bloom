import { useEffect, type RefObject } from 'react';
import { Platform, type View } from 'react-native';

/** Extra browser inputs use the same state and geometry as native gestures. */
export function useTrackEvents(
  ref: RefObject<View | null>,
  onWheel: ((deltaX: number, deltaY: number) => void) | undefined,
  onKey?: (key: string, shiftKey: boolean) => boolean,
  onFocus?: (focused: boolean) => void,
) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = ref.current as unknown as HTMLElement | null;
    if (!element?.addEventListener) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || !onWheel) return;
      event.preventDefault();
      event.stopPropagation();
      const multiplier =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1;
      onWheel(event.deltaX * multiplier, event.deltaY * multiplier);
    };
    const key = (event: KeyboardEvent) => {
      if (onKey?.(event.key, event.shiftKey)) event.preventDefault();
    };
    const focus = () => onFocus?.(true);
    const blur = (event: FocusEvent) => {
      if (!element.contains(event.relatedTarget as Node | null))
        onFocus?.(false);
    };
    element.addEventListener('wheel', wheel, { passive: false });
    element.addEventListener('keydown', key);
    element.addEventListener('focusin', focus);
    element.addEventListener('focusout', blur);
    return () => {
      element.removeEventListener('wheel', wheel);
      element.removeEventListener('keydown', key);
      element.removeEventListener('focusin', focus);
      element.removeEventListener('focusout', blur);
    };
  }, [ref, onWheel, onKey, onFocus]);
}
