import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BottomSheet, type BottomSheetRef } from '../bottom-sheet';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { Context, useDialogControl } from './context';
import { DialogBody } from './DialogContent';
import { DialogBottomSheet } from './DialogBottomSheet';
import {
  ANIMATION_DURATION,
  DEFAULT_DIALOG_CONTENT_PADDING,
  DEFAULT_SIDE_WIDTH,
  DIALOG_SHEET_BACKDROP_TESTID,
  PANEL_RADIUS,
  SHEET_BACKDROP_OPACITY,
  SIDE_SHEET_MIN_GUTTER,
  useResolvedPlacement,
} from './placement';
import type {
  DialogAction,
  DialogControlProps,
  DialogInset,
  DialogProps,
} from './types';

export { DIALOG_SHEET_BACKDROP_TESTID };

/**
 * Native variant of `<Dialog>`.
 *
 * Open/close is driven by EITHER the imperative `control` (legacy) OR the
 * controlled `open` prop. When `open` is provided it wins.
 *
 * `placement` selects the surface:
 *
 *   - `'center'` (default) / `'bottom'` — bloom's `BottomSheet` (`detached`
 *     for center: a floating, content-hugging card that degrades from sheet to
 *     centered card via the 500px cap; flush for bottom: a full-width sheet
 *     with a drag handle). Default behavior is unchanged.
 *   - `'left'` / `'right'` — an anchored side-sheet/drawer driven by
 *     reanimated. Exit animations are safe on native.
 *
 * The component accepts three rendering modes simultaneously:
 *
 *   1. Declarative — `title`, `description`, `actions`.
 *   2. Custom children — caller passes JSX, bloom renders the chrome.
 *   3. Pure children — no `title`/`description`/`actions`.
 */
export function Dialog({
  placement,
  ...rest
}: DialogProps) {
  const resolvedPlacement = useResolvedPlacement(placement);

  // `bottom` routes to the shared cross-platform `BottomSheet` surface — one
  // code path with drag-to-dismiss on web and native. `center` (default) and
  // the side-sheets keep their existing native lifecycle below. Each branch is
  // its own component so the dispatcher only ever calls `useResolvedPlacement`,
  // keeping the rules-of-hooks contract intact across a responsive placement
  // change.
  if (resolvedPlacement === 'bottom') {
    return <DialogBottomSheet {...rest} />;
  }
  return <CenteredOrSideDialog {...rest} placement={resolvedPlacement} />;
}

/**
 * Native `center` and `left`/`right` placements. `center` uses bloom's
 * `BottomSheet` in `detached` mode (a floating, content-hugging card that
 * degrades from sheet to centered card via the 500px cap); the side placements
 * use a reanimated drawer. These share one open/close lifecycle. The `bottom`
 * placement is handled separately by `DialogBottomSheet`.
 */
