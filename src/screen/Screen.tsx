import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { windowEdgeGap } from '../layout/edge';
import { useSharedValue } from 'react-native-reanimated';
import { useTheme } from '../theme/use-theme';
import { WEB_POSITION_STICKY, WEB_VIEWPORT_HEIGHT } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { ScreenContext, ScreenNavigationContext } from './context';
import { useScreenWindowBinding } from './use-screen-window-scroll';
import type { ScreenProps } from './types';

/** One continuous canvas; chrome overlays it and content reserves its measured footprint. */
export function Screen({ header, bottomBar, primaryAction, active: requestedActive = true, navigationScope = 'inherit', documentScroll = false, headerHeight, bottomBarHeight, contentClearance = 16, children, style, testID, ...props }: ScreenProps) {
  const { colors } = useTheme();
  const parentScreen = useContext(ScreenContext);
  const active = requestedActive && (navigationScope === 'isolated' ? true : parentScreen?.active ?? true);
  const scrollY = useSharedValue(0);
  const localProgress = useSharedValue(0);
  const localTarget = useSharedValue(0);
  const localScroller = useSharedValue<string | null>(null);
  const inheritedNavigation = useContext(ScreenNavigationContext);
  const navigation = useMemo(() => navigationScope === 'inherit' && inheritedNavigation ? inheritedNavigation : { collapseProgress: localProgress, collapseTarget: localTarget, activeScrollerId: localScroller }, [navigationScope, inheritedNavigation, localProgress, localTarget, localScroller]);
  const { collapseProgress, collapseTarget, activeScrollerId } = navigation;
  const insets = useContext(SafeAreaInsetsContext);
  const [measuredTop, setTop] = useState<number | null>(null);
  const [measuredBottom, setBottom] = useState<number | null>(null);
  const top = measuredTop ?? headerHeight ?? (56 + (Platform.OS === 'web' ? 0 : insets?.top ?? 0));
  const bottom = measuredBottom ?? bottomBarHeight ?? (58 + windowEdgeGap(insets?.bottom ?? 0));
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const hasBottom = !keyboardVisible && Boolean(bottomBar || primaryAction);
  const document = documentScroll && Platform.OS === 'web';
  const value = useMemo(() => ({ active, scrollY, collapseProgress, collapseTarget, activeScrollerId,
    contentInsetsHandled: document, topInset: header ? top : 0, bottomInset: hasBottom ? bottom + contentClearance : navigationScope === 'inherit' ? inheritedNavigation?.bottomInset ?? contentClearance : contentClearance,
  }), [active, scrollY, collapseProgress, collapseTarget, activeScrollerId, header, hasBottom, top, bottom, contentClearance, navigationScope, inheritedNavigation?.bottomInset, document]);
  useScreenWindowBinding(value, { active: document });
  const headerNode = header ? <View testID={testID ? `${testID}-header` : undefined} pointerEvents="box-none" onLayout={event => setTop(event.nativeEvent.layout.height)} style={document ? { position: WEB_POSITION_STICKY, top: 0, zIndex: Z_INDEX.floating, marginBottom: -top } : { position: 'absolute', top: 0, left: 0, right: 0 }}>{header}</View> : null;
  const bottomNode = hasBottom ? <View testID={testID ? `${testID}-bottom` : undefined} pointerEvents="box-none" onLayout={event => setBottom(event.nativeEvent.layout.height)} style={document ? { position: WEB_POSITION_STICKY, bottom: 0, zIndex: Z_INDEX.floating, marginTop: -bottom } : { position: 'absolute', bottom: 0, left: 0, right: 0 }}>{bottomBar ?? <View pointerEvents="box-none" style={{ alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: windowEdgeGap(insets?.bottom ?? 0), minHeight: bottom }}>{primaryAction}</View>}</View> : null;
  return (
    <ScreenNavigationContext.Provider value={navigationScope === 'inherit' ? inheritedNavigation : { ...navigation, bottomInset: value.bottomInset }}>
    <ScreenContext.Provider value={value}>
      <View {...props} testID={testID} style={[document ? { minHeight: WEB_VIEWPORT_HEIGHT, width: '100%', position: 'relative', backgroundColor: colors.background } : { flex: 1, minHeight: 0, position: 'relative', backgroundColor: colors.background }, style]}>
        {document ? headerNode : null}
        {document ? <View testID={testID ? `${testID}-content` : undefined} style={{
          flexGrow: 1, flexShrink: 0,
          paddingTop: header ? top : 0,
          paddingBottom: hasBottom ? bottom + contentClearance : 0,
        }}>{children}</View> : children}
        {document ? null : headerNode}
        {bottomNode}
      </View>
    </ScreenContext.Provider>
    </ScreenNavigationContext.Provider>
  );
}
