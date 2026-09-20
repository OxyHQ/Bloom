import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

type Placement = 'rail' | 'sidebar';
interface Props {
  placement: Placement;
  children: (placement: Placement) => ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

/** A single navigation tree: fade out, replace at zero opacity, resize and reveal. */
export function ResponsiveNavigation({ placement, children, style, testID }: Props) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(placement);
  const [transitioning, setTransitioning] = useState(false);
  const shownRef = useRef(placement);
  const naturalWidth = useRef(0);
  const generation = useRef(0);
  const moving = useRef(false);
  const opacity = useSharedValue(1);
  const width = useSharedValue(0);

  const finish = (version: number) => {
    if (version !== generation.current) return;
    moving.current = false;
    setTransitioning(false);
  };
  const commit = (next: Placement, version: number) => {
    if (version !== generation.current) return;
    shownRef.current = next;
    setShown(next);
    opacity.value = withTiming(1, { duration: 200, easing: EASE }, finished => {
      if (finished) runOnJS(finish)(version);
    });
  };

  useEffect(() => {
    const version = ++generation.current;
    cancelAnimation(opacity);
    cancelAnimation(width);
    if (reducedMotion || naturalWidth.current === 0) {
      shownRef.current = placement;
      setShown(placement);
      moving.current = false;
      setTransitioning(false);
      opacity.value = 1;
      return;
    }
    if (placement === shownRef.current && !moving.current) return;
    if (!moving.current) width.value = naturalWidth.current;
    moving.current = true;
    setTransitioning(true);
    if (placement === shownRef.current) {
      width.value = withTiming(naturalWidth.current, { duration: 200, easing: EASE });
      opacity.value = withTiming(1, { duration: 200, easing: EASE }, finished => {
        if (finished) runOnJS(finish)(version);
      });
    } else {
      opacity.value = withTiming(0, { duration: 90, easing: EASE }, finished => {
        if (finished) runOnJS(commit)(placement, version);
      });
    }
    return () => { cancelAnimation(opacity); cancelAnimation(width); };
  }, [placement, reducedMotion, opacity, width]);

  const measure = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    naturalWidth.current = nextWidth;
    if (moving.current) width.value = withTiming(nextWidth, { duration: 160, easing: EASE });
  };
  const frameStyle = useAnimatedStyle(() => ({ width: transitioning ? width.value : 'auto' }), [transitioning, width]);
  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);
  return <Animated.View testID={testID ? `${testID}-frame` : undefined} style={[{ flexShrink: 0, minHeight: 0 }, frameStyle]}>
    <Animated.View style={[{ flex: 1, minHeight: 0, alignSelf: 'flex-start' }, contentStyle]}>
      <View testID={testID} onLayout={measure} style={[{ flex: 1, minHeight: 0, alignSelf: 'flex-start' }, style]}>{children(shown)}</View>
    </Animated.View>
  </Animated.View>;
}
