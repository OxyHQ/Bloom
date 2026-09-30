import {
  memo,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  AppState,
  PixelRatio,
  Platform,
  type View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useMessages } from '../locale/messages';
import { StyledView } from '../styles/styled-primitives';
import { drawAvatar } from './artwork';
import { advanceAttention, createAttention } from './attention';
import { advanceBlink, createBlink } from './blink';
import { AvatarDrawingObserver } from './context';
import { DrawingContext } from './drawing';
import { ENTRANCE_SECONDS } from './entrance';
import {
  easeFace,
  expressionRig,
  faceAtSize,
  gazeAngles,
  type FaceRig,
} from './face';
import { AGENT_AVATAR_MESSAGES } from './messages';
import type { ShapeMorph } from './shape-morph';
import { Drawing } from './SvgDrawing';
import type { AgentAvatarProps } from './types';
import { advanceWander, createWander } from './wander';
import { WORKING_SECONDS } from './working';

const TAU = Math.PI * 2;
const randomSeed = () => {
  if (globalThis.crypto?.getRandomValues)
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]!;
  return Math.floor(Math.random() * 4294967296) >>> 0;
};

/** Animated procedural artwork; shared geometry, face rig and materials across platforms. */
function AgentAvatarComponent({
  config,
  size = 64,
  paused = false,
  label,
  locale,
  entranceKey,
  workingKey,
  workingCycles = 1,
  className,
  style,
  accessibilityLabel,
  testID,
}: AgentAvatarProps) {
  const { messages } = useMessages(AGENT_AVATAR_MESSAGES, locale);
  const initialReduced = useReducedMotion();
  const [reduced, setReduced] = useState(initialReduced);
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    const media =
      Platform.OS === 'web' && typeof matchMedia !== 'undefined'
        ? matchMedia('(prefers-reduced-motion: reduce)')
        : undefined;
    const change = () => setReduced(media!.matches);
    media?.addEventListener('change', change);
    if (media) change();
    return () => {
      subscription?.remove?.();
      media?.removeEventListener('change', change);
    };
  }, []);
  const backingSize = Math.round(size * Math.min(PixelRatio.get() || 1, 2));
  const root = useRef<View>(null);
  const randomized = useRef(false);
  const state = useRef<{
    phase: number;
    blink: ReturnType<typeof createBlink>;
    wander: ReturnType<typeof createWander>;
    attention: ReturnType<typeof createAttention>;
    shapeMorph: ShapeMorph;
    expression?: FaceRig;
    face?: FaceRig;
    velocity: Partial<FaceRig>;
    gaze?: [number, number];
    entrance: { key?: number; elapsed: number };
    working: { key?: number; elapsed: number };
  } | null>(null);
  if (!state.current) {
    const seed = config.seed >>> 0;
    state.current = {
      phase: (seed / 4294967296) * TAU,
      blink: createBlink(seed),
      wander: createWander(seed ^ config.seed, config.family === 'fold'),
      attention: createAttention(seed ^ config.seed),
      shapeMorph: { started: 0, active: false },
      velocity: {},
      entrance: { elapsed: ENTRANCE_SECONDS },
      working: { elapsed: WORKING_SECONDS },
    };
  }
  const renderDrawing = () => {
    const context = new DrawingContext(),
      s = state.current!;
    const appearance = faceAtSize(config, size),
      target = expressionRig(appearance);
    drawAvatar(
      context,
      appearance,
      s.phase,
      s.face ?? target,
      s.gaze ?? gazeAngles(appearance, s.phase, target),
      size,
      s.entrance.elapsed,
      s.working.elapsed,
      undefined,
      Math.max(1, Math.floor(workingCycles)),
      backingSize,
    );
    return context;
  };
  const [drawing, setDrawing] = useState(renderDrawing);
  const observeDrawing = useContext(AvatarDrawingObserver);
  useLayoutEffect(() => {
    observeDrawing?.(drawing);
  }, [observeDrawing, drawing]);
  useEffect(() => {
    const s = state.current!,
      cycles = Math.max(1, Math.floor(workingCycles));
    if (!randomized.current) {
      s.wander = createWander(
        randomSeed() ^ config.seed,
        config.family === 'fold',
      );
      const seed = randomSeed();
      s.phase = (seed / 4294967296) * TAU;
      s.blink = createBlink(seed);
      s.attention = createAttention(randomSeed() ^ config.seed);
      randomized.current = true;
    }
    const duration = WORKING_SECONDS * cycles,
      appearance = faceAtSize(config, size),
      target = expressionRig(appearance);
    if (s.entrance.key !== entranceKey)
      s.entrance = {
        key: entranceKey,
        elapsed: entranceKey === undefined || paused ? ENTRANCE_SECONDS : 0,
      };
    if (s.working.key !== workingKey) {
      s.working = {
        key: workingKey,
        elapsed: workingKey === undefined || paused ? duration : 0,
      };
      if (workingKey !== undefined) s.entrance.elapsed = ENTRANCE_SECONDS;
    }
    if (config.idle || workingKey === undefined) s.working.elapsed = duration;
    s.expression ??= s.face ?? target;
    s.face ??= target;
    s.gaze ??= gazeAngles(appearance, s.phase, target, s.wander.point);
    const frozen = paused || reduced || config.motion === 0;
    if (reduced || config.motion === 0) {
      s.entrance.elapsed = ENTRANCE_SECONDS;
      s.working.elapsed = duration;
    }
    if (frozen) {
      s.shapeMorph = { started: 0, active: false };
      s.face = target;
      s.expression = target;
      s.velocity = {};
      if (!paused || config.lookAt !== 'wander')
        s.gaze = gazeAngles(appearance, s.phase, target, s.wander.point);
    }
    const draw = () => {
      const context = new DrawingContext();
      drawAvatar(
        context,
        appearance,
        s.phase,
        s.face!,
        s.gaze!,
        size,
        s.entrance.elapsed,
        s.working.elapsed,
        frozen ? undefined : s.shapeMorph,
        cycles,
        backingSize,
      );
      setDrawing(context);
    };
    let frame = 0,
      last = 0,
      visible = true,
      active = AppState.currentState !== 'background',
      transitioning = true;
    const tick = (now: number) => {
      if (!last) last = now;
      if (now - last >= (transitioning ? 16 : 32)) {
        if (visible && active) {
          const milliseconds = Math.min(now - last, 64),
            seconds = milliseconds / 1000;
          s.entrance.elapsed = Math.min(
            ENTRANCE_SECONDS,
            s.entrance.elapsed + seconds,
          );
          s.working.elapsed = Math.min(duration, s.working.elapsed + seconds);
          const base = easeFace(
            s.expression ?? target,
            target,
            s.velocity,
            seconds,
          );
          s.expression = base;
          transitioning =
            (Object.keys(target) as (keyof FaceRig)[]).some(
              (key) => base[key] !== target[key],
            ) || s.shapeMorph.active;
          s.face =
            config.family === 'fold' || base.smile > 0.2
              ? advanceAttention(
                  s.attention,
                  (seconds * 8) / config.duration,
                  base,
                  appearance,
                )
              : base;
          s.face.blink = config.idle ? 1 : advanceBlink(s.blink, seconds);
          transitioning ||= s.blink.blinking;
          s.phase = (s.phase + (seconds * TAU) / config.duration) % TAU;
          if (!config.idle && config.lookAt === 'wander')
            advanceWander(
              s.wander,
              (seconds * 8) / config.duration,
              config.family === 'fold',
            );
          const aim = gazeAngles(appearance, s.phase, s.face, s.wander.point),
            ease = 1 - Math.exp(-milliseconds / 85);
          s.gaze = [
            s.gaze![0] + (aim[0] - s.gaze![0]) * ease,
            s.gaze![1] + (aim[1] - s.gaze![1]) * ease,
          ];
          draw();
        }
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const subscription = AppState.addEventListener('change', (next) => {
      active = next === 'active';
      last = 0;
    });
    let observer: IntersectionObserver | undefined;
    if (
      Platform.OS === 'web' &&
      typeof IntersectionObserver !== 'undefined' &&
      root.current instanceof Element
    ) {
      observer = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      });
      observer.observe(root.current);
    }
    draw();
    if (!frozen) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      subscription?.remove?.();
      observer?.disconnect();
    };
  }, [
    config,
    size,
    backingSize,
    paused,
    reduced,
    entranceKey,
    workingKey,
    workingCycles,
  ]);
  return (
    <StyledView
      ref={root}
      className={className}
      style={[{ width: size, height: size, maxWidth: '100%' }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? label ?? messages.label}
      testID={testID}
    >
      <Drawing context={drawing} size={size} />
    </StyledView>
  );
}

export const AgentAvatar = memo(AgentAvatarComponent);
AgentAvatar.displayName = 'AgentAvatar';
