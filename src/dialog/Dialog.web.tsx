import React, {
  createContext,
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
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { RemoveScrollBar } from 'react-remove-scroll-bar';

import { Portal } from '../portal/index.web';
import { createOverlayZIndex } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { Context, useDialogControl } from './context';
import { DialogBody } from './DialogContent';
import { DialogBottomSheet } from './DialogBottomSheet';
import {
  ANIMATION_DURATION,
  CENTER_FADE_OUT_DURATION,
  DEFAULT_CENTER_MAX_WIDTH,
  DEFAULT_DIALOG_CONTENT_PADDING,
  DEFAULT_SIDE_WIDTH,
  DIALOG_SHEET_BACKDROP_TESTID,
  EASE_OUT,
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

const FADE_OUT_DURATION = CENTER_FADE_OUT_DURATION;
const dialogZIndex = createOverlayZIndex();

const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();

const ClosingContext = createContext(false);

/**
 * Web variant of `<Dialog>`.
 *
 * A centered modal card (default) rendered into the bloom Portal at the end of
 * `document.body`, an anchored side-sheet for `left`/`right`, or — for
 * `bottom` — bloom's cross-platform `BottomSheet` (the SAME component native
 * uses), so the bottom placement drags-to-dismiss on web too. Same prop API as
 * native, so call sites are platform agnostic.
 *
 * Open/close is driven by EITHER the imperative `control` (legacy) OR the
 * controlled `open` prop. When `open` is provided it wins.
 *
 * Accessibility: the panel has `role="dialog"` and the `title`/`description`
 * props (when provided) become the `aria-labelledby` / `aria-describedby`
 * targets. Pressing the backdrop dismisses. Pressing `Escape` dismisses.
 * Focus is locked inside the dialog while it's open.
 *
 * Web motion never uses reanimated `exiting` (which throws `removeChild` on
 * concurrent React unmounts): the centered card uses CSS keyframes and the
 * side modes use self-contained CSS transitions on a mounted-through-exit
 * node. The bottom placement animates via `BottomSheet`'s shared-value/gesture
 * animation (no `exiting` layout animation).
 */
export function Dialog({ placement, ...rest }: DialogProps) {
  const resolvedPlacement = useResolvedPlacement(placement);

  // `bottom` routes to the shared cross-platform `BottomSheet` surface — the
  // SAME component native uses — so drag-to-dismiss works on web too and there
  // is no duplicated CSS slide-up sheet. `center` (default) and the side-sheets
  // keep their DOM-portal implementation below. Each branch is its own
  // component so the dispatcher only ever calls `useResolvedPlacement`, keeping
  // the rules-of-hooks contract intact across a responsive placement change.
  if (resolvedPlacement === 'bottom') {
    return <DialogBottomSheet {...rest} />;
  }
  return <CenterOrSideDialog {...rest} placement={resolvedPlacement} />;
}

/**
 * Web `center` (default) and `left`/`right` placements. The centered card is a
 * DOM-portal modal; the side placements are CSS-transition sheets. The `bottom`
 * placement is handled separately by `DialogBottomSheet` (bloom's cross-platform
 * `BottomSheet`).
 */
function CenterOrSideDialog({
  control,
  open: controlledOpen,
  onClose,
  testID,
  title,
  description,
  actions,
  placement,
  width = DEFAULT_SIDE_WIDTH,
  maxWidth = DEFAULT_CENTER_MAX_WIDTH,
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
  // Controlled mode is opt-in: when `open` is a boolean the host owns the
  // visible state; otherwise the legacy imperative `control` path drives it.
  const isControlled = controlledOpen !== undefined;
  const resolvedPlacement = placement;

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeCallbacksRef = useRef<(() => void)[]>([]);
  // Read the latest controlled flag inside stable callbacks without re-binding.
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;

  const open = useCallback(() => {
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  // A dismissal request (backdrop, Escape, action button). In controlled mode
  // it asks the host to close via `onClose` (the host flips `open`); in
  // imperative mode it starts the exit animation directly. Either way an
  // optional callback runs after the dialog has finished closing.
  const close = useCallback<DialogControlProps['close']>(
    (cb) => {
      if (typeof cb === 'function') {
        closeCallbacksRef.current.push(cb);
      }
      if (isControlledRef.current) {
        onCloseRef.current?.();
        return;
      }
      setIsClosing(true);
    },
    [],
  );

  // `onClose` mirrored into a ref so `close` stays referentially stable (the
  // dialog context + imperative handle depend on it).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // In controlled mode, mirror the `open` prop into the internal open/closing
  // state machine so both modes share the same exit-animation lifecycle.
  useEffect(() => {
    if (!isControlled) return;
    if (controlledOpen) {
      setIsClosing(false);
      setIsOpen(true);
    } else {
      setIsClosing(true);
    }
  }, [isControlled, controlledOpen]);

  const exitDuration =
    resolvedPlacement === 'center' ? FADE_OUT_DURATION : ANIMATION_DURATION;

  useEffect(() => {
    if (!isClosing) return;

    const timer = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      const queued = closeCallbacksRef.current;
      closeCallbacksRef.current = [];
      for (const cb of queued) {
        try {
          cb();
        } catch (e) {
          if (typeof console !== 'undefined' && console.error) {
            console.error('Dialog close callback error:', e);
          }
        }
      }
      // Imperative mode fires `onClose` when the exit settles. Controlled mode
      // already requested the close through `onClose` (the host then flipped
      // `open`), so it must NOT fire it a second time here.
      if (!isControlledRef.current) onCloseRef.current?.();
    }, exitDuration);

    return () => clearTimeout(timer);
  }, [isClosing, exitDuration]);

  // Escape-to-close while open. The listener is intentionally scoped to the
  // open lifetime so stacked dialogs don't fight for the keydown — the
  // top-most one wins via document-level event order. Escape honors
  // `dismissOnBackdrop`: a blocking dialog (e.g. an unanswered confirm) is not
  // dismissible by Escape, matching the backdrop's behavior. The default
  // (`dismissOnBackdrop` true) is unchanged — Escape still closes.
  useEffect(() => {
    if (!isOpen || !dismissOnBackdrop || typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close, dismissOnBackdrop, isOpen]);

  useImperativeHandle(
    control?.ref,
    () => ({ open, close }),
    [open, close],
  );

  const context = useMemo(
    () => ({ close, isWithinDialog: true }),
    [close],
  );

  if (!isOpen) return null;

  if (resolvedPlacement === 'center') {
    return (
      <Portal>
        <Context.Provider value={context}>
          <ClosingContext.Provider value={isClosing}>
            <RemoveScrollBar />
            <Pressable
              onPress={dismissOnBackdrop ? () => close() : undefined}
              disabled={!dismissOnBackdrop}
              // `pointerEvents: 'auto'` opts back in from the Portal root's
              // `pointer-events: none`, which is set so the idle portal
              // doesn't intercept clicks on the underlying app.
              style={{
                position: 'fixed' as 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: dialogZIndex.backdrop,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 20,
                pointerEvents: 'auto',
              }}
            >
              <DialogBackdrop isClosing={isClosing} />
              <DialogPanel
                testID={testID}
                label={label}
                title={title}
                description={description}
                actions={actions}
                style={style}
                maxWidth={maxWidth}
                contentPadding={contentPadding}
                isClosing={isClosing}
              >
                {children}
              </DialogPanel>
            </Pressable>
          </ClosingContext.Provider>
        </Context.Provider>
      </Portal>
    );
  }

  return (
    <Portal>
      <Context.Provider value={context}>
        <ClosingContext.Provider value={isClosing}>
          <RemoveScrollBar />
          <SheetSurface
            testID={testID}
            label={label}
            title={title}
            description={description}
            actions={actions}
            placement={resolvedPlacement}
            shown={!isClosing}
            width={width}
            inset={inset}
            dismissOnBackdrop={dismissOnBackdrop}
            contentPadding={contentPadding}
            onDismiss={close}
            panelStyle={panelStyle}
            panelClassName={panelClassName}
            containerStyle={containerStyle}
            containerClassName={containerClassName}
            style={style}
          >
            {children}
          </SheetSurface>
        </ClosingContext.Provider>
      </Context.Provider>
    </Portal>
  );
}

function DialogPanel({
  testID,
  label,
  title,
  description,
  actions,
  style,
  maxWidth,
  contentPadding,
  isClosing,
  children,
}: {
  testID?: string;
  label?: string;
  title?: string;
  description?: string;
  actions?: DialogAction[];
  style?: DialogProps['style'];
  maxWidth: number;
  contentPadding: number;
  isClosing: boolean;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const titleId = useId();
  const descriptionId = useId();

  return (
    <View
      role="dialog"
      aria-label={label}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      testID={testID}
      onStartShouldSetResponder={() => true}
      onResponderRelease={stopPropagation}
      {...({ onClick: stopPropagation } as Record<string, unknown>)}
      style={[
        {
          position: 'relative',
          borderRadius: 20,
          width: '100%',
          maxWidth,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          shadowColor: '#000',
          shadowOpacity: theme.isDark ? 0.4 : 0.1,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 4 },
          padding: contentPadding,
          zIndex: dialogZIndex.surface,
        },
        isClosing
          ? ({ animation: `bloomDialogZoomFadeOut ease-in ${FADE_OUT_DURATION}ms forwards` } as ViewStyle)
          : ({ animation: 'bloomDialogZoomFadeIn cubic-bezier(0.16, 1, 0.3, 1) 0.3s' } as ViewStyle),
        style,
      ]}
    >
      <DialogBody
        titleId={titleId}
        descriptionId={descriptionId}
        title={title}
        description={description}
        actions={actions}
      >
        {children}
      </DialogBody>
    </View>
  );
}

export { DIALOG_SHEET_BACKDROP_TESTID };

/**
 * Side-sheet surface for the `left`/`right` placements. Pure CSS transitions:
 * the node stays mounted through the exit while a `shown` flag drives the
 * transform/opacity, so both directions animate without reanimated `exiting`.
 *
 * The `bottom` placement is NOT handled here — it routes through
 * `DialogBottomSheet` (bloom's cross-platform `BottomSheet`) so it shares one
 * implementation with native and supports drag-to-dismiss on web.
 */
function SheetSurface({
  testID,
  label,
  title,
  description,
  actions,
  placement,
  shown,
  width,
  inset,
  dismissOnBackdrop,
  contentPadding,
  onDismiss,
  panelStyle,
  panelClassName,
  containerStyle,
  containerClassName,
  style,
  children,
}: {
  testID?: string;
  label?: string;
  title?: string;
  description?: string;
  actions?: DialogAction[];
  placement: 'left' | 'right';
  shown: boolean;
  width: number;
  inset?: DialogInset;
  dismissOnBackdrop: boolean;
  contentPadding: number;
  onDismiss: () => void;
  panelStyle?: StyleProp<ViewStyle>;
  panelClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  containerClassName?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const titleId = useId();
  const descriptionId = useId();
  const { width: viewportWidth } = useWindowDimensions();

  // Defer the entry transition by a frame so the start state paints before the
  // browser animates to `shown`. `entered` is false on the first committed
  // frame, then flips true so the CSS transition runs.
  const frameRef = useRef<FrameToken | null>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    frameRef.current = scheduleFrame(() => {
      frameRef.current = scheduleFrame(() => setEntered(true));
    });
    return () => {
      if (frameRef.current !== null) cancelFrame(frameRef.current);
      frameRef.current = null;
    };
  }, []);

  const visible = shown && entered;

  const panelTransition = useMemo<ViewStyle>(
    () =>
      ({
        transitionProperty: 'transform, opacity',
        transitionDuration: `${ANIMATION_DURATION}ms`,
        transitionTimingFunction: EASE_OUT,
      }) as ViewStyle,
    [],
  );

  const backdropTransition = useMemo<ViewStyle>(
    () =>
      ({
        transitionProperty: 'opacity',
        transitionDuration: `${ANIMATION_DURATION}ms`,
        transitionTimingFunction: EASE_OUT,
      }) as ViewStyle,
    [],
  );

  const panelGeometry = useMemo<ViewStyle>(() => {
    const insetTop = inset?.top ?? 0;
    const insetBottom = inset?.bottom ?? 0;
    const insetLeft = inset?.left ?? 0;
    const insetRight = inset?.right ?? 0;
    const anchorInset = placement === 'left' ? insetLeft : insetRight;
    const oppositeInset = placement === 'left' ? insetRight : insetLeft;
    const available = viewportWidth - anchorInset - oppositeInset - SIDE_SHEET_MIN_GUTTER;
    const cappedWidth = Math.max(0, Math.min(width, available));
    const hiddenSign = placement === 'left' ? '-100%' : '100%';

    return {
      top: insetTop,
      bottom: insetBottom,
      [placement]: anchorInset,
      width: cappedWidth,
      borderRadius: PANEL_RADIUS,
      transform: [{ translateX: visible ? 0 : hiddenSign }],
      opacity: visible ? 1 : 0,
    } as ViewStyle;
  }, [visible, placement, width, inset, viewportWidth]);

  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdrop) onDismiss();
  }, [dismissOnBackdrop, onDismiss]);

  return (
    <View
      style={[sheetStyles.root, containerStyle]}
      {...(containerClassName ? ({ className: containerClassName } as Record<string, string>) : {})}
      pointerEvents="box-none"
    >
      <Pressable
        testID={testID ? `${testID}-backdrop` : DIALOG_SHEET_BACKDROP_TESTID}
        accessibilityRole="button"
        accessibilityLabel={label ? `Dismiss ${label}` : 'Dismiss dialog'}
        onPress={handleBackdropPress}
        disabled={!dismissOnBackdrop}
        style={[
          sheetStyles.backdrop,
          backdropTransition,
          { opacity: visible ? SHEET_BACKDROP_OPACITY : 0 },
        ]}
      />

      <View
        role="dialog"
        aria-label={label}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        accessibilityViewIsModal
        testID={testID}
        onStartShouldSetResponder={() => true}
        onResponderRelease={stopPropagation}
        {...({ onClick: stopPropagation } as Record<string, unknown>)}
        {...(panelClassName ? ({ className: panelClassName } as Record<string, string>) : {})}
        style={[
          sheetStyles.panel,
          { backgroundColor: theme.colors.background, shadowColor: theme.colors.shadow },
          panelGeometry,
          panelTransition,
          panelStyle,
          style,
        ]}
        pointerEvents="auto"
      >
        <View style={{ padding: contentPadding }}>
          <DialogBody
            titleId={titleId}
            descriptionId={descriptionId}
            title={title}
            description={description}
            actions={actions}
          >
            {children}
          </DialogBody>
        </View>
      </View>
    </View>
  );
}

