import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTrackEvents } from '../agent-creator/use-track-events';
import { Collapsible } from '../collapsible';
import type { AgentReplyProps } from './types';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { webDataSet } from '../styles/web-data';
import { useAgentReplyWebCss } from './web-css';
import { useInteractionState } from '../hooks/use-interaction-state';

const AnimatedView = Animated.createAnimatedComponent(View);

const replyHook = webDataSet({ bloomAgentReply: '' });

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
    // The web's column and type are its sheet's (`web-css.ts`); native keeps the body type the
    // class put on the row, which nothing reads.
    ...Platform.select({
      web: {},
      default: { maxWidth: '94%', fontSize: 14, lineHeight: 20, fontWeight: 400 },
    }),
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actions: { flexShrink: 0 },
} as const);

/**
 * One reply of an agent: the reply on top, and under it who answered (start) and what can be
 * done with it (end), both flush with the reply's own edges. Actions appear on hover or focus on web, and stay shown elsewhere.
 */
export function AgentReply({ children, identity, actions, style }: AgentReplyProps) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  useAgentReplyWebCss();
  const reduced = usePrefersReducedMotion();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const [focused, setFocused] = useState(false);
  useTrackEvents(ref, undefined, undefined, setFocused);
  const show = Platform.OS !== 'web' || hovered || focused;
  const opacity = useSharedValue(show ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(show ? 1 : 0, { duration: reduced ? 0 : 150 });
  }, [show, reduced, opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);
  return (
    <View
      {...replyHook}
      ref={ref}
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}
      style={[styles.root, style]}
    >
      {/* The reply opens up as it arrives (a thinking agent has none yet): no jump of height. */}
      <Collapsible open={children != null && children !== false}>{children}</Collapsible>
      <View style={styles.footer}>
        {identity}
        {actions ? <AnimatedView style={[styles.actions, animated]}>{actions}</AnimatedView> : null}
      </View>
    </View>
  );
}
