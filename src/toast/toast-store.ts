/**
 * Derived from sonner-native v0.26.4 — src/toast-store.ts
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * The auto-close timers were lifted out into `toast-timers.ts`. Everything this
 * module touches is pure JavaScript — `react` (for `createRef`), `./constants`,
 * `./toast-comparator`, `./toast-timers` and type-only `./types`. Keep it that
 * way: nothing here may reach React Native or Reanimated, or the store stops
 * being testable without a platform.
 */
import * as React from 'react';
import { ENTERING_ANIMATION_DURATION, toastDefaults } from './constants';
import { areToastsEqual } from './toast-comparator';
import { ToastTimerRegistry } from './toast-timers';
import type {
  ToastProps,
  ToastRef,
  ToastStoreConfig,
  ToastStoreState,
} from './types';

type Subscriber = () => void;

/** How long the collapse gesture stays latched, so the same tap cannot re-expand. */
const COLLAPSE_COOLDOWN = 100;

class ToastStore {
  private state: ToastStoreState = {
    toasts: [],
    toastsById: new Map(),
    toastsCounter: 1,
    toastRefs: {},
    shouldShowOverlay: false,
    toastHeights: {},
    isExpanded: false,
  };

  private subscribers = new Set<Subscriber>();
  private config: ToastStoreConfig = {};
  private timers = new ToastTimerRegistry();
  private hideOverlayTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingPromises = new Set<string | number>();
  private collapseCooldown = false;
  private collapseCooldownTimeout: ReturnType<typeof setTimeout> | null = null;
  private expansionHold: (() => boolean) | null = null;

  subscribe = (callback: Subscriber) => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  /** Stable while nothing has changed — safe as a `useSyncExternalStore` snapshot. */
  getSnapshot = (): ToastStoreState => {
    return this.state;
  };

  setConfig = (config: ToastStoreConfig) => {
    this.config = config;
  };

  /**
   * Something outside the store can HOLD an expanded stack open — on web, a pointer
   * resting on it. Registered by the platform trigger (`use-stack-hover`) so this
   * module stays pure JS with no DOM and no platform branch; native registers
   * nothing and the predicate stays `null`.
   *
   * It is asked at DECISION time rather than tracked as state on purpose: a row can
   * stop being under the pointer with no event at all — rows unmount under the
   * cursor and move under a stationary one, and neither fires `pointerleave` —
   * so any cached boolean goes stale. Nothing renders from this, so it is
   * deliberately not part of the snapshot.
   */
  setExpansionHold = (hold: (() => boolean) | null) => {
    this.expansionHold = hold;
  };

  private isHeldOpen = (): boolean => this.expansionHold?.() === true;

  private notify = () => {
    this.subscribers.forEach((callback) => callback());
  };

  private cloneIndex = (): Map<string | number, ToastProps> => {
    return new Map(this.state.toastsById);
  };

  private resolveDuration = (duration: number | undefined): number => {
    return duration ?? this.config.duration ?? toastDefaults.duration;
  };

  private scheduleAutoClose = (id: string | number, duration: number) => {
    this.timers.start({
      id,
      duration,
      onComplete: () => {
        this.dismissToast(id, 'onAutoClose');
      },
    });
  };

  pauseTimer = (id: string | number) => {
    this.timers.pause(id);
  };

  resumeTimer = (id: string | number) => {
    this.timers.resume(id);
  };

  pauseAllTimers = () => {
    this.timers.pauseAll();
  };

  resumeAllTimers = () => {
    this.timers.resumeAll();
  };

  private handlePromise = async (toast: ToastProps) => {
    const { id, promiseOptions } = toast;

    if (!promiseOptions || this.pendingPromises.has(id)) {
      return;
    }

    this.pendingPromises.add(id);

    try {
      // Already the success title — see `PromiseOptions`.
      const title = await promiseOptions.promise;

      if (!this.state.toastsById.has(id)) return;

      this.addToast({
        title,
        id,
        variant: 'success',
        promiseOptions: undefined,
        duration: toast.duration,
        styles: promiseOptions.styles?.success,
      });
    } catch (error) {
      if (!this.state.toastsById.has(id)) return;

      this.addToast({
        title:
          typeof promiseOptions.error === 'function'
            ? promiseOptions.error(error)
            : promiseOptions.error,
        id,
        variant: 'error',
        promiseOptions: undefined,
        duration: toast.duration,
        styles: promiseOptions.styles?.error,
      });
    } finally {
      this.pendingPromises.delete(id);
    }
  };