function CenteredOrSideDialog({
  control,
  open: controlledOpen,
  onClose,
  testID,
  title,
  description,
  actions,
  placement,
  width = DEFAULT_SIDE_WIDTH,
  inset,
  dismissOnBackdrop = true,
  contentPadding = DEFAULT_DIALOG_CONTENT_PADDING,
  style,
  panelStyle,
  panelClassName,
  containerStyle,
  containerClassName,
  label,
  children,
}: Omit<DialogProps, 'placement'> & { placement: 'center' | 'left' | 'right' }) {
  const isControlled = controlledOpen !== undefined;
  const isSide = placement === 'left' || placement === 'right';

  // Imperative open state for the side placement (the BottomSheet path owns its
  // own visibility via its ref instead).
  const [sideOpen, setSideOpen] = useState(false);

  const theme = useTheme();
  const ref = useRef<BottomSheetRef>(null);
  const closeCallbacks = useRef<(() => void)[]>([]);
  const titleId = useId();
  const descriptionId = useId();

  // Read the latest controlled flag / `onClose` inside stable callbacks
  // without re-binding them (the context + imperative handle depend on `close`
  // staying referentially stable).
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Drain queued close callbacks atomically — capturing the list and
  // resetting it before invocation ensures a callback that synchronously
  // re-opens the dialog (and queues fresh callbacks) does not see the old
  // ones replayed against the new session.
  const callQueuedCallbacks = useCallback(() => {
    const queued = closeCallbacks.current;
    closeCallbacks.current = [];
    for (const cb of queued) {
      try {
        cb();
      } catch (e) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('Dialog close callback error:', e);
        }
      }
    }
  }, []);

  const open = useCallback(() => {
    setSideOpen(true);
    ref.current?.present();
  }, []);

  // A dismissal request (backdrop, pan-to-close, action button). In controlled
  // mode it asks the host to close via `onClose` (the host flips `open`); in
  // imperative mode it dismisses the surface directly. The optional callback
  // runs once the dialog has finished closing.
  const close = useCallback<DialogControlProps['close']>((cb) => {
    if (typeof cb === 'function') {
      closeCallbacks.current.push(cb);
    }
    if (isControlledRef.current) {
      onCloseRef.current?.();
      return;
    }
    setSideOpen(false);
    ref.current?.dismiss();
  }, []);

  // Fired when the underlying surface has finished closing. Drains queued
  // callbacks, then fires `onClose` ONLY in imperative mode — controlled mode
  // already requested the close through `onClose` (the host then flipped
  // `open`), so firing it again here would double-call it.
  const handleDismiss = useCallback(() => {
    callQueuedCallbacks();
    if (!isControlledRef.current) onCloseRef.current?.();
  }, [callQueuedCallbacks]);

  // In controlled mode, mirror the `open` prop onto the underlying surface so
  // both modes share one lifecycle. The BottomSheet path presents/dismisses by
  // ref; the side path flips `sideOpen`.
  useEffect(() => {
    if (!isControlled) return;
    if (controlledOpen) {
      setSideOpen(true);
      ref.current?.present();
    } else {
      setSideOpen(false);
      ref.current?.dismiss();
    }
  }, [isControlled, controlledOpen]);

  useImperativeHandle(
    control?.ref,
    () => ({ open, close }),
    [open, close],
  );

  const context = useMemo(
    () => ({ close, isWithinDialog: true }),
    [close],
  );

  const sheetStyle = useMemo(
    () => ({
      maxWidth: 500,
      backgroundColor: theme.colors.background,
      // All four corners rounded — bloom's BottomSheet defaults to top-only
      // radius in flush mode, but we use `detached` so the whole card is
      // floating and rounded uniformly.
      borderRadius: 20,
    }),
    [theme.colors.background],
  );

  const bodyNode = (
    <DialogBody
      titleId={titleId}
      descriptionId={descriptionId}
      title={title}
      description={description}
      actions={actions}
    >
      {children}
    </DialogBody>
  );

  if (isSide) {
    return (
      <Context.Provider value={context}>
        <SideSheet
          open={sideOpen}
          onDismiss={handleDismiss}
          side={placement}
          width={width}
          inset={inset}
          dismissOnBackdrop={dismissOnBackdrop}
          contentPadding={contentPadding}
          testID={testID}
          label={label}
          title={title}
          description={description}
          titleId={titleId}
          descriptionId={descriptionId}
          panelStyle={panelStyle}
          panelClassName={panelClassName}
          containerStyle={containerStyle}
          containerClassName={containerClassName}
          style={style}
        >
          {bodyNode}
        </SideSheet>
      </Context.Provider>
    );
  }

  return (
    <BottomSheet
      ref={ref}
      onDismiss={handleDismiss}
      enablePanDownToClose
      detached
      showHandle
      // Stronger dim when a Dialog is stacked over another sheet so the
      // underlying sheet's handle/content doesn't bleed through.
      backdropOpacity={0.7}
      style={sheetStyle}
    >
      <Context.Provider value={context}>
        <View
          testID={testID}
          accessibilityLabel={label}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          {...(panelClassName ? ({ className: panelClassName } as Record<string, string>) : {})}
          style={[
            // Detached BottomSheet already adds `marginBottom: insets.bottom + 16`
            // to the sheet container — the floating card sits ABOVE the
            // system gesture bar, so we don't add `insets.bottom` here.
            { padding: contentPadding },
            { backgroundColor: theme.colors.background },
            style,
            panelStyle,
          ]}
        >
          {bodyNode}
        </View>
      </Context.Provider>
    </BottomSheet>
  );
}

/**
 * Reanimated side-sheet/drawer for the `left`/`right` placements (native).
 *
 * A shared `progress` value times 0 -> 1 on open and 1 -> 0 on close, mapped to
 * the panel translateX and the backdrop opacity. The node stays mounted through
 * the close timing and unmounts from the animation completion callback. Native
 * exit animations are safe (the web `removeChild` crash does not apply).
 */
