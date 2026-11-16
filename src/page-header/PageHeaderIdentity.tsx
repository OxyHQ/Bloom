import { useRef, type ComponentRef, type ReactNode } from 'react';
import { Platform, type View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { dataHook } from '../styles/data-hook';
import { pointerEventsStyle } from '../styles/pointer-events';
import { useSurfacePresenceProgress } from '../surface/use-surface-presence';

/** Isolates scroll-driven identity presence from the header's layout and action budget. */
export function PageHeaderIdentity({
  presence,
  hidden,
  children,
  style,
  testID,
}: {
  presence: SharedValue<number>;
  hidden: boolean;
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const web = Platform.OS === 'web';
  const identityRef = useRef<ComponentRef<typeof View>>(null);
  useSurfacePresenceProgress(identityRef, presence);
  const nativeStyle = useAnimatedStyle(
    () => ({ opacity: web ? 1 : presence.value }),
    [web, presence],
  );
  return (
    <Animated.View
      ref={identityRef}
      {...dataHook('bloomPageHeaderTitleBlock')}
      aria-hidden={hidden}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      {...(web && hidden ? { inert: true } : {})}
      style={[style, nativeStyle, pointerEventsStyle(hidden ? 'none' : 'auto')]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
}