  addToast = (
    options: Omit<
      ToastProps,
      'id' | 'numberOfToasts' | 'index' | 'orderedToastIds'
    > & {
      id?: string | number;
    },
  ): string | number => {
    const providedId =
      typeof options.id === 'number' ||
      (typeof options.id === 'string' && options.id.length > 0)
        ? options.id
        : undefined;

    const id: string | number = providedId ?? this.state.toastsCounter;
    const nextCounter =
      providedId === undefined
        ? this.state.toastsCounter + 1
        : this.state.toastsCounter;

    const duration = this.resolveDuration(options.duration);

    const newToast: ToastProps = {
      ...options,
      id,
      variant: options.variant ?? toastDefaults.variant,
      duration,
      // Assigned by the Toaster at render time from the live position group.
      numberOfToasts: 0,
      index: 0,
      orderedToastIds: [],
    };

    const existingToast = this.state.toastsById.get(id);

    if (existingToast && providedId !== undefined) {
      const shouldWiggle =
        this.config.autoWiggleOnUpdate === 'always' ||
        (this.config.autoWiggleOnUpdate === 'toast-change' &&
          !areToastsEqual(newToast, existingToast));

      if (shouldWiggle) {
        this.wiggleToast(providedId);
      }

      const updatedToasts = this.state.toasts.map((currentToast) =>
        currentToast.id === providedId
          ? { ...currentToast, ...newToast }
          : currentToast,
      );

      // The update may have changed the duration, so the timer restarts.
      if (!newToast.promiseOptions) {
        this.scheduleAutoClose(id, duration);
      }

      const updatedIndex = this.cloneIndex();
      const updatedEntry = updatedToasts.find((t) => t.id === providedId);
      if (updatedEntry) {
        updatedIndex.set(providedId, updatedEntry);
      }

      this.state = {
        ...this.state,
        toasts: updatedToasts,
        toastsById: updatedIndex,
        shouldShowOverlay: true,
      };
    } else {
      const newToasts: ToastProps[] = [...this.state.toasts, newToast];

      const newToastRefs = { ...this.state.toastRefs };
      if (!(id in newToastRefs)) {
        newToastRefs[id] = React.createRef<ToastRef>();
      }

      const visibleToasts =
        this.config.visibleToasts ?? toastDefaults.visibleToasts;
      const newIndex = this.cloneIndex();
      newIndex.set(id, newToast);
      const updatedHeights = { ...this.state.toastHeights };
      let heightsChanged = false;

      if (newToasts.length > visibleToasts) {
        const removedToast = newToasts.shift();
        if (removedToast) {
          this.timers.clear(removedToast.id);
          newIndex.delete(removedToast.id);
          delete newToastRefs[removedToast.id];
          if (removedToast.id in updatedHeights) {
            delete updatedHeights[removedToast.id];
            heightsChanged = true;
          }
        }
      }

      this.state = {
        ...this.state,
        toasts: newToasts,
        toastsById: newIndex,
        toastRefs: newToastRefs,
        toastHeights: heightsChanged ? updatedHeights : this.state.toastHeights,
        toastsCounter: nextCounter,
        shouldShowOverlay: true,
      };

      if (newToast.promiseOptions) {
        // A promise toast has no auto-close timer until it settles.
        void this.handlePromise(newToast);
      } else {
        this.scheduleAutoClose(id, duration);
      }
    }

    if (this.hideOverlayTimeout) {
      clearTimeout(this.hideOverlayTimeout);
      this.hideOverlayTimeout = null;
    }

    this.notify();
    return id;
  };

