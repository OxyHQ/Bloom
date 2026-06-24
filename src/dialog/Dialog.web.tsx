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
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { RemoveScrollBar } from 'react-remove-scroll-bar';

import { Portal } from '../portal/index.web';
import { createOverlayZIndex } from '../styles/z-index';
import type { ThemeColors } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Context, useDialogContext, useDialogControl } from './context';
import {
  ANIMATION_DURATION,
  CENTER_FADE_OUT_DURATION,
  DEFAULT_CENTER_MAX_WIDTH,
  DEFAULT_MAX_HEIGHT_RATIO,
  DEFAULT_SIDE_WIDTH,
  DIALOG_SHEET_BACKDROP_TESTID,
  EASE_OUT,
  HANDLE_HEIGHT,
  HANDLE_RADIUS,
  HANDLE_WIDTH,
  PANEL_RADIUS,
  SHEET_BACKDROP_OPACITY,
  SIDE_SHEET_MIN_GUTTER,
  useResolvedPlacement,
  type DialogPlacement,
} from './placement';
import type {
  DialogAction,
  DialogActionColor,
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
 * `document.body`, or — when `placement` is `left`/`right`/`bottom` — an
 * anchored side-sheet or bottom-sheet. Same prop API as native, so call sites
 * are platform agnostic.
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
 * side/bottom modes use self-contained CSS transitions (the `responsive-sheet`
 * technique) on a mounted-through-exit node.
 */
export function Dialog({
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
  maxHeightRatio = DEFAULT_MAX_HEIGHT_RATIO,
  inset,
  showHandle = true,
  dismissOnBackdrop = true,
  style,
  panelStyle,
  panelClassName,
  containerStyle,
  containerClassName,
  label,
  children,
}: DialogProps) {
  // Controlled mode is opt-in: when `open` is a boolean the host owns the
  // visible state; otherwise the legacy imperative `control` path drives it.
  const isControlled = controlledOpen !== undefined;
  const resolvedPlacement = useResolvedPlacement(placement);

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
  // top-most one wins via document-level event order.
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close, isOpen]);

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
            maxHeightRatio={maxHeightRatio}
            inset={inset}
            showHandle={showHandle}
            dismissOnBackdrop={dismissOnBackdrop}
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

/**
 * Renders the dialog's body: optional declarative title + description, any
 * `children`, then the action row. Shared by the centered panel and the
 * side/bottom sheet so all placements present identical content. The
 * `titleId`/`descriptionId` are wired by the caller onto the `role="dialog"`
 * element for `aria-labelledby` / `aria-describedby`.
 */
function DialogBody({
  titleId,
  descriptionId,
  title,
  description,
  actions,
  children,
}: {
  titleId: string;
  descriptionId: string;
  title?: string;
  description?: string;
  actions?: DialogAction[];
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <>
      {title ? (
        <Text
          nativeID={titleId}
          style={{
            fontSize: 22,
            fontWeight: '600',
            color: theme.colors.text,
            paddingBottom: description ? 4 : 16,
            lineHeight: 30,
          }}
        >
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text
          nativeID={descriptionId}
          style={{
            fontSize: 16,
            color: theme.colors.textSecondary,
            paddingBottom: 16,
            lineHeight: 22,
          }}
        >
          {description}
        </Text>
      ) : null}
      {children}
      {actions && actions.length > 0 ? <ActionRow actions={actions} /> : null}
    </>
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
          padding: 20,
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
 * Side-sheet / bottom-sheet surface for the `left`/`right`/`bottom`
 * placements. Pure CSS transitions (the `responsive-sheet` technique): the
 * node stays mounted through the exit while a `shown` flag drives the
 * transform/opacity, so both directions animate without reanimated `exiting`.
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
  maxHeightRatio,
  inset,
  showHandle,
  dismissOnBackdrop,
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
  placement: Exclude<DialogPlacement, 'center'>;
  shown: boolean;
  width: number;
  maxHeightRatio: number;
  inset?: DialogInset;
  showHandle: boolean;
  dismissOnBackdrop: boolean;
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
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();

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
  const isBottom = placement === 'bottom';

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
    if (isBottom) {
      return {
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: Math.round(viewportHeight * maxHeightRatio),
        borderTopLeftRadius: PANEL_RADIUS,
        borderTopRightRadius: PANEL_RADIUS,
        transform: [{ translateY: visible ? 0 : '100%' }],
        opacity: visible ? 1 : 0,
      } as ViewStyle;
    }

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
  }, [isBottom, visible, placement, width, inset, viewportWidth, viewportHeight, maxHeightRatio]);

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
        {isBottom && showHandle ? (
          <View style={sheetStyles.handleRow} pointerEvents="none">
            <View style={[sheetStyles.handle, { backgroundColor: theme.colors.border }]} />
          </View>
        ) : null}
        <View style={sheetStyles.body}>
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

function ActionRow({ actions }: { actions: DialogAction[] }) {
  return (
    <View style={{ width: '100%', gap: 8, justifyContent: 'flex-end' }}>
      {actions.map((action, idx) => (
        <ActionButton
          key={`${action.label}-${idx}`}
          action={action}
        />
      ))}
    </View>
  );
}

function ActionButton({ action }: { action: DialogAction }) {
  const { close } = useDialogContext();
  const theme = useTheme();
  const color: DialogActionColor = action.color ?? 'default';
  const shouldCloseOnPress = action.shouldCloseOnPress ?? true;

  const { background, foreground } = getActionPalette(color, theme.colors);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      const onPress = action.onPress;
      if (color === 'cancel') {
        close(onPress ? () => onPress(e) : undefined);
        return;
      }
      if (shouldCloseOnPress) {
        close(onPress ? () => onPress(e) : undefined);
      } else {
        onPress?.(e);
      }
    },
    [action.onPress, close, color, shouldCloseOnPress],
  );

  return (
    <TouchableOpacity
      style={{
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
        opacity: action.disabled ? 0.5 : 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
      }}
      onPress={handlePress}
      disabled={action.disabled}
      activeOpacity={0.7}
      testID={action.testID}
    >
      <Text style={{ fontSize: 16, fontWeight: '500', color: foreground }}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );
}

function getActionPalette(
  color: DialogActionColor,
  colors: ThemeColors,
): { background: string; foreground: string } {
  switch (color) {
    case 'destructive':
      return {
        background: colors.negative,
        foreground: colors.negativeForeground,
      };
    case 'cancel':
      return { background: colors.contrast50, foreground: colors.text };
    case 'default':
      return { background: colors.primary, foreground: colors.primaryForeground };
    /* c8 ignore next 3 -- TS exhaustiveness guard */
    default: {
      const _exhaustive: never = color;
      return { background: colors.primary, foreground: colors.primaryForeground };
    }
  }
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
  handleRow: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  } as ViewStyle,
  handle: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: HANDLE_RADIUS,
    opacity: 0.5,
  } as ViewStyle,
  body: {
    padding: 20,
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
 * The `left`/`right`/`bottom` placements do NOT depend on this — they animate
 * via self-contained inline CSS transitions and need no keyframe injection.
 */
export const BLOOM_DIALOG_CSS = `
@keyframes bloomDialogFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bloomDialogFadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes bloomDialogZoomFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes bloomDialogZoomFadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
`;
