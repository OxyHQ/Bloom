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
  ScrollView,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { RemoveScrollBar } from 'react-remove-scroll-bar';

import { Backdrop, OverlayRoot } from '../overlay';
import { Portal } from '../portal/index.web';
import { createOverlayZIndex } from '../styles/z-index';
import { WEB_POSITION_FIXED, type WebCssStyle } from '../styles/web-view-style';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useTheme } from '../theme/use-theme';
import { Context, useDialogContext, useDialogControl } from './context';
import { DialogBody } from './DialogContent';
import { DialogBottomSheet } from './DialogBottomSheet';
import {
  DIALOG_NAV_BAR_HEIGHT,
  DialogHeaderProvider,
  DialogLargeTitle,
  DialogNavBarSpacer,
  DialogNavHeader,
  useDialogHeaderController,
} from './DialogHeader';
import { DialogMorphContent, useDialogMorph } from './DialogMorph';
import {
  ANIMATION_DURATION,
  CENTER_FADE_OUT_DURATION,
  DEFAULT_CENTER_MAX_WIDTH,
  DEFAULT_DIALOG_CONTENT_PADDING,
  DEFAULT_MAX_HEIGHT_RATIO,
  DEFAULT_SIDE_WIDTH,
  DIALOG_SHEET_BACKDROP_TESTID,
  EASE_OUT,
  PANEL_RADIUS,
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


/**
 * The four CSS `animation` shorthands driving the centered card and its backdrop.
 * `animation` has no `ViewStyle` key at all — react-native-web forwards it to the
 * DOM node — so these are annotated `WebCssStyle` rather than cast. The
 * `@keyframes` they name are self-injected by `useDialogCss()`.
 */
const ZOOM_FADE_IN: WebCssStyle = {
  animation: 'bloomDialogZoomFadeIn cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
};
const ZOOM_FADE_OUT: WebCssStyle = {
  animation: `bloomDialogZoomFadeOut ease-in ${FADE_OUT_DURATION}ms forwards`,
};
/**
 * Backdrop fade-in duration (ms). The card's zoom-fade is longer; the dim
 * arriving first is what makes the card read as landing ON something.
 */
const BACKDROP_FADE_IN_DURATION = 150;

const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();

const ClosingContext = createContext(false);

// ---------------------------------------------------------------------------
//  Keyframe self-injection
//
//  The centered card + its backdrop animate via CSS `animation` shorthands that
//  reference the `bloomDialog*` @keyframes. Those keyframes MUST exist in the
//  document or the browser silently no-ops the animation (assigns an
//  animation-name that resolves to nothing, then leaves the element at its
//  static computed values — no error, no visible motion). We inject the
//  required stylesheet once, keyed by id, exactly like `Button.web`'s
//  `useButtonCss()`, so every consumer gets working dialog animations with zero
//  app-side setup — no more "remember to paste BLOOM_DIALOG_CSS into your global
//  stylesheet" footgun. The exported `BLOOM_DIALOG_CSS` string stays public for
//  anyone already referencing it manually; a duplicate global copy is a harmless
//  no-op because injection is guarded on the style id.
// ---------------------------------------------------------------------------

const DIALOG_STYLE_ID = 'bloom-dialog-web-css';

function useDialogCss(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(DIALOG_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = DIALOG_STYLE_ID;
    style.textContent = BLOOM_DIALOG_CSS;
    document.head.appendChild(style);
  }, []);
}

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
  startOpen,
  onClose,
  testID,
  title,
  description,
  actions,
  header,
  placement,
  layer,
  width = DEFAULT_SIDE_WIDTH,
  maxWidth = DEFAULT_CENTER_MAX_WIDTH,
  inset,
  dismissOnBackdrop = true,
  contentPadding = DEFAULT_DIALOG_CONTENT_PADDING,
  maxHeightRatio,
  scrollable,
  morph,
  style,
  panelStyle,
  panelClassName,
  containerStyle,
  containerClassName,
  label,
  children,
}: Omit<DialogProps, 'placement'> & { placement: 'center' | 'left' | 'right' }) {
  // Inject the required @keyframes on mount (before the panel ever appears —
  // this component renders once with `isOpen=false` prior to opening, so the
  // stylesheet is present by the time the animated surface mounts).
  useDialogCss();

  // Per-layer overlay z-indices, so a dialog presented on top of another (via
  // the surface stack) paints above it. Defaults to layer 0 — the offset is 0,
  // so a lone dialog's z is byte-for-byte unchanged.
  const dialogZIndex = useMemo(() => createOverlayZIndex(layer ?? 0), [layer]);

  // Controlled mode is opt-in: when `open` is a boolean the host owns the
  // visible state; otherwise the legacy imperative `control` path drives it.
  const isControlled = controlledOpen !== undefined;
  const resolvedPlacement = placement;

  // Seed the initial visible state so a branch that mounts while the surface is
  // already open (the imperative `startOpen` intent) or under a truthy
  // controlled `open` renders open on its FIRST commit — this is what lets a
  // responsive Dialog survive a placement swap (centered card ↔ bottom sheet on
  // resize) without going blank. `startOpen` never flips the close semantics;
  // the imperative `control.close()` still drives the exit + post-exit onClose.
  const [isOpen, setIsOpen] = useState(() => controlledOpen ?? startOpen ?? false);
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

  // The backdrop's fade rides a shared value, NOT a CSS `@keyframes opacity
  // 0 → 1` handed to the layers. A running CSS animation outranks inline styles
  // in the cascade, so those keyframes drove the DIM layer — whose inline
  // opacity IS the dim (0.28) — all the way to 1, i.e. opaque black, and then
  // dropped it back to 0.28 the instant the animation ended. That is the black
  // flash every centered dialog opened with. `progress` is multiplied INTO each
  // layer's own opacity by `Backdrop`, so the dim can only ever reach its own
  // value. (The side-sheet path was never affected: it animates with a CSS
  // *transition*, which interpolates the inline value instead of overriding it.)
  const backdropFade = useSharedValue(0);

  useEffect(() => {
    if (!isOpen) {
      backdropFade.value = 0;
      return;
    }
    backdropFade.value = isClosing
      ? withTiming(0, { duration: FADE_OUT_DURATION, easing: Easing.in(Easing.ease) })
      : withTiming(1, { duration: BACKDROP_FADE_IN_DURATION, easing: Easing.out(Easing.ease) });
  }, [backdropFade, isOpen, isClosing]);

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
            {/* The press target IS the full-viewport box, so it uses
                `Backdrop` (which opts back in from the Portal root's
                `pointer-events: none` via the `pointerEvents` PROP — the style
                form is dropped before it reaches the DOM, see `src/overlay`)
                and lays the panel out inside itself. */}
            <Backdrop
              onPress={() => close()}
              disabled={!dismissOnBackdrop}
              accessibilityLabel={label ? `Dismiss ${label}` : 'Dismiss dialog'}
              // The fade rides on the LAYERS, never on the press target: an
              // opacity animation on the blur's ancestor composites the group in
              // isolation and leaves `backdrop-filter` nothing to sample.
              progress={backdropFade}
              style={{
                position: WEB_POSITION_FIXED,
                zIndex: dialogZIndex.backdrop,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 20,
              }}
            >
              <DialogPanel
                testID={testID}
                label={label}
                title={title}
                description={description}
                actions={actions}
                header={header}
                style={style}
                maxWidth={maxWidth}
                contentPadding={contentPadding}
                maxHeightRatio={maxHeightRatio}
                scrollable={scrollable}
                morph={morph}
                surfaceZIndex={dialogZIndex.surface}
                isClosing={isClosing}
              >
                {children}
              </DialogPanel>
            </Backdrop>
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
            header={header}
            scrollable={scrollable}
            placement={resolvedPlacement}
            shown={!isClosing}
            width={width}
            inset={inset}
            dismissOnBackdrop={dismissOnBackdrop}
            contentPadding={contentPadding}
            backdropZIndex={dialogZIndex.backdrop}
            surfaceZIndex={dialogZIndex.surface}
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
  header,
  style,
  maxWidth,
  contentPadding,
  maxHeightRatio,
  scrollable,
  morph,
  surfaceZIndex,
  isClosing,
  children,
}: {
  testID?: string;
  label?: string;
  title?: string;
  description?: string;
  actions?: DialogAction[];
  header?: DialogProps['header'];
  style?: DialogProps['style'];
  maxWidth: number;
  contentPadding: number;
  maxHeightRatio?: number;
  scrollable?: boolean;
  morph?: boolean;
  surfaceZIndex: number;
  isClosing: boolean;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const { close } = useDialogContext();
  const titleId = useId();
  const descriptionId = useId();
  const headerController = useDialogHeaderController();
  const { height: viewportHeight } = useWindowDimensions();
  const heightRatio = maxHeightRatio ?? DEFAULT_MAX_HEIGHT_RATIO;

  // Size morphing across an in-place content swap. The centered card is the one
  // placement whose width can vary too, so `maxWidth` is handed over as well.
  // The card's own `maxHeight` (the ratio percentage below) does the exact
  // capping — the viewport is just the bound the reshape may not exceed.
  const morphState = useDialogMorph({
    enabled: morph !== false,
    measurable: scrollable !== false,
    maxHeight: viewportHeight,
    maxWidth,
  });

  const body = (
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

  return (
    <Animated.View
      role="dialog"
      aria-label={label}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      testID={testID}
      onLayout={morphState.onPanelLayout}
      onStartShouldSetResponder={() => true}
      onResponderRelease={stopPropagation}
      {...({ onClick: stopPropagation } as Record<string, unknown>)}
      style={[
        {
          position: 'relative',
          borderRadius: 20,
          width: '100%',
          maxWidth,
          // The Dialog OWNS the size cap + scroll boundary (its content renders
          // bare, edge-to-edge). Short content stays natural; tall content is
          // capped at `maxHeightRatio` of the viewport and scrolls inside the
          // rounded card (via the ScrollView below) — consumers never add their
          // own height cap / ScrollView. `overflow: hidden` clips to the radius.
          maxHeight: `${Math.round(heightRatio * 100)}%`,
          overflow: 'hidden',
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          // Design-system overlay elevation (`shadow-m`) as a `boxShadow` — RN-Web
          // deprecated the `shadow*` style props.
          ...bloomShadowStyle('m'),
          zIndex: surfaceZIndex,
        },
        isClosing ? ZOOM_FADE_OUT : ZOOM_FADE_IN,
        // Drives `height` (and `maxWidth`) only while a morph is in flight; at
        // rest it resolves to `height: 'auto'` — the natural sizing above. Placed
        // before `style` so a consumer's explicit size still wins.
        morphState.panelStyle,
        style,
      ]}
    >
      {header ? (
        // Nav-header mode: the Dialog OWNS a sticky gradient nav bar + a large
        // collapsing title over its own scroll content (see `DialogHeader`). The
        // bar overlays; the large title + screen body scroll under it, feeding
        // the shared scroll offset that drives the small-title cross-fade.
        <>
          <DialogNavHeader
            controller={headerController}
            header={header}
            onDismiss={close}
            collapse={scrollable !== false}
          />
          {scrollable === false ? (
            <DialogMorphContent morph={morphState} style={{ flex: 1, minHeight: 0 }}>
              <DialogNavBarSpacer controller={headerController} header={header} />
              <DialogHeaderProvider controller={headerController}>{body}</DialogHeaderProvider>
            </DialogMorphContent>
          ) : (
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: contentPadding }}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => {
                headerController.scrollY.value = e.nativeEvent.contentOffset.y;
              }}
            >
              <DialogMorphContent morph={morphState}>
                <DialogLargeTitle controller={headerController} header={header} />
                <DialogHeaderProvider controller={headerController}>{body}</DialogHeaderProvider>
              </DialogMorphContent>
            </ScrollView>
          )}
        </>
      ) : scrollable === false ? (
        // The content owns its own scrolling (a FlatList / VirtualizedList or a
        // nested ScrollView). Render it bare in a bounded flex box — the card's
        // `maxHeight` + `overflow: hidden` cap it and `flex: 1` + `minHeight: 0`
        // hand the child a bounded height to scroll into — with NO wrapping
        // ScrollView, so a VirtualizedList never nests inside one.
        <DialogMorphContent
          morph={morphState}
          style={{ flex: 1, minHeight: 0, padding: contentPadding }}
        >
          {body}
        </DialogMorphContent>
      ) : (
        <ScrollView
          style={{ flexShrink: 1 }}
          contentContainerStyle={{ padding: contentPadding }}
          showsVerticalScrollIndicator={false}
        >
          <DialogMorphContent morph={morphState}>{body}</DialogMorphContent>
        </ScrollView>
      )}
    </Animated.View>
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
  header,
  scrollable,
  placement,
  shown,
  width,
  inset,
  dismissOnBackdrop,
  contentPadding,
  backdropZIndex,
  surfaceZIndex,
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
  header?: DialogProps['header'];
  scrollable?: boolean;
  placement: 'left' | 'right';
  shown: boolean;
  width: number;
  inset?: DialogInset;
  dismissOnBackdrop: boolean;
  contentPadding: number;
  backdropZIndex: number;
  surfaceZIndex: number;
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
  const headerController = useDialogHeaderController();
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

  const panelTransition = useMemo<WebCssStyle>(
    () => ({
      transitionProperty: 'transform, opacity',
      transitionDuration: `${ANIMATION_DURATION}ms`,
      transitionTimingFunction: EASE_OUT,
    }),
    [],
  );

  const backdropTransition = useMemo<WebCssStyle>(
    () => ({
      transitionProperty: 'opacity',
      transitionDuration: `${ANIMATION_DURATION}ms`,
      transitionTimingFunction: EASE_OUT,
    }),
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
    };
  }, [visible, placement, width, inset, viewportWidth]);

  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdrop) onDismiss();
  }, [dismissOnBackdrop, onDismiss]);

  return (
    <OverlayRoot
      style={[sheetStyles.root, { zIndex: backdropZIndex }, containerStyle]}
      {...(containerClassName ? ({ className: containerClassName } as Record<string, string>) : {})}
    >
      <Backdrop
        testID={testID ? `${testID}-backdrop` : DIALOG_SHEET_BACKDROP_TESTID}
        accessibilityLabel={label ? `Dismiss ${label}` : 'Dismiss dialog'}
        onPress={handleBackdropPress}
        disabled={!dismissOnBackdrop}
        // Same reason as the centred dialog: the transition and the opacity it
        // animates belong to the layers, not to the press target above them.
        // No `dimOpacity` override — one darkness for every Bloom surface.
        layerStyle={backdropTransition}
        style={[sheetStyles.backdrop, { opacity: visible ? 1 : 0 }]}
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
          {
            backgroundColor: theme.colors.background,
            zIndex: surfaceZIndex,
            pointerEvents: 'auto',
            // Design-system overlay elevation (`shadow-m`) as a `boxShadow`.
            ...bloomShadowStyle('m'),
          },
          panelGeometry,
          panelTransition,
          panelStyle,
          style,
        ]}
      >
        {header ? (
          // Nav-header mode on a side drawer: a static titled bar (the drawer
          // body does not own a Dialog scroll offset to drive a collapse) over
          // the content, which is inset below the bar.
          <View style={{ flex: 1, minHeight: 0 }}>
            <DialogNavHeader
              controller={headerController}
              header={header}
              onDismiss={onDismiss}
              collapse={false}
            />
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingTop: DIALOG_NAV_BAR_HEIGHT, paddingBottom: contentPadding }}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              scrollEnabled={scrollable !== false}
              onScroll={(e) => {
                headerController.scrollY.value = e.nativeEvent.contentOffset.y;
              }}
            >
              <DialogHeaderProvider controller={headerController}>
                <DialogBody
                  titleId={titleId}
                  descriptionId={descriptionId}
                  title={title}
                  description={description}
                  actions={actions}
                >
                  {children}
                </DialogBody>
              </DialogHeaderProvider>
            </ScrollView>
          </View>
        ) : (
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
        )}
      </View>
    </OverlayRoot>
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

