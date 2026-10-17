import { useTemplateCopy } from '../template-copy';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, type View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { EYES, type AvatarConfig } from '../agent-avatar';
import { AgentFace } from '../agent-avatar/AgentFace';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { EMOTION_NAMES } from './constants';
import { useTrackEvents } from './use-track-events';

function Emotion({ config, eyes, index, rotation, onChange }: { config: AvatarConfig; eyes: AvatarConfig['eyes']; index: number; rotation: SharedValue<number>; onChange: (eyes: AvatarConfig['eyes']) => void }) {
  const localizeBloomCopy = useTemplateCopy();
  const { colors } = useTheme();
  const animated = useAnimatedStyle(() => {
    const angle = (index * 360 / EYES.length + rotation.value) * Math.PI / 180;
    return { transform: [{ translateX: Math.sin(angle) * 116 }, { translateY: -Math.cos(angle) * 116 }] };
  }, [rotation, index]);
  return localizeBloomCopy(<Animated.View style={[{ position: 'absolute', left: 117, top: 117, width: 34, height: 34 }, animated]}>
    <StyledPressable accessibilityRole="button" accessibilityLabel={EMOTION_NAMES[eyes]} aria-pressed={config.eyes === eyes} accessibilityState={{ selected: config.eyes === eyes }} onPress={() => onChange(eyes)}
      className="flex size-[34px] items-center justify-center overflow-hidden rounded-full border-2 outline-none"
      style={{ backgroundColor: `hsl(${config.hue}, ${config.saturation}%, ${config.lightness ?? 80}%)`, borderColor: config.eyes === eyes ? colors.icon : 'transparent' }}>
      <AgentFace config={{ ...config, eyes, eyeSize: 24, eyeGap: 36, lookAt: 'center', motion: 0, idle: false }} size={34} />
    </StyledPressable>
  </Animated.View>);
}

/** Slow orbit, pausing on interaction; each expression stays upright. */
export function EmotionPicker({ config, onChange }: { config: AvatarConfig; onChange: (eyes: AvatarConfig['eyes']) => void }) {
  const localizeBloomCopy = useTemplateCopy();
  const ref = useRef<View>(null);
  const visible = useSharedValue(true);
  const rotation = useSharedValue(0);
  const dragging = useSharedValue(false);
  const previousAngle = useSharedValue(0);
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useFrameCallback(frame => {
    if (!reduced && !hovered && !focused && !dragging.value && visible.value) rotation.value += Math.min(frame.timeSincePreviousFrame ?? 0, 64) * .003;
  });
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { visible.value = state === 'active'; });
    const visibility = () => { visible.value = !document.hidden; };
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.addEventListener('visibilitychange', visibility);
    return () => { subscription.remove(); if (Platform.OS === 'web' && typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibility); };
  }, [visible]);
  useTrackEvents(ref, (x, y) => { rotation.value += (Math.abs(x) > Math.abs(y) ? x : y) * .2; }, undefined, setFocused);
  const drag = Gesture.Pan().minDistance(5).onStart(event => {
    dragging.value = true;
    previousAngle.value = Math.atan2(event.y - 134, event.x - 134) * 180 / Math.PI;
  }).onUpdate(event => {
    const angle = Math.atan2(event.y - 134, event.x - 134) * 180 / Math.PI;
    rotation.value += ((angle - previousAngle.value + 540) % 360) - 180;
    previousAngle.value = angle;
  }).onFinalize(() => { dragging.value = false; });
  return localizeBloomCopy(<GestureDetector gesture={drag}><StyledView ref={ref} accessibilityLabel="Agent emotion" className="relative size-[268px] rounded-full" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    {EYES.map((eyes, index) => <StyledView key={eyes} onTouchStart={() => setFocused(true)} onTouchEnd={() => setFocused(false)} pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}><Emotion config={config} eyes={eyes} index={index} rotation={rotation} onChange={onChange} /></StyledView>)}
  </StyledView></GestureDetector>);
}
