import { useRef, useState, type ComponentType } from 'react';
import { View, ScrollView, Keyboard, Platform } from 'react-native';
import { useEffect } from 'react';
import Animated, { useAnimatedReaction, useAnimatedStyle, interpolate, runOnJS, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClaimBottomEdge } from '../layout/bottom-edge';
import { windowEdgeGap } from '../layout/edge';
import { useMinimizeState } from '../tab-bar/context';
import { EXPANDED_HEIGHT, MINIMIZED_HEIGHT, BLUR_BLEED, MAX_EXPANDED_ITEM_WIDTH, ROW_PAD_H } from '../tab-bar/shared';
import type { TabBarProps, TabBarButtonProps } from '../tab-bar/types';
import type { ProgressiveBlurProps } from '../progressive-blur/types';
import type { BottomBarProps } from './types';

interface Props extends BottomBarProps {
  Navigation: ComponentType<TabBarProps>;
  Item: ComponentType<TabBarButtonProps>;
  Blur: ComponentType<ProgressiveBlurProps>;
}
export function BottomBarBase({ Navigation, Item, Blur, items, value, onValueChange, action,
  actionBehavior = 'hide', material = 'translucent', minimizeProgress, blur = true, maxWidth = 560, style, testID }: Props) {
  const insets = useSafeAreaInsets();
  const minimize = useMinimizeState();
  const progress = minimizeProgress ?? minimize.progress;
  const reducedMotion = useReducedMotion();
  const hideAction = actionBehavior === 'hide' && items.length > 0;
  const [actionHidden, setActionHidden] = useState(() => hideAction && progress.value > 0.01);
  const actionRef = useRef<View>(null);
  const [actionWidth, setActionWidth] = useState<number | null>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const actionSpace = action ? (actionWidth ?? 56) + 10 : 0;
  const navigationWidth = Math.max(0, Math.min(rowWidth - 24 - actionSpace, items.length * MAX_EXPANDED_ITEM_WIDTH + ROW_PAD_H * 2));
  // Only interaction eligibility crosses to JS; all motion stays on the shared UI signal.
  useAnimatedReaction(() => hideAction && progress.value > 0.01, (hidden, previous) => {
    if (hidden !== previous) runOnJS(setActionHidden)(hidden);
  }, [hideAction, progress, setActionHidden]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = actionRef.current as unknown as HTMLElement | null;
    if (!node) return;
    if (actionHidden && node.contains(document.activeElement)) (document.activeElement as HTMLElement | null)?.blur?.();
    node.inert = actionHidden;
  }, [actionHidden]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const bottom = windowEdgeGap(insets.bottom);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  useClaimBottomEdge(keyboardVisible ? 0 : bottom + EXPANDED_HEIGHT);
  const rowStyle = useAnimatedStyle(() => ({
    height: interpolate(reducedMotion ? Number(progress.value > 0.01) : progress.value, [0, 1], [EXPANDED_HEIGHT, MINIMIZED_HEIGHT], 'clamp'),
  }), [progress, reducedMotion]);
  const actionStyle = useAnimatedStyle(() => {
    const amount = hideAction ? Math.min(1, Math.max(0, reducedMotion ? Number(progress.value > 0.01) : progress.value)) : 0;
    return {
      ...(actionWidth == null ? {} : { width: actionWidth * (1 - amount) }),
      marginLeft: items.length ? 10 * (1 - amount) : 0,
      opacity: 1 - amount,
      transform: [{ scale: 1 - amount * 0.15 }],
    };
  }, [progress, hideAction, reducedMotion, actionWidth, items.length]);
  if (keyboardVisible || (!items.length && !action)) return null;
  return <View testID={testID} pointerEvents="box-none" style={[{ height: bottom + EXPANDED_HEIGHT, justifyContent: 'flex-end' }, style]}>
    {blur && material === 'translucent' && <Blur direction="bottom" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: bottom + EXPANDED_HEIGHT + BLUR_BLEED }} />}
    <Animated.View onLayout={event => setRowWidth(event.nativeEvent.layout.width)} pointerEvents="box-none" style={[{ justifyContent: items.length ? 'center' : 'flex-end', alignSelf: 'center', width: '100%', maxWidth, paddingLeft: 12, paddingRight: 12, marginBottom: bottom, flexDirection: 'row', alignItems: 'center' }, rowStyle]}>
      {items.length > 0 && <View testID={testID ? `${testID}-navigation` : undefined} style={{ width: navigationWidth, minWidth: 0 }}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: '100%' }}><View style={{ width: Math.max(navigationWidth, items.length * 44 + 8) }}><Navigation scrollable={navigationWidth > 0 && navigationWidth < items.length * 44 + 8} embedded blur={false} material={material} minimizeProgress={progress}
        activeIndex={items.findIndex(item => item.name === value)} onIndexChange={index => { if (items[index]) onValueChange(items[index].name); }}>
        {items.map((item, index) => <Item key={item.name} item={item} index={index} />)}
      </Navigation></View></ScrollView></View>}
      {action && <Animated.View ref={actionRef} pointerEvents={actionHidden ? 'none' : 'auto'}
        accessibilityElementsHidden={actionHidden} importantForAccessibility={actionHidden ? 'no-hide-descendants' : 'auto'}
        aria-hidden={actionHidden} testID={testID ? `${testID}-action` : undefined}
        style={[{ flexShrink: 0, alignItems: 'flex-start', justifyContent: 'center' }, actionStyle]}>
        <View onLayout={event => setActionWidth(event.nativeEvent.layout.width)} style={{ flexShrink: 0, ...(actionWidth == null ? {} : { width: actionWidth }) }}>{action}</View>
      </Animated.View>}
    </Animated.View>
  </View>;
}
