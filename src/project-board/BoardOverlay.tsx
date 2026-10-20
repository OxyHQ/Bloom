import type { ComponentType, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { OverlayRoot } from '../overlay';
import { StyledView } from '../styles/styled-primitives';
const AnimatedView = Animated.createAnimatedComponent(StyledView);

export function BoardOverlay({
  Portal,
  style,
  children,
  testID,
}: {
  Portal: ComponentType<{ children?: ReactNode }>;
  style: AnimatedStyle<ViewStyle>;
  children: ReactNode;
  testID?: string;
}) {
  return (
    <Portal>
      <OverlayRoot>
        <AnimatedView
          testID={testID}
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={style}
        >
          {children}
        </AnimatedView>
      </OverlayRoot>
    </Portal>
  );
}
