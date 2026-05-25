/**
 * Web stub for `react-native-gesture-handler` used by Storybook. We forward
 * to react-native primitives so Bloom's BottomSheet / Menu / etc. render
 * statically (without pan support) on web.
 */
import React, {
  createElement,
  forwardRef,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type PressableProps,
  type ScrollViewProps,
  type ViewProps,
} from 'react-native';

const passthrough = <P extends object>(
  Component: ComponentType<P>,
  displayName: string,
) => {
  const Comp = forwardRef<unknown, P>((props, ref) =>
    createElement(Component as ComponentType<P & { ref?: unknown }>, {
      ...props,
      ref,
    }),
  );
  Comp.displayName = displayName;
  return Comp;
};

export const GestureHandlerRootView = passthrough<ViewProps>(
  View,
  'GestureHandlerRootView',
);
export const PanGestureHandler = ({ children }: { children: ReactNode }) =>
  createElement(React.Fragment, null, children);
export const TapGestureHandler = PanGestureHandler;
export const LongPressGestureHandler = PanGestureHandler;
export const PinchGestureHandler = PanGestureHandler;
export const RotationGestureHandler = PanGestureHandler;
export const ForceTouchGestureHandler = PanGestureHandler;
export const NativeViewGestureHandler = PanGestureHandler;

export const RectButton = passthrough<PressableProps>(Pressable, 'RectButton');
export const BorderlessButton = passthrough<PressableProps>(
  Pressable,
  'BorderlessButton',
);
export const BaseButton = passthrough<PressableProps>(Pressable, 'BaseButton');
export const RawButton = passthrough<PressableProps>(Pressable, 'RawButton');
export const TouchableOpacity = passthrough<PressableProps>(
  Pressable,
  'GHTouchableOpacity',
);
export const TouchableHighlight = passthrough<PressableProps>(
  Pressable,
  'GHTouchableHighlight',
);
export const TouchableWithoutFeedback = passthrough<PressableProps>(
  Pressable,
  'GHTouchableWithoutFeedback',
);

const noopBuilder = () => {
  const builder = {
    enabled: () => builder,
    onBegin: () => builder,
    onStart: () => builder,
    onUpdate: () => builder,
    onChange: () => builder,
    onEnd: () => builder,
    onFinalize: () => builder,
    onTouchesDown: () => builder,
    onTouchesMove: () => builder,
    onTouchesUp: () => builder,
    onTouchesCancelled: () => builder,
    activeOffsetX: () => builder,
    activeOffsetY: () => builder,
    failOffsetX: () => builder,
    failOffsetY: () => builder,
    minDistance: () => builder,
    minVelocity: () => builder,
    minVelocityX: () => builder,
    minVelocityY: () => builder,
    minPointers: () => builder,
    maxPointers: () => builder,
    averageTouches: () => builder,
    avgTouches: () => builder,
    enableTrackpadTwoFingerGesture: () => builder,
    shouldCancelWhenOutside: () => builder,
    hitSlop: () => builder,
    cancelsTouchesInView: () => builder,
    manualActivation: () => builder,
    requireExternalGestureToFail: () => builder,
    simultaneousWithExternalGesture: () => builder,
    blocksExternalGesture: () => builder,
    runOnJS: () => builder,
    withTestId: () => builder,
    withRef: () => builder,
  };
  return builder;
};

export const Gesture = {
  Pan: noopBuilder,
  Tap: noopBuilder,
  LongPress: noopBuilder,
  Pinch: noopBuilder,
  Rotation: noopBuilder,
  Fling: noopBuilder,
  Manual: noopBuilder,
  Native: noopBuilder,
  ForceTouch: noopBuilder,
  Race: noopBuilder,
  Simultaneous: noopBuilder,
  Exclusive: noopBuilder,
};

export const GestureDetector = ({ children }: { children: ReactNode }) =>
  createElement(React.Fragment, null, children);

export const FlatList = passthrough<ScrollViewProps>(ScrollView, 'GHFlatList');
export const ScrollView_GH = passthrough<ScrollViewProps>(
  ScrollView,
  'GHScrollView',
);
export { ScrollView_GH as ScrollView };

export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
} as const;

export const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
} as const;

export type GestureType = unknown;
export type ComposedGesture = unknown;

export default { GestureHandlerRootView, Text };
