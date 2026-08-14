import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { type AnimatedStyle } from 'react-native-reanimated';

import { BottomSheet, type BottomSheetRef } from '../bottom-sheet';
import { useTheme } from '../theme/use-theme';
import { StyledView } from '../styles/styled-primitives';
import { Context } from './context';
import { DialogBody } from './DialogContent';
import {
  DIALOG_NAV_BAR_HEIGHT,
  DialogHeaderProvider,
  DialogLargeTitle,
  DialogNavHeader,
  useDialogHeaderController,
} from './DialogHeader';
import { DialogMorphContent, useDialogMorph } from './DialogMorph';
import {
  DEFAULT_DIALOG_CONTENT_PADDING,
  DEFAULT_MAX_HEIGHT_RATIO,
  PANEL_RADIUS,
} from './placement';
import type { DialogControlProps, DialogProps } from './types';

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
  startOpen,
  onClose,
  testID,
  title,
  description,
  actions,
  header,
  maxHeightRatio = DEFAULT_MAX_HEIGHT_RATIO,
  showHandle = true,
  dismissOnBackdrop = true,
  contentPadding = DEFAULT_DIALOG_CONTENT_PADDING,
  scrollable,
  morph,
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
  const { height: viewportHeight } = useWindowDimensions();
  const ref = useRef<BottomSheetRef>(null);
  const closeCallbacks = useRef<(() => void)[]>([]);
  const titleId = useId();
  const descriptionId = useId();
  const headerController = useDialogHeaderController();

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

  const scrollableResolved = scrollable ?? true;

  // Size morphing across an in-place content swap. The sheet is anchored at the
  // bottom, so animating its height makes it grow/shrink from that edge; its
  // width is fixed by the placement. The sheet's own `maxHeight` (the ratio
  // percentage + the safe-area clamp inside `BottomSheet`) does the exact
  // capping — the viewport is just the bound the reshape may not exceed.
  const morphState = useDialogMorph({
    enabled: morph !== false,
    measurable: scrollableResolved,
    maxHeight: viewportHeight,
  });

  // `panelStyle` paints the sheet surface (e.g. a brand background). It composes
  // AFTER the BottomSheet's internal background so a host palette wins; the
  // shape (radius, max height) is supplied here and remains overridable.
  const sheetStyle = useMemo<StyleProp<AnimatedStyle<ViewStyle>>>(() => {
    const maxHeightPercent: `${number}%` = `${Math.round(maxHeightRatio * 100)}%`;
    return [
      {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: PANEL_RADIUS + 4,
        borderTopRightRadius: PANEL_RADIUS + 4,
        maxHeight: maxHeightPercent,
      },
      panelStyle,
      // Drives the card's `height` only while a morph is in flight; at rest it
      // resolves to `height: 'auto'` — the sheet's normal content sizing.
      morphState.panelStyle,
    ];
  }, [theme.colors.background, maxHeightRatio, panelStyle, morphState.panelStyle]);

  // Does this dialog render bloom's declarative chrome (title / description /
  // actions)? This no longer gates the SCROLL decision (that is now the explicit
  // `scrollable` prop below) — it only opts declarative dialogs into the
  // gorhom-style pan coordination for their internal ScrollView. A declarative
  // dialog overflowing on a small viewport needs the coordinated pan so the body
  // scrolls instead of the drag stealing every vertical gesture; pure-custom
  // children keep the legacy always-active pan.
  const hasDeclarativeChrome =
    title !== undefined ||
    description !== undefined ||
    (actions !== undefined && actions.length > 0);

  const dialogBody = (
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

  // Nav-header mode: the Dialog OWNS a sticky gradient nav bar + a large
  // collapsing title over the sheet's OWN scroll content. The bar floats via the
  // BottomSheet `headerOverlay` slot; the sheet's scroll offset feeds the shared
  // controller (`scrollY`) that drives the small-title cross-fade. `contentPadding`
  // is dropped (the large title + screens own their padding).
  const headerBody = header ? (
    scrollableResolved ? (
      <>
        <DialogLargeTitle controller={headerController} header={header} />
        <DialogHeaderProvider controller={headerController}>{dialogBody}</DialogHeaderProvider>
      </>
    ) : (
      <>
        <View style={{ height: DIALOG_NAV_BAR_HEIGHT }} />
        <DialogHeaderProvider controller={headerController}>{dialogBody}</DialogHeaderProvider>
      </>
    )
  ) : null;

  return (
    <BottomSheet
      ref={ref}
      // Seed the sheet's open state so a fresh mount that should be open renders
      // visible on its FIRST commit instead of relying on a present()-in-effect
      // that races the mount and flashes blank. In controlled mode that seed is
      // `controlledOpen`; in imperative mode it is the surface's `startOpen`
      // intent — which is what lets a responsive Dialog survive a resize
      // placement swap (centered card → bottom sheet) STILL OPEN.
      open={isControlled ? controlledOpen : startOpen}
      onDismiss={handleDismiss}
      onDismissAttempt={onDismissAttempt}
      enablePanDownToClose
      // Nav-header mode hides the drag handle (the nav bar sits at the very top);
      // drag-to-dismiss still works via the coordinated body pan.
      showHandle={header ? false : showHandle}
      // Content scrolls inside the sheet's internal ScrollView by default; the
      // Dialog owns the scroll boundary. A surface whose content owns its own
      // scroller (a FlatList / VirtualizedList) passes `scrollable={false}` to
      // opt OUT so there is exactly ONE scroll container (no scroll-in-scroll,
      // no "VirtualizedList inside a plain ScrollView" warning).
      scrollable={scrollableResolved}
      // Declarative dialogs (title/description/actions) that overflow — AND every
      // nav-header page (its scroll content overflows by design) — need
      // gorhom-style pan coordination: the drag-to-dismiss pan only activates
      // when the ScrollView is at the top AND the finger moves down >8dp —
      // otherwise the ScrollView owns the touch. Without this the always-active
      // legacy body-pan steals vertical drags and a tall body cannot scroll
      // (dragging up dismisses the sheet / bleeds into the parent instead). The
      // standalone `BottomSheet` API keeps its legacy `manualActivation={false}`
      // default, so direct consumers are unaffected.
      manualActivation={header ? scrollableResolved : hasDeclarativeChrome}
      // Feed the sheet's scroll offset into the nav header's collapse controller.
      scrollY={header ? headerController.scrollY : undefined}
      // Float the sticky nav bar over the scroll body (clipped to the sheet top).
      headerOverlay={
        header ? (
          <DialogNavHeader
            controller={headerController}
            header={header}
            onDismiss={close}
            collapse={scrollableResolved}
          />
        ) : undefined
      }
      // Stronger dim than a lone sheet so an underlying sheet's handle/content
      // doesn't bleed through when a Dialog is stacked over one.
      // Measures the sheet card — the size a morph starts from.
      onLayout={morphState.onPanelLayout}
      style={sheetStyle}
    >
      <Context.Provider value={context}>
        <StyledView
          testID={testID}
          accessibilityLabel={label}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          // Bottom placement renders ONE node for both, so the two classes are
          // joined rather than spread twice — the second spread used to
          // overwrite the first, so `containerClassName` was silently dropped on
          // this branch and the cast type-checked it anyway.
          className={[containerClassName, panelClassName].filter(Boolean).join(' ') || undefined}
          style={[
            // Nav-header mode: the large title + screens own their padding, so the
            // wrapper adds none. Otherwise the Dialog's uniform content padding.
            header ? null : { padding: contentPadding },
            // `containerStyle` carries the host's CSS-var theme scope; it wraps
            // the content subtree so descendants read the scoped palette.
            containerStyle,
            style,
            panelStyle,
          ]}
        >
          {/* The morph layer is its own node INSIDE the class-name'd container:
              a className'd component's `onLayout` never fires on web, and this
              one has to measure the incoming frame. */}
          <DialogMorphContent morph={morphState}>
            {header ? headerBody : dialogBody}
          </DialogMorphContent>
        </StyledView>
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
  | 'startOpen'
  | 'onClose'
  | 'testID'
  | 'title'
  | 'description'
  | 'actions'
  | 'header'
  | 'maxHeightRatio'
  | 'showHandle'
  | 'dismissOnBackdrop'
  | 'contentPadding'
  | 'scrollable'
  | 'morph'
  | 'style'
  | 'panelStyle'
  | 'panelClassName'
  | 'containerStyle'
  | 'containerClassName'
  | 'label'
  | 'children'
>;
