import { useTemplateCopy } from '../template-copy';
import { useEffect, useRef, useState } from 'react';
import type { ComponentType, Ref } from 'react';
import type { View, ViewProps } from 'react-native';
import { useDirection } from '../direction';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { AgentAvatar, FOLD_SHAPES, type AvatarConfig } from '../agent-avatar';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { wrapShape } from './shared';
import { useTrackEvents } from './use-track-events';

// RNW supports the ARIA listbox role; React Native's Role type omits it.
type ListboxViewProps = Omit<ViewProps, 'role'> & { role: 'listbox'; ref?: Ref<View> };
const ListboxView = StyledView as unknown as ComponentType<ListboxViewProps>;

function ShapeSlot({ config, slot, position, sign, onSelect }: { config: AvatarConfig; slot: number; position: SharedValue<number>; sign: number; onSelect: (slot: number) => void }) {
  const localizeBloomCopy = useTemplateCopy();
  const { colors } = useTheme();
  const shape = FOLD_SHAPES[wrapShape(slot)]!;
  const animated = useAnimatedStyle(() => {
    const angle = (slot - position.value) * .34;
    return { transform: [{ translateX: Math.sin(angle) * 210 * sign }, { translateY: Math.cos(angle) * 210 - 176 }] };
  }, [position, slot, sign]);
  return localizeBloomCopy(<Animated.View style={[{ position: 'absolute', left: '50%', top: 35, marginLeft: -28, width: 56, height: 56 }, animated]}>
    <StyledPressable role="option" aria-selected={config.foldShape === shape} accessibilityLabel={`${shape.charAt(0).toUpperCase()}${shape.slice(1)} shape`} onPress={() => onSelect(slot)}
      className="flex size-14 items-center justify-center rounded-2xl"
      style={{ backgroundColor: config.foldShape === shape ? colors.backgroundSecondary : 'transparent', borderColor: colors.border, borderWidth: config.foldShape === shape ? 1 : 0 }}>
      <AgentAvatar config={{ ...config, foldShape: shape, face: false, idle: false, motion: 0, lookAt: 'center' }} size={56} paused label={`${shape} silhouette`} />
    </StyledPressable>
  </Animated.View>);
}

/** The source's unbounded circular track, with shared gesture geometry on every platform. */
export function ShapeArc({ config, onChange }: { config: AvatarConfig; onChange: (shape: AvatarConfig['foldShape']) => void }) {
  const localizeBloomCopy = useTemplateCopy();
  const ref = useRef<View>(null);
  const initial = Math.max(0, FOLD_SHAPES.indexOf(config.foldShape));
  const position = useSharedValue(initial);
  const [target, setTarget] = useState(initial);
  const reduced = useReducedMotion();
  const sign = useDirection() === 'rtl' ? -1 : 1;
  const start = useRef(initial);
  const move = (next: number) => { setTarget(next); position.value = reduced ? next : withSpring(next, { stiffness: 180, damping: 28 }); };
  useEffect(() => {
    const current = FOLD_SHAPES[wrapShape(Math.round(target))];
    if (current !== config.foldShape) move(FOLD_SHAPES.indexOf(config.foldShape));
  }, [config.foldShape]);
  const select = (slot: number) => { move(slot); onChange(FOLD_SHAPES[wrapShape(slot)]!); };
  const drag = Gesture.Pan().activeOffsetX([-5, 5]).failOffsetY([-20, 20]).runOnJS(true)
    .onStart(() => { start.current = target; }).onUpdate(event => move(start.current - event.translationX * sign / 70));
  useTrackEvents(ref, (x, y) => move(target + (Math.abs(x) > Math.abs(y) ? x * sign : y) / 110), key => {
    const step = key === 'ArrowRight' ? sign : key === 'ArrowLeft' ? -sign : key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
    if (!step && key !== 'Home' && key !== 'End') return false;
    select(step ? Math.round(target) + step : key === 'Home' ? 0 : FOLD_SHAPES.length - 1);
    return true;
  });
  const center = Math.round(target);
  return localizeBloomCopy(<GestureDetector gesture={drag}><ListboxView ref={ref} role="listbox" tabIndex={0} accessibilityLabel="Avatar shape" className="relative h-[126px] w-full overflow-hidden"
    accessibilityActions={[{ name: 'increment', label: 'Next shape' }, { name: 'decrement', label: 'Previous shape' }]}
    onAccessibilityAction={event => select(Math.round(target) + (event.nativeEvent.actionName === 'increment' ? 1 : -1))}>
    {Array.from({ length: 9 }, (_, index) => center + index - 4).map(slot => <ShapeSlot key={slot} config={config} slot={slot} position={position} sign={sign} onSelect={select} />)}
  </ListboxView></GestureDetector>);
}
