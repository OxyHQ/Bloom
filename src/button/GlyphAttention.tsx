import { type ComponentRef, type ReactNode, useLayoutEffect, useRef } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { IS_WEB } from '../styles/platform';

interface Props {
  token: number;
  blocked: boolean;
  children: ReactNode;
}

const CENTER: ViewStyle = { alignItems: 'center', justifyContent: 'center' };
const ATTENTION_CSS = `
@keyframes bloom-glyph-attention-a {
  0%, 100% { transform: scale(1); }
  31.25% { transform: scale(1.12); }
}
@keyframes bloom-glyph-attention-b {
  0%, 100% { transform: scale(1); }
  31.25% { transform: scale(1.12); }
}
[data-bloom-glyph-attention] {
  animation-duration: 320ms;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-glyph-attention] { animation: none !important; }
}`;

/** Only opt-in glyphs mount this feedback; ordinary buttons retain their plain View. */
function WebGlyphAttention({ token, blocked, children }: Props) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const previous = useRef(token);
  const phase = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  useInteractiveWebCss('bloom-glyph-attention', ATTENTION_CSS);

  useLayoutEffect(() => {
    const changed = !Object.is(previous.current, token);
    previous.current = token;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;
    if (blocked || reducedMotion || !Number.isFinite(token)) {
      node.style.animationName = 'none';
    } else if (changed) {
      // Alternating equivalent CSS animations restarts on each committed attempt,
      // including during an unfinished pulse, without remounting or reading layout.
      phase.current = !phase.current;
      node.style.animationName = `bloom-glyph-attention-${phase.current ? 'a' : 'b'}`;
    }
  }, [token, blocked, reducedMotion]);

  return (
    <View
      ref={ref}
      pointerEvents="none"
      {...({ dataSet: { bloomGlyphAttention: '' } } as Record<string, unknown>)}
      style={CENTER}
    >
      {children}
    </View>
  );
}

function NativeGlyphAttention({ token, blocked, children }: Props) {
  const previous = useRef(token);
  const scale = useSharedValue(1);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const changed = !Object.is(previous.current, token);
    previous.current = token;
    cancelAnimation(scale);
    scale.value = 1;
    if (changed && !blocked && !reducedMotion && Number.isFinite(token)) {
      const easing = Easing.bezier(0.2, 0.8, 0.2, 1);
      scale.value = withSequence(
        withTiming(1.12, { duration: 100, easing, reduceMotion: ReduceMotion.System }),
        withTiming(1, { duration: 220, easing, reduceMotion: ReduceMotion.System }),
      );
    }
    return () => cancelAnimation(scale);
  }, [token, blocked, reducedMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale]);
  return (
    <Animated.View pointerEvents="none" style={[CENTER, style]}>
      {children}
    </Animated.View>
  );
}

export const GlyphAttention = IS_WEB ? WebGlyphAttention : NativeGlyphAttention;
