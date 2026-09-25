import React, { useCallback, useEffect, useRef } from 'react';
import type { View } from 'react-native';

import { listenForEscape, tabbablesWithin, wrapTab } from './modal-keyboard';
import { useOverlayLayerContext } from './Overlay';
import { isTopmostOverlayLayer } from './stack';

export interface ModalKeyboardProps {
  /** The surface's panel: where focus goes, and what Tab stays inside. */
  panelRef: React.RefObject<View | null>;
  /** The surface has started its exit: focus goes back now, Escape is spent. */
  closing?: boolean;
  /** Whether Escape may dismiss it (a dialog's `dismissOnBackdrop`). */
  dismissible: boolean;
  dismiss: () => void;
}

/**
 * An open modal surface's keyboard and focus, WEB. Renders nothing; it must
 * sit INSIDE the surface's `OverlayRoot`, which is how it knows the surface's
 * place in the overlay stack. Used by the web `Dialog` (card and side drawers)
 * and the web `BottomSheet`.
 *
 *  - Focus moves INTO the panel when it opens — to whatever the content
 *    focused itself (an `autoFocus` field), else the first tabbable, else the
 *    panel — and goes BACK to the element that had it once the surface starts
 *    closing (or unmounts), unless the host has already put it somewhere else.
 *  - Tab and Shift+Tab wrap at the panel's edges.
 *  - Escape dismisses (when `dismissible`), from anywhere — a text field of the
 *    surface included, which react-native-web keeps every keydown from
 *    bubbling out of (`./modal-keyboard.ts`).
 *
 * All three belong to the TOP-MOST surface only: a menu or a second dialog
 * opened from this one takes them until it closes, so Escape closes one layer
 * at a time. Inert without a DOM, so native never runs any of it.
 */
export function ModalKeyboard({ panelRef, closing = false, dismissible, dismiss }: ModalKeyboardProps) {
  const layer = useOverlayLayerContext();
  const state = useRef({ closing, dismissible, dismiss });
  state.current = { closing, dismissible, dismiss };
  const opener = useRef<HTMLElement | null>(null);

  const restoreFocus = useCallback(() => {
    const target = opener.current;
    opener.current = null;
    if (!target?.isConnected || typeof document === 'undefined') return;
    const panel = panelRef.current as unknown as HTMLElement | null;
    const active = document.activeElement;
    // Only focus the surface still holds (or lost with its nodes): a host that
    // moved focus on purpose while closing keeps its choice.
    if (!active || active === document.body || panel?.contains(active)) target.focus();
  }, [panelRef]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
    const panel = () => panelRef.current as unknown as HTMLElement | null;
    // A frame later, so content that focuses itself on mount has done so.
    const frame = requestAnimationFrame(() => {
      const node = panel();
      if (!node || node.contains(document.activeElement) || !isTopmostOverlayLayer(layer)) return;
      (tabbablesWithin(node)[0] ?? node).focus();
    });
    const onTab = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !isTopmostOverlayLayer(layer)) return;
      wrapTab(event, panel());
    };
    // Capture: a text field in the panel stops its own keydowns.
    window.addEventListener('keydown', onTab, true);
    const stopEscape = listenForEscape(
      () => state.current.dismissible && !state.current.closing && isTopmostOverlayLayer(layer),
      () => state.current.dismiss(),
    );
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onTab, true);
      stopEscape();
      restoreFocus();
    };
  }, [layer, panelRef, restoreFocus]);

  useEffect(() => {
    if (closing) restoreFocus();
  }, [closing, restoreFocus]);

  return null;
}
