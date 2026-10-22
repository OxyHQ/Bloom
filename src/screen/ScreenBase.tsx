import type { ComponentType } from 'react';
import type { ScrollBarProps } from '../layout/types';
import type { BloomColorScopeProps } from '../theme/color-scope/ColorScope';
import type { useScrollRestoration as UseScrollRestoration } from '../scroll/use-scroll-restoration';
import type React from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { windowEdgeGap } from '../layout/edge';
import { useSharedValue } from 'react-native-reanimated';
import { useSurfaceFillRecipe } from '../styles/surface-levels';
import {
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
import type { ScreenProps } from './types';
import { useCssSafeAreaInsets, NO_SAFE_AREA_INSETS } from '../hooks/use-css-safe-area-insets';
import type { ScreenKeyboardComponents } from './keyboard-components';

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
    bottomBar,
    bottomBarKeyboardBehavior = 'hide',
    primaryAction,
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
    const surfaceFill = surfaceRecipe.paint;
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
    const [keyboardVisible, setKeyboardVisible] = useState(
      () => Platform.OS !== 'web' && (Keyboard.isVisible?.() ?? false),
    );
    useEffect(() => {
      if (Platform.OS === 'web') return;
      const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
      const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
      return () => {
        show.remove();
        hide.remove();
      };
    }, []);
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
        bottomInsetHandled: scroll === 'none' || ((document || ownsViewport) && !keyboardFollow),
        keyboardFollow,
        keyboardFooterHeight: hasBottom ? bottom : 0,
        documentScroll: document,
        topInset: reservedTop,
        bottomInset:
          keyboardVisible && !hasBottom
            ? contentClearance
            : hasBottom
              ? bottom + navigationEdge + contentClearance
              : navigationScope === 'inherit'
                ? (inheritedNavigation?.bottomInset ?? contentClearance)
                : contentClearance,
      }),
      [
        active,
        contentSized,
        scrollY,
        collapseProgress,
        collapseTarget,
        activeScrollerId,
        header,
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
    const headerNode = header ? (
      <View
        testID={testID ? `${testID}-header` : undefined}
        pointerEvents="box-none"
        onLayout={(event) => setTop(event.nativeEvent.layout.height)}
        style={
          document
            ? documentHeaderStyle
            : { position: 'absolute', top: 0, left: 0, right: 0, zIndex: Z_INDEX.floating }
        }
      >
        <ScreenHeaderContext.Provider value={value}>{header}</ScreenHeaderContext.Provider>
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
    return (
      <ScreenHostContext.Provider value={host}>
        {surfaceRecipe.sheet}
        <ScreenNavigationContext.Provider
          value={
            navigationScope === 'inherit'
              ? inheritedNavigation
              : { ...navigation, bottomInset: value.bottomInset }
          }
        >
          <ScreenContext.Provider value={value}>
            <ScreenViewportContext.Provider value={ownsViewport ? viewport.value : parentViewport}>
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
                                      keyboardFollow && scroll !== 'none' ? 0 : reservedBottom,
                                  }
                                : {}),
                            }
                      }
                    >
                      {ownWebViewport ? (
                        <View
                          ref={viewport.scrollRef as React.Ref<React.ElementRef<typeof View>>}
                          {...{
                            dataSet: { bloomScreenViewport: document ? 'document' : 'element' },
                          }}
                          testID={testID ? `${testID}-viewport` : undefined}
                          style={[
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
                                : { containerType: contentSized ? 'inline-size' : 'size' }),
                            } as WebCssStyle,
                          ]}
                        >
                          <View
                            ref={viewport.contentRef as React.Ref<React.ElementRef<typeof View>>}
                            testID={testID ? `${testID}-scroll-content` : undefined}
                            style={{
                              minWidth: 0,
                              flexGrow: 1,
                              flexShrink: 0,
                              ...(!document
                                ? { paddingTop: reservedTop, paddingBottom: reservedBottom }
                                : {}),
                            }}
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
                  </View>
                </ScrollOffsetProvider>
              </ScrollMetricsContext.Provider>
            </ScreenViewportContext.Provider>
          </ScreenContext.Provider>
        </ScreenNavigationContext.Provider>
      </ScreenHostContext.Provider>
    );
  }

  return Screen;
}
