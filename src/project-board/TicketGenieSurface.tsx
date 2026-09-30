import { useEffect, useState, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useDialogContext } from '../dialog/context';
import { StyledView } from '../styles/styled-primitives';
import { TicketGenieEnteredContext } from './context';
const AnimatedView = Animated.createAnimatedComponent(StyledView);
function phase(start: number, end: number, value: number) {
  'worklet';
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}
export function TicketGenieSurface({
  children,
  corner = false,
}: {
  children: ReactNode;
  corner?: boolean;
}) {
  const { isClosing = false } = useDialogContext();
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 0 : 1);
  const [height, setHeight] = useState(280);
  const [entered, setEntered] = useState(reduced || !corner);
  const { height: viewportHeight } = useWindowDimensions();
  useEffect(() => {
    progress.value = withTiming(isClosing ? 1 : 0, {
      duration: reduced ? 0 : 480,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    });
  }, [isClosing, progress, reduced]);
  useEffect(() => {
    if (isClosing || !corner) return;
    const timer = setTimeout(() => setEntered(true), reduced ? 0 : 480);
    return () => clearTimeout(timer);
  }, [isClosing, corner, reduced]);
  const style = useAnimatedStyle(() => {
    const p = reduced ? 0 : progress.value;
    const extension = 64 * phase(0, 0.42, p);
    const swallow = phase(0.32, 1, p);
    const stretch = Math.max(
      0.001,
      ((height + extension) * (1 - swallow)) / height,
    );
    return {
      opacity: 1 - phase(0.94, 1, p),
      transform: [
        {
          translateY: corner
            ? viewportHeight * swallow * 0.5
            : extension + (height * (1 - stretch)) / 2,
        },
        { translateX: corner ? 24 * phase(0, 0.72, p) : 0 },
        { scaleX: corner ? 1 - 0.88 * swallow : 1 },
        { scaleY: stretch },
      ],
    };
  }, [progress, reduced, corner, height, viewportHeight]);
  return (
    <TicketGenieEnteredContext.Provider value={entered}>
    <AnimatedView
      onLayout={(event) => setHeight(event.nativeEvent.layout.height || 280)}
      style={[corner ? { flex: 1, minHeight: 0 } : {}, style]}
    >
      {children}
    </AnimatedView>
    </TicketGenieEnteredContext.Provider>
  );
}
export function TicketCornerGenieSurface({
  children,
}: {
  children: ReactNode;
}) {
  return <TicketGenieSurface corner>{children}</TicketGenieSurface>;
}
