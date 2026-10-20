import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  useResolvedPlacement,
  type DialogPlacement,
  type ResponsiveDialogPlacement,
} from './placement';

/** Internal lifecycle reports completion, not merely a dismissal request. */
export interface DialogPresentationLifecycle {
  onPresentationOpen?: () => void;
  onPresentationClosed?: () => void;
}

/**
 * A responsive Dialog chooses its renderer for one complete open/exit session.
 * Switching renderer while editing would unmount fields, focus and scroll owners.
 * The chosen renderer still adapts its dimensions to the current viewport.
 */
export function usePresentationSession(
  placement: ResponsiveDialogPlacement | undefined,
  { open, startOpen }: { open?: boolean; startOpen?: boolean },
) {
  const resolved = useResolvedPlacement(placement);
  const responsive = typeof placement === 'object' && placement != null;
  const [session, setSession] = useState<DialogPlacement | null>(() =>
    responsive && (open ?? startOpen ?? false) ? resolved : null,
  );
  const active = useRef(session);
  const latest = useRef({ resolved, responsive });
  latest.current = { resolved, responsive };

  const onPresentationOpen = useCallback(() => {
    if (!latest.current.responsive || active.current !== null) return;
    active.current = latest.current.resolved;
    setSession(active.current);
  }, []);
  const onPresentationClosed = useCallback(() => {
    active.current = null;
    setSession(null);
  }, []);

  // Imperative opens notify synchronously from the renderer; controlled opens
  // enter the session before paint. startOpen seeds the initial session only.
  useLayoutEffect(() => {
    if (open === true) onPresentationOpen();
  }, [open, onPresentationOpen]);

  return {
    placement: responsive ? (session ?? resolved) : resolved,
    // A close callback may immediately reopen at the new viewport. If that
    // selects a different renderer, seed it open on its first commit as well.
    startOpen: responsive ? session !== null : startOpen,
    onPresentationOpen,
    onPresentationClosed,
  };
}
