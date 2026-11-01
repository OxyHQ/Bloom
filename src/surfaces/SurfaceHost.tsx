import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import { useDialogControl } from '../dialog/context';
import { useResolvedBloomLocale } from '../locale/context';
import type { DialogProps } from '../dialog/types';
import {
  finalizeClose,
  getSnapshot,
  markSurfaceMounted,
  present,
  requestDismiss,
  resetSurfaces,
  subscribe,
} from './surface-store';
import { SurfaceContext } from './use-surface';
import type { SurfaceControls, SurfaceEntry, SurfacePresentation } from './types';

type DialogComponent = React.ComponentType<DialogProps>;

/**
 * Set by a `<SurfaceProvider>` for its children. A `<SurfaceHost>` mounted among
 * them claims the stack, and the provider stops rendering its own host while
 * it does.
 */
const SurfaceHostSlot = createContext<(() => () => void) | null>(null);

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
    progress: p.progress,
    backdrop: p.backdrop,
    inset: p.inset,
    showHandle: p.showHandle,
    dismissOnBackdrop: p.dismissOnBackdrop,
    contentPadding: p.contentPadding,
    header: p.header,
    frame: p.frame,
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
    const locale = useResolvedBloomLocale();

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

    useLayoutEffect(() => {
      return markSurfaceMounted(id);
    }, [id]);

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
        actions: entry.presentation.actions?.(controls, locale),
      }),
      [entry.presentation, controls, locale],
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
        <SurfaceContext.Provider value={controls}>{entry.render(controls)}</SurfaceContext.Provider>
      </Dialog>
    );
  }

  function SurfaceStack() {
    const stack = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    // Each Dialog owns keyboard dismissal through the global overlay stack.
    // Host-level listeners cannot see standalone sheets opened above this store.

    return (
      <>
        {stack.map((entry) => (
          <SurfaceLayer key={entry.id} entry={entry} />
        ))}
      </>
    );
  }

  /**
   * Renders the surface stack where it is mounted. Inside a `<SurfaceProvider>`
   * it takes the stack over from the provider's own host, so an app whose
   * surfaces read its own contexts (i18n, data, the app shell) mounts one
   * beneath those providers: a surface renders inside whatever wraps the host,
   * and on web a portal keeps the context of where it was rendered.
   */
  function SurfaceHost() {
    const claim = useContext(SurfaceHostSlot);
    useLayoutEffect(() => claim?.(), [claim]);
    return <SurfaceStack />;
  }
  SurfaceHost.displayName = 'SurfaceHost';

  /**
   * Mount ONCE near your app root — renders `children` plus the stack host.
   * Requires the Bloom Portal provider to be mounted too (same as any `<Dialog>`
   * usage): on web the Portal auto-creates `#bloom-portal-root`; on native mount
   * `<PortalProvider>`/`<PortalOutlet>` from `@oxy.so/bloom/portal`. Can equally be folded
   * next to that Portal provider — `<SurfaceHost>` used directly does the same
   * job without wrapping `children`. A `<SurfaceHost>` mounted among `children`
   * takes the stack over while it is mounted.
   */
  function SurfaceProvider({ children }: { children: React.ReactNode }) {
    // Resolve any pending awaiters if the provider unmounts so no `present()`
    // promise is stranded.
    useEffect(() => () => resetSurfaces(), []);
    // How many `<SurfaceHost>`s among `children` hold the stack. One host renders
    // it at a time: two would draw every surface twice.
    const [claims, setClaims] = useState(0);
    const claim = useCallback(() => {
      setClaims((count) => count + 1);
      return () => setClaims((count) => count - 1);
    }, []);
    return (
      <>
        <SurfaceHostSlot.Provider value={claim}>{children}</SurfaceHostSlot.Provider>
        {claims === 0 ? <SurfaceStack /> : null}
      </>
    );
  }
  SurfaceProvider.displayName = 'SurfaceProvider';

  return { SurfaceHost, SurfaceProvider };
}
