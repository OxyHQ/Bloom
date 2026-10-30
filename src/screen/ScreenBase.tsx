import { useThemeRecipe } from '../theme/use-theme-paint';
import { resolvePaintMode } from '../theme/paint';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { flattenWebStyle } from '../styles/flatten-web-style';
import type { ComponentType } from 'react';
import type { ScrollBarProps } from '../layout/types';
import type { BloomColorScopeProps } from '../theme/color-scope/ColorScope';
import type { useScrollRestoration as UseScrollRestoration } from '../scroll/use-scroll-restoration';
import type React from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useKeyboardVisible } from '../hooks/use-keyboard-visible';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { windowEdgeGap } from '../layout/edge';
import { useSharedValue } from 'react-native-reanimated';
import {
  useSurfaceFillRecipe,
  useSurfaceLevelValue,
  SurfaceLevelProvider,
  surfaceFillVars,
} from '../styles/surface-levels';
import {
  WEB_POSITION_FIXED,
  WEB_POSITION_STICKY,
  WEB_SURFACE_STICKY_TOP,
  WEB_VIEWPORT_HEIGHT,
  webViewportHeightMinus,
  type WebCssStyle,
} from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { useAppShellRegion } from '../layout/app-shell-region';
import { ScrollMetricsContext } from '../layout/scroll-metrics';
import { ScrollOffsetProvider, useScrollOffset } from '../layout/scroll-offset';
import { ScreenHostContext, ScreenViewportContext } from './context';
import { useOptionalScrollRestorationContext } from '../scroll/context';
import { useScreenViewportBinding, createScreenViewportRestoration } from './use-screen-viewport';
import {
  ScreenContext,
  ScreenFooterContext,
  ScreenHeaderContext,
  ScreenNavigationContext,
} from './context';
import { useScreenWindowBinding } from './use-screen-window-scroll';
import { useStatusBarClaim } from '../theme/SystemStatusBar';
import { useRegisterReselectHandler } from './reselect';
import { ScreenActionOwnerContext, useScreenActionClaim } from '../app-shell/screen-action';
import type { ScreenProps } from './types';
import { useCssSafeAreaInsets, NO_SAFE_AREA_INSETS } from '../hooks/use-css-safe-area-insets';
import type { ScreenKeyboardComponents } from './keyboard-components';
import { usePlatformWindow } from '../platform-surface/context';
import { useWindowFullscreen } from '../window/use-window';
import {
  useWindowChrome,
  useWindowCornerTaken,
  WindowChromeProvider,
  WindowCornerProvider,
  type WindowChrome,
} from '../window/context';
import { WindowControls } from '../window/WindowControls';
import { WindowDragRegion } from '../window/WindowDragRegion';

