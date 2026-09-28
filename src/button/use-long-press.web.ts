import { useCallback, useEffect, useRef, type PointerEvent, type MouseEvent, type KeyboardEvent } from 'react';
import type { GestureResponderEvent } from 'react-native';

/** One gesture lifecycle for previews and Pressable-compatible long holds. */
export function useLongPress(
  onLongPress: ((event: GestureResponderEvent) => void) | undefined,
  disabled: boolean,
  onPressIn?: () => void,
  onPressOut?: () => void,
) {
  const callbacks = useRef({ onLongPress, onPressIn, onPressOut });
  callbacks.current = { onLongPress, onPressIn, onPressOut };
  const cleanup = useRef<(() => void) | undefined>(undefined);
  const active = useRef<'pointer' | string | null>(null);
  const held = useRef(false);
  const touch = useRef(false);
  const end = useCallback(() => {
    cleanup.current?.(); cleanup.current = undefined;
    if (active.current !== null) {
      active.current = null;
      callbacks.current.onPressOut?.();
    }
  }, []);
  useEffect(() => { if (disabled) end(); }, [disabled, end]);
  useEffect(() => end, [end]);
  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (active.current !== null) return;
    held.current = false;
    touch.current = event.pointerType === 'touch';
    if (disabled || event.button !== 0 || event.isPrimary === false || event.defaultPrevented) return;
    const { onLongPress, onPressIn, onPressOut } = callbacks.current;
    if (!onLongPress && !onPressIn && !onPressOut) return;
    const { clientX, clientY, pointerId } = event;
    const doc = event.currentTarget.ownerDocument;
    active.current = 'pointer';
    const move = (next: globalThis.PointerEvent) => {
      if (next.pointerId === pointerId && Math.hypot(next.clientX - clientX, next.clientY - clientY) > 10) end();
    };
    const release = (next: globalThis.PointerEvent) => { if (next.pointerId === pointerId) end(); };
    const timer = onLongPress ? setTimeout(() => {
      held.current = true;
      callbacks.current.onLongPress?.(event as unknown as GestureResponderEvent);
    }, 450) : undefined;
    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', release);
    doc.addEventListener('pointercancel', release);
    doc.addEventListener('scroll', end, true);
    doc.defaultView?.addEventListener('blur', end);
    cleanup.current = () => {
      clearTimeout(timer);
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', release);
      doc.removeEventListener('pointercancel', release);
      doc.removeEventListener('scroll', end, true);
      doc.defaultView?.removeEventListener('blur', end);
    };
    onPressIn?.();
  }, [end, disabled]);
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (disabled || event.defaultPrevented || event.repeat || active.current !== null || (event.key !== ' ' && event.key !== 'Enter')) return;
    if (!callbacks.current.onPressIn && !callbacks.current.onPressOut) return;
    active.current = event.key;
    const win = event.currentTarget.ownerDocument.defaultView;
    win?.addEventListener('blur', end);
    cleanup.current = () => win?.removeEventListener('blur', end);
    callbacks.current.onPressIn?.();
  }, [disabled, end]);
  const onKeyUp = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (active.current === event.key) end();
  }, [end]);
  const suppressClick = useCallback((event: MouseEvent<HTMLElement>) => {
    const suppress = held.current && event.detail !== 0;
    held.current = false;
    if (suppress) { event.preventDefault(); event.stopPropagation(); }
    return suppress;
  }, []);
  const onContextMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!disabled && callbacks.current.onLongPress && touch.current) event.preventDefault();
  }, [disabled]);
  return { onPointerDown, onPointerLeave: end, onBlur: end, onKeyDown, onKeyUp, onContextMenu, suppressClick };
}
