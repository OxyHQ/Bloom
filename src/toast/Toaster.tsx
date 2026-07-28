/**
 * Derived from sonner-native v0.26.4 — src/toaster.tsx
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * Subscribes to the store, resolves the outlet configuration once, groups rows by
 * position and renders each group through `Positioner` inside the platform
 * `ToastHost`.
 *
 * W5 — ONE `AppState` subscription for the whole stack. Upstream subscribes per
 * row, so N toasts meant N `visibilitychange` listeners all doing the same work;
 * the store already exposes stack-wide `pauseAllTimers`/`resumeAllTimers`.
 *
 * `react-native-screens` is not imported here either — the platform wrapper is
 * `ToastHost`'s concern (D6).
 */
import * as React from 'react';

import { toastDefaults } from './constants';
import { DynamicToastContext, ToastContext } from './context';
import { getOrderedToastIds } from './position-utils';
import { Positioner } from './Positioner';
import { ToastHost } from './ToastHost';
import { ToastRow } from './ToastRow';
import { toastStore } from './toast-store';
import type {
  DynamicToastContextType,
  StableToastContextType,
  ToasterProps,
  ToastPosition,
  ToastProps,
} from './types';
import { useAppStateChange } from './use-app-state';
import { useSingleOutletGuard } from './use-single-outlet-guard';

const ALL_POSITIONS: ToastPosition[] = [
  'top-center',
  'bottom-center',
  'center',
];

// Stable identities so the context memos below do not invalidate every render.
const EMPTY_TOAST_OPTIONS: NonNullable<ToasterProps['toastOptions']> = {};
const EMPTY_ICONS: NonNullable<ToasterProps['icons']> = {};
const EMPTY_ANIMATION: NonNullable<ToasterProps['animation']> = {};

/**
 * A top-anchored stack grows downward from the newest toast, so its rows render
 * in reverse order.
 */
function orderToastsFromPosition(
  toasts: ToastProps[],
  position: ToastPosition,
): ToastProps[] {
  return position === 'top-center' ? toasts.slice().reverse() : toasts;
}