export function createScreen(
  ScrollBar: ComponentType<ScrollBarProps>,
  BloomColorScope: ComponentType<
    Pick<BloomColorScopeProps, 'colorPreset' | 'asChild' | 'children'>
  >,
  useScrollRestoration: typeof UseScrollRestoration,
  getKeyboardComponents: (() => ScreenKeyboardComponents) | null,
) {
  const ScreenViewportRestoration = createScreenViewportRestoration(useScrollRestoration);
  /** One continuous canvas; chrome overlays it and content reserves its measured footprint. */
  function Screen(props: ScreenProps) {
    return (
      <BloomColorScope colorPreset={props.colorPreset} asChild>
        <ScreenCanvas {...props} />
      </BloomColorScope>
    );
  }

  function ScreenCanvas({
    colorPreset,
    header,
    scroll = 'content',
    headerPlacement = 'inset',
    bottomBarPlacement = 'inset',
    bottomBar,
    bottomBarKeyboardBehavior = 'hide',
    primaryAction,
    reselect,
    active: requestedActive = true,
    navigationScope = 'inherit',
    documentScroll,
    headerHeight,
    bottomBarHeight,
    contentClearance = 16,
    children,
    style,
    testID,
    ...props
  }: ScreenProps) {
    const surfaceRecipe = useSurfaceFillRecipe();
    // On the page the canvas is the page fill. Inside a painted surface (a panel,
    // a sheet) that surface is already the paint, material and edge light included,
    // and an opaque canvas over it would hide both.
    const surfaceLevel = useSurfaceLevelValue();
    const onSurface = surfaceLevel > 0;
    const flatStyle = Platform.OS === 'web' ? flattenWebStyle(style) : StyleSheet.flatten(style);
    const background = flatStyle?.backgroundColor;
    const explicitFill =
      typeof background === 'string' && background !== 'transparent' ? background : undefined;
    const paintedSurface = useThemeRecipe((_theme, documentMode, preset) => {
      const backing = resolvePaintMode(surfaceRecipe, documentMode, preset);
      return explicitFill
        ? resolveSurfaceMaterial({
            fill: explicitFill,
            parentFill: backing,
            parentLevel: surfaceLevel,
            paint: false,
          }).publishedFill
        : backing;
    });
    const surfaceFill = onSurface ? 'transparent' : surfaceRecipe.paint;
    const parentScreen = useContext(ScreenContext);
    const parentViewport = useContext(ScreenViewportContext);
    const inheritedMetrics = useContext(ScrollMetricsContext);
    const inheritedOffset = useScrollOffset();
    const incomingHost = useContext(ScreenHostContext);
    // The first Screen consumes a panel's host. A nested Screen owns independent
    // geometry and chrome; overlays start afresh through ScreenScope.
    const host = useMemo(
      () =>
        parentScreen
          ? { active: incomingHost.active, kind: 'element' as const, restoreScroll: false }
          : incomingHost,
      [incomingHost, parentScreen],
    );
    // ---- the window's chrome (OxyOS ADR 0016) -------------------------------
    // With the platform's `window` capability, a Screen nothing else holds the
    // window's corner for (no shell, no settings layout, no other screen, no
    // overlay) IS the window's content: it draws the controls in its corner
    // and its header is the window's title area. Inside a shell, the shell may
    // hand that chrome down (a panel along the window's top edge): the first
    // Screen there takes it. Either way the header row moves the window and
    // keeps the controls' room at its leading edge (`PageHeader` keeps it in
    // its own bar); the content below is untouched.
    // Not `useWindow()`: a screen re-renders when the window enters or leaves
    // full screen, not each time it is activated.
    const platformWindow = usePlatformWindow();
    const fullscreen = useWindowFullscreen();
    const cornerTaken = useWindowCornerTaken();
    const handedChrome = useWindowChrome();
    const windowContent = platformWindow != null && !cornerTaken && !parentScreen;
    const windowChromeShown = platformWindow != null && !fullscreen;
    const ownChrome = useMemo<WindowChrome | null>(
      () =>
        windowContent && windowChromeShown && platformWindow
          ? { leading: platformWindow.metrics.room.leading }
          : null,
      [windowContent, windowChromeShown, platformWindow],
    );
    const windowChrome = windowChromeShown ? (ownChrome ?? handedChrome) : null;
    const ownsViewport = scroll === 'auto';
    const contentSized = host.sizing === 'content';
    const reservesChrome = ownsViewport || scroll === 'none';
    const ownWebViewport = ownsViewport && Platform.OS === 'web';
    const restoration = useOptionalScrollRestorationContext();
    const region = useAppShellRegion();
    const active = requestedActive && host.active && (parentScreen?.active ?? true);
    useEffect(() => {
      if (active && colorPreset) return host.claimColorPreset?.(colorPreset);
    }, [active, colorPreset, host.claimColorPreset]);
    // A dark screen in a light app (or the reverse) owns the status bar content
    // while it is the active one.
    useStatusBarClaim(active);
    useRegisterReselectHandler(reselect, active);
    // Its own floating action asks the shell's to step aside while it is in front.
    useScreenActionClaim(active && primaryAction != null);
    const localScrollY = useSharedValue(0);
    const scrollY =
      ownsViewport && !parentScreen && !parentViewport && host.metrics
        ? host.metrics.scrollY
        : localScrollY;
    const localProgress = useSharedValue(0);
    const localTarget = useSharedValue(0);
    const localScroller = useSharedValue<string | null>(null);
    const inheritedNavigation = useContext(ScreenNavigationContext);
    const navigation = useMemo(
      () =>
        navigationScope === 'inherit' && inheritedNavigation
          ? inheritedNavigation
          : {
              collapseProgress: localProgress,
              collapseTarget: localTarget,
              activeScrollerId: localScroller,
            },
      [navigationScope, inheritedNavigation, localProgress, localTarget, localScroller],
    );
    const { collapseProgress, collapseTarget, activeScrollerId } = navigation;
    const insets = useCssSafeAreaInsets(useContext(SafeAreaInsetsContext) ?? NO_SAFE_AREA_INSETS);
    const [measuredTop, setTop] = useState<number | null>(null);
    const [measuredBottom, setBottom] = useState<number | null>(null);
    const top =
      measuredTop ?? headerHeight ?? 56 + (Platform.OS === 'web' ? 0 : (insets?.top ?? 0));
    const bottom = measuredBottom ?? bottomBarHeight ?? 58 + windowEdgeGap(insets?.bottom ?? 0);
    const keyboardVisible = useKeyboardVisible();
    const keyboardFollow =
      getKeyboardComponents !== null &&
      Platform.OS !== 'web' &&
      bottomBarKeyboardBehavior === 'follow';
    const hasBottom =
      (!keyboardVisible || bottomBarKeyboardBehavior !== 'hide') &&
      Boolean(bottomBar || primaryAction || host.bottomBar);
    // The app's own bottom navigation (an `AppShell` bottom bar) already owns the
    // bottom edge. This screen's bar stacks ON it, never under it, and the content
    // clears both.
    const navigationEdge = useBottomEdgeInset();
    // On native a panel can reach under the app's bottom bar
    // (`reserveBottomBarSpace={false}`). A screen without a bar of its own pads
    // nothing there, so its scroller clears that bar instead.
    const scrollsUnderBar = Platform.OS !== 'web' && !hasBottom && !!region?.underBottomBar;
    // On web the bar already floats over the scrolled content (sticky in the
    // document, inside the viewport otherwise); only native reserved it. A
    // footer holding nothing but the floating action always floats: a FAB sits
    // over the content, whose scroller pads its end clear of it, never above a
    // band the content stops short of.
    const actionOnly = primaryAction != null && bottomBar == null && host.bottomBar == null;
    const bottomOverlaid =
      (bottomBarPlacement === 'overlay' || actionOnly) && Platform.OS !== 'web';
    const underBarInset = (scrollsUnderBar ? navigationEdge : 0) + contentClearance;
    const document =
      (documentScroll ??
        (ownsViewport &&
          (host.kind ? host.kind === 'document' : !region || region.flow === 'document'))) &&
      Platform.OS === 'web';
    const reservedTop = header && headerPlacement === 'inset' ? top : 0;
    // A document page fills ONE SCREEN of the region it is in. Inside a panel
    // shell that screen is the viewport less the shell's gutters and top bar —
    // a full `100dvh` page inside a panel 8px down overflowed it, and every short
    // page scrolled the document by the two gutters (and, on a phone, by the
    // bottom bar the panel reserves under it).
    const pageMinHeight =
      region?.flow === 'document'
        ? webViewportHeightMinus(
            region.viewportInset.top + region.viewportInset.bottom + region.bottomReserve,
          )
        : WEB_VIEWPORT_HEIGHT;
    const value = useMemo(
      () => ({
        active,
        contentSized,
        scrollY,
        collapseProgress,
        collapseTarget,
        activeScrollerId,
        contentInsetsHandled: document || reservesChrome,
        bottomInsetHandled:
          scroll === 'none' ||
          ((document || ownsViewport) && !keyboardFollow && !scrollsUnderBar && !bottomOverlaid),
        keyboardFollow,
        keyboardFooterHeight: hasBottom ? bottom : 0,
        documentScroll: document,
        headerOverlays: header != null && headerPlacement === 'overlay',
        topInset: reservedTop,
        bottomInset:
          keyboardVisible && !hasBottom
            ? contentClearance
            : hasBottom
              ? bottom + navigationEdge + contentClearance
              : navigationScope === 'inherit'
                ? scrollsUnderBar
                  ? Math.max(inheritedNavigation?.bottomInset ?? 0, underBarInset)
                  : (inheritedNavigation?.bottomInset ?? underBarInset)
                : underBarInset,
      }),
      [
        active,
        contentSized,
        scrollY,
        collapseProgress,
        collapseTarget,
        activeScrollerId,
        header,
        headerPlacement,
        hasBottom,
        top,
        bottom,
        contentClearance,
        navigationScope,
        inheritedNavigation?.bottomInset,
        document,
        ownsViewport,
        reservesChrome,
        scroll,
        reservedTop,
        keyboardVisible,
        navigationEdge,
        keyboardFollow,
        scrollsUnderBar,
        bottomOverlaid,
        underBarInset,
      ],
    );
    useScreenWindowBinding(value, { active: document && !ownsViewport });
    const reservedBottom = hasBottom ? bottom + navigationEdge + contentClearance : 0;
    const shellInset = region
      ? region.viewportInset.top + region.viewportInset.bottom + region.bottomReserve
      : 0;
    const viewport = useScreenViewportBinding(
      value,
      ownsViewport,
      document,
      shellInset + reservedTop + reservedBottom,
      !parentScreen && !parentViewport ? host : undefined,
    );
    const scrollbarTarget = useMemo(
      () => ({ current: { getScrollableNode: () => viewport.scrollRef.current } }),
      [viewport.scrollRef],
    );
    const viewportCss = ownWebViewport
      ? ({
          '--bloom-screen-viewport-height': document
            ? `calc(100dvh - ${shellInset + reservedTop + reservedBottom}px)`
            : `calc(100cqh - ${reservedTop + reservedBottom}px)`,
          '--bloom-screen-viewport-top': `${(document ? (region?.viewportInset.top ?? 0) : 0) + reservedTop}px`,
        } as WebCssStyle)
      : undefined;
    const documentHeaderStyle: WebCssStyle = {
      position: WEB_POSITION_STICKY,
      top: WEB_SURFACE_STICKY_TOP,
      zIndex: Z_INDEX.floating,
      marginBottom: -top,
      transitionProperty: 'top',
      transitionDuration: 'var(--bloom-panel-inset-duration, 0ms)',
      transitionTimingFunction: 'ease-in-out',
    };
    const headerSlotStyle = document
      ? documentHeaderStyle
      : ({ position: 'absolute', top: 0, left: 0, right: 0, zIndex: Z_INDEX.floating } as const);
    const headerNode = header ? (
      platformWindow != null ? (
        // The same node whether or not it is the window's chrome right now (a
        // full-screen window, a panel that leaves the top edge), so the header
        // is never remounted. As chrome it takes the presses nothing inside
        // takes, so it is no longer `box-none`.
        <WindowDragRegion
          disabled={windowChrome == null}
          testID={testID ? `${testID}-header` : undefined}
          pointerEvents={windowChrome == null ? 'box-none' : undefined}
          onLayout={(event) => setTop(event.nativeEvent.layout.height)}
          style={headerSlotStyle}
        >
          <WindowChromeProvider value={windowChrome}>
            <ScreenHeaderContext.Provider value={value}>{header}</ScreenHeaderContext.Provider>
          </WindowChromeProvider>
        </WindowDragRegion>
      ) : (
        <View
          testID={testID ? `${testID}-header` : undefined}
          pointerEvents="box-none"
          onLayout={(event) => setTop(event.nativeEvent.layout.height)}
          style={headerSlotStyle}
        >
          <ScreenHeaderContext.Provider value={value}>{header}</ScreenHeaderContext.Provider>
        </View>
      )
    ) : null;
    // The controls, once, in the window's corner: this screen's when it is the
    // window's content. A document scrolls the screen, so there the corner is
    // the viewport's.
    const windowControlsNode =
      ownChrome != null && platformWindow?.controls === 'bloom' ? (
        <View
          pointerEvents="box-none"
          style={{
            position: document ? WEB_POSITION_FIXED : 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: Z_INDEX.floating,
          }}
        >
          <WindowControls testID={testID ? `${testID}-window-controls` : undefined} />
        </View>
      ) : null;
    const localBottom =
      bottomBar ??
      (primaryAction ? (
        <View
          pointerEvents="box-none"
          style={{
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingBottom: windowEdgeGap(insets?.bottom ?? 0),
            minHeight: host.bottomBar
              ? (bottomBarHeight ?? 58 + windowEdgeGap(insets?.bottom ?? 0))
              : bottom,
          }}
        >
          {primaryAction}
        </View>
      ) : null);
    const Footer =
      keyboardFollow && getKeyboardComponents ? getKeyboardComponents().KeyboardStickyView : View;
    const bottomNode = hasBottom ? (
      <Footer
        {...(keyboardFollow ? { enabled: active } : {})}
        testID={testID ? `${testID}-bottom` : undefined}
        pointerEvents="box-none"
        onLayout={(event) => setBottom(event.nativeEvent.layout.height)}
        style={
          document
            ? {
                position: WEB_POSITION_STICKY,
                bottom: Math.max(
                  navigationEdge,
                  (region?.viewportInset.bottom ?? 0) + (region?.bottomReserve ?? 0),
                ),
                zIndex: Z_INDEX.floating,
                marginTop: -bottom,
              }
            : {
                position: 'absolute',
                bottom: keyboardFollow ? 0 : navigationEdge,
                left: 0,
                right: 0,
                zIndex: Z_INDEX.floating,
              }
        }
      >
        <ScreenFooterContext.Provider value={value}>
          {host.bottomBar ? (
            <View>
              {localBottom}
              {host.bottomBar}
            </View>
          ) : (
            localBottom
          )}
        </ScreenFooterContext.Provider>
      </Footer>
    ) : null;
    const screen = (
      <SurfaceLevelProvider
        level={surfaceLevel}
        fill={paintedSurface.current}
        fillModes={paintedSurface}
      >
        <ScreenActionOwnerContext.Provider value="route">
          <ScreenHostContext.Provider value={host}>
            {surfaceRecipe.sheet}
            {paintedSurface.sheet}
            <ScreenNavigationContext.Provider
              value={
                navigationScope === 'inherit'
                  ? inheritedNavigation
                  : { ...navigation, bottomInset: value.bottomInset }
              }
            >
              <ScreenContext.Provider value={value}>
                <ScreenViewportContext.Provider
                  value={ownsViewport ? viewport.value : parentViewport}
                >
                  <ScrollMetricsContext.Provider
                    value={ownsViewport ? viewport.value.metrics : inheritedMetrics}
                  >
                    <ScrollOffsetProvider value={ownsViewport ? value.scrollY : inheritedOffset}>
                      <View
                        {...props}
                        testID={testID}
                        style={[
                          document
                            ? {
                                minHeight: pageMinHeight,
                                width: '100%',
                                position: 'relative',
                                backgroundColor: surfaceFill,
                              }
                            : {
                                flexGrow: 1,
                                flexShrink: 1,
                                flexBasis: contentSized ? 'auto' : 0,
                                minHeight: 0,
                                position: 'relative',
                                backgroundColor: surfaceFill,
                              },
                          surfaceFillVars(paintedSurface.paint),
                          viewportCss,
                          style,
                        ]}
                      >
                        {ownWebViewport &&
                        restoration &&
                        host.restoreScroll !== false &&
                        !(document && host.restoresDocument) ? (
                          <ScreenViewportRestoration
                            target={document ? 'window' : viewport.scrollRef}
                            active={active}
                            restoring={viewport.restoring}
                          />
                        ) : null}
                        {headerNode}
                        <View
                          testID={testID ? `${testID}-content` : undefined}
                          style={
                            document
                              ? {
                                  position: 'relative',
                                  zIndex: 0,
                                  flexGrow: 1,
                                  flexShrink: 0,
                                  paddingTop: reservedTop,
                                  paddingBottom: hasBottom
                                    ? bottom + navigationEdge + contentClearance
                                    : 0,
                                }
                              : {
                                  position: 'relative',
                                  zIndex: 0,
                                  flexGrow: 1,
                                  flexShrink: 1,
                                  flexBasis: contentSized ? 'auto' : 0,
                                  minHeight: 0,
                                  minWidth: 0,
                                  ...((ownsViewport && !ownWebViewport) || scroll === 'none'
                                    ? {
                                        paddingTop: reservedTop,
                                        paddingBottom:
                                          (keyboardFollow && scroll !== 'none') || bottomOverlaid
                                            ? 0
                                            : reservedBottom,
                                      }
                                    : {}),
                                }
                          }
                        >
                          {/* Keep routed children at one tree position when scroll ownership
                            changes. Non-owning web wrappers create no layout boxes. */}
                          {Platform.OS === 'web' ? (
                            <View
                              ref={
                                ownWebViewport
                                  ? (viewport.scrollRef as React.Ref<React.ElementRef<typeof View>>)
                                  : undefined
                              }
                              {...{
                                dataSet: ownWebViewport
                                  ? { bloomScreenViewport: document ? 'document' : 'element' }
                                  : undefined,
                              }}
                              testID={ownWebViewport && testID ? `${testID}-viewport` : undefined}
                              style={
                                ownWebViewport
                                  ? [
                                      {
                                        minHeight: 0,
                                        minWidth: 0,
                                        flexGrow: 1,
                                        flexShrink: document ? 0 : 1,
                                        flexBasis: document || contentSized ? 'auto' : 0,
                                      },
                                      {
                                        overflowX: document ? 'visible' : 'hidden',
                                        overflowY: document ? 'visible' : 'auto',
                                        overscrollBehaviorY: document ? undefined : 'contain',
                                        ...(document
                                          ? {}
                                          : {
                                              containerType: contentSized ? 'inline-size' : 'size',
                                            }),
                                      } as WebCssStyle,
                                    ]
                                  : { display: 'contents' }
                              }
                            >
                              <View
                                ref={
                                  ownWebViewport
                                    ? (viewport.contentRef as React.Ref<
                                        React.ElementRef<typeof View>
                                      >)
                                    : undefined
                                }
                                testID={
                                  ownWebViewport && testID ? `${testID}-scroll-content` : undefined
                                }
                                style={
                                  ownWebViewport
                                    ? {
                                        minWidth: 0,
                                        flexGrow: 1,
                                        flexShrink: 0,
                                        ...(!document
                                          ? {
                                              paddingTop: reservedTop,
                                              paddingBottom: reservedBottom,
                                            }
                                          : {}),
                                      }
                                    : { display: 'contents' }
                                }
                              >
                                {children}
                              </View>
                            </View>
                          ) : (
                            children
                          )}
                          {ownWebViewport && active && !document ? (
                            <ScrollBar target={scrollbarTarget} />
                          ) : null}
                          {ownWebViewport && active && document && region?.flow !== 'document' ? (
                            <ScrollBar
                              target="document"
                              insets={{ start: reservedTop, end: reservedBottom }}
                            />
                          ) : null}
                        </View>
                        {bottomNode}
                        {windowControlsNode}
                      </View>
                    </ScrollOffsetProvider>
                  </ScrollMetricsContext.Provider>
                </ScreenViewportContext.Provider>
              </ScreenContext.Provider>
            </ScreenNavigationContext.Provider>
          </ScreenHostContext.Provider>
        </ScreenActionOwnerContext.Provider>
      </SurfaceLevelProvider>
    );
    if (platformWindow == null) return screen;
    // The chrome stops at this screen's header: its content (a nested screen,
    // a shell) is below it. While it is the window's content nothing inside is
    // at the corner.
    const content = <WindowChromeProvider value={null}>{screen}</WindowChromeProvider>;
    return windowContent ? <WindowCornerProvider value>{content}</WindowCornerProvider> : content;
  }

  return Screen;
}
