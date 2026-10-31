import { useScreen } from '../screen/context';
import type { ScreenComponents } from '../screen/types';
import type { ScrollAreaProps } from '../layout/types';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import React, {
  type ComponentRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { PageHeader } from '../page-header';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { Backdrop, OverlayRoot } from '../overlay';
import { ModalKeyboard } from '../overlay/ModalKeyboard';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import { SurfacePaint } from '../surface/SurfacePaint';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceFill } from '../styles/surface-levels';
import {
  SettingsModalContext,
  settingsLayoutFor,
  useSettingsPalette,
  type SettingsModalLayout,
} from './context';
import { ModalPortal } from './modal-portal';
import type { SettingsPalette } from './palette';
import type {
  SettingsLayoutProps,
  SettingsModalLabels,
  SettingsModalPage,
  SettingsModalProps,
  SettingsNavGroup,
  SettingsNavItem,
} from './types';
import { useKeyboardReveal } from './use-keyboard-reveal';
import { useSettingsWebCss } from './web-css';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { SETTINGS_MODAL_MESSAGES } from './messages';
import { IS_WEB } from '../styles/platform';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';
import { mergeRefs } from '../hooks/merge-refs';
import { surfacePresenceVars, useSurfacePresenceContent } from '../surface/use-surface-presence';
import { useContainerWidth } from '../hooks/use-container-width';
import { useDirectionProps } from '../hooks/use-is-rtl';
import type { WindowControlsRoom } from '../window/types';
import { useWindow } from '../window/use-window';
import { useWindowCornerTaken, WindowCornerProvider } from '../window/context';
import { WindowControls } from '../window/WindowControls';
import { WindowDragRegion } from '../window/WindowDragRegion';
import type { AppShellProps } from '../app-shell/types';
import type { PanelNavigationEntry, PanelNavigationState } from '../app-shell/panel-layout-types';

