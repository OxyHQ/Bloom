import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, type View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { EYES, type AvatarConfig } from '../agent-avatar';
import { AgentFace } from '../agent-avatar/AgentFace';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { useAgentCreatorMessages } from './context';
import { useTrackEvents } from './use-track-events';

const AnimatedView = Animated.createAnimatedComponent(StyledView);
function Emotion({
  config,
  eyes,
  index,
  rotation,
  onChange,
}: {
  config: AvatarConfig;
  eyes: AvatarConfig['eyes'];
  index: number;
  rotation: SharedValue<number>;
  onChange: (eyes: AvatarConfig['eyes']) => void;
}) {
  const messages = useAgentCreatorMessages();
  const { colors } = useTheme();
  const angle = (index * 360) / EYES.length;
  const counterRotation = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${-rotation.value - angle}deg` }] }),
    [rotation, angle],
  );
  return (
    <StyledView
      className="absolute left-1/2 top-1/2 -ml-[17px] -mt-[17px] size-[34px]"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -17,
        marginTop: -17,
        width: 34,
        height: 34,
        transform: [{ rotate: `${angle}deg` }, { translateY: -116 }],
      }}
    >
      <AnimatedView style={counterRotation}>
        <StyledPressable
          accessibilityRole="button"
          accessibilityLabel={messages.emotions[eyes]}
          aria-pressed={config.eyes === eyes}
          accessibilityState={{ selected: config.eyes === eyes }}
          onPress={() => onChange(eyes)}
          pointerEvents="auto"
          className={`pointer-events-auto flex size-[34px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 outline-none transition-[border-color,box-shadow] hover:ring-2 hover:ring-border-button-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring ${config.eyes === eyes ? 'border-foreground-icon-secondary' : 'border-transparent'}`}
          style={{
            backgroundColor: `hsl(${config.hue}, ${config.saturation}%, ${config.lightness ?? 80}%)`,
            borderColor: config.eyes === eyes ? colors.icon : 'transparent',
          }}
        >
          <AgentFace
            config={{
              ...config,
              eyes,
              eyeSize: 24,
              eyeGap: 36,
              lookAt: 'center',
              motion: 0,
              idle: false,
            }}
            size={34}
          />
        </StyledPressable>
      </AnimatedView>
    </StyledView>
  );
}

/** Slow automatic orbit with direct manipulation and always-upright eye chips. */
export function EmotionPicker({
  config,
  onChange,
}: {
  config: AvatarConfig;
  onChange: (eyes: AvatarConfig['eyes']) => void;
}) {
  const messages = useAgentCreatorMessages();
  const ref = useRef<View>(null);
  const visible = useSharedValue(true);
  const target = useSharedValue(0);
  const reduced = useReducedMotion();
  const rotation = useDerivedValue(
    () =>
      reduced
        ? target.value
        : withSpring(target.value, { stiffness: 180, damping: 28 }),
    [target, reduced],
  );
  const dragging = useSharedValue(false);
  const previousAngle = useSharedValue(0);
  const suppressClick = useSharedValue(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useFrameCallback((frame) => {
    if (!reduced && !hovered && !focused && !dragging.value && visible.value)
      target.value += Math.min(frame.timeSincePreviousFrame ?? 0, 64) * 0.003;
  });
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      visible.value = state === 'active';
    });
    const visibility = () => {
      visible.value = !document.hidden;
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined')
      document.addEventListener('visibilitychange', visibility);
    return () => {
      subscription?.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', visibility);
    };
  }, [visible]);
  useTrackEvents(
    ref,
    (x, y) => {
      target.value += (Math.abs(x) > Math.abs(y) ? x : y) * 0.2;
    },
    undefined,
    setFocused,
  );
  const drag = Gesture.Pan()
    .minDistance(5)
    .onBegin(() => {
      suppressClick.value = false;
    })
    .onStart((event) => {
      target.value = rotation.value;
      dragging.value = true;
      previousAngle.value =
        (Math.atan2(event.y - 134, event.x - 134) * 180) / Math.PI;
    })
    .onUpdate((event) => {
      const angle = (Math.atan2(event.y - 134, event.x - 134) * 180) / Math.PI;
      const delta = ((angle - previousAngle.value + 540) % 360) - 180;
      if (Math.abs(delta) > 2 || suppressClick.value) {
        suppressClick.value = true;
        previousAngle.value = angle;
        target.value += delta;
      }
    })
    .onFinalize(() => {
      dragging.value = false;
    });
  const orbit = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );
  return (
    <GestureDetector gesture={drag}>
      <StyledView
        ref={ref}
        role="group"
        accessibilityLabel={messages.emotion}
        pointerEvents="auto"
        className="pointer-events-auto relative size-[268px] touch-none rounded-full"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <AnimatedView
          pointerEvents="box-none"
          className="pointer-events-none absolute inset-0"
          style={[
            { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
            orbit,
          ]}
        >
          {EYES.map((eyes, index) => (
            <Emotion
              key={eyes}
              config={config}
              eyes={eyes}
              index={index}
              rotation={rotation}
              onChange={(value) => {
                if (!suppressClick.value) onChange(value);
              }}
            />
          ))}
        </AnimatedView>
      </StyledView>
    </GestureDetector>
  );
}
