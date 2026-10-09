import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Platform, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { MOTION_RECIPES } from '../motion/recipes';
import { WEB_OVERFLOW_CLIP } from '../styles/web-view-style';
import { AppShellPaneActiveContext } from './context';
import { SplitPane } from './SplitPane';
import type { AppShellSplitPanesProps } from './types';

type Props = Pick<AppShellSplitPanesProps, 'list' | 'detail' | 'listErrorBoundary' | 'detailErrorBoundary' | 'testID'> & {
  showList: boolean;
  showDetail: boolean;
  paneScroll: boolean;
  width: number;
  gap: number;
  dividerStyle: ViewStyle;
  resizeHandle: React.ReactNode;
};

// `clip` prevents horizontal overflow without creating a nested scroll owner.
// Native has no document scroll and uses its ordinary clipping primitive.
const clipStyle: ViewStyle = { overflow: Platform.OS === 'web' ? WEB_OVERFLOW_CLIP : 'hidden' };

/** One progress value owns both live pane positions; no clones, opacity or layout snapshots. */
export function AppShellSplitMotion({ list, detail, showList, showDetail, width, gap,
  paneScroll, listErrorBoundary, detailErrorBoundary, dividerStyle, resizeHandle, testID }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [retained, setRetained] = useState({ list, detail, listVisible: showList, detailVisible: showDetail });
  const previousSplit = useRef(showList);
  const split = showDetail ? showList : previousSplit.current;
  const progress = useSharedValue(showDetail ? 1 : 0);
  const reducedMotion = usePrefersReducedMotion();
  const generation = useRef(0);
  const direction = useIsRtl() ? -1 : 1;
  const directionProps = useDirectionProps();

  useLayoutEffect(() => {
    previousSplit.current = split;
    setRetained(current => ({
      list: showList ? list : current.list,
      detail: showDetail ? detail : current.detail,
      listVisible: showList || current.listVisible,
      detailVisible: showDetail || current.detailVisible,
    }));
  }, [list, detail, showList, showDetail, split]);

  const finish = useCallback((id: number, keepList: boolean, keepDetail: boolean) => {
    if (generation.current !== id) return;
    setRetained(current => ({
      list: keepList ? current.list : undefined,
      detail: keepDetail ? current.detail : undefined,
      listVisible: keepList,
      detailVisible: keepDetail,
    }));
  }, []);

  useLayoutEffect(() => {
    const id = ++generation.current;
    const target = showDetail ? 1 : 0;
    if (reducedMotion) {
      progress.value = target;
      finish(id, showList, showDetail);
    } else {
      // Duration springs in Reanimated 3 cap each frame's integrated time at
      // 64ms, then force their target at the wall-clock deadline. Expensive
      // layout frames can therefore end in a large final jump. Timing samples
      // elapsed time directly and never accumulates that integration deficit.
      progress.value = withTiming(target, {
        duration: MOTION_RECIPES.expand.duration,
        easing: Easing.out(Easing.cubic),
        // The reactive hook above owns this policy; System is a launch snapshot.
        reduceMotion: ReduceMotion.Never,
      }, completed => {
        if (completed) runOnJS(finish)(id, showList, showDetail);
      });
    }
    return () => { cancelAnimation(progress); };
  }, [showList, showDetail, progress, reducedMotion, finish]);

  const measure = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);
  const listStyle = useAnimatedStyle(() => ({
    width: containerWidth > 0 ? (split ? containerWidth - (containerWidth - width) * progress.value : containerWidth) : undefined,
    transform: [{ translateX: split ? 0 : -direction * containerWidth * progress.value }],
  }), [containerWidth, width, split, progress, direction]);
  const detailStyle = useAnimatedStyle(() => ({
    width: containerWidth > 0 ? (split ? Math.max(0, containerWidth - width - gap) : containerWidth) : undefined,
    transform: [{ translateX: split ? 0 : direction * containerWidth * (1 - progress.value) }],
  }), [containerWidth, width, gap, split, progress, direction]);
  const gapStyle = useAnimatedStyle(() => ({ width: gap * progress.value }), [gap, progress]);

  const hasList = showList || retained.listVisible;
  const hasDetail = showDetail || retained.detailVisible;
  const inactive = (active: boolean) => ({
    pointerEvents: active ? 'auto' as const : 'none' as const,
    'aria-hidden': active ? undefined : true,
    importantForAccessibility: active ? 'auto' as const : 'no-hide-descendants' as const,
    accessibilityElementsHidden: !active,
    ...(Platform.OS === 'web' && !active ? { inert: true } : null),
  });
  return <View {...directionProps} onLayout={measure} testID={testID ? `${testID}-motion` : undefined}
    style={[{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, flexDirection: 'row', alignItems: 'stretch' }, clipStyle]}>
    {hasList ? <Animated.View {...inactive(showList)}
      testID={testID ? `${testID}-pane-list` : undefined}
      style={[{ minWidth: 0, flexShrink: 0 }, !split && !showList ? { position: 'absolute', top: 0, start: 0 } : null, listStyle]}>
      <AppShellPaneActiveContext.Provider value={showList}>
        <SplitPane scroll={paneScroll} errorBoundary={listErrorBoundary} style={{ flexGrow: 1 }}>
          {showList ? list : retained.list}
        </SplitPane>
      </AppShellPaneActiveContext.Provider>
    </Animated.View> : null}
    {split && hasList && hasDetail ? <Animated.View
      style={[dividerStyle, gapStyle]} testID={testID ? `${testID}-list-gap` : undefined}>
      {showList && showDetail ? <View pointerEvents="box-none"
        testID={testID ? `${testID}-resize-anchor` : undefined}
        style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', right: '50%', width: 0 }}>
        {resizeHandle}
      </View> : null}
    </Animated.View> : null}
    {hasDetail ? <Animated.View {...inactive(showDetail)}
      testID={testID ? `${testID}-pane-detail` : undefined}
      style={[{ minWidth: 0, flexShrink: 0 }, !split && !showDetail ? { position: 'absolute', top: 0, start: 0 } : null, detailStyle]}>
      <AppShellPaneActiveContext.Provider value={showDetail}>
        <SplitPane scroll={paneScroll} errorBoundary={detailErrorBoundary} style={{ flexGrow: 1 }}>
          {showDetail ? detail : retained.detail}
        </SplitPane>
      </AppShellPaneActiveContext.Provider>
    </Animated.View> : null}
  </View>;
}
