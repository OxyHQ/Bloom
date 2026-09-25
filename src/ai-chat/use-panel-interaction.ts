import { useEffect, useRef } from 'react';
import { BackHandler, Platform, type View } from 'react-native';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { listenForEscape, tabbablesWithin, wrapTab } from '../overlay/modal-keyboard';
import { hasActiveOverlays } from '../overlay/stack';

/**
 * Interaction only: the shell continues to own the drawer's layout and motion.
 * Used by both shell drawers — the panel and the navigation.
 *
 *   open    Escape (web) and back (Android) close it
 *   modal   it covers the workspace: focus moves in on open, Tab is kept
 *           inside, and focus goes back to the opener on close
 *
 * Any portaled overlay above (a dialog, a menu) takes all of it first.
 */
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
    const focusFirst = () => tabbablesWithin(node)[0]?.focus();
    if (modal) focusFirst();
    const onFocus = (event: FocusEvent) => {
      if (modal && !hasActiveOverlays() && node && !node.contains(event.target as Node)) focusFirst();
    };
    const onTab = (event: KeyboardEvent) => {
      if (modal && !event.defaultPrevented && !hasActiveOverlays()) wrapTab(event, node);
    };
    const stopEscape = listenForEscape(() => !hasActiveOverlays(), () => closeRef.current());
    // Capture: a text field inside the drawer stops its own keydowns (see
    // `overlay/modal-keyboard.ts`), and Tab must wrap from there too.
    window.addEventListener('keydown', onTab, true);
    document.addEventListener('focusin', onFocus);
    return () => {
      stopEscape();
      window.removeEventListener('keydown', onTab, true);
      document.removeEventListener('focusin', onFocus);
      if (opener?.isConnected) opener.focus();
    };
  }, [open, modal, ref]);
  return ref;
}
