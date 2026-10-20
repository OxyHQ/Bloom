import { type ComponentRef, useEffect, type RefObject } from 'react';
import { Platform, type View } from 'react-native';

/** Horizontal browser input uses the track; ordinary vertical wheel stays with Screen. */
export function useTrackEvents(
  ref: RefObject<ComponentRef<typeof View> | null>,
  onWheel: ((delta: number) => void) | undefined,
  onKey?: (key: string, shiftKey: boolean) => boolean,
  onFocus?: (focused: boolean) => void,
) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = ref.current as unknown as HTMLElement | null;
    if (!element?.addEventListener) return;
    const wheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || !onWheel) return;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.shiftKey
            ? event.deltaY
            : 0;
      if (delta === 0) return;
      event.preventDefault();
      event.stopPropagation();
      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1;
      onWheel(delta * multiplier);
    };
    const key = (event: KeyboardEvent) => {
      if (onKey?.(event.key, event.shiftKey)) event.preventDefault();
    };
    const focus = () => onFocus?.(true);
    const blur = (event: FocusEvent) => {
      if (!element.contains(event.relatedTarget as Node | null)) onFocus?.(false);
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
