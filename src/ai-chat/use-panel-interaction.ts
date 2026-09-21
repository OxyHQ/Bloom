import { useEffect, useRef } from 'react';
import { BackHandler, Platform, type View } from 'react-native';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { hasActiveOverlays } from '../overlay/stack';

function visible(element: HTMLElement): boolean {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const style = getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]';

/** Interaction only: the shell continues to own the drawer's layout and motion. */
export function usePanelInteraction(open: boolean, modal: boolean, close: () => void) {
  const ref = useAccessibilityFocus<View>(modal);
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;
    if (Platform.OS !== 'web') {
      const subscription = BackHandler?.addEventListener('hardwareBackPress', () => {
        if (hasActiveOverlays()) return false;
        closeRef.current();
        return true;
      });
      return () => subscription?.remove();
    }
    if (typeof window === 'undefined') return;
    // This ref is a native View on native, a DOM host on web.
    const node = ref.current as unknown as HTMLElement | null;
    const opener = document.activeElement as HTMLElement | null;
    const candidates = () => Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter(element => element.tabIndex >= 0 && !element.matches(':disabled, [aria-disabled="true"]') &&
        !element.closest('[hidden], [aria-hidden="true"]') && visible(element));
    const focusFirst = () => candidates()[0]?.focus();
    if (modal) focusFirst();
    const onFocus = (event: FocusEvent) => {
      if (modal && !hasActiveOverlays() && node && !node.contains(event.target as Node)) focusFirst();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || hasActiveOverlays()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      } else if (modal && event.key === 'Tab') {
        const items = candidates();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || !node?.contains(document.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !node?.contains(document.activeElement))) {
          event.preventDefault(); first?.focus();
        }
      }
    };
    // Menus/dialogs consume Escape on document; shell listens after them.
    window.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocus);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocus);
      if (opener?.isConnected) opener.focus();
    };
  }, [open, modal, ref]);
  return ref;
}
