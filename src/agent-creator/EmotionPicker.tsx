import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cubicBezier,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import type { AvatarCharacter } from '../agent-avatar';
import { CharacterAvatar } from '../agent-avatar/CharacterAvatar';
import { updateAvatarCharacter } from '../agent-avatar/character';
import { pointerEventsStyles } from '../styles/pointer-events';
import { ROUNDED_FULL } from '../styles/rounded-full';
import { useTheme } from '../theme/use-theme';
import { useAgentCreatorMessages } from './context';
import { AGENT_CREATOR_HOOKS, useAgentCreatorWebCss } from './web-css';
import { useTrackEvents } from './use-track-events';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useAppForeground } from '../hooks/use-app-state';

const AnimatedView = Animated.createAnimatedComponent(View);
// Native eases a chip's border into and out of the selection (150ms, Tailwind's default curve);
// the web transitions it from the editor's sheet.
const Chip = Platform.OS === 'web' ? Pressable : Animated.createAnimatedComponent(Pressable);
const CHIP_MOTION = (
  Platform.OS === 'web'
    ? null
    : {
        transitionProperty: ['borderColor', 'boxShadow'],
        transitionDuration: 150,
        transitionTimingFunction: cubicBezier(0.4, 0, 0.2, 1),
      }
) as ViewStyle | null;
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
  const eyeStyle = useMemo(() => ({ opacity: choice.disabled ? 0.35 : 1 }), [choice.disabled]);
  const angle = (index * 360) / count;
  const counterRotation = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${-rotation.value - angle}deg` }] }),
    [rotation, angle],
  );
  return (
    <View
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
        <Chip
          {...AGENT_CREATOR_HOOKS.emotion}
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
          style={[
            styles.chip,
            CHIP_MOTION,
            { backgroundColor, borderColor: active ? colors.icon : 'transparent' },
          ]}
        >
          <CharacterAvatar
            renderer="svg"
            previewPart="eyes"
            character={eyeCharacter}
            portrait
            paused
            interactive={false}
            size={34}
            style={eyeStyle}
          />
        </Chip>
      </AnimatedView>
    </View>
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
  const emit = onSelect;
  const ref = useRef<ComponentRef<typeof View>>(null);
  useAgentCreatorWebCss();
  const visible = useSharedValue(true);
  const target = useSharedValue(0);
  const reduced = usePrefersReducedMotion();
  const rotation = useDerivedValue(
    () => (reduced ? target.value : withSpring(target.value, { stiffness: 180, damping: 28 })),
    [target, reduced],
  );
  const dragging = useSharedValue(false);
  const previousAngle = useSharedValue(0);
  const suppressClick = useSharedValue(false);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const [focused, setFocused] = useState(false);
  useFrameCallback((frame) => {
    if (!reduced && !hovered && !focused && !dragging.value && visible.value)
      target.value += Math.min(frame.timeSincePreviousFrame ?? 0, 64) * 0.003;
  });
  // The spin stops while the app is backgrounded or its tab is hidden.
  const foreground = useAppForeground();
  useEffect(() => {
    visible.value = foreground;
  }, [foreground, visible]);
  useTrackEvents(
    ref,
    (delta) => {
      target.value += delta * 0.2;
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
      <View
        collapsable={false}
        ref={ref}
        role="group"
        accessibilityLabel={messages.emotion}
        style={[styles.orbit, pointerEventsStyles['box-none']]}
        onPointerEnter={onHoverIn}
        onPointerLeave={onHoverOut}
      >
        <AnimatedView
          style={[
            styles.fill,
            // Reanimated flattens styles: CSS cannot express box-none on this animated node.
            // Web chips opt back into auto; native retains box-none child hit testing.
            Platform.OS === 'web' ? pointerEventsStyles.none : pointerEventsStyles['box-none'],
            { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
            orbit,
          ]}
        >
          {choices.map((choice, index) => (
            <Emotion
              key={choice.id}
              choice={choice}
              backgroundColor={backgroundColor}
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
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  chip: {
    pointerEvents: 'auto',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: ROUNDED_FULL,
    borderStyle: 'solid',
    borderWidth: 2,
  },
  orbit: {
    position: 'relative',
    width: 268,
    height: 268,
    borderRadius: ROUNDED_FULL,
    ...(Platform.OS === 'web' ? { touchAction: 'none' } : null),
  },
  fill: { position: 'absolute', inset: 0 },
});