// Annotated rather than cast: a plain object literal widens `position: 'absolute'`
// to `string`, which is what the three `as ViewStyle` casts here used to silence.
// The annotation supplies the contextual type instead, so the literals narrow and
// a genuine mistake still fails.
const sheetStyles: Record<'root' | 'backdrop' | 'panel', ViewStyle> = {
  // `zIndex` for the root (backdrop) and panel (surface) is applied inline from
  // the per-layer `createOverlayZIndex(layer)` in `SheetSurface`, so a side
  // dialog stacked on top of another (surface stack) paints above it.
  root: {
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    // Geometry only: the colour and the dim level belong to `Backdrop`.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    position: 'absolute',
    overflow: 'hidden',
    // Elevation is applied at the usage site via `bloomShadowStyle('m')`
    // (`boxShadow` on web); the deprecated `shadow*` props were removed.
  },
};

/**
 * CSS keyframes required for the web dialog's centered-card open/close motion.
 *
 * `<Dialog>` self-injects these automatically on web (see `useDialogCss`), so
 * consumers do NOT need to do anything — a working zoom/fade animation ships
 * with zero app-side setup. This constant remains exported for anyone who
 * already references it manually (e.g. a hand-copied block in a global
 * stylesheet); such a copy is a harmless duplicate because the runtime
 * injection is guarded by a unique style id.
 *
 * ```css
 * @keyframes bloomDialogZoomFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
 * @keyframes bloomDialogZoomFadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
 * ```
 *
 * The `left`/`right` placements do NOT depend on this — they animate via
 * self-contained inline CSS transitions and need no keyframe injection. The
 * `bottom` placement uses bloom's `BottomSheet` (reanimated) and needs none.
 */
export const BLOOM_DIALOG_CSS = `
@keyframes bloomDialogZoomFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes bloomDialogZoomFadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
`;
