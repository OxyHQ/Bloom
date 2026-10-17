import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { windowEdgeGap } from '../layout/edge';
import { useSharedValue } from 'react-native-reanimated';
import { useSurfaceFill } from '../styles/surface-levels';
import {
  WEB_POSITION_STICKY,
  WEB_SURFACE_STICKY_TOP,
  WEB_VIEWPORT_HEIGHT,
  webViewportHeightMinus,
  type WebCssStyle,
} from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { useAppShellRegion } from '../layout/app-shell-region';
import { ScreenContext, ScreenHeaderContext, ScreenNavigationContext } from './context';
import { useScreenWindowBinding } from './use-screen-window-scroll';
import type { ScreenProps } from './types';
import { useCssSafeAreaInsets, NO_SAFE_AREA_INSETS } from '../hooks/use-css-safe-area-insets';

/** One continuous canvas; chrome overlays it and content reserves its measured footprint. */
export function Screen({
  header,
  bottomBar,
  primaryAction,
  active: requestedActive = true,
  navigationScope = 'inherit',
  documentScroll = false,
  headerHeight,
  bottomBarHeight,
  contentClearance = 16,
  children,
  style,
  testID,
  ...props
}: ScreenProps) {
  const surfaceFill = useSurfaceFill();
  const parentScreen = useContext(ScreenContext);
  const active =
    requestedActive && (navigationScope === 'isolated' ? true : (parentScreen?.active ?? true));
  const scrollY = useSharedValue(0);
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
  const top = measuredTop ?? headerHeight ?? 56 + (Platform.OS === 'web' ? 0 : (insets?.top ?? 0));
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
  const hasBottom = !keyboardVisible && Boolean(bottomBar || primaryAction);
  // The app's own bottom navigation (an `AppShell` bottom bar) already owns the
  // bottom edge. This screen's bar stacks ON it, never under it, and the content
  // clears both.
  const navigationEdge = useBottomEdgeInset();
  const document = documentScroll && Platform.OS === 'web';
  // A document page fills ONE SCREEN of the region it is in. Inside a panel
  // shell that screen is the viewport less the shell's gutters and top bar —
  // a full `100dvh` page inside a panel 8px down overflowed it, and every short
  // page scrolled the document by the two gutters (and, on a phone, by the
  // bottom bar the panel reserves under it).
  const region = useAppShellRegion();
  const pageMinHeight =
    region?.flow === 'document'
      ? webViewportHeightMinus(
          region.viewportInset.top + region.viewportInset.bottom + region.bottomReserve,
        )
      : WEB_VIEWPORT_HEIGHT;
  const value = useMemo(
    () => ({
      active,
      scrollY,
      collapseProgress,
      collapseTarget,
      activeScrollerId,
      contentInsetsHandled: document,
      documentScroll: document,
      topInset: header ? top : 0,
      bottomInset: keyboardVisible
        ? contentClearance
        : hasBottom
          ? bottom + navigationEdge + contentClearance
          : navigationScope === 'inherit'
            ? (inheritedNavigation?.bottomInset ?? contentClearance)
            : contentClearance,
    }),
    [
      active,
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
      keyboardVisible,
      navigationEdge,
    ],
  );
  useScreenWindowBinding(value, { active: document });
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
      style={document ? documentHeaderStyle : { position: 'absolute', top: 0, left: 0, right: 0 }}
    >
      <ScreenHeaderContext.Provider value={value}>{header}</ScreenHeaderContext.Provider>
    </View>
  ) : null;
  const bottomNode = hasBottom ? (
    <View
      testID={testID ? `${testID}-bottom` : undefined}
      pointerEvents="box-none"
      onLayout={(event) => setBottom(event.nativeEvent.layout.height)}
      style={
        document
          ? {
              position: WEB_POSITION_STICKY,
              bottom: navigationEdge,
              zIndex: Z_INDEX.floating,
              marginTop: -bottom,
            }
          : { position: 'absolute', bottom: navigationEdge, left: 0, right: 0 }
      }
    >
      {bottomBar ?? (
        <View
          pointerEvents="box-none"
          style={{
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingBottom: windowEdgeGap(insets?.bottom ?? 0),
            minHeight: bottom,
          }}
        >
          {primaryAction}
        </View>
      )}
    </View>
  ) : null;
  return (
    <ScreenNavigationContext.Provider
      value={
        navigationScope === 'inherit'
          ? inheritedNavigation
          : { ...navigation, bottomInset: value.bottomInset }
      }
    >
      <ScreenContext.Provider value={value}>
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
              : { flex: 1, minHeight: 0, position: 'relative', backgroundColor: surfaceFill },
            style,
          ]}
        >
          {document ? headerNode : null}
          {document ? (
            <View
              testID={testID ? `${testID}-content` : undefined}
              style={{
                flexGrow: 1,
                flexShrink: 0,
                paddingTop: header ? top : 0,
                paddingBottom: hasBottom ? bottom + navigationEdge + contentClearance : 0,
              }}
            >
              {children}
            </View>
          ) : (
            children
          )}
          {document ? null : headerNode}
          {bottomNode}
        </View>
      </ScreenContext.Provider>
    </ScreenNavigationContext.Provider>
  );
}