/**
 * Opaque token returned by `scheduleFrame`. `requestAnimationFrame` returns a
 * number; the `setTimeout` fallback returns a timer handle.
 */
type FrameToken = { raf: number } | { timer: ReturnType<typeof setTimeout> };

function scheduleFrame(cb: () => void): FrameToken {
  if (typeof requestAnimationFrame === 'function') {
    return { raf: requestAnimationFrame(cb) };
  }
  return { timer: setTimeout(cb, 0) };
}

function cancelFrame(token: FrameToken): void {
  if ('raf' in token) {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(token.raf);
    return;
  }
  clearTimeout(token.timer);
}

function DialogBackdrop({ isClosing }: { isClosing: boolean }) {
  const style: ViewStyle[] = [
    {
      position: 'fixed' as 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
    },
    isClosing
      ? ({ animation: `bloomDialogFadeOut ease-in ${FADE_OUT_DURATION}ms forwards` } as ViewStyle)
      : ({ animation: 'bloomDialogFadeIn ease-out 0.15s' } as ViewStyle),
  ];

  return <View style={style} />;
}

/**
 * Inline imperative dialog used by `alert()`. Mounts and immediately
 * presents; resolves the host's `onResolve` once the dialog has finished
 * its exit animation.
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

const sheetStyles = {
  root: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: dialogZIndex.backdrop,
  } as ViewStyle,
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  } as ViewStyle,
  panel: {
    position: 'absolute',
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    zIndex: dialogZIndex.surface,
  } as ViewStyle,
};

/**
 * CSS keyframes required for web dialog animations.
 * Consumers should inject this string into a <style> tag or their global CSS:
 *
 * ```css
 * @keyframes bloomDialogFadeIn { from { opacity: 0; } to { opacity: 1; } }
 * @keyframes bloomDialogFadeOut { from { opacity: 1; } to { opacity: 0; } }
 * @keyframes bloomDialogZoomFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
 * @keyframes bloomDialogZoomFadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
 * ```
 *
 * The `left`/`right` placements do NOT depend on this — they animate via
 * self-contained inline CSS transitions and need no keyframe injection. The
 * `bottom` placement uses bloom's `BottomSheet` (reanimated) and needs none.
 */
export const BLOOM_DIALOG_CSS = `
@keyframes bloomDialogFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bloomDialogFadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes bloomDialogZoomFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes bloomDialogZoomFadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
`;
