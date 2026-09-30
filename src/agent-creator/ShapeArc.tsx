import { useId, useRef, useState, type ComponentType, type Ref } from 'react';
import { Platform, type View, type ViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AgentAvatar, FOLD_SHAPES, type AvatarConfig } from '../agent-avatar';
import { useIsRtl } from '../hooks/use-is-rtl';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { useAgentCreatorMessages } from './context';
import { wrapShape } from './shared';
import { useTrackEvents } from './use-track-events';

// RNW supports these listbox properties; native handles equivalent accessibility actions.
type ListboxViewProps = Omit<ViewProps, 'role'> & {
  role: 'listbox';
  'aria-activedescendant'?: string;
  ref?: Ref<View>;
};
const ListboxView = StyledView as unknown as ComponentType<ListboxViewProps>;
const AnimatedView = Animated.createAnimatedComponent(StyledView);
interface ArcCssStyle extends WebCssStyle {
  clipPath?: string;
}
const trackClip: ArcCssStyle = {
  maskImage:
    'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
  clipPath:
    'polygon(0 0, 15% 0, 30% 36%, 50% 50%, 70% 36%, 85% 0, 100% 0, 100% 100%, 0 100%)',
};
function ShapeSlot({
  config,
  slot,
  position,
  sign,
  id,
  onSelect,
}: {
  config: AvatarConfig;
  slot: number;
  position: SharedValue<number>;
  sign: number;
  id: string;
  onSelect: (slot: number) => void;
}) {
  const messages = useAgentCreatorMessages();
  const { colors } = useTheme();
  const shape = FOLD_SHAPES[wrapShape(slot)]!;
  const active = config.foldShape === shape;
  const animated = useAnimatedStyle(() => {
    const angle = (slot - position.value) * 0.34;
    return {
      transform: [
        { translateX: Math.sin(angle) * 210 * sign },
        { translateY: Math.cos(angle) * 210 - 176 },
      ],
    };
  }, [position, slot, sign]);
  return (
    <AnimatedView
      pointerEvents="auto"
      className="pointer-events-auto absolute left-1/2 top-[35px] -ml-7 size-14"
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: 35,
          marginLeft: -28,
          width: 56,
          height: 56,
        },
        animated,
      ]}
    >
      <StyledPressable
        nativeID={`${id}-${slot}`}
        role="option"
        tabIndex={-1}
        aria-selected={active}
        accessibilityLabel={messages.shapeLabel(messages.shapes[shape])}
        onPress={() => onSelect(slot)}
        className={`flex size-14 cursor-grab items-center justify-center rounded-2xl outline-none transition-colors hover:bg-background-secondary-default active:cursor-grabbing${active ? ' bg-background-secondary-default ring-1 ring-border-button-default' : ''}`}
        style={{
          backgroundColor: active ? colors.backgroundSecondary : 'transparent',
        }}
      >
        <AgentAvatar
          config={{
            ...config,
            foldShape: shape,
            face: false,
            idle: false,
            motion: 0,
            lookAt: 'center',
          }}
          size={56}
          paused
          label={messages.silhouetteLabel(messages.shapes[shape])}
        />
      </StyledPressable>
    </AnimatedView>
  );
}

