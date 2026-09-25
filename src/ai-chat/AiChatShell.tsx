import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PointerEvent,
  type ViewProps,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '../button';
import { usePanelInteraction } from './use-panel-interaction';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiCodeSLine } from '../icons/remix/RiCodeSLine';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { WEB_OVERFLOW_CLIP, WEB_POSITION_FIXED, WEB_VIEWPORT_HEIGHT, type WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { AiChatDocumentGutterContext, AiChatShellContext, useAiChatShell, type AiChatShellState } from './context';
import {
  dataHook,
  DOCUMENT_RAIL,
  IS_WEB,
  PANEL_BREAKPOINT,
  SHELL_GUTTER,
  SIDEBAR_BREAKPOINT,
  useAiChatPalette,
  useAiChatWebCss,
} from './shared';
import type { AiChatMobileHeaderProps, AiChatResizeHandleProps, AiChatShellProps } from './types';

const REVEAL_EASE = Easing.bezier(0.42, 0, 0.58, 1);
const REVEAL_MS = 325;
const REVEAL_OFFSET = 272;
const DRAWER_EASE = Easing.bezier(0.4, 0, 0.2, 1);
const DRAWER_MS = 300;

/**
 * A drawer at rest stays mounted, parked offscreen, so hiding it takes more
 * than `aria-hidden` (the accessibility tree) and `pointerEvents` (the mouse):
 * its rows would still take Tab. `inert` removes them from the tab order as
 * well; react-native-web forwards it, React Native's types do not list it.
 * Native gets the platform flags that hide a subtree from VoiceOver/TalkBack.
 */
const CLOSED_LAYER: ViewProps =
  Platform.OS === 'web'
    ? ({ 'aria-hidden': true, inert: true } as ViewProps)
    : { 'aria-hidden': true, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };

// --- Nav drawer swipe ------------------------------------------------------
//
// The numbers the claim is made of. They are deliberately strict: the gesture
// lives on the shell's ROOT, which is the whole screen below `lg`, so every
// touch the chat, the thread and a host's own content receive passes through
// them first.

/**
 * The strip at the shell's left edge an OPENING drag has to start in. Wide
 * enough for a thumb landing on the frame (the root's own 12px padding plus the
 * container's edge), narrow enough that nothing a host draws is inside it.
 */
const NAV_EDGE_WIDTH = 24;
/** Horizontal travel before the drag is a swipe rather than a slipped tap. */
const NAV_SWIPE_SLOP = 12;
/**
 * How many times more horizontal than vertical the drag must be. 2 is a ±26°
 * cone around the horizontal: a vertical scroll of the thread never enters it,
 * and neither does the diagonal that starts most scrolls.
 */
const NAV_SWIPE_RATIO = 2;
/** px/ms — a flick past this settles in its own direction whatever the distance. */
const NAV_SWIPE_FLICK = 0.3;
/** A settle never runs shorter than this, so the last few px are still seen. */
const NAV_SETTLE_MIN_MS = 120;

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

const DEFAULT_LABELS = {
  openNavigation: 'Open navigation',
  closeNavigation: 'Close navigation',
  openPanel: (panel: string) => `Open ${panel.toLowerCase()}`,
  closePanel: (panel: string) => `Close ${panel.toLowerCase()}`,
  resize: 'Resize panels',
};

// ---------------------------------------------------------------------------
//  Resize handle
// ---------------------------------------------------------------------------

/**
 * The resize grip (`DragHandle`): a 20px strip straddling the chat's right edge
 * (10px past it). Hovering it reveals a 15×25 grip — radius 4, 1px
 * border-button-default, background-primary, shadow-xs, three 1×13
 * icon-quaternary lines 2 apart — that follows the pointer along the edge
 * (kept 13px inside it) and stays up while dragging (150ms fade). Holding and
 * dragging reports the horizontal distance from where the drag started.
 */
export function AiChatResizeHandle({
  onResizeStart,
  onResize,
  onResizeEnd,
  label = DEFAULT_LABELS.resize,
  onNudge,
  style,
  testID,
}: AiChatResizeHandleProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const [gripY, setGripY] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const height = useRef(0);
  const startX = useRef(0);
  const callbacks = useRef({ onResizeStart, onResize, onResizeEnd });
  callbacks.current = { onResizeStart, onResize, onResizeEnd };

  const track = (localY: number) => {
    const h = height.current;
    if (h > 0) setGripY(Math.min(h - 13, Math.max(13, localY)));
  };

  // Native: a pan responder (web uses pointer capture below).
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          track(event.nativeEvent.locationY);
          setDragging(true);
          callbacks.current.onResizeStart?.();
        },
        onPanResponderMove: (_event, gesture) => callbacks.current.onResize(gesture.dx),
        onPanResponderRelease: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
      }),
    [],
  );

  type DomTarget = {
    getBoundingClientRect: () => { top: number };
    setPointerCapture: (id: number) => void;
    hasPointerCapture: (id: number) => boolean;
  };
  const web = IS_WEB
    ? {
        onPointerDown: (event: PointerEvent) => {
          event.preventDefault();
          startX.current = event.nativeEvent.clientX;
          setDragging(true);
          callbacks.current.onResizeStart?.();
          (event.currentTarget as unknown as DomTarget).setPointerCapture(event.nativeEvent.pointerId);
        },
        onPointerMove: (event: PointerEvent) => {
          const target = event.currentTarget as unknown as DomTarget;
          track(event.nativeEvent.clientY - target.getBoundingClientRect().top);
          if (target.hasPointerCapture(event.nativeEvent.pointerId)) {
            callbacks.current.onResize(event.nativeEvent.clientX - startX.current);
          }
        },
        onPointerUp: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
        onPointerCancel: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
        onKeyDown: (event: { nativeEvent: { key: string } }) => {
          if (event.nativeEvent.key === 'ArrowLeft') onNudge?.(-16);
          if (event.nativeEvent.key === 'ArrowRight') onNudge?.(16);
        },
        tabIndex: onNudge ? (0 as const) : undefined,
      }
    : responder.panHandlers;

  const grip: WebCssStyle = {
    position: 'absolute',
    ...(gripY === null ? { top: '50%' } : { top: gripY }),
    width: 15,
    height: 25,
    marginTop: -12.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.primary,
    boxShadow: palette.shadowXs,
    ...(IS_WEB ? null : { opacity: dragging ? 1 : 0 }),
  };

  return (
    <View
      {...dataHook('bloomAiChatGrip')}
      {...web}
      role="separator"
      aria-orientation="vertical"
      accessibilityLabel={label}
      testID={testID}
      onLayout={(event: LayoutChangeEvent) => {
        height.current = event.nativeEvent.layout.height;
      }}
      style={[
        { position: 'absolute', top: 0, bottom: 0, right: -10, zIndex: 10, width: 20, alignItems: 'center' },
        style,
      ]}>
      <View {...dataHook('bloomAiChatGripPill', dragging ? 'dragging' : '')} pointerEvents="none" style={grip}>
        {[0, 1, 2].map((line) => (
          <View key={line} style={{ width: 1, height: 13, backgroundColor: palette.iconQuaternary }} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Mobile header
// ---------------------------------------------------------------------------

/**
 * The in-container header below `xl`: at least 48 tall, px 12 / pt 11. The menu
 * button (below `lg`, where the sidebar is a drawer) and the chat's name in
 * headline-medium on the left; the button opening the panel drawer on the right.
 * Both are 36px secondary icon buttons. Renders nothing outside an
 * `AiChatShell`, or from `xl` up.
 */
export function AiChatMobileHeader({ title, style, testID }: AiChatMobileHeaderProps) {
  const shell = useAiChatShell();
  const palette = useAiChatPalette();
  if (!shell || !shell.compact) return null;
  return (
    <View
      testID={testID}
      style={[
        {
          minHeight: 48,
          flexShrink: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 11,
        },
        style,
      ]}>
      <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {shell.navCollapsed && shell.hasNav ? (
          <Button size="md" icon={RiMenuLine} accessibilityLabel={shell.labels.openNavigation} onPress={shell.openNav} appearance="plain" tone="neutral" />
        ) : null}
        <Text
          variant="headline-medium"
          numberOfLines={1}
          style={{ flexShrink: 1, paddingLeft: 4, paddingRight: 4, color: palette.text }}>
          {title}
        </Text>
      </View>
      {shell.hasPanel ? (
        <Button size="md" icon={shell.panelIcon} accessibilityLabel={shell.labels.openPanel(shell.panelLabel)} onPress={shell.openPanel} appearance="plain" tone="neutral" />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Shell
// ---------------------------------------------------------------------------

/**
 * The AI chat shell: the full AI chat
 * screen on background-full with a 12px frame.
 *
 *   lg and up   the floating `sidebar` in flow, 16 from the workspace, at
 *               `sidebarWidth` (or its own width) — `sidebarCollapsed` narrows
 *               the column only when `collapsedSidebarWidth` explicitly overrides the sidebar
 *   workspace   the chat container flexing, then (xl and up) the `panel` 12 to
 *               its right at `panelWidth`; the resize grip on the chat's right
 *               edge trades width between them, clamped 320–560
 *   below xl    the panel is a right drawer — min(410, 100% − 12) wide,
 *               background-full, p 12, shadow-sidebar, a 40-tall header (panel
 *               name in headline-medium, a close button) — sliding in over a 40%
 *               black backdrop (300ms ease-in-out)
 *   below lg    the `mobileSidebar` rests under the workspace (272 wide, py 12 /
 *               pl 6); opening it slides the whole workspace 272 right and rounds
 *               it to 32 while the sidebar scales up from 94% and fades in (325ms
 *               `cubic-bezier(0.42, 0, 0.58, 1)`); a 10% black (5% white) veil
 *               over the workspace closes it, and so does dragging it back — a
 *               drag in from the left edge opens it (`navSwipeEnabled`), the
 *               drawer following the finger and settling on release
 *
 * The chat container reads the drawer controls through `AiChatMobileHeader`.
 * Everything the shell knows — including `navPresented`, which says whether the
 * nav is on screen at all — is published to any descendant through
 * `useAiChatShell()`.
 *
 * `background` is a layer drawn above the shell's own paint and below all of
 * it; with `surface={false}` neither the root nor the workspace paints, so the
 * layer reaches the chat.
 */
export function AiChatShell({
  sidebar,
  sidebarWidth,
  sidebarCollapsed = false,
  collapsedSidebarWidth,
  mobileSidebar,
  children,
  panel,
  panelLabel = 'Code',
  panelIcon = RiCodeSLine,
  defaultPanelWidth = 410,
  minPanelWidth = 320,
  maxPanelWidth = 560,
  navOpen: navOpenProp,
  onNavOpenChange,
  navSwipeEnabled = true,
  panelOpen: panelOpenProp,
  onPanelOpenChange,
  background,
  surface = true,
  scroll = 'container',
  labels,
  style,
  testID,
}: AiChatShellProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const reducedMotion = useReducedMotion();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const { width: windowWidth } = useWindowDimensions();
  // Native has no document: `document` is `container` there.
  const documentScroll = IS_WEB && scroll === 'document';
  // What covers the screen — the drawers, the backdrop, a shell background —
  // is `fixed` over a scrolling document: `absolute` would cover the page and
  // scroll away with it.
  const overlayPosition = documentScroll ? WEB_POSITION_FIXED : 'absolute';
  const wide = windowWidth >= PANEL_BREAKPOINT;
  const navInFlow = windowWidth >= SIDEBAR_BREAKPOINT;

  const [navOpenState, setNavOpen] = useControllableState<boolean>({
    value: navOpenProp,
    defaultValue: false,
    onChange: onNavOpenChange,
  });
  const [panelOpenState, setPanelOpen] = useControllableState<boolean>({
    value: panelOpenProp,
    defaultValue: false,
    onChange: onPanelOpenChange,
  });
  const navOpen = navOpenState && !navInFlow && !!mobileSidebar;
  const panelOpen = panelOpenState && !wide && !!panel;
  const dismissPanel = useCallback(() => setPanelOpen(false), [setPanelOpen]);
  const panelRef = usePanelInteraction(panelOpenState && !!panel, panelOpen, dismissPanel);
  const dismissNav = useCallback(() => setNavOpen(false), [setNavOpen]);
  // The nav drawer covers the workspace whenever it is open: Escape closes it,
  // focus moves in and is kept there, and returns to the opener on close.
  const navRef = usePanelInteraction(navOpen, navOpen, dismissNav);
  // The swipe's handlers are built once and read the drawer's state from here.
  const navOpenRef = useRef(navOpen);
  navOpenRef.current = navOpen;

  const [panelWidth, setPanelWidth] = useState(defaultPanelWidth);
  const [dragging, setDragging] = useState(false);
  const widthAtDragStart = useRef(defaultPanelWidth);

  const onResizeStart = useCallback(() => {
    widthAtDragStart.current = panelWidth;
    setDragging(true);
  }, [panelWidth]);
  const onResize = useCallback(
    (dx: number) => {
      // Dragging right widens the chat, so the panel gives up that width.
      setPanelWidth(Math.min(maxPanelWidth, Math.max(minPanelWidth, widthAtDragStart.current - dx)));
    },
    [maxPanelWidth, minPanelWidth],
  );
  const onNudge = useCallback(
    (dx: number) => setPanelWidth((w) => Math.min(maxPanelWidth, Math.max(minPanelWidth, w - dx))),
    [maxPanelWidth, minPanelWidth],
  );

  // Push drawer.
  const reveal = useSharedValue(navOpen ? 1 : 0);
  /**
   * Where `reveal` was last sent. The swipe writes it before it commits the
   * state change, so the effect below does not restart an animation the
   * gesture has already aimed — a drag released back where it started changes
   * no state at all, and would otherwise leave `reveal` stranded mid-travel.
   */
  const revealTarget = useRef(navOpen ? 1 : 0);
  useEffect(() => {
    const target = navOpen ? 1 : 0;
    if (revealTarget.current === target) return;
    revealTarget.current = target;
    reveal.value = reducedMotion ? target : withTiming(target, { duration: REVEAL_MS, easing: REVEAL_EASE });
  }, [navOpen, reducedMotion, reveal]);
  /**
   * Land the drawer open or closed, animating from wherever it is now.
   * `duration` is what a swipe shortens when there is little left to travel;
   * reduced motion snaps, exactly as the effect above does.
   */
  const settleNav = useCallback(
    (open: boolean, duration: number = REVEAL_MS) => {
      const target = open ? 1 : 0;
      revealTarget.current = target;
      reveal.value = reducedMotion ? target : withTiming(target, { duration, easing: REVEAL_EASE });
      // A drag that ends where it began animates back and changes nothing:
      // a controlled host must not be told the drawer opened and closed.
      if (open === navOpenRef.current) return;
      if (open) setPanelOpen(false);
      setNavOpen(open);
    },
    [reducedMotion, reveal, setNavOpen, setPanelOpen],
  );
  const railStyle = useAnimatedStyle(
    () => ({ opacity: reveal.value, transform: [{ scale: 0.94 + 0.06 * reveal.value }] }),
    [reveal],
  );
  const workspaceStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: REVEAL_OFFSET * reveal.value }], borderRadius: 32 * reveal.value }),
    [reveal],
  );
  const veilStyle = useAnimatedStyle(() => ({ opacity: reveal.value }), [reveal]);

  // The edge swipe. Armed only where there IS a drawer: below `lg`, with a
  // `mobileSidebar`, and only while the host allows it.
  const navSwipeArmed = navSwipeEnabled && !navInFlow && !!mobileSidebar;
  const swipe = useRef({ armed: false, blocked: false, from: 0, settle: settleNav });
  swipe.current.armed = navSwipeArmed;
  // A drag over the panel drawer's backdrop belongs to the panel.
  swipe.current.blocked = panelOpen;
  swipe.current.settle = settleNav;

  /**
   * Opening and closing the nav drawer with the finger.
   *
   * It sits on the shell's ROOT rather than on the workspace, because below
   * `lg` the root's own 12px frame is part of the edge a thumb lands on and a
   * touch there never reaches the workspace at all.
   *
   * **What it claims.** Never a touch START — every press inside the shell
   * still reaches the control under it. On MOVE, all of:
   *
   * - the drag is at least `NAV_SWIPE_SLOP` across and `NAV_SWIPE_RATIO` times
   *   more horizontal than vertical, so the thread's scroll keeps every
   *   vertical and near-vertical drag;
   * - one finger only (a two-finger zoom in a code block is not a swipe);
   * - **closed:** it started inside `NAV_EDGE_WIDTH` of the left edge and is
   *   travelling right — a horizontal drag in the middle of the screen stays
   *   the content's, which is where a carousel or a scrolling code block is;
   * - **open:** it is travelling left, from anywhere. The veil is over the
   *   whole workspace by then and a press on it already closes the drawer, so
   *   there is nothing underneath to take the drag from.
   *
   * `gestureState.x0` is NOT the start of the gesture — PanResponder fills it
   * in at GRANT, which for a move-claimed responder is after the fact. The
   * start is recovered as `moveX - dx`, both of which the capture phase has
   * already updated by the time the claim runs.
   *
   * **On web** only a real touch is claimed (`nativeEvent.type`, which
   * react-native-web sets from the DOM event it synthesised the touch from).
   * A mouse drag from the edge is not a gesture anyone performs on purpose and
   * claiming it would cancel a selection that began at the edge. Nothing here
   * sets `touch-action` either: that would have to go on an ancestor of the
   * whole workspace and would take horizontal panning away from every
   * scroller inside it.
   */
  const navSwipe = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (event, gesture) => {
          const state = swipe.current;
          if (!state.armed) return false;
          // `type` is react-native-web's own addition to the touch it makes of
          // a DOM event; native carries no such field, hence the cast.
          const domType = (event.nativeEvent as { type?: string }).type ?? '';
          if (IS_WEB && !domType.startsWith('touch')) return false;
          if (gesture.numberActiveTouches > 1) return false;
          const { dx, dy } = gesture;
          if (Math.abs(dx) < NAV_SWIPE_SLOP) return false;
          if (Math.abs(dx) < Math.abs(dy) * NAV_SWIPE_RATIO) return false;
          if (navOpenRef.current) return dx < 0;
          if (state.blocked) return false;
          return dx > 0 && gesture.moveX - dx <= NAV_EDGE_WIDTH;
        },
        onPanResponderGrant: () => {
          swipe.current.from = navOpenRef.current ? 1 : 0;
        },
        // `dx` is measured from the GRANT, not from the touch, so the drawer
        // picks up under the finger where the claim was made.
        onPanResponderMove: (_event, gesture) => {
          reveal.value = clamp01(swipe.current.from + gesture.dx / REVEAL_OFFSET);
        },
        onPanResponderRelease: (_event, gesture) => {
          const progress = clamp01(swipe.current.from + gesture.dx / REVEAL_OFFSET);
          const open =
            Math.abs(gesture.vx) >= NAV_SWIPE_FLICK ? gesture.vx > 0 : progress >= 0.5;
          const remaining = Math.abs((open ? 1 : 0) - progress);
          swipe.current.settle(
            open,
            Math.max(NAV_SETTLE_MIN_MS, Math.round(REVEAL_MS * remaining)),
          );
        },
        // Whatever took the gesture away, the drawer goes back where it was.
        onPanResponderTerminate: () => swipe.current.settle(swipe.current.from === 1),
        // Nothing takes the drag off us once the drawer is following the finger.
        onPanResponderTerminationRequest: () => false,
      }),
    [reveal],
  );

  // Panel drawer.
  const drawer = useSharedValue(panelOpen ? 1 : 0);
  useEffect(() => {
    const target = panelOpen ? 1 : 0;
    drawer.value = reducedMotion ? target : withTiming(target, { duration: DRAWER_MS, easing: DRAWER_EASE });
  }, [panelOpen, reducedMotion, drawer]);
  const [shellWidth, setShellWidth] = useState(windowWidth);
  const drawerWidth = Math.min(410, shellWidth - 12);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: drawer.value }), [drawer]);
  const drawerStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: drawerWidth * 1.1 * (1 - drawer.value) }] }),
    [drawer, drawerWidth],
  );

  const shellState: AiChatShellState = useMemo(
    () => ({
      compact: !wide,
      navCollapsed: !navInFlow,
      hasNav: !!mobileSidebar,
      hasPanel: !!panel,
      // In flow it is always on screen; as a drawer, only while it is open.
      navPresented: navInFlow ? !!sidebar : navOpen,
      sidebarCollapsed,
      documentScroll,
      openNav: () => {
        setPanelOpen(false);
        setNavOpen(true);
      },
      closeNav: () => setNavOpen(false),
      openPanel: () => {
        setNavOpen(false);
        setPanelOpen(true);
      },
      panelLabel,
      panelIcon,
      labels: { openNavigation: l.openNavigation, openPanel: l.openPanel },
    }),
    [
      wide,
      navInFlow,
      navOpen,
      sidebar,
      sidebarCollapsed,
      documentScroll,
      mobileSidebar,
      panel,
      setPanelOpen,
      setNavOpen,
      panelLabel,
      panelIcon,
      l,
    ],
  );

  const rootStyle: WebCssStyle = {
    position: 'relative',
    width: '100%',
    // A document-scrolled shell is at least one screen and grows with the
    // chat. `clip`, not `hidden`, so it is not a scroll container of its own
    // and the sticky columns inside still stick to the screen.
    ...(documentScroll ? { minHeight: WEB_VIEWPORT_HEIGHT, overflow: WEB_OVERFLOW_CLIP } : { height: '100%', overflow: 'hidden' }),
    flexDirection: 'row',
    gap: 16,
    padding: SHELL_GUTTER,
    backgroundColor: surface ? palette.full : 'transparent',
  };

  const veil = palette.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <AiChatShellContext.Provider value={shellState}>
      <AiChatDocumentGutterContext.Provider value={documentScroll && surface ? palette.full : null}>
      <View
        {...dataHook('bloomAiChatDragging', dragging ? 'on' : '')}
        {...(navSwipeArmed ? navSwipe.panHandlers : null)}
        testID={testID}
        onLayout={(event: LayoutChangeEvent) => setShellWidth(event.nativeEvent.layout.width)}
        style={[rootStyle, style]}>
        {background ? (
          <View pointerEvents="none" style={{ position: overlayPosition, top: 0, left: 0, right: 0, bottom: 0 }}>
            {background}
          </View>
        ) : null}
        {!navInFlow && mobileSidebar ? (
          <View
            ref={navRef}
            {...(navOpen ? null : CLOSED_LAYER)}
            pointerEvents={navOpen ? 'box-none' : 'none'}
            style={{ position: overlayPosition, top: 0, bottom: 0, left: 0, zIndex: 10, width: 272, paddingTop: 12, paddingBottom: 12, paddingLeft: 6 }}>
            <Animated.View
              pointerEvents={navOpen ? 'auto' : 'none'}
              style={[{ height: '100%', width: 260, transformOrigin: 'left' }, railStyle]}>
              {mobileSidebar}
            </Animated.View>
          </View>
        ) : null}

        {navInFlow ? (
          <View
            style={{
              ...(documentScroll ? DOCUMENT_RAIL : { position: 'relative', height: '100%' }),
              zIndex: 10,
              // Untouched unless the host asked for a width: the sidebar has
              // always sized itself.
              ...(sidebarCollapsed
                ? (collapsedSidebarWidth !== undefined ? { width: collapsedSidebarWidth, flexShrink: 0 } : null)
                : sidebarWidth !== undefined
                  ? { width: sidebarWidth, flexShrink: 0 }
                  : null),
            }}>
            {sidebar}
          </View>
        ) : null}

        <Animated.View
          style={[
            {
              position: 'relative',
              zIndex: navInFlow ? 0 : 20,
              minWidth: 0,
              flex: 1,
              flexDirection: 'column',
              gap: 8,
              overflow: documentScroll ? WEB_OVERFLOW_CLIP : 'hidden',
              backgroundColor: surface ? palette.full : 'transparent',
            },
            navInFlow ? null : workspaceStyle,
          ]}>
          {!navInFlow ? (
            <Animated.View
              {...(navOpen ? null : CLOSED_LAYER)}
              pointerEvents={navOpen ? 'auto' : 'none'}
              style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }, veilStyle]}>
              {/* Never a Tab stop: open, focus is kept in the drawer and Escape
                  closes it; closed, the veil is not there at all. `tabIndex`,
                  not `focusable` — react-native-web's Pressable writes its own
                  tabIndex 0 over `focusable`. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={l.closeNavigation}
                tabIndex={-1}
                onPress={() => setNavOpen(false)}
                style={{ flex: 1, backgroundColor: veil }}
              />
            </Animated.View>
          ) : null}
          <View
            style={
              documentScroll
                ? { minWidth: 0, flexGrow: 1, flexDirection: 'row', gap: 12 }
                : { minHeight: 0, minWidth: 0, flex: 1, flexDirection: 'row', gap: 12, overflow: 'hidden' }
            }>
            <View style={{ position: 'relative', minWidth: 0, flex: 1, flexBasis: 0, flexDirection: 'row' }}>
              {children}
              {wide && panel ? (
                <AiChatResizeHandle
                  label={l.resize}
                  onResizeStart={onResizeStart}
                  onResize={onResize}
                  onResizeEnd={() => setDragging(false)}
                  onNudge={onNudge}
                />
              ) : null}
            </View>
            {wide && panel ? (
              documentScroll ? (
                // A row, so the panel stretches to the rail's height.
                <View style={[DOCUMENT_RAIL, { flexDirection: 'row' }]}>{panel(panelWidth)}</View>
              ) : (
                panel(panelWidth)
              )
            ) : null}
          </View>
        </Animated.View>

        {!wide && panel ? (
          <View
            {...(panelOpen ? null : CLOSED_LAYER)}
            pointerEvents={panelOpen ? 'auto' : 'none'}
            style={{ position: overlayPosition, top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={l.closePanel(panelLabel)}
                tabIndex={panelOpen ? 0 : -1}
                onPress={() => setPanelOpen(false)}
                style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
              />
            </Animated.View>
            <Animated.View
              ref={panelRef}
              role="dialog"
              aria-modal={panelOpen}
              accessibilityLabel={panelLabel}
              accessibilityViewIsModal={panelOpen}
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: drawerWidth,
                  flexDirection: 'column',
                  backgroundColor: palette.full,
                  padding: 12,
                  boxShadow: palette.shadowSidebar,
                },
                drawerStyle,
              ]}>
              <View
                style={{
                  minHeight: 40,
                  flexShrink: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: 4,
                  paddingRight: 4,
                }}>
                <Text variant="headline-medium" style={{ color: palette.text }}>
                  {panelLabel}
                </Text>
                <Button size="md" icon={RiCloseLine} accessibilityLabel={l.closePanel(panelLabel)} onPress={() => setPanelOpen(false)} appearance="plain" tone="neutral" />
              </View>
              <View style={{ minHeight: 0, flex: 1 }}>{panel('100%')}</View>
            </Animated.View>
          </View>
        ) : null}
      </View>
      </AiChatDocumentGutterContext.Provider>
    </AiChatShellContext.Provider>
  );
}

export type { GestureResponderEvent };
