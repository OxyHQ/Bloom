import React, {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { BackHandler, Platform } from 'react-native';

import { useDialogControl } from '../dialog/context';
import type { DialogProps } from '../dialog/types';
import {
  finalizeClose,
  getSnapshot,
  present,
  requestDismiss,
  resetSurfaces,
  subscribe,
} from './surface-store';
import { SurfaceContext } from './use-surface';
import type { SurfaceControls, SurfaceEntry, SurfacePresentation } from './types';

type DialogComponent = React.ComponentType<DialogProps>;

/** Default placement — the ecosystem's responsive "sheet" (bottom → centered). */
const DEFAULT_PLACEMENT: SurfacePresentation['placement'] = {
  base: 'bottom',
  md: 'center',
};

/**
 * Map a surface's presentation config onto the shared `Dialog` props. Every
 * field is a 1:1 forward except `actions`, which the caller resolves against the
 * surface's own controls (see {@link SurfacePresentation.actions}).
 */
function dialogPropsFor(p: SurfacePresentation): Partial<DialogProps> {
  return {
    placement: p.placement ?? DEFAULT_PLACEMENT,
    width: p.width,
    maxWidth: p.maxWidth,
    maxHeightRatio: p.maxHeightRatio,
    inset: p.inset,
    showHandle: p.showHandle,
    dismissOnBackdrop: p.dismissOnBackdrop,
    contentPadding: p.contentPadding,
    header: p.header,
    scrollable: p.scrollable,
    morph: p.morph,
    style: p.style,
    panelStyle: p.panelStyle,
    panelClassName: p.panelClassName,
    containerStyle: p.containerStyle,
    containerClassName: p.containerClassName,
    label: p.label,
    testID: p.testID,
    title: p.title,
    description: p.description,
  };
}

/**
 * Build the `<SurfaceHost>` + `<SurfaceProvider>` bound to a platform `Dialog`.
 *
 * `Dialog` is platform-forked (native `BottomSheet`-backed vs. pure-DOM web
 * overlay), so — like `createAlertDialog` — the platform entry files
 * (`index.ts` / `index.web.ts`) inject the correct one. The stack logic below is
 * single-source, no duplication.
 */
export function createSurfaceHost(Dialog: DialogComponent) {
  /**
   * One stacked surface. Bridges a store entry onto an IMPERATIVE `Dialog`
   * (`useDialogControl()` + `open()`/`close()`) — never the controlled
   * `open`/`onClose` boolean path, which fires `onClose` synchronously as the
   * dismiss REQUEST and has no post-exit callback, so it could never tell the
   * store WHEN to splice the entry after the exit animation.
   */
  function SurfaceLayer({ entry }: { entry: SurfaceEntry }) {
    const control = useDialogControl();
    const { id, status } = entry;

    const controls = useMemo<SurfaceControls>(
      () => ({
        dismiss: (result?: unknown) => requestDismiss(id, result),
        present: (render, opts) => present(render, opts),
      }),
      [id],
    );

    // Open imperatively on mount (mirrors `AlertDialog`'s canonical
    // fresh-mount open-from-effect; `control` is stable for the layer's life).
    useEffect(() => {
      control.open();
    }, [control]);

    // When the store flips this entry to 'closing' (a programmatic dismiss,
    // dismissAll, dismissToRoot, Escape, or Android-back), run the exit
    // animation. A user backdrop/Escape handled by the Dialog itself instead
    // drives its own internal close; either way `onClose` fires post-exit.
    useEffect(() => {
      if (status === 'closing') control.close();
    }, [status, control]);

    // Fires AFTER the exit animation settles (imperative mode), for ANY
    // dismissal path — user backdrop/Escape/back OR a programmatic dismiss.
    // `requestDismiss` resolves-once (a programmatic dismiss already resolved
    // with its result; this is a no-op then), then `finalizeClose` splices the
    // entry out. Guarded by unique ids + `'closing'` status in the store.
    const handleClose = useCallback(() => {
      requestDismiss(id);
      finalizeClose(id);
    }, [id]);

    const dialogProps = useMemo(
      () => ({
        ...dialogPropsFor(entry.presentation),
        actions: entry.presentation.actions?.(controls),
      }),
      [entry.presentation, controls],
    );

    return (
      // `startOpen` is the surface's open-INTENT (true while not closing). It
      // ONLY seeds a freshly-mounted Dialog branch's visible state — the
      // imperative `control` still owns open/close — so when a responsive Dialog
      // swaps its inner component on resize (centered card ↔ bottom sheet) the
      // new branch mounts STILL OPEN instead of dismissing the surface. A real
      // dismiss (backdrop/Escape/back/programmatic) still resolves + splices
      // exactly once via `control.close()` → `handleClose`, post-exit.
      <Dialog
        control={control}
        onClose={handleClose}
        startOpen={status !== 'closing'}
        {...dialogProps}
      >
        <SurfaceContext.Provider value={controls}>
          {entry.render(controls)}
        </SurfaceContext.Provider>
      </Dialog>
    );
  }

  function SurfaceHost() {
    const stack = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    useAndroidBackDismissesTop();
    useEscapeDismissesTop();

    return (
      <>
        {stack.map((entry) => (
          <SurfaceLayer key={entry.id} entry={entry} />
        ))}
      </>
    );
  }
  SurfaceHost.displayName = 'SurfaceHost';

  /**
   * Mount ONCE near your app root — renders `children` plus the stack host.
   * Requires the Bloom Portal provider to be mounted too (same as any `<Dialog>`
   * usage): on web the Portal auto-creates `#bloom-portal-root`; on native mount
   * `<PortalProvider>`/`<PortalOutlet>` from `@oxyhq/bloom/portal`. Can equally be folded
   * next to that Portal provider — `<SurfaceHost>` used directly does the same
   * job without wrapping `children`.
   */
  function SurfaceProvider({ children }: { children: React.ReactNode }) {
    // Resolve any pending awaiters if the provider unmounts so no `present()`
    // promise is stranded.
    useEffect(() => () => resetSurfaces(), []);
    return (
      <>
        {children}
        <SurfaceHost />
      </>
    );
  }
  SurfaceProvider.displayName = 'SurfaceProvider';

  return { SurfaceHost, SurfaceProvider };
}

/**
 * ONE Android hardware-back handler for the whole stack → dismiss the TOP
 * surface. Reads the live top from the store so a single registration always
 * targets the current top. Returns `false` when the stack is empty so app-level
 * back navigation is untouched.
 */
function useAndroidBackDismissesTop(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const stack = getSnapshot();
      const top = stack[stack.length - 1];
      if (!top) return false;
      if (top.presentation.dismissOnBackdrop === false) return true;
      requestDismiss(top.id);
      return true;
    });
    return () => sub.remove();
  }, []);
}

/**
 * Web-only: route Escape to the TOP surface only. A window-CAPTURE listener runs
 * before each `Dialog`'s own document-level keydown, so `stopImmediatePropagation`
 * prevents the lower stacked dialogs from ALSO handling Escape (they each add a
 * document listener) — Escape dismisses strictly the top, LIFO. No-op on native.
 */
function useEscapeDismissesTop(): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const stack = getSnapshot();
      const top = stack[stack.length - 1];
      if (!top) return;
      if (top.presentation.dismissOnBackdrop === false) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      requestDismiss(top.id);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);
}