export const Toaster: React.FC<ToasterProps> = ({
  ToasterOverlayWrapper,
  ToastWrapper,
  duration = toastDefaults.duration,
  position = toastDefaults.position,
  offset = toastDefaults.offset,
  visibleToasts = toastDefaults.visibleToasts,
  swipeToDismissDirection = toastDefaults.swipeToDismissDirection,
  closeButton = toastDefaults.closeButton,
  gap = toastDefaults.gap,
  theme = toastDefaults.theme,
  invert = toastDefaults.invert,
  richColors = toastDefaults.richColors,
  enableStacking = toastDefaults.enableStacking,
  autoWiggleOnUpdate = toastDefaults.autoWiggleOnUpdate,
  pauseWhenPageIsHidden = toastDefaults.pauseWhenPageIsHidden,
  allowFontScaling = toastDefaults.allowFontScaling,
  maxFontSizeMultiplier,
  toastOptions = EMPTY_TOAST_OPTIONS,
  icons = EMPTY_ICONS,
  animation = EMPTY_ANIMATION,
  unstyled,
  positionerStyle,
  style,
  styles: styleOverrides,
}) => {
  // Before any early return, and independent of whether a toast is up: a second
  // outlet duplicates every row from the moment it mounts, not from the first
  // toast, so the warning must not wait for one.
  useSingleOutletGuard();

  const { toasts, shouldShowOverlay, toastHeights, isExpanded } =
    React.useSyncExternalStore(
      toastStore.subscribe,
      toastStore.getSnapshot,
      toastStore.getSnapshot,
    );

  // Runs even while idle: the store must know the outlet's limits BEFORE the
  // first toast arrives, or that toast is resolved against the bare defaults.
  React.useEffect(() => {
    toastStore.setConfig({
      autoWiggleOnUpdate,
      visibleToasts,
      duration,
      pauseWhenPageIsHidden,
    });
  }, [autoWiggleOnUpdate, visibleToasts, duration, pauseWhenPageIsHidden]);

  const onBackground = React.useCallback(() => {
    if (pauseWhenPageIsHidden) {
      toastStore.pauseAllTimers();
    }
  }, [pauseWhenPageIsHidden]);

  const onForeground = React.useCallback(() => {
    if (pauseWhenPageIsHidden) {
      toastStore.resumeAllTimers();
    }
  }, [pauseWhenPageIsHidden]);

  useAppStateChange({ onBackground, onForeground });

  const stableValue: StableToastContextType = React.useMemo(
    () => ({
      duration,
      position,
      offset,
      visibleToasts,
      swipeToDismissDirection,
      closeButton,
      gap,
      theme,
      invert,
      richColors,
      enableStacking,
      autoWiggleOnUpdate,
      pauseWhenPageIsHidden,
      allowFontScaling,
      maxFontSizeMultiplier,
      toastOptions,
      icons,
      animation,
      unstyled: unstyled ?? toastOptions.unstyled ?? toastDefaults.unstyled,
    }),
    [
      duration,
      position,
      offset,
      visibleToasts,
      swipeToDismissDirection,
      closeButton,
      gap,
      theme,
      invert,
      richColors,
      enableStacking,
      autoWiggleOnUpdate,
      pauseWhenPageIsHidden,
      allowFontScaling,
      maxFontSizeMultiplier,
      toastOptions,
      icons,
      animation,
      unstyled,
    ],
  );

  const dynamicValue: DynamicToastContextType = React.useMemo(
    () => ({
      toastHeights,
      isExpanded,
      expand: toastStore.expand,
      collapse: toastStore.collapse,
      toggleExpand: toastStore.toggleExpand,
    }),
    [toastHeights, isExpanded],
  );

  /**
   * Rows grouped by their EFFECTIVE position, which for a toast with no explicit
   * `position` is the outlet's configured one — the same resolution `ToastRow`
   * itself does (`positionProp ?? positionCtx`).
   *
   * It must NOT be "whichever group happens to come first". Grouping a
   * position-less row by index put it in the top-center group the moment any
   * top-center toast existed, because `ALL_POSITIONS` starts with `top-center`:
   * a plain `toast('Saved')` then rendered against the top inset (visible only as
   * a sliver above the screen edge), and an already-placed one JUMPED there when a
   * top-center toast arrived.
   *
   * The configured position is always kept, even with no rows in it, so
   * position-less rows always have a home. Each group is ordered by its OWN
   * position: a top-anchored stack renders in reverse, and applying the outlet's
   * ordering to every group reversed the wrong ones.
   */
  const toastsByPosition = React.useMemo(() => {
    const groups = new Map<ToastPosition, ToastProps[]>();
    for (const candidate of ALL_POSITIONS) {
      const group = toasts.filter(
        (toast) => (toast.position ?? position) === candidate,
      );
      if (candidate === position || group.length > 0) {
        groups.set(candidate, orderToastsFromPosition(group, candidate));
      }
    }
    return groups;
  }, [toasts, position]);

  const onDismiss = React.useCallback((id: string | number) => {
    toastStore.dismissToast(id, 'onDismiss');
  }, []);

  // Nothing to host while idle. `shouldShowOverlay` stays true for the length of
  // the exit animation after the last dismissal, so this never cuts one short.
  if (!shouldShowOverlay) {
    return null;
  }

  return (
    <ToastHost ToasterOverlayWrapper={ToasterOverlayWrapper}>
      <ToastContext.Provider value={stableValue}>
        <DynamicToastContext.Provider value={dynamicValue}>
          {Array.from(toastsByPosition, ([currentPosition, toastsForPosition]) => {
            const orderedToastIds = getOrderedToastIds(
              toastsForPosition,
              currentPosition,
              enableStacking,
            );

            return (
              <Positioner
                key={currentPosition}
                position={currentPosition}
                style={positionerStyle}
              >
                {toastsForPosition.map((toast, index) => {
                  const row = (
                    <ToastRow
                      key={toast.id}
                      {...toast}
                      style={toast.style ?? style}
                      styles={toast.styles ?? styleOverrides}
                      index={index}
                      numberOfToasts={toastsForPosition.length}
                      orderedToastIds={orderedToastIds}
                      onDismiss={onDismiss}
                      ref={toastStore.getToastRef(toast.id)}
                    />
                  );

                  return ToastWrapper ? (
                    <ToastWrapper key={toast.id} toastId={toast.id}>
                      {row}
                    </ToastWrapper>
                  ) : (
                    row
                  );
                })}
              </Positioner>
            );
          })}
        </DynamicToastContext.Provider>
      </ToastContext.Provider>
    </ToastHost>
  );
};

Toaster.displayName = 'Toaster';