function SideSheet({
  open,
  onDismiss,
  side,
  width,
  inset,
  dismissOnBackdrop,
  contentPadding,
  testID,
  label,
  title,
  description,
  titleId,
  descriptionId,
  panelStyle,
  panelClassName,
  containerStyle,
  containerClassName,
  style,
  children,
}: {
  open: boolean;
  onDismiss: () => void;
  side: 'left' | 'right';
  width: number;
  inset?: DialogInset;
  dismissOnBackdrop: boolean;
  contentPadding: number;
  testID?: string;
  label?: string;
  title?: string;
  description?: string;
  titleId: string;
  descriptionId: string;
  panelStyle?: StyleProp<ViewStyle>;
  panelClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  containerClassName?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const { width: viewportWidth } = useWindowDimensions();

  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(open ? 1 : 0);

  const insetTop = inset?.top ?? 0;
  const insetBottom = inset?.bottom ?? 0;
  const insetLeft = inset?.left ?? 0;
  const insetRight = inset?.right ?? 0;
  const anchorInset = side === 'left' ? insetLeft : insetRight;
  const oppositeInset = side === 'left' ? insetRight : insetLeft;

  const sideWidth = useMemo(() => {
    const available = viewportWidth - anchorInset - oppositeInset - SIDE_SHEET_MIN_GUTTER;
    return Math.max(0, Math.min(width, available));
  }, [viewportWidth, anchorInset, oppositeInset, width]);

  // Travel distance for the hidden state: the panel's measured width, with the
  // geometry target as the pre-measurement fallback.
  const travel = useSharedValue(sideWidth);
  useEffect(() => {
    travel.value = sideWidth;
  }, [sideWidth, travel]);

  const finishClose = useCallback(() => {
    setMounted(false);
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    cancelAnimation(progress);
    const timing = { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) };
    if (open) {
      setMounted(true);
      progress.value = withTiming(1, timing);
      return;
    }
    if (!mounted) return;
    progress.value = withTiming(0, timing, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [open, mounted, progress, finishClose]);

  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdrop) onDismiss();
  }, [dismissOnBackdrop, onDismiss]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value * SHEET_BACKDROP_OPACITY,
  }), []);

  const hiddenSign = side === 'left' ? -1 : 1;
  const panelAnimatedStyle = useAnimatedStyle(() => {
    const hidden = 1 - progress.value;
    return {
      opacity: progress.value,
      transform: [{ translateX: hidden * travel.value * hiddenSign }],
    };
  }, [hiddenSign]);

  const measurePanel = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      const measured = e.nativeEvent.layout.width;
      if (measured > 0) travel.value = measured;
    },
    [travel],
  );

  const panelGeometry = useMemo<ViewStyle>(
    () =>
      ({
        top: insetTop,
        bottom: insetBottom,
        [side]: anchorInset,
        width: sideWidth,
        borderRadius: PANEL_RADIUS,
      }) as ViewStyle,
    [insetTop, insetBottom, side, anchorInset, sideWidth],
  );

  if (!mounted) return null;

  return (
    <View
      style={[sideStyles.root, containerStyle]}
      {...(containerClassName ? ({ className: containerClassName } as Record<string, string>) : {})}
      pointerEvents="box-none"
    >
      <Animated.View style={[sideStyles.backdrop, backdropAnimatedStyle]} pointerEvents="auto">
        <Pressable
          testID={testID ? `${testID}-backdrop` : DIALOG_SHEET_BACKDROP_TESTID}
          accessibilityRole="button"
          accessibilityLabel={label ? `Dismiss ${label}` : 'Dismiss dialog'}
          onPress={handleBackdropPress}
          disabled={!dismissOnBackdrop}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        accessibilityLabel={label}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        testID={testID}
        onLayout={measurePanel}
        {...(panelClassName ? ({ className: panelClassName } as Record<string, string>) : {})}
        style={[
          sideStyles.panel,
          { backgroundColor: theme.colors.background, shadowColor: theme.colors.shadow },
          panelGeometry,
          panelAnimatedStyle,
          panelStyle,
          style,
        ]}
        pointerEvents="auto"
      >
        <View style={{ padding: contentPadding }}>{children}</View>
      </Animated.View>
    </View>
  );
}

const sideStyles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: Z_INDEX.fullscreen,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  panel: {
    position: 'absolute',
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});

/**
 * Helper used by the imperative `alert()` API. Mounts a `<Dialog>` against
 * a fresh control and presents it immediately. `onResolve` is invoked
 * exactly once when the dialog finishes closing (regardless of how the
 * dismissal happened).
 *
 * Kept private to the dialog module — `alert()` is the public surface.
 */
export function AutoMountedDialog({
  title,
  description,
  actions,
  onResolve,
}: {
  title?: string;
  description?: string;
  actions: DialogAction[];
  onResolve: () => void;
}) {
  const control = useDialogControl();

  // `control` is referentially stable for the lifetime of the component
  // (memoised by `useDialogControl` on `[id]`), so this effect runs exactly
  // once per mount — present-on-mount semantics for an `alert()` call
  // without re-presenting on subsequent renders.
  useEffect(() => {
    control.open();
  }, [control]);

  return (
    <Dialog
      control={control}
      title={title}
      description={description}
      actions={actions}
      onClose={onResolve}
    />
  );
}