/** A manually moved, evenly spaced circular track with an unbounded index. */
export function ShapeArc({
  config,
  onChange,
}: {
  config: AvatarConfig;
  onChange: (shape: AvatarConfig['foldShape']) => void;
}) {
  const messages = useAgentCreatorMessages();
  const { colors } = useTheme();
  const id = useId();
  const ref = useRef<View>(null);
  const initial = Math.max(0, FOLD_SHAPES.indexOf(config.foldShape));
  const target = useSharedValue(initial);
  const position = useSharedValue(initial);
  const [center, setCenter] = useState(initial);
  const reduced = useReducedMotion();
  const sign = useIsRtl() ? -1 : 1;
  const dragStart = useSharedValue(initial);
  const suppressClick = useSharedValue(false);
  const move = (next: number) => {
    target.value = next;
    position.value = reduced
      ? next
      : withSpring(next, { stiffness: 180, damping: 28 });
  };
  useAnimatedReaction(
    () => Math.round(position.value),
    (value, previous) => {
      if (value !== previous) runOnJS(setCenter)(value);
    },
    [position, setCenter],
  );
  const select = (slot: number) => {
    if (suppressClick.value) return;
    move(slot);
    onChange(FOLD_SHAPES[wrapShape(slot)]!);
  };
  const drag = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-20, 20])
    .runOnJS(true)
    .onBegin(() => {
      suppressClick.value = false;
      dragStart.value = target.value;
    })
    .onUpdate((event) => {
      suppressClick.value = true;
      move(dragStart.value - (event.translationX * sign) / 70);
    });
  useTrackEvents(
    ref,
    (x, y) =>
      move(target.value + (Math.abs(x) > Math.abs(y) ? x * sign : y) / 110),
    (key) => {
      const step =
        key === 'ArrowRight'
          ? sign
          : key === 'ArrowLeft'
            ? -sign
            : key === 'ArrowDown'
              ? 1
              : key === 'ArrowUp'
                ? -1
                : 0;
      if (!step && key !== 'Home' && key !== 'End') return false;
      const next = step
        ? Math.round(target.value) + step
        : key === 'Home'
          ? 0
          : FOLD_SHAPES.length - 1;
      move(next);
      onChange(FOLD_SHAPES[wrapShape(next)]!);
      return true;
    },
  );
  const slots = Array.from({ length: 9 }, (_, index) => center + index - 4);
  const selectedSlot = slots.find(
    (slot) => FOLD_SHAPES[wrapShape(slot)] === config.foldShape,
  );
  return (
    <GestureDetector gesture={drag}>
      <ListboxView
        ref={ref}
        role="listbox"
        aria-activedescendant={
          selectedSlot === undefined ? undefined : `${id}-${selectedSlot}`
        }
        tabIndex={0}
        accessibilityLabel={messages.shape}
        pointerEvents="auto"
        className="pointer-events-auto relative h-[126px] w-full touch-pan-y select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring"
        style={Platform.OS === 'web' ? trackClip : undefined}
        accessibilityActions={[
          { name: 'increment', label: messages.nextShape },
          { name: 'decrement', label: messages.previousShape },
        ]}
        onAccessibilityAction={(event) => {
          const next =
            Math.round(target.value) +
            (event.nativeEvent.actionName === 'increment' ? 1 : -1);
          move(next);
          onChange(FOLD_SHAPES[wrapShape(next)]!);
        }}
      >
        {slots.map((slot) => (
          <ShapeSlot
            key={slot}
            id={id}
            config={config}
            slot={slot}
            position={position}
            sign={sign}
            onSelect={select}
          />
        ))}
        {Platform.OS !== 'web' && (
          <Svg
            pointerEvents="none"
            width="100%"
            height={126}
            viewBox="0 0 100 126"
            preserveAspectRatio="none"
            style={{ position: 'absolute', left: 0, top: 0 }}
            accessible={false}
          >
            <Defs>
              <LinearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.background} />
                <Stop
                  offset=".08"
                  stopColor={colors.background}
                  stopOpacity={0}
                />
                <Stop
                  offset=".92"
                  stopColor={colors.background}
                  stopOpacity={0}
                />
                <Stop offset="1" stopColor={colors.background} />
              </LinearGradient>
            </Defs>
            <Path
              d="M0 0H100H85L70 45.36L50 63L30 45.36L15 0Z"
              fill={colors.background}
            />
            <Rect width={100} height={126} fill={`url(#${id}-edge)`} />
          </Svg>
        )}
      </ListboxView>
    </GestureDetector>
  );
}
