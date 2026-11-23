import {
  type ComponentRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type Ref,
} from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cubicBezier,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { AvatarCharacter } from '../agent-avatar';
import { useIsRtl } from '../hooks/use-is-rtl';
import type { WebCssStyle } from '../styles/web-view-style';
import { createTokenStyles } from '../theme/color-tokens';
import { useTheme } from '../theme/use-theme';
import { useAgentCreatorMessages } from './context';
import { AGENT_CREATOR_HOOKS, useAgentCreatorWebCss } from './web-css';
import { useTrackEvents } from './use-track-events';
import { ShapeSilhouette } from './ShapeSilhouette';
import { svgA11yProps } from '../styles/svg-a11y';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

// RNW supports these listbox properties; native handles equivalent accessibility actions.
type ListboxViewProps = Omit<ViewProps, 'role'> & {
  role: 'listbox';
  'aria-activedescendant'?: string;
  ref?: Ref<ComponentRef<typeof View>>;
};
const ListboxView = View as unknown as ComponentType<ListboxViewProps>;
const AnimatedView = Animated.createAnimatedComponent(View);
// Native eases a slot's fill into and out of the selection (`transition-colors`: 150ms,
// Tailwind's default curve); the web transitions it from the editor's sheet.
const Slot = Platform.OS === 'web' ? Pressable : Animated.createAnimatedComponent(Pressable);
const SLOT_MOTION = (
  Platform.OS === 'web'
    ? null
    : {
        transitionProperty: [
          'color',
          'backgroundColor',
          'borderColor',
          'outlineColor',
          'textDecorationColor',
          'fill',
          'stroke',
        ],
        transitionDuration: 150,
        transitionTimingFunction: cubicBezier(0.4, 0, 0.2, 1),
      }
) as ViewStyle | null;
interface ArcCssStyle extends WebCssStyle {
  clipPath?: string;
}
const trackClip: ArcCssStyle = {
  maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
  clipPath: 'polygon(0 0, 15% 0, 30% 36%, 50% 50%, 70% 36%, 85% 0, 100% 0, 100% 100%, 0 100%)',
};
export type ShapeArcChoice = {
  id: string;
  label: string;
  character: AvatarCharacter;
};
const wrap = (slot: number, count: number) => ((slot % count) + count) % count;
function ShapeSlot({
  slot,
  position,
  sign,
  id,
  onSelect,
  choices,
  value,
}: {
  choices: readonly ShapeArcChoice[];
  value: string;
  slot: number;
  position: SharedValue<number>;
  sign: number;
  id: string;
  onSelect: (slot: number) => void;
}) {
  const messages = useAgentCreatorMessages();
  const { colors } = useTheme();
  const ring = useRingStyles();
  const choice = choices[wrap(slot, choices.length)]!;
  const active = value === choice.id;
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
    <AnimatedView pointerEvents="auto" style={[styles.slot, animated]}>
      <Slot
        {...AGENT_CREATOR_HOOKS.shape}
        nativeID={`${id}-${slot}`}
        role="option"
        tabIndex={-1}
        aria-selected={active}
        accessibilityLabel={messages.shapeLabel(choice.label)}
        onPress={() => onSelect(slot)}
        style={[
          styles.shape,
          SLOT_MOTION,
          active && ring.active,
          { backgroundColor: active ? colors.backgroundSecondary : 'transparent' },
        ]}
      >
        <ShapeSilhouette character={choice.character} />
      </Slot>
    </AnimatedView>
  );
}

