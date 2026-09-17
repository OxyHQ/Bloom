import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PointerEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '../button';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiCodeSLine } from '../icons/remix/RiCodeSLine';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { AiChatShellContext, useAiChatShell, type AiChatShellState } from './context';
import {
  dataHook,
  IS_WEB,
  PANEL_BREAKPOINT,
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
 * The in-container header below `xl`: 48 tall, px 12 / pt 11. The menu
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
          height: 48,
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
          <Button
            variant="secondary"
            size="medium"
            iconOnly
            icon={RiMenuLine}
            accessibilityLabel={shell.labels.openNavigation}
            onPress={shell.openNav}
          />
        ) : null}
        <Text
          variant="headline-medium"
          numberOfLines={1}
          style={{ flexShrink: 1, paddingLeft: 4, paddingRight: 4, color: palette.text }}>
          {title}
        </Text>
      </View>
      {shell.hasPanel ? (
        <Button
          variant="secondary"
          size="medium"
          iconOnly
          icon={shell.panelIcon}
          accessibilityLabel={shell.labels.openPanel(shell.panelLabel)}
          onPress={shell.openPanel}
        />
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
 *   lg and up   the floating `sidebar` in flow, 16 from the workspace
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
 *               over the workspace closes it
 *
 * The chat container reads the drawer controls through `AiChatMobileHeader`.
 */
export function AiChatShell({
  sidebar,
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
  panelOpen: panelOpenProp,
  onPanelOpenChange,
  labels,
  style,
  testID,
}: AiChatShellProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const reducedMotion = useReducedMotion();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const { width: windowWidth } = useWindowDimensions();
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
  useEffect(() => {
    const target = navOpen ? 1 : 0;
    reveal.value = reducedMotion ? target : withTiming(target, { duration: REVEAL_MS, easing: REVEAL_EASE });
  }, [navOpen, reducedMotion, reveal]);
  const railStyle = useAnimatedStyle(
    () => ({ opacity: reveal.value, transform: [{ scale: 0.94 + 0.06 * reveal.value }] }),
    [reveal],
  );
  const workspaceStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: REVEAL_OFFSET * reveal.value }], borderRadius: 32 * reveal.value }),
    [reveal],
  );
  const veilStyle = useAnimatedStyle(() => ({ opacity: reveal.value }), [reveal]);

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
      openNav: () => {
        setPanelOpen(false);
        setNavOpen(true);
      },
      openPanel: () => {
        setNavOpen(false);
        setPanelOpen(true);
      },
      panelLabel,
      panelIcon,
      labels: { openNavigation: l.openNavigation, openPanel: l.openPanel },
    }),
    [wide, navInFlow, mobileSidebar, panel, setPanelOpen, setNavOpen, panelLabel, panelIcon, l],
  );

  const rootStyle: WebCssStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    gap: 16,
    overflow: 'hidden',
    padding: 12,
    backgroundColor: palette.full,
  };

  const veil = palette.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <AiChatShellContext.Provider value={shellState}>
      <View
        {...dataHook('bloomAiChatDragging', dragging ? 'on' : '')}
        testID={testID}
        onLayout={(event: LayoutChangeEvent) => setShellWidth(event.nativeEvent.layout.width)}
        style={[rootStyle, style]}>
        {!navInFlow && mobileSidebar ? (
          <View
            aria-hidden={!navOpen}
            pointerEvents={navOpen ? 'box-none' : 'none'}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 10, width: 272, paddingTop: 12, paddingBottom: 12, paddingLeft: 6 }}>
            <Animated.View
              pointerEvents={navOpen ? 'auto' : 'none'}
              style={[{ height: '100%', width: 260, transformOrigin: 'left' }, railStyle]}>
              {mobileSidebar}
            </Animated.View>
          </View>
        ) : null}

        {navInFlow ? <View style={{ position: 'relative', zIndex: 10, height: '100%' }}>{sidebar}</View> : null}

        <Animated.View
          style={[
            {
              position: 'relative',
              zIndex: navInFlow ? 0 : 20,
              minWidth: 0,
              flex: 1,
              flexDirection: 'column',
              gap: 8,
              overflow: 'hidden',
              backgroundColor: palette.full,
            },
            navInFlow ? null : workspaceStyle,
          ]}>
          {!navInFlow ? (
            <Animated.View
              pointerEvents={navOpen ? 'auto' : 'none'}
              style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }, veilStyle]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={l.closeNavigation}
                focusable={navOpen}
                onPress={() => setNavOpen(false)}
                style={{ flex: 1, backgroundColor: veil }}
              />
            </Animated.View>
          ) : null}
          <View style={{ minHeight: 0, minWidth: 0, flex: 1, flexDirection: 'row', gap: 12, overflow: 'hidden' }}>
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
            {wide && panel ? panel(panelWidth) : null}
          </View>
        </Animated.View>

        {!wide && panel ? (
          <View
            aria-hidden={!panelOpen}
            pointerEvents={panelOpen ? 'auto' : 'none'}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={l.closePanel(panelLabel)}
                focusable={panelOpen}
                onPress={() => setPanelOpen(false)}
                style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
              />
            </Animated.View>
            <Animated.View
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
                  height: 40,
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
                <Button
                  variant="secondary"
                  size="medium"
                  iconOnly
                  icon={RiCloseLine}
                  accessibilityLabel={l.closePanel(panelLabel)}
                  onPress={() => setPanelOpen(false)}
                />
              </View>
              <View style={{ minHeight: 0, flex: 1 }}>{panel('100%')}</View>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </AiChatShellContext.Provider>
  );
}

export type { GestureResponderEvent };
