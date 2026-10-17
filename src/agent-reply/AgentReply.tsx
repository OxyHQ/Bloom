import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Platform, type View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTrackEvents } from '../agent-creator/use-track-events';
import { Collapsible } from '../collapsible';
import { StyledView } from '../styles/styled-primitives';
import type { AgentReplyProps } from './types';

const AnimatedView = Animated.createAnimatedComponent(StyledView);

/**
 * One reply of an agent: the reply on top, and under it who answered (start) and what can be
 * done with it (end), both flush with the reply's own edges. Actions appear on hover or focus on web, and stay shown elsewhere.
 */
export function AgentReply({ children, identity, actions, style }: AgentReplyProps) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useTrackEvents(ref, undefined, undefined, setFocused);
  const show = Platform.OS !== 'web' || hovered || focused;
  const opacity = useSharedValue(show ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(show ? 1 : 0, { duration: reduced ? 0 : 150 });
  }, [show, reduced, opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);
  return (
    <StyledView
      ref={ref}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="group/reply w-fit max-w-[min(520px,calc(100%-24px))] text-body-regular"
      style={[
        {
          marginHorizontal: 12,
          marginTop: 12,
          maxWidth: Platform.OS === 'web' ? undefined : '94%',
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {/* The reply opens up as it arrives (a thinking agent has none yet): no jump of height. */}
      <Collapsible open={children != null && children !== false}>{children}</Collapsible>
      <StyledView className="flex items-center justify-between gap-2 flex-row">
        {identity}
        {actions ? (
          <AnimatedView style={[{ flexShrink: 0 }, animated]}>{actions}</AnimatedView>
        ) : null}
      </StyledView>
    </StyledView>
  );
}