export function createSettings(
  { Screen, ScreenScrollView }: ScreenComponents,
  ScrollArea: React.ComponentType<ScrollAreaProps>,
  /**
   * The composer `SettingsLayout`'s window is built with. Only the layout's
   * entry passes it (`SettingsLayout.tsx`): the modal's must not link AppShell
   * (`lean-entries.test.ts`), and a modal is never a window's content.
   */
  AppShell: React.ComponentType<AppShellProps> | null,
) {
  /**
   * A settings modal.
   *
   *   backdrop  black @ 70%
   *   panel     871×614 (capped at the viewport − 32), radius 24,
   *             background/full, shadow-xs, clipped
   *   rail      274 wide, background/secondary, 1px right separator, p 10,
   *             groups 20 apart; group = pt 4, label (pl 8, body-medium,
   *             text/secondary) 6 above rows 4 apart; row = p 8, radius 10,
   *             20px icon (icon/secondary) + 8 + body-medium label
   *             (selected: background/secondary/hover + text/primary;
   *             hover: background/secondary/hover @ 60%)
   *   content   one viewport with a sticky PageHeader and its scroll-linked edge;
   *             content insets belong to the page body, never the viewport
   *   toast     "Saved" pill straddling the panel's bottom edge: 1px
   *             border/button, background/primary, py 4 pr 10 pl 6, gap 4,
   *             16px lime check + body-2-medium, shadow-dropdown. Rises 12px in,
   *             drifts 10px up on the way out, scale .9 + blur 2px, 200ms.
   *
   * Motion: the panel fades, un-blurs (4px, web) and scales from .85 over 300ms
   * on `cubic-bezier(0.32, 0.72, 0, 1)`; the backdrop cross-fades; close plays
   * the same in reverse and unmounts after it. All of it snaps under reduced
   * motion.
   *
   * WHY NOT `Dialog`: this shell differs from Dialog's centered card in every
   * load-bearing way — its own backdrop (black 70%, no blur), radius, surface,
   * size, motion curve and a toast that must sit OUTSIDE the panel's clip.
   * Dialog's card owns its chrome, its keyframes and its overflow, so hosting
   * this inside it means overriding all of them from outside. The shell is built
   * from the same authorities Dialog is — `Portal`, `OverlayRoot` (the stacking
   * rank) and `Backdrop` (the pointer-events contract) — and takes Dialog's
   * `control` from `useDialogControl()`, so it is driven exactly like one.
   */

  const PANEL_WIDTH = 871;
  const PANEL_HEIGHT = 614;
  const RAIL_WIDTH = 274;
  /** `medium` layout: the rail narrows so the page keeps a readable measure. */
  const RAIL_WIDTH_MEDIUM = 220;
  /** Content inset per layout — 32 at regular, stepping down with the room. */
  const CONTENT_INSET: Record<SettingsModalLayout, number> = {
    regular: 32,
    medium: 24,
    compact: 16,
  };
  const VIEWPORT_GUTTER = 16;
  const MOTION_MS = 300;
  const UNMOUNT_MS = 320;
  const MOTION_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const EASE = Easing.bezier(0.32, 0.72, 0, 1);
  /** Tailwind `ease-out` — the backdrop's cross-fade. */
  const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
  const SAVED_VISIBLE_MS = 2000;
  const SAVED_FADE_MS = 220;
  /** `SettingsLayout`: the toast's centre above the bottom edge, inside the box. */
  const TOAST_INSET = 32;

  type SavedPhase = 'hidden' | 'shown' | 'leaving';

  /** Double rAF — the hidden state must commit before the transition runs. */
  function afterPaint(fn: () => void): () => void {
    if (typeof requestAnimationFrame !== 'function') {
      const t = setTimeout(fn, 0);
      return () => clearTimeout(t);
    }
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(fn);
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }

  function firstPage(groups: SettingsNavGroup[]): string | undefined {
    for (const group of groups) {
      for (const item of group.items) if (item.page) return item.page;
    }
    return undefined;
  }

  /**
   * The navigation both hosts share: the current page (controlled or not), the
   * pages visited (back and forward, a window's history), the compact list →
   * page step and the leave guard.
   */
  function useSettingsNavigation({
    groups,
    page: controlledPage,
    defaultPage,
    onPageChange,
    initialView,
    onBeforeLeave,
  }: Pick<
    SettingsLayoutProps,
    'groups' | 'page' | 'defaultPage' | 'onPageChange' | 'onBeforeLeave'
  > & { initialView: 'navigation' | 'page' }) {
    const serial = useRef(0);
    const entryFor = useCallback(
      (page: string | undefined): PanelNavigationEntry => ({
        key: `page-${++serial.current}`,
        name: page ?? '',
      }),
      [],
    );
    // The pages visited, as a panel's history: selecting one drops what was
    // ahead and goes to it; back and forward move through them.
    const [history, setHistory] = useState<PanelNavigationState>(() => ({
      entries: [entryFor(controlledPage ?? defaultPage ?? firstPage(groups))],
      index: 0,
    }));
    const latest = useRef(history);
    latest.current = history;
    const visited = history.entries[history.index]?.name || undefined;
    const currentPage = controlledPage ?? visited;

    // A controlled page moved by its owner, not through this history: it is
    // the next place visited.
    useEffect(() => {
      if (controlledPage === undefined || controlledPage === visited) return;
      const current = latest.current;
      const entries = [...current.entries.slice(0, current.index + 1), entryFor(controlledPage)];
      setHistory({ entries, index: entries.length - 1 });
    }, [controlledPage, visited, entryFor]);

    // `compact` layout is two levels: the section list, then a page pushed over it.
    const [compactPageOpen, setCompactPageOpen] = useState(initialView === 'page');
    const initialViewRef = useRef(initialView);
    initialViewRef.current = initialView;

    const beforeLeaveRef = useRef(onBeforeLeave);
    beforeLeaveRef.current = onBeforeLeave;
    const mayLeave = useCallback(
      (reason: 'close' | 'navigation' | 'page') => beforeLeaveRef.current?.(reason) !== false,
      [],
    );
    const onPageChangeRef = useRef(onPageChange);
    onPageChangeRef.current = onPageChange;

    const defaultPageRef = useRef(defaultPage ?? firstPage(groups));
    defaultPageRef.current = defaultPage ?? firstPage(groups);

    /** Back to the default page and the initial view, as every open of the modal is. */
    const reset = useCallback(() => {
      setHistory({ entries: [entryFor(defaultPageRef.current)], index: 0 });
      setCompactPageOpen(initialViewRef.current === 'page');
    }, [entryFor]);

    const selectPage = useCallback(
      (next: string) => {
        if (next !== currentPage && !mayLeave('page')) return;
        if (next !== currentPage) {
          const current = latest.current;
          const entries = [...current.entries.slice(0, current.index + 1), entryFor(next)];
          setHistory({ entries, index: entries.length - 1 });
        }
        setCompactPageOpen(true);
        onPageChangeRef.current?.(next);
      },
      [currentPage, mayLeave, entryFor],
    );

    /** Moves to another place in the history (back, forward), guarded as a page change is. */
    const navigate = useCallback(
      (next: PanelNavigationState) => {
        const current = latest.current;
        if (next.index === current.index && next.entries === current.entries) return;
        const page = next.entries[next.index]?.name;
        const leaving = page !== current.entries[current.index]?.name;
        if (leaving && !mayLeave('page')) return;
        latest.current = next;
        setHistory(next);
        if (leaving && page) onPageChangeRef.current?.(page);
      },
      [mayLeave],
    );

    const requestNavigation = useCallback(() => {
      if (mayLeave('navigation')) setCompactPageOpen(false);
    }, [mayLeave]);

    return {
      currentPage,
      history,
      navigate,
      compactPageOpen,
      mayLeave,
      reset,
      selectPage,
      requestNavigation,
    };
  }

  type SettingsNavigationState = ReturnType<typeof useSettingsNavigation>;

  /** The "Saved" toast's phase, and the trigger pages call (`useSettingsSavedToast`). */
  function useSavedToast() {
    const [savedPhase, setSavedPhase] = useState<SavedPhase>('hidden');
    const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const showSaved = useCallback(() => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
      setSavedPhase('shown');
      savedTimer.current = setTimeout(() => {
        setSavedPhase('leaving');
        // Back to the below-the-edge start once faded, so the next save rises in again.
        savedTimer.current = setTimeout(() => setSavedPhase('hidden'), SAVED_FADE_MS);
      }, SAVED_VISIBLE_MS);
    }, []);
    const hideSaved = useCallback(() => setSavedPhase('hidden'), []);
    useEffect(
      () => () => {
        if (savedTimer.current) clearTimeout(savedTimer.current);
      },
      [],
    );
    return { savedPhase, showSaved, hideSaved };
  }

  function SettingsModal({
    control,
    open: controlledOpen,
    onClose,
    onBeforeLeave,
    groups,
    pages,
    page: controlledPage,
    defaultPage,
    onPageChange,
    initialView = 'navigation',
    labels,
    testID,
  }: SettingsModalProps) {
    const panelRef = useRef<ComponentRef<typeof View>>(null);
    const { messages } = useMessages(SETTINGS_MODAL_MESSAGES);
    useSettingsWebCss();
    const parentFill = useSurfaceFill();
    const palette = useSettingsPalette();
    const publishedFill = resolveSurfaceMaterial({
      fill: palette.full,
      parentFill: parentFill,
    }).publishedFill;
    const reducedMotion = useReducedMotion();
    const isControlled = controlledOpen !== undefined;

    const [mounted, setMounted] = useState(controlledOpen === true);
    // Whether the modal is WANTED open. It leads `visible`, which only turns true
    // a painted frame after mount: a close requested inside that window (Escape
    // pressed the moment the panel appears) must cancel the pending enter, not be
    // overwritten by it.
    const [wanted, setWanted] = useState(controlledOpen === true);
    const [visible, setVisible] = useState(false);
    // Bumped by every open, so reopening during an exit replays the enter.
    const [openCount, setOpenCount] = useState(0);
    // The modal's own size follows the WINDOW (full screen below `compact`,
    // the 871×614 panel above), so its layout does too.
    const { width: vw, height: vh } = useWindowDimensions();
    const layout = settingsLayoutFor(vw);
    const layoutRef = useRef(layout);
    layoutRef.current = layout;
    const insets = useCssSafeAreaInsets(useSafeAreaInsets());

    const navigation = useSettingsNavigation({
      groups,
      page: controlledPage,
      defaultPage,
      onPageChange,
      initialView,
      onBeforeLeave,
    });
    const { mayLeave, reset, requestNavigation } = navigation;

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const isControlledRef = useRef(isControlled);
    isControlledRef.current = isControlled;

    const show = useCallback(() => {
      reset();
      setMounted(true);
      setWanted(true);
      setOpenCount((count) => count + 1);
    }, [reset]);

    const hide = useCallback(() => {
      setWanted(false);
      setVisible(false);
    }, []);

    // Enter: once mounted, the hidden frame commits, then the transition runs —
    // unless a close arrived first, which cancels the pending frame.
    useEffect(() => {
      if (!mounted || !wanted) return;
      return afterPaint(() => setVisible(true));
    }, [mounted, wanted, openCount]);

    // Exit: `wanted` and `visible` go false before `mounted` does, so this runs
    // for every close. A modal that was shown unmounts after the reverse
    // transition; one closed before it ever became visible has nothing to
    // animate and unmounts at once.
    const wasVisible = useRef(false);
    useEffect(() => {
      if (visible) {
        wasVisible.current = true;
        return;
      }
      if (!mounted || wanted) return;
      const timer = setTimeout(
        () => {
          wasVisible.current = false;
          setMounted(false);
          if (!isControlledRef.current) onCloseRef.current?.();
        },
        reducedMotion || !wasVisible.current ? 0 : UNMOUNT_MS,
      );
      return () => clearTimeout(timer);
    }, [visible, mounted, wanted, reducedMotion]);

    // Controlled mode mirrors `open` into the same two-phase lifecycle.
    useEffect(() => {
      if (!isControlled) return;
      if (controlledOpen) show();
      else hide();
    }, [isControlled, controlledOpen, show, hide]);

    const requestClose = useCallback(() => {
      if (!mayLeave('close')) return false;
      if (isControlledRef.current) onCloseRef.current?.();
      else hide();
      return true;
    }, [hide, mayLeave]);

    useImperativeHandle(
      control?.ref,
      () => ({
        open: show,
        close: (cb?: () => void) => {
          if (requestClose() && cb) setTimeout(cb, UNMOUNT_MS);
        },
      }),
      [show, requestClose],
    );

    const compactPageOpenRef = useRef(false);
    compactPageOpenRef.current = navigation.compactPageOpen && layoutRef.current === 'compact';

    // Android back closes, like a native modal — handed to `OverlayRoot`, which
    // owns hardware back for every portaled surface.
    const onHardwareBack = useCallback(() => {
      // On a pushed page (compact), back returns to the section list first.
      if (compactPageOpenRef.current) requestNavigation();
      else requestClose();
    }, [requestClose, requestNavigation]);

    // ----- saved toast -------------------------------------------------------
    const { savedPhase, showSaved, hideSaved } = useSavedToast();
    useEffect(() => {
      if (!mounted) hideSaved();
    }, [mounted, hideSaved]);

    const context = useMemo(
      () => ({ showSaved, close: requestClose, layout }),
      [showSaved, requestClose, layout],
    );

    // ----- motion ------------------------------------------------------------
    const progress = useSharedValue(0);
    useEffect(() => {
      progress.value = reducedMotion
        ? visible
          ? 1
          : 0
        : withTiming(visible ? 1 : 0, { duration: MOTION_MS, easing: EASE_OUT });
    }, [visible, reducedMotion, progress]);

    const panelProgress = useSharedValue(0);
    useEffect(() => {
      if (IS_WEB) return;
      panelProgress.value = reducedMotion
        ? visible
          ? 1
          : 0
        : withTiming(visible ? 1 : 0, { duration: MOTION_MS, easing: EASE });
    }, [visible, reducedMotion, panelProgress]);
    const isCompact = layout === 'compact';
    const nativePanelMotion = useAnimatedStyle(
      () => ({
        opacity: panelProgress.value,
        transform: isCompact
          ? [{ translateY: 16 * (1 - panelProgress.value) }]
          : [{ scale: 0.85 + 0.15 * panelProgress.value }],
      }),
      [panelProgress, isCompact],
    );

    // Full screen, a .85 scale reads as the page shrinking away; compact rises 16px instead.
    // The panel paints the material, so on the web its wrapper only moves: the
    // fade and un-blur run through the panel's presence and its content.
    const webPanelMotion: WebCssStyle = {
      transform: isCompact ? [{ translateY: visible ? 0 : 16 }] : [{ scale: visible ? 1 : 0.85 }],
      transitionProperty: 'transform',
      transitionDuration: reducedMotion ? '0ms' : `${MOTION_MS}ms`,
      transitionTimingFunction: MOTION_EASING,
    };
    const presenceMs = reducedMotion ? 0 : MOTION_MS;
    const [panelNode, setPanelNode] = useState<ComponentRef<typeof View> | null>(null);
    const attachPanel = useMemo(() => mergeRefs([panelRef, setPanelNode]), []);
    useSurfacePresenceContent(panelNode, {
      presence: visible ? 1 : 0,
      duration: presenceMs,
      easing: MOTION_EASING,
      blur: 4,
    });

    if (!mounted) return null;

    const closeLabel = labels?.close ?? messages.close;

    return (
      <ModalPortal>
        <SettingsModalContext.Provider value={context}>
          <OverlayRoot onRequestClose={onHardwareBack} modal>
            {IS_WEB ? (
              <ModalKeyboard
                panelRef={panelRef}
                closing={!wanted}
                dismissible
                dismiss={requestClose}
              />
            ) : null}
            <Backdrop
              onPress={requestClose}
              progress={progress}
              blurIntensity={0}
              dimColor="#000"
              dimOpacity={0.7}
              accessibilityLabel={closeLabel}
              testID={testID ? `${testID}-backdrop` : undefined}
            >
              <View
                pointerEvents="box-none"
                style={[styles.center, layout === 'compact' ? styles.centerCompact : null]}
              >
                <Animated.View
                  pointerEvents="box-none"
                  style={[
                    styles.motion,
                    layout === 'compact' ? styles.motionCompact : null,
                    IS_WEB ? webPanelMotion : nativePanelMotion,
                  ]}
                >
                  <View
                    ref={attachPanel}
                    tabIndex={IS_WEB ? -1 : undefined}
                    role="dialog"
                    aria-modal
                    aria-label={labels?.dialog ?? messages.dialog}
                    testID={testID}
                    {...webDataSet({ bloomSettingsDialog: '' })}
                    style={[
                      styles.panel,
                      layout === 'compact'
                        ? {
                            // Full screen: no radius, no gutter, content inside the safe area.
                            width: vw,
                            height: vh,
                            borderRadius: 0,
                            paddingTop: insets.top,
                            paddingBottom: insets.bottom,
                            paddingLeft: insets.left,
                            paddingRight: insets.right,
                          }
                        : {
                            width: Math.min(PANEL_WIDTH, vw - VIEWPORT_GUTTER * 2),
                            height: Math.min(PANEL_HEIGHT, vh - VIEWPORT_GUTTER * 2),
                          },
                      {
                        backgroundColor: 'transparent',
                        ...surfaceFillVars(publishedFill),
                        boxShadow: palette.shadowXs,
                      },
                      IS_WEB
                        ? ({
                            ...surfacePresenceVars(visible ? 1 : 0, presenceMs),
                            boxShadow: visible ? palette.shadowXs : 'none',
                            transitionProperty: 'box-shadow',
                            transitionDuration: `${presenceMs}ms`,
                            transitionTimingFunction: MOTION_EASING,
                          } as WebCssStyle)
                        : null,
                      ringVars(palette),
                    ]}
                  >
                    <SurfacePaint fill={palette.full} radius={layout === 'compact' ? 0 : 24} />
                    <SurfaceLevelProvider level={1} fill={publishedFill}>
                      <SettingsPanes
                        layout={layout}
                        navigation={navigation}
                        groups={groups}
                        pages={pages}
                        labels={labels}
                        onClose={requestClose}
                        room={null}
                        palette={palette}
                        testID={testID}
                      />
                    </SurfaceLevelProvider>
                  </View>
                  <SavedToast
                    phase={savedPhase}
                    label={labels?.saved ?? messages.saved}
                    palette={palette}
                    reducedMotion={reducedMotion}
                    testID={testID ? `${testID}-saved` : undefined}
                  />
                </Animated.View>
              </View>
            </Backdrop>
          </OverlayRoot>
        </SettingsModalContext.Provider>
      </ModalPortal>
    );
  }

  /**
   * The settings themselves, in a box of any size: the rail and the pages side
   * by side, or (narrower than 640) the section list with a page pushed over
   * it. Its layout follows the box's MEASURED width, not the window's, so the
   * same settings are a modal (`SettingsModal`), an application window or a
   * panel. As a window's content (`windowControls="auto"`, where the platform
   * has windows) the rail keeps the window controls' room at its top and moves
   * the window; narrow, the header keeps it at its leading edge.
   */
  function SettingsLayout({
    onClose,
    onBeforeLeave,
    groups,
    pages,
    page,
    defaultPage,
    onPageChange,
    initialView = 'navigation',
    layout: layoutProp,
    windowControls = 'auto',
    labels,
    style,
    testID,
  }: SettingsLayoutProps) {
    const { messages } = useMessages(SETTINGS_MODAL_MESSAGES);
    useSettingsWebCss();
    const palette = useSettingsPalette();
    const reducedMotion = useReducedMotion();
    const dirProps = useDirectionProps();
    // The window until the first layout, so a layout that spans the window is
    // right on frame one; an embedded one pays a single layout pass.
    const { width: windowWidth } = useWindowDimensions();
    const { width: measuredWidth, onLayout } = useContainerWidth();
    const layout = layoutProp ?? settingsLayoutFor(measuredWidth ?? windowWidth);

    const navigation = useSettingsNavigation({
      groups,
      page,
      defaultPage,
      onPageChange,
      initialView,
      onBeforeLeave,
    });
    const { mayLeave } = navigation;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const requestClose = useCallback(() => {
      if (mayLeave('close')) onCloseRef.current?.();
    }, [mayLeave]);

    const { savedPhase, showSaved } = useSavedToast();
    const context = useMemo(
      () => ({ showSaved, close: requestClose, layout }),
      [showSaved, requestClose, layout],
    );

    // The window's content, unless a region above already holds its corner
    // (the layout is a panel in an application's shell).
    const platformWindow = useWindow();
    const cornerTaken = useWindowCornerTaken();
    const appWindow = windowControls === 'auto' && !cornerTaken ? platformWindow : null;
    const windowChrome = appWindow != null && !appWindow.fullscreen;
    // A window wide enough for the rail beside the page is composed as every
    // Oxy application's window is: Bloom's AppShell, the rail its sidebar and
    // the page its panel, whose history the page's header (the window's
    // toolbar) goes back and forward through. The shell keeps the controls'
    // room and draws them. Narrower, the section list and its pushed page.
    if (AppShell != null && appWindow != null && layout !== 'compact') {
      return (
        <SettingsModalContext.Provider value={context}>
          <View
            {...dirProps}
            onLayout={onLayout}
            testID={testID}
            style={[styles.layout, { backgroundColor: palette.full }, ringVars(palette), style]}
          >
            <SurfaceLevelProvider level={1} fill={palette.full}>
              <SettingsWindow
                layout={layout}
                navigation={navigation}
                groups={groups}
                pages={pages}
                labels={labels}
                onClose={onClose ? requestClose : undefined}
                palette={palette}
                testID={testID}
              />
            </SurfaceLevelProvider>
            <SavedToast
              phase={savedPhase}
              label={labels?.saved ?? messages.saved}
              palette={palette}
              reducedMotion={reducedMotion}
              inset={TOAST_INSET}
              testID={testID ? `${testID}-saved` : undefined}
            />
          </View>
        </SettingsModalContext.Provider>
      );
    }

    const settings = (
      <SettingsModalContext.Provider value={context}>
        <View
          {...dirProps}
          onLayout={onLayout}
          testID={testID}
          style={[styles.layout, { backgroundColor: palette.full }, ringVars(palette), style]}
        >
          <SurfaceLevelProvider level={1} fill={palette.full}>
            <SettingsPanes
              layout={layout}
              navigation={navigation}
              groups={groups}
              pages={pages}
              labels={labels}
              onClose={onClose ? requestClose : undefined}
              room={windowChrome ? appWindow.metrics.room : null}
              palette={palette}
              testID={testID}
            />
          </SurfaceLevelProvider>
          <SavedToast
            phase={savedPhase}
            label={labels?.saved ?? messages.saved}
            palette={palette}
            reducedMotion={reducedMotion}
            inset={TOAST_INSET}
            testID={testID ? `${testID}-saved` : undefined}
          />
          {windowChrome ? (
            <WindowControls testID={testID ? `${testID}-window-controls` : undefined} />
          ) : null}
        </View>
      </SettingsModalContext.Provider>
    );
    return appWindow != null ? (
      <WindowCornerProvider value>{settings}</WindowCornerProvider>
    ) : (
      settings
    );
  }

  /**
   * A settings window beside its rail: Bloom's AppShell, as Stash, Mention
   * and Inbox compose their windows. The rail is the shell's sidebar (keeping
   * the window controls' room the shell hands it), the page is one panel
   * whose `navigation` is the pages visited, and the page's `PageHeader` is
   * the window's toolbar: its title, and back and forward in one group.
   */
  function SettingsWindow({
    layout,
    navigation,
    groups,
    pages,
    labels,
    onClose,
    palette,
    testID,
  }: {
    layout: SettingsModalLayout;
    navigation: SettingsNavigationState;
    groups: SettingsNavGroup[];
    pages: Record<string, SettingsModalPage>;
    labels?: SettingsModalLabels;
    onClose?: () => void;
    palette: SettingsPalette;
    testID?: string;
  }) {
    const common = useCommonMessages();
    const { messages } = useMessages(SETTINGS_MODAL_MESSAGES);
    const { currentPage, history, navigate, selectPage } = navigation;
    const closeLabel = labels?.close ?? messages.close;
    const backLabel = labels?.back ?? common.back;
    const railLabel = labels?.nav ?? messages.nav;
    const railWidth = layout === 'medium' ? RAIL_WIDTH_MEDIUM : RAIL_WIDTH;
    const renderPage = (entry: PanelNavigationEntry) => {
      const pageConfig = pages[entry.name];
      const pageContent =
        typeof pageConfig?.content === 'function'
          ? pageConfig.content({ onBack: undefined, backLabel, onClose, closeLabel })
          : pageConfig?.content;
      return pageConfig?.fullBleed ? (
        pageContent
      ) : (
        <PageScroller
          header={{ title: pageConfig?.title ?? '', backLabel, closeLabel, onClose }}
          key={entry.key}
          inset={CONTENT_INSET[layout]}
          insetTop={pageConfig?.compactTitle ? 6 : 12}
          testID={testID}
        >
          {pageContent}
        </PageScroller>
      );
    };
    if (AppShell == null) return null;
    return (
      <AppShell
        testID={testID ? `${testID}-shell` : undefined}
        header={null}
        background="transparent"
        navigationAlign="content"
        navigationGap={0}
        gutter={0}
        contentMaxWidth="none"
        sidebar={{
          surface: 'plain',
          variant: 'panel',
          // The rail's sections are its rows: it never shrinks to icons.
          collapsed: false,
          collapseDisabled: true,
          width: railWidth,
          render: ({ windowControlsRoom, style }) => (
            <SettingsRail
              // The region's height and width, as the shell gives its sidebar.
              style={[styles.railFill, style]}
              groups={groups}
              page={currentPage}
              onSelect={selectPage}
              palette={palette}
              label={railLabel}
              layout={layout}
              windowBand={windowControlsRoom ?? 0}
              testID={testID}
            />
          ),
        }}
        panelLayout={{
          mode: 'split',
          flow: 'bounded',
          appearance: 'plain',
          panels: [
            {
              id: 'page',
              chrome: 'none',
              appearance: 'plain',
              navigation: {
                initialEntries: history.entries,
                state: history,
                onNavigationChange: navigate,
                render: renderPage,
              },
            },
          ],
        }}
      />
    );
  }

  /**
   * The rail and the pages, for either host. `room` is the window controls'
   * room when the panes are a window's content, else null.
   */
  function SettingsPanes({
    layout,
    navigation,
    groups,
    pages,
    labels,
    onClose,
    room,
    palette,
    testID,
  }: {
    layout: SettingsModalLayout;
    navigation: SettingsNavigationState;
    groups: SettingsNavGroup[];
    pages: Record<string, SettingsModalPage>;
    labels?: SettingsModalLabels;
    /** The close request; without it there is no close button. */
    onClose?: () => void;
    room: WindowControlsRoom | null;
    palette: SettingsPalette;
    testID?: string;
  }) {
    const common = useCommonMessages();
    const { messages } = useMessages(SETTINGS_MODAL_MESSAGES);
    const { currentPage, compactPageOpen, selectPage, requestNavigation } = navigation;
    const isCompact = layout === 'compact';
    const pageConfig = currentPage ? pages[currentPage] : undefined;
    const closeLabel = labels?.close ?? messages.close;
    const backLabel = labels?.back ?? common.back;
    const pageContent =
      typeof pageConfig?.content === 'function'
        ? pageConfig.content({
            onBack: isCompact ? requestNavigation : undefined,
            backLabel,
            onClose,
            closeLabel,
          })
        : pageConfig?.content;
    // Narrow, the header is the window's toolbar and starts after the
    // controls; side by side, the rail keeps their room and the page header
    // only moves the window.
    const compactWindowRoom = room ? room.leading : undefined;

    return layout === 'compact' ? (
      compactPageOpen && pageConfig ? (
        <View style={styles.content}>
          {pageConfig.fullBleed ? (
            typeof pageConfig.content === 'function' ? (
              pageContent
            ) : (
              <>
                <WindowToolbar room={compactWindowRoom}>
                  <PageHeader
                    title={pageConfig.title}
                    onBack={requestNavigation}
                    backLabel={backLabel}
                    safeArea={false}
                    placement="inline"
                  />
                </WindowToolbar>
                {pageContent}
              </>
            )
          ) : (
            <PageScroller
              header={{
                title: pageConfig.title,
                onBack: requestNavigation,
                backLabel,
                closeLabel,
                onClose,
                windowRoom: compactWindowRoom,
              }}
              key={currentPage}
              inset={CONTENT_INSET.compact}
              insetTop={CONTENT_INSET.compact}
              testID={testID}
            >
              {pageContent}
            </PageScroller>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <SettingsRail
            header={{
              title: labels?.dialog ?? messages.dialog,
              closeLabel,
              onClose,
              windowRoom: compactWindowRoom,
            }}
            groups={groups}
            page={currentPage}
            onSelect={selectPage}
            palette={palette}
            label={labels?.nav ?? messages.nav}
            layout="compact"
            testID={testID}
          />
        </View>
      )
    ) : (
      <>
        <SettingsRail
          groups={groups}
          page={currentPage}
          onSelect={selectPage}
          palette={palette}
          label={labels?.nav ?? messages.nav}
          layout={layout}
          windowBand={room ? room.top : 0}
          testID={testID}
        />
        <View style={styles.content}>
          {pageConfig?.fullBleed ? (
            pageContent
          ) : (
            <PageScroller
              header={{
                title: pageConfig?.title ?? '',
                closeLabel,
                onClose,
                windowRoom: room ? 0 : undefined,
              }}
              key={currentPage}
              inset={CONTENT_INSET[layout]}
              insetTop={pageConfig?.compactTitle ? 6 : 12}
              testID={testID}
            >
              {pageContent}
            </PageScroller>
          )}
        </View>
      </>
    );
  }

  /** A window's toolbar: a drag region keeping `room` at its leading edge. Without a room, its child. */
  function WindowToolbar({ room, children }: { room?: number; children: React.ReactNode }) {
    return room === undefined ? (
      children
    ) : (
      <WindowDragRegion style={room > 0 ? { paddingInlineStart: room } : undefined}>
        {children}
      </WindowDragRegion>
    );
  }

  function ringVars(palette: SettingsPalette): WebCssStyle | null {
    return IS_WEB
      ? {
          '--bloom-settings-ring': palette.ring,
          '--bloom-settings-ring-offset': palette.full,
        }
      : null;
  }

  // ---------------------------------------------------------------------------
  //  Rail
  // ---------------------------------------------------------------------------

  function SettingsRail({
    header,
    groups,
    page,
    onSelect,
    palette,
    label,
    layout,
    windowBand = 0,
    style,
    testID,
  }: {
    header?: SettingsHeaderProps;
    groups: SettingsNavGroup[];
    page: string | undefined;
    onSelect: (page: string) => void;
    palette: SettingsPalette;
    label: string;
    layout: SettingsModalLayout;
    /** A window's sidebar: the controls' room at its top, which moves the window. */
    windowBand?: number;
    /** The region's own geometry, when a shell holds the rail as its sidebar. */
    style?: StyleProp<ViewStyle>;
    testID?: string;
  }) {
    const compact = layout === 'compact';
    const railLook = {
      backgroundColor: palette.secondary,
      ...surfaceFillVars(palette.secondary),
      borderRightColor: palette.separator,
    };
    const railWidth = layout === 'medium' ? RAIL_WIDTH_MEDIUM : RAIL_WIDTH;
    const content = (
      <View style={header ? [styles.railContent, styles.railContentCompact] : { gap: 20 }}>
        {groups.map((group) => (
          <View key={group.key ?? group.label} style={styles.group}>
            <Text
              variant="body-medium"
              style={[styles.groupLabel, { color: palette.textSecondary }]}
            >
              {group.label}
            </Text>
            <View style={styles.groupRows}>
              {group.items.map((item) => (
                <RailRow
                  key={item.key}
                  item={item}
                  // A list, not a selection, when the rows ARE the navigation.
                  selected={!compact && item.page !== undefined && item.page === page}
                  showChevron={compact && item.page !== undefined}
                  onSelect={onSelect}
                  palette={palette}
                  testID={testID ? `${testID}-nav-${item.key}` : undefined}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    );
    return (
      <SurfaceLevelProvider level={1} fill={palette.secondary}>
        {header ? (
          <View
            role="navigation"
            aria-label={label}
            style={styles.railCompact}
            testID={testID ? `${testID}-rail` : undefined}
          >
            <PageScroller header={header} inset={0} testID={testID}>
              {content}
            </PageScroller>
          </View>
        ) : !compact && windowBand > 0 ? (
          // The band stays put while the rows scroll, so they never pass under
          // the controls.
          <View
            role="navigation"
            aria-label={label}
            style={[styles.rail, { width: railWidth }, railLook, style]}
            testID={testID ? `${testID}-rail` : undefined}
          >
            <WindowDragRegion
              style={{ height: windowBand }}
              testID={testID ? `${testID}-rail-window-band` : undefined}
            />
            <ScrollArea
              style={styles.scroll}
              contentContainerStyle={styles.railContent}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
            >
              {content}
            </ScrollArea>
          </View>
        ) : (
          <ScrollArea
            role="navigation"
            aria-label={label}
            style={[
              compact ? styles.railCompact : [styles.rail, { width: railWidth }],
              railLook,
              style,
            ]}
            contentContainerStyle={styles.railContent}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            testID={testID ? `${testID}-rail` : undefined}
          >
            {content}
          </ScrollArea>
        )}
      </SurfaceLevelProvider>
    );
  }

  function RailRow({
    item,
    selected,
    showChevron = false,
    onSelect,
    palette,
    testID,
  }: {
    item: SettingsNavItem;
    selected: boolean;
    showChevron?: boolean;
    onSelect: (page: string) => void;
    palette: SettingsPalette;
    testID?: string;
  }) {
    const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
    const Icon = item.icon;
    const onPress = item.page ? () => onSelect(item.page as string) : item.onPress;
    return (
      <Pressable
        role="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected, disabled: item.disabled }}
        aria-disabled={item.disabled}
        {...(IS_WEB ? { 'aria-current': selected ? 'page' : undefined } : null)}
        {...webDataSet({ bloomSettingsPress: '' })}
        disabled={item.disabled}
        onPress={onPress}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        testID={testID}
        style={[
          styles.railRow,
          {
            backgroundColor: selected
              ? palette.secondaryHover
              : hovered
                ? palette.secondaryHoverSoft
                : 'transparent',
          },
        ]}
      >
        <Icon width={20} height={20} fill={palette.iconSecondary} />
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={[
            styles.railLabel,
            {
              color: selected || showChevron ? palette.text : palette.textSecondary,
            },
          ]}
        >
          {item.label}
        </Text>
        {showChevron ? (
          <View style={styles.railChevron}>
            <RiArrowRightSLine width={20} height={20} fill={palette.iconSecondary} />
          </View>
        ) : null}
      </Pressable>
    );
  }

  // ---------------------------------------------------------------------------
  //  Close button, scroller, toast
  // ---------------------------------------------------------------------------

  /** Shared header on every layout; the modal already owns safe-area insets. */
  type SettingsHeaderProps = {
    title: string;
    onBack?: () => void;
    backLabel?: string;
    closeLabel: string;
    /** Without it the header has no close button. */
    onClose?: () => void;
    /**
     * Set, the header is the window's toolbar: a drag region that keeps this
     * much room for the window's controls at its leading edge.
     */
    windowRoom?: number;
  };

  function SettingsHeader({
    title,
    onBack,
    backLabel,
    closeLabel,
    onClose,
    windowRoom,
    testID,
  }: SettingsHeaderProps & {
    testID?: string;
  }) {
    return (
      <WindowToolbar room={windowRoom}>
        <PageHeader
          title={title}
          headingLevel={2}
          onBack={onBack}
          backLabel={backLabel}
          safeArea={false}
          // The opaque bar, not the floating islands: page content scrolls UNDER
          // this header, and the floating presentation's translucent capsules and
          // gradient scrim showed that content ghosting through. The bar paints the
          // modal's published surface fill and draws its hairline once scrolled.
          presentation="bar"
          actions={
            onClose ? (
              <ButtonGroup accessibilityLabel={closeLabel}>
                <ButtonGroupItem
                  iconOnly
                  leadingIcon={RiCloseLine}
                  accessibilityLabel={closeLabel}
                  onPress={onClose}
                  testID={testID ? `${testID}-close` : undefined}
                />
              </ButtonGroup>
            ) : undefined
          }
          testID={testID ? `${testID}-header` : undefined}
        />
      </WindowToolbar>
    );
  }

  /** Each page owns one full-height viewport, including its header. */
  function PageScroller({
    children,
    header,
    inset,
    insetTop = 0,
    testID,
  }: {
    children: React.ReactNode;
    header: SettingsHeaderProps;
    inset: number;
    insetTop?: number;
    testID?: string;
  }) {
    return (
      <Screen
        scroll="auto"
        documentScroll={false}
        navigationScope="isolated"
        contentClearance={0}
        header={<SettingsHeader {...header} testID={testID} />}
        style={styles.scroll}
      >
        <SettingsPageContent inset={inset} insetTop={insetTop} testID={testID}>
          {children}
        </SettingsPageContent>
      </Screen>
    );
  }

  function SettingsPageContent({
    children,
    inset,
    insetTop,
    testID,
  }: {
    children: React.ReactNode;
    inset: number;
    insetTop: number;
    testID?: string;
  }) {
    const { scrollY } = useScreen();
    const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
    const keyboardHeight = useKeyboardReveal(scrollRef, scrollY, !IS_WEB);
    return (
      <ScreenScrollView
        ref={scrollRef}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        testID={testID ? `${testID}-page` : undefined}
      >
        <View
          style={{
            paddingLeft: inset,
            paddingRight: inset,
            paddingBottom: inset + keyboardHeight,
            paddingTop: insetTop,
          }}
        >
          {children}
        </View>
      </ScreenScrollView>
    );
  }

  function SavedToast({
    phase,
    label,
    palette,
    reducedMotion,
    inset = 0,
    testID,
  }: {
    phase: SavedPhase;
    label: string;
    palette: SettingsPalette;
    reducedMotion: boolean;
    /**
     * How far above the host's bottom edge the pill is centred: 0 straddles
     * the edge (the modal's panel, the pill outside its clip), more keeps it
     * inside a host that clips (a window).
     */
    inset?: number;
    testID?: string;
  }) {
    const shown = phase === 'shown';
    // Only the HEIGHT is measured, and it feeds only a transform. The pill used
    // to centre itself with `left: '50%'` plus `marginLeft: -width / 2` from its
    // own measured width — a size fed back into its own position. Yoga rounds a
    // node's width as round(right) - round(left), so moving the left edge by
    // half the width can flip the rounded width by one device pixel, which
    // moves the edge back: on a Pixel 8a (2.625) every odd-pixel label width
    // alternated 201 <-> 200 px forever. Fabric reports every frame change, so
    // the open (and idle) settings modal committed a layout on every vsync —
    // 601 frames in 5 s, ~146 % CPU — behind a toast at opacity 0. The row
    // below centres it instead, so nothing about its position depends on it.
    const [height, setHeight] = useState(26);
    // `translate-y-1/2`, `calc(50% + 12px)` (rising in) and `calc(50% - 10px)` (drifting out).
    const half = height / 2;
    const translateY = phase === 'shown' ? half : phase === 'hidden' ? half + 12 : half - 10;
    const motion: WebCssStyle = {
      opacity: shown ? 1 : 0,
      transform: [{ translateY }, { scale: shown ? 1 : 0.9 }],
      ...(IS_WEB
        ? {
            filter: shown ? 'none' : 'blur(2px)',
            transitionProperty: 'opacity, transform, filter',
            transitionDuration: reducedMotion || phase === 'hidden' ? '0ms' : '200ms',
            transitionTimingFunction: 'ease-out',
          }
        : null),
    };
    return (
      <View
        pointerEvents="none"
        style={inset ? [styles.toastRow, { bottom: inset }] : styles.toastRow}
      >
        <View
          pointerEvents="none"
          aria-live="polite"
          accessibilityLiveRegion="polite"
          onLayout={(event) => {
            const next = event.nativeEvent.layout.height;
            setHeight((previous) => (previous === next ? previous : next));
          }}
          testID={testID}
          style={[
            styles.toast,
            {
              borderColor: palette.borderButton,
              backgroundColor: palette.primary,
              boxShadow: palette.shadowDropdown,
            },
            motion,
          ]}
        >
          <RiCheckboxCircleFill width={16} height={16} fill={palette.success[600]} />
          <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.text }}>
            {label}
          </Text>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    center: {
      // Spelled out, not `StyleSheet.absoluteFillObject`: RN 0.85 removed it, and
      // spreading the resulting `undefined` left this box in flow at ZERO height.
      // The panel still painted (nothing clips it) and still took touches, but
      // Android reports every view under a zero-area ancestor as not visible to
      // the user, so TalkBack and UI Automator saw no modal content at all —
      // only the backdrop's full-screen "Close".
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      padding: VIEWPORT_GUTTER,
    },
    centerCompact: {
      padding: 0,
    },
    motion: {
      position: 'relative',
    },
    motionCompact: {
      flex: 1,
      alignSelf: 'stretch',
    },
    railCompact: {
      flex: 1,
    },
    railFill: {
      height: '100%',
    },
    railContentCompact: {
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 12,
      paddingBottom: 24,
    },
    railChevron: {
      marginLeft: 'auto',
    },
    panel: {
      flexDirection: 'row',
      borderRadius: 24,
      overflow: 'hidden',
    },
    rail: {
      flexGrow: 0,
      flexShrink: 0,
      borderRightWidth: 1,
    },
    railContent: {
      padding: 10,
      gap: 20,
    },
    group: {
      paddingTop: 4,
      gap: 6,
    },
    groupLabel: {
      paddingLeft: 8,
    },
    groupRows: {
      gap: 4,
    },
    railRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 8,
      borderRadius: 10,
    },
    railLabel: {
      flexShrink: 1,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    layout: {
      flex: 1,
      flexDirection: 'row',
      minWidth: 0,
      minHeight: 0,
    },
    scroll: {
      flex: 1,
      minHeight: 0,
    },
    toastRow: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      alignItems: 'center',
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderRadius: 9999,
      paddingTop: 4,
      paddingBottom: 4,
      paddingRight: 10,
      paddingLeft: 6,
    },
  });

  return { SettingsModal, SettingsLayout };
}
