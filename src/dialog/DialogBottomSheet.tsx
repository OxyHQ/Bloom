import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { BottomSheet, type BottomSheetRef } from '../bottom-sheet';
import { useTheme } from '../theme/use-theme';
import { Context } from './context';
import { DialogBody } from './DialogContent';
import {
  DEFAULT_MAX_HEIGHT_RATIO,
  PANEL_RADIUS,
  SHEET_BACKDROP_OPACITY,
} from './placement';
import type { DialogControlProps, DialogProps } from './types';

/**
 * Padding of the bottom-sheet content container (px). Matches the side-sheet
 * and centered-panel body padding so every placement reads identically.
 */
const SHEET_CONTENT_PADDING = 20;

/**
 * Shared `BottomSheet`-backed surface for the `bottom` placement, used by BOTH
 * `Dialog.tsx` (native) and `Dialog.web.tsx` (web). `BottomSheet` is itself a
 * single cross-platform implementation (react-native-gesture-handler +
 * reanimated, drag-to-dismiss on web and native alike), so routing the bottom
 * placement through here gives ONE code path with drag working everywhere — no
 * duplicated CSS slide-up sheet.
 *
 * This component owns the entire open↔present/dismiss bridge and the Dialog →
 * BottomSheet prop mapping in one place:
 *
 *   - `open` (controlled) / `control` (imperative) → `present()` / `dismiss()`
 *   - `onClose`                                     → fired once the sheet settles
 *   - `maxHeightRatio`                              → sheet `maxHeight`
 *   - `showHandle` / `dismissOnBackdrop` / `label`  → forwarded to the surface
 *   - `panelStyle`                                  → paints the sheet surface
 *   - `containerStyle`                              → wraps the content subtree
 *     so a host's CSS-var theme scope (`vars()`) still applies to descendants
 *   - `title` / `description` / `actions` / `children` → declarative body
 */
export function DialogBottomSheet({
  control,
  open: controlledOpen,
  onClose,
  testID,
  title,
  description,
  actions,
  maxHeightRatio = DEFAULT_MAX_HEIGHT_RATIO,
  showHandle = true,
  dismissOnBackdrop = true,
  style,
  panelStyle,
  panelClassName,
  containerStyle,
  containerClassName,
  label,
  children,
}: DialogBottomSheetProps) {
  const isControlled = controlledOpen !== undefined;
  const theme = useTheme();
  const ref = useRef<BottomSheetRef>(null);
  const closeCallbacks = useRef<(() => void)[]>([]);
  const titleId = useId();
  const descriptionId = useId();

  // Read the latest controlled flag / `onClose` inside stable callbacks without
  // re-binding them (the context + imperative handle depend on `close` staying
  // referentially stable).
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Drain queued close callbacks atomically — capturing the list and resetting
  // it before invocation ensures a callback that synchronously re-opens the
  // dialog (and queues fresh callbacks) does not see the old ones replayed
  // against the new session.
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
    ref.current?.dismiss();
  }, []);

  // Fired when the sheet has finished closing. Drains queued callbacks, then
  // fires `onClose` ONLY in imperative mode — controlled mode already requested
  // the close through `onClose` (the host then flipped `open`), so firing it
  // again here would double-call it.
  const handleDismiss = useCallback(() => {
    callQueuedCallbacks();
    if (!isControlledRef.current) onCloseRef.current?.();
  }, [callQueuedCallbacks]);

  // In controlled mode, mirror the `open` prop onto the underlying sheet so both
  // modes share one lifecycle.
  useEffect(() => {
    if (!isControlled) return;
    if (controlledOpen) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [isControlled, controlledOpen]);

  useImperativeHandle(control?.ref, () => ({ open, close }), [open, close]);

  const context = useMemo(() => ({ close, isWithinDialog: true }), [close]);

  // Backdrop press → dismiss, unless the host disabled it. Returning `false`
  // from `onDismissAttempt` blocks the BottomSheet's own backdrop/pan dismissal,
  // which is how `dismissOnBackdrop: false` maps onto the single sheet API.
  const onDismissAttempt = useCallback(
    () => dismissOnBackdrop,
    [dismissOnBackdrop],
  );

  // `panelStyle` paints the sheet surface (e.g. a brand background). It composes
  // AFTER the BottomSheet's internal background so a host palette wins; the
  // shape (radius, max height) is supplied here and remains overridable.
  const sheetStyle = useMemo<StyleProp<ViewStyle>>(() => {
    const maxHeightPercent: `${number}%` = `${Math.round(maxHeightRatio * 100)}%`;
    return [
      {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: PANEL_RADIUS + 4,
        borderTopRightRadius: PANEL_RADIUS + 4,
        maxHeight: maxHeightPercent,
      },
      panelStyle,
    ];
  }, [theme.colors.background, maxHeightRatio, panelStyle]);

  return (
    <BottomSheet
      ref={ref}
      onDismiss={handleDismiss}
      onDismissAttempt={onDismissAttempt}
      enablePanDownToClose
      showHandle={showHandle}
      // Stronger dim than a lone sheet so an underlying sheet's handle/content
      // doesn't bleed through when a Dialog is stacked over one.
      backdropOpacity={SHEET_BACKDROP_OPACITY + 0.3}
      style={sheetStyle}
    >
      <Context.Provider value={context}>
        <View
          testID={testID}
          accessibilityLabel={label}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          {...(containerClassName ? ({ className: containerClassName } as Record<string, string>) : {})}
          {...(panelClassName ? ({ className: panelClassName } as Record<string, string>) : {})}
          style={[
            { padding: SHEET_CONTENT_PADDING },
            // `containerStyle` carries the host's CSS-var theme scope; it wraps
            // the content subtree so descendants read the scoped palette.
            containerStyle,
            style,
            panelStyle,
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
      </Context.Provider>
    </BottomSheet>
  );
}

/**
 * Props the shared bottom-sheet surface consumes — the `bottom`-relevant subset
 * of `DialogProps`. `width`, `maxWidth`, and `inset` are placement-specific to
 * the side/centered surfaces and intentionally excluded.
 */
export type DialogBottomSheetProps = Pick<
  DialogProps,
  | 'control'
  | 'open'
  | 'onClose'
  | 'testID'
  | 'title'
  | 'description'
  | 'actions'
  | 'maxHeightRatio'
  | 'showHandle'
  | 'dismissOnBackdrop'
  | 'style'
  | 'panelStyle'
  | 'panelClassName'
  | 'containerStyle'
  | 'containerClassName'
  | 'label'
  | 'children'
>;