/** A manually moved, evenly spaced circular track with an unbounded index. */
export function ShapeArc({
  choices,
  value,
  onSelect,
}: {
  choices: readonly ShapeArcChoice[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const messages = useAgentCreatorMessages();
  const { colors } = useTheme();
  const emit = (slot: number) => {
    onSelect(choices[wrap(slot, choices.length)]!.id);
  };
  const id = useId();
  useAgentCreatorWebCss();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const initial = Math.max(
    0,
    choices.findIndex((choice) => choice.id === value),
  );
  const target = useSharedValue(initial);
  const position = useSharedValue(initial);
  const [center, setCenter] = useState(initial);
  const reduced = usePrefersReducedMotion();
  const sign = useIsRtl() ? -1 : 1;
  const dragStart = useSharedValue(initial);
  const suppressClick = useSharedValue(false);
  const move = (next: number) => {
    target.value = next;
    position.value = reduced ? next : withSpring(next, { stiffness: 180, damping: 28 });
  };
  useEffect(() => {
    const selected = choices.findIndex((choice) => choice.id === value);
    if (selected < 0) return;
    const current = Math.round(target.value);
    let delta = selected - wrap(current, choices.length);
    if (delta > choices.length / 2) delta -= choices.length;
    if (delta < -choices.length / 2) delta += choices.length;
    if (delta) move(current + delta);
  }, [value, choices.length]);
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
    emit(slot);
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
    (delta) => move(target.value + (delta * sign) / 110),
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
      const next = step ? Math.round(target.value) + step : key === 'Home' ? 0 : choices.length - 1;
      move(next);
      emit(next);
      return true;
    },
  );
  const slots = Array.from({ length: 9 }, (_, index) => center + index - 4);
  const selectedSlot = slots.find((slot) => choices[wrap(slot, choices.length)]?.id === value);
  return (
    // `touchAction="pan-y"`, not the track's sheet rule: RNGH writes an INLINE
    // `touch-action: none` on this view on web, which beats the sheet, so a
    // touch that lands on the arc could never scroll the page. The rule stays
    // for the moment before the handler attaches.
    <GestureDetector gesture={drag} touchAction="pan-y">
      <ListboxView
        collapsable={false}
        ref={ref}
        role="listbox"
        aria-activedescendant={selectedSlot === undefined ? undefined : `${id}-${selectedSlot}`}
        tabIndex={0}
        accessibilityLabel={messages.shape}
        pointerEvents="auto"
        {...AGENT_CREATOR_HOOKS.shapeTrack}
        style={[styles.track, Platform.OS === 'web' ? trackClip : undefined]}
        accessibilityActions={[
          { name: 'increment', label: messages.nextShape },
          { name: 'decrement', label: messages.previousShape },
        ]}
        onAccessibilityAction={(event) => {
          const next =
            Math.round(target.value) + (event.nativeEvent.actionName === 'increment' ? 1 : -1);
          move(next);
          emit(next);
        }}
      >
        {slots.map((slot) => (
          <ShapeSlot
            key={slot}
            id={id}
            choices={choices}
            value={value}
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
            {...svgA11yProps()}
          >
            <Defs>
              <LinearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.background} />
                <Stop offset=".08" stopColor={colors.background} stopOpacity={0} />
                <Stop offset=".92" stopColor={colors.background} stopOpacity={0} />
                <Stop offset="1" stopColor={colors.background} />
              </LinearGradient>
            </Defs>
            <Path d="M0 0H100H85L70 45.36L50 63L30 45.36L15 0Z" fill={colors.background} />
            <Rect width={100} height={126} fill={`url(#${id}-edge)`} />
          </Svg>
        )}
      </ListboxView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  slot: {
    pointerEvents: 'auto',
    position: 'absolute',
    left: '50%',
    top: 35,
    marginLeft: -28,
    width: 56,
    height: 56,
  },
  shape: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  track: {
    pointerEvents: 'auto',
    position: 'relative',
    height: 126,
    width: '100%',
    overflow: 'hidden',
    userSelect: 'none',
  },
});

/** The selected shape's 1px ring on native; the web draws it from the editor's sheet. */
const useRingStyles = createTokenStyles((t) => ({
  active:
    Platform.OS === 'web'
      ? {}
      : {
          boxShadow: [
            { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: t.border },
          ],
        },
}));