  /** Omit `id` to dismiss every toast. */
  dismissToast = (
    id: string | number | undefined,
    origin?: 'onDismiss' | 'onAutoClose',
  ): string | number | undefined => {
    if (id == null) {
      this.timers.clearAll();
      this.state.toasts.forEach((currentToast) => {
        if (origin === 'onDismiss') {
          currentToast.onDismiss?.(currentToast.id);
        } else {
          currentToast.onAutoClose?.(currentToast.id);
        }
      });

      this.state = {
        ...this.state,
        toasts: [],
        toastsById: new Map(),
        toastsCounter: 1,
        toastRefs: {},
        toastHeights: {},
        isExpanded: false,
      };
      this.scheduleHideOverlay();
      this.notify();
      return undefined;
    }

    this.timers.clear(id);

    const toastForCallback = this.state.toastsById.get(id);

    const filteredToasts = this.state.toasts.filter(
      (currentToast) => currentToast.id !== id,
    );

    const updatedHeights = { ...this.state.toastHeights };
    delete updatedHeights[id];

    const updatedRefs = { ...this.state.toastRefs };
    delete updatedRefs[id];

    /**
     * An expanded stack collapses itself once a single row is left, because
     * "expanded" then means nothing visually — a lone row resolves to the SAME
     * offset and scale either way (`toast-position-utils.test.ts` pins that) — while
     * `isExpanded` keeps every timer paused, so staying expanded would leave that
     * last toast on screen forever with no visible reason. Inherited from
     * sonner-native and kept deliberately: on native it is invisible and it is the
     * only thing that stops the last row hanging.
     *
     * UNLESS something is holding the stack open. On web that is a pointer resting
     * on it, and collapsing under the cursor would resume the timers hover had just
     * paused — the toast would then expire while the user is reading it, which is
     * exactly what hover exists to prevent.
     *
     * An EMPTY stack always resets, hold or no hold: it no longer exists to be held,
     * and once the rows unmount no `pointerleave` will ever arrive to release it.
     */
    const isEmpty = filteredToasts.length === 0;
    const heldOpen = !isEmpty && this.isHeldOpen();
    const shouldAutoCollapse =
      filteredToasts.length <= 1 && this.state.isExpanded && !heldOpen;

    const updatedIndex = this.cloneIndex();
    updatedIndex.delete(id);

    this.state = {
      ...this.state,
      toasts: filteredToasts,
      toastsById: updatedIndex,
      toastRefs: updatedRefs,
      toastHeights: updatedHeights,
      isExpanded: shouldAutoCollapse ? false : this.state.isExpanded,
    };

    if (shouldAutoCollapse) {
      this.timers.resumeAll();
    }

    if (origin === 'onDismiss') {
      toastForCallback?.onDismiss?.(id);
    } else {
      toastForCallback?.onAutoClose?.(id);
    }

    if (filteredToasts.length === 0) {
      this.scheduleHideOverlay();
    }

    this.notify();
    return id;
  };

  /** Keeps the overlay mounted until the last exit animation has finished. */
  private scheduleHideOverlay = () => {
    if (this.hideOverlayTimeout) {
      clearTimeout(this.hideOverlayTimeout);
    }

    this.hideOverlayTimeout = setTimeout(() => {
      this.state = {
        ...this.state,
        shouldShowOverlay: false,
      };
      this.hideOverlayTimeout = null;
      this.notify();
    }, ENTERING_ANIMATION_DURATION);
  };

  wiggleToast = (id: string | number) => {
    const toast = this.state.toastsById.get(id);
    if (!toast) {
      return;
    }

    this.state.toastRefs[id]?.current?.wiggle();

    // A wiggle re-draws attention, so the reading time starts over — except for
    // toasts that never auto-close.
    if (!toast.promiseOptions) {
      this.scheduleAutoClose(id, this.resolveDuration(toast.duration));
    }
  };

  getToastRef = (
    id: string | number,
  ): React.RefObject<ToastRef | null> | undefined => {
    return this.state.toastRefs[id];
  };

  setToastHeight = (id: string | number, height: number) => {
    if (this.state.toastHeights[id] === height) return;
    // A NEW object, never an in-place write — see `ToastStoreState.toastHeights`.
    this.state = {
      ...this.state,
      toastHeights: {
        ...this.state.toastHeights,
        [id]: height,
      },
    };
    this.notify();
  };

  expand = () => {
    this.state = {
      ...this.state,
      isExpanded: true,
    };
    this.timers.pauseAll();
    this.notify();
  };

  collapse = () => {
    this.state = {
      ...this.state,
      isExpanded: false,
    };

    this.collapseCooldown = true;
    if (this.collapseCooldownTimeout) {
      clearTimeout(this.collapseCooldownTimeout);
    }
    this.collapseCooldownTimeout = setTimeout(() => {
      this.collapseCooldown = false;
      this.collapseCooldownTimeout = null;
    }, COLLAPSE_COOLDOWN);

    this.timers.resumeAll();
    this.notify();
  };

  toggleExpand = () => {
    if (!this.state.isExpanded && this.collapseCooldown) {
      return;
    }

    if (this.state.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  };
}

export const toastStore = new ToastStore();
