import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
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
import type { AvatarCharacter } from '../agent-avatar';
import { bodyPigmentHex } from '../agent-avatar/body-pigment';
import { CharacterAvatar } from '../agent-avatar/CharacterAvatar';
import { updateAvatarCharacter } from '../agent-avatar/character';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { useAgentCreatorMessages } from './context';
import { useTrackEvents } from './use-track-events';

const AnimatedView = Animated.createAnimatedComponent(StyledView);
export type EmotionChoice = {
  id: string;
  label: string;
  character: AvatarCharacter;
  disabled?: boolean;
};
function Emotion({
  choice,
  backgroundColor,
  active,
  count,
  index,
  rotation,
  onChange,
}: {
  choice: EmotionChoice;
  backgroundColor: string;
  active: boolean;
  count: number;
  index: number;
  rotation: SharedValue<number>;
  onChange: (id: string) => void;
}) {
  const { colors } = useTheme();
  // The eyes alone, on a plain circle: the chip shows the eyes, not the body they sit in.
  const eyeCharacter = useMemo(
    () =>
      updateAvatarCharacter(choice.character, {
        shape: 'circle',
        eyewear: 'none',
        accessory: 'none',
      }),
    [choice.character],
  );
  const angle = (index * 360) / count;
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
          accessibilityLabel={choice.label}
          aria-pressed={active}
          accessibilityState={{ selected: active, disabled: choice.disabled }}
          aria-disabled={choice.disabled}
          disabled={choice.disabled}
          onPress={() => {
            if (!choice.disabled) onChange(choice.id);
          }}
          pointerEvents="auto"
          className={`pointer-events-auto flex size-[34px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 outline-none transition-[border-color,box-shadow] hover:ring-2 hover:ring-border-button-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring ${active ? 'border-foreground-icon-secondary' : 'border-transparent'}`}
          style={{
            backgroundColor,
            borderColor: active ? colors.icon : 'transparent',
          }}
        >
          <CharacterAvatar
            previewPart="eyes"
            character={eyeCharacter}
            portrait
            paused
            interactive={false}
            size={34}
            style={{ opacity: choice.disabled ? 0.35 : 1 }}
          />
        </StyledPressable>
      </AnimatedView>
    </StyledView>
  );
}

/** Slow automatic orbit with direct manipulation and always-upright eye chips. */
export function EmotionPicker({
  choices,
  value,
  onSelect,
  backgroundColor,
}: {
  /** The body paint as `#rrggbb`, behind each chip. */
  backgroundColor: string;
  choices: readonly EmotionChoice[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const messages = useAgentCreatorMessages();
  const previewBackground = bodyPigmentHex(backgroundColor);
  const emit = onSelect;
  const ref = useRef<ComponentRef<typeof View>>(null);
  const visible = useSharedValue(true);
  const target = useSharedValue(0);
  const reduced = useReducedMotion();
  const rotation = useDerivedValue(
    () => (reduced ? target.value : withSpring(target.value, { stiffness: 180, damping: 28 })),
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
      subscription?.remove?.();
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
      previousAngle.value = (Math.atan2(event.y - 134, event.x - 134) * 180) / Math.PI;
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
          style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, orbit]}
        >
          {choices.map((choice, index) => (
            <Emotion
              key={choice.id}
              choice={choice}
              backgroundColor={previewBackground}
              active={value === choice.id}
              count={choices.length}
              index={index}
              rotation={rotation}
              onChange={(value) => {
                if (!suppressClick.value) emit(value);
              }}
            />
          ))}
        </AnimatedView>
      </StyledView>
    </GestureDetector>
  );
}
