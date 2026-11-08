import {
  advanceVectorPlayback,
  playVectorAction,
  VECTOR_TRANSITION_SECONDS,
} from './vector-playback';
import { paintVectorEyeFrame } from './vector-eye-ink';
import { CHARACTER_COLORS } from './character-colors';
import { vectorWorkLook } from './vector-work-look';
import { sampleVectorPose, blendVectorPose, type VectorPose } from './vector-pose';
import { sampleVectorMotion, type VectorMotionPose } from './vector-motion';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import { Platform, type View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import { useAppForeground } from '../hooks/use-app-state';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useMessages } from '../locale/messages';
import { StyledText, StyledView } from '../styles/styled-primitives';
import { resolveAvatarCharacter } from './character';
import {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_EYEWEAR,
  AVATAR_SHAPES,
} from './catalog-ids';
import { AvatarSnapshotObserver, CharacterRuntimeContext } from './context';
import { AGENT_AVATAR_MESSAGES } from './messages';
import type { AgentAvatarProps } from './types';
import { VectorStaticPortrait } from './VectorStaticPortrait';
import { vectorEyePortraits } from './vector-static';
import { vectorAssetLoader } from './vector-assets';
import { composeVectorCharacter } from './vector-compose';
import { renderVectorFrame } from './vector-frame';
import type { VectorAction, VectorData, VectorFrame } from './vector-types';

type Props = AgentAvatarProps & { previewPart?: 'eyes' };
type Display = {
  drawing: VectorFrame;
  action: VectorAction;
  time: number;
  count: number;
  entrance: number;
  gazeYaw: number;
  gazePitch: number;
  tracking: number;
};
/** Shared browser/native SVG host; loading, composition and projection never start the 3D runtime. */
export function VectorCharacterAvatar(props: Props) {
  if (props.previewPart === 'eyes') {
    const resolved = resolveAvatarCharacter(props.character),
      eyes = resolved.eyes;
    const frame = eyes === 'none' ? undefined : vectorEyePortraits[eyes];
    const paint =
      'bodyColor' in resolved.paint
        ? resolved.paint.bodyColor
        : CHARACTER_COLORS[resolved.paint.color];
    return (
      <VectorStaticPortrait {...props} frame={frame ? paintVectorEyeFrame(frame, paint) : frame} />
    );
  }
  return <AnimatedVectorCharacterAvatar {...props} />;
}
function AnimatedVectorCharacterAvatar(props: Props) {
  const { character, size = 64, paused, portrait, interactive, previewPart } = props;
  const { messages } = useMessages(AGENT_AVATAR_MESSAGES, props.locale);
  const reduced = usePrefersReducedMotion(),
    foreground = useAppForeground();
  const { reportCapabilities } = useContext(CharacterRuntimeContext);
  const resolved = useMemo(() => resolveAvatarCharacter(character), [character]);
  const [asset, setAsset] = useState<VectorData>(),
    [failed, setFailed] = useState(false),
    [visible, setVisible] = useState(true);
  const [display, setDisplay] = useState<Display>(),
    [revision, setRevision] = useState(0);
  const host = useRef<ComponentRef<typeof View> | null>(null);
  const svg = useRef<Svg | null>(null);
  const observeSnapshot = useContext(AvatarSnapshotObserver);
  useEffect(() => {
    observeSnapshot?.(async () => {
      if (Platform.OS === 'web') {
        const element = (host.current as unknown as HTMLElement | null)?.querySelector('svg');
        return element
          ? {
              uri:
                'data:image/svg+xml;charset=utf-8,' +
                encodeURIComponent(new XMLSerializer().serializeToString(element)),
            }
          : null;
      }
      return svg.current
        ? new Promise((resolve) =>
            svg.current!.toDataURL((data) => resolve({ uri: 'data:image/png;base64,' + data })),
          )
        : null;
    });
    return () => observeSnapshot?.(null);
  }, [observeSnapshot]);
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ready = useRef(false),
    onReady = useRef(props.onReady);
  onReady.current = props.onReady;
  const state = useRef({
    action: 'idle' as VectorAction,
    time: 0,
    repeats: 1,
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    count: 0,
    entrance: 1,
    workLook: { yaw: 0.35, pitch: 0.35 },
    clock: 0,
    lookMix: 0,
    pointerActive: false,
    lastPose: undefined as VectorPose | undefined,
    poseFrom: undefined as VectorPose | undefined,
    lastMotion: undefined as VectorMotionPose | undefined,
    motionFrom: undefined as VectorMotionPose | undefined,
    transitionStarted: 0,
    transitionDuration: VECTOR_TRANSITION_SECONDS,
  });
  const previous = useRef({
    idle: props.idleKey,
    reaction: props.reactionKey,
    work: props.workingKey,
    entrance: props.entranceKey,
  });
  const cycles = useRef(props.workingCycles);
  cycles.current = props.workingCycles;
  const play = useCallback((action: VectorAction) => {
    playVectorAction(state.current, action, action === 'work' ? cycles.current : 1);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    let current = true;
    setAsset(undefined);
    setDisplay(undefined);
    setFailed(false);
    state.current = {
      ...state.current,
      action: 'idle',
      clock: 0,
      lookMix: 0,
      pointerActive: false,
      lastPose: undefined,
      poseFrom: undefined,
      lastMotion: undefined,
      motionFrom: undefined,
      time: 0,
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
      count: 0,
    };
    void composeVectorCharacter(resolved, vectorAssetLoader)
      .then((value) => {
        if (!current) return;
        if (value.referenceFace) state.current.workLook = vectorWorkLook(value);
        setAsset(value);
        reportCapabilities?.({
          key: JSON.stringify(resolved),
          selected: {
            shape: resolved.shape,
            eyes: resolved.eyes,
            eyewear: resolved.eyewear,
            accessory: resolved.accessory,
          },
          available: Object.fromEntries([
            ...AVATAR_SHAPES.map((id) => [`shape:${id}`, true]),
            ...AVATAR_EYES.map((id) => [`eyes:${id}`, true]),
            ['eyes:none', true],
            ...AVATAR_EYEWEAR.map((id) => [`eyewear:${id}`, true]),
            ...AVATAR_ACCESSORIES.map((id) => [`accessory:${id}`, true]),
            ...AVATAR_COLORS.map((id) => [`color:${id}`, true]),
          ]),
        });
      })
      .catch(() => {
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [resolved, reportCapabilities]);
  useEffect(() => {
    if (props.reactionKey !== previous.current.reaction) {
      previous.current.reaction = props.reactionKey;
      play('reaction');
    }
    if (props.workingKey !== previous.current.work) {
      previous.current.work = props.workingKey;
      play('work');
    }
    if (props.idleKey !== previous.current.idle) {
      previous.current.idle = props.idleKey;
      play('idle');
    }
    if (props.entranceKey !== previous.current.entrance) {
      previous.current.entrance = props.entranceKey;
      state.current.entrance = 0;
      play('idle');
    }
  }, [props.idleKey, props.reactionKey, props.workingKey, props.entranceKey, play]);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof IntersectionObserver === 'undefined' || !host.current)
      return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? false),
    );
    observer.observe(host.current as unknown as Element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!asset || !visible || !foreground) return;
    let request = 0,
      last = 0,
      painted = 0,
      disposed = false;
    const stopped = !!paused || !!portrait || reduced;
    const tick = (now: number) => {
      if (disposed) return;
      const delta = last ? Math.min(0.064, (now - last) / 1000) : 0;
      last = now;
      const motion = state.current;
      if (!stopped) {
        advanceVectorPlayback(motion, asset, delta);
        motion.entrance = Math.min(1, motion.entrance + delta / 0.25);
        const follow = 1 - Math.exp(-delta * 7);
        motion.yaw += (motion.targetYaw - motion.yaw) * follow;
        motion.pitch += (motion.targetPitch - motion.pitch) * follow;
        motion.lookMix += ((motion.pointerActive ? 1 : 0) - motion.lookMix) * follow;
      }
      if (!painted || stopped || now - painted >= 1000 / 30) {
        painted = painted ? now - ((now - painted) % (1000 / 30)) : now;
        const action = portrait ? 'idle' : motion.action,
          time = portrait ? 0 : motion.time;
        const transition = Math.min(
          1,
          Math.max(0, (motion.clock - motion.transitionStarted) / motion.transitionDuration),
        );
        const eased = transition * transition * (3 - 2 * transition);
        const targetPose = sampleVectorPose(asset, action, time);
        const pose =
          motion.poseFrom && !portrait
            ? blendVectorPose(motion.poseFrom, targetPose, eased)
            : targetPose;
        const procedural = asset.referenceFace
          ? sampleVectorMotion({
              time: portrait ? 0 : motion.clock,
              state: action,
              stateTime: time,
              workLook: motion.workLook,
              look: {
                yaw: motion.yaw,
                pitch: motion.pitch,
                mix: portrait ? 0 : motion.lookMix,
                wander: (action === 'work' ? 0.15 : 1) * (1 - motion.lookMix),
              },
              transition:
                motion.motionFrom && !portrait
                  ? {
                      from: motion.motionFrom,
                      startedAt: motion.transitionStarted,
                      duration: motion.transitionDuration,
                    }
                  : undefined,
            })
          : undefined;
        motion.lastPose = pose;
        motion.lastMotion = procedural;
        if (transition >= 1) {
          motion.poseFrom = undefined;
          motion.motionFrom = undefined;
        }
        const drawing = renderVectorFrame(asset, {
          action,
          time,
          yaw: portrait ? 0 : motion.yaw,
          pitch: portrait ? 0 : motion.pitch,
          eyesOnly: previewPart === 'eyes',
          pose,
          motion: procedural,
          look: procedural ? { yaw: procedural.yaw, pitch: procedural.pitch, mix: 1 } : undefined,
        });
        motion.count++;
        setDisplay({
          drawing,
          action,
          time,
          count: motion.count,
          entrance: stopped ? 1 : motion.entrance,
          gazeYaw: procedural?.yaw ?? motion.yaw,
          gazePitch: procedural?.pitch ?? motion.pitch,
          tracking: motion.lookMix,
        });
      }
      if (!stopped) request = requestAnimationFrame(tick);
    };
    if (stopped) tick(typeof performance === 'undefined' ? 0 : performance.now());
    else request = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(request);
    };
  }, [asset, visible, foreground, paused, portrait, reduced, previewPart, revision]);
  useEffect(() => {
    if (display && !ready.current) {
      ready.current = true;
      onReady.current?.();
    }
  }, [display]);
  const gaze = (x: number, y: number, width: number, height: number) => {
    if (!interactive || paused || portrait || reduced) return;
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return;
    state.current.pointerActive = true;
    const limit = asset?.referenceFace ? 0.6 : 0.8;
    state.current.targetYaw = Math.max(-limit, Math.min(limit, (x / width - 0.5) * 1.8));
    state.current.targetPitch = Math.max(-0.45, Math.min(0.45, y / height - 0.5));
  };
  return (
    <StyledView
      ref={host}
      className={props.className}
      style={[{ width: size, height: size }, props.style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={props.accessibilityLabel ?? props.label ?? messages.label}
      testID={props.testID}
      {...(Platform.OS === 'web'
        ? {
            dataSet: {
              bloomVectorAvatar: '',
              action: display?.action ?? 'loading',
              time: String(display?.time ?? 0),
              frame: String(display?.count ?? 0),
              gazeYaw: String(display?.gazeYaw ?? 0),
              gazePitch: String(display?.gazePitch ?? 0),
              tracking: String(display?.tracking ?? 0),
            },
          }
        : {})}
      onPointerMove={(event) => {
        if (Platform.OS !== 'web' || !host.current) return;
        const box = (host.current as unknown as HTMLElement).getBoundingClientRect();
        gaze(
          event.nativeEvent.clientX - box.left,
          event.nativeEvent.clientY - box.top,
          box.width,
          box.height,
        );
      }}
      onPointerLeave={() => {
        state.current.pointerActive = false;
        state.current.targetYaw = 0;
        state.current.targetPitch = 0;
      }}
      onPointerDown={() => {
        if (Platform.OS === 'web' && interactive && !paused && !portrait && !reduced)
          play('reaction');
      }}
      onTouchMove={(event) => {
        if (Platform.OS !== 'web')
          gaze(event.nativeEvent.locationX, event.nativeEvent.locationY, size, size);
      }}
      onTouchEnd={() => {
        if (Platform.OS !== 'web' && interactive && !paused && !portrait && !reduced)
          play('reaction');
      }}
    >
      {failed ? (
        <StyledText numberOfLines={2} style={{ fontSize: 10 }}>
          {messages.unavailable}
        </StyledText>
      ) : display ? (
        <Svg
          ref={svg}
          width="100%"
          height="100%"
          viewBox={display.drawing.viewBox}
          testID="bloom-vector-drawing"
          accessible={false}
        >
          <Defs>
            {display.drawing.paths
              .filter((path) => path.clip !== undefined)
              .map((path) => (
                <ClipPath
                  key={path.id}
                  id={`${prefix}-${path.id}`}
                  {...{ clipPathUnits: 'userSpaceOnUse' }}
                >
                  <Path d={path.clip} fillRule="nonzero" clipRule="nonzero" />
                </ClipPath>
              ))}
          </Defs>
          <G opacity={display.entrance}>
            {display.drawing.paths.map((path) => (
              <Path
                key={path.id}
                d={path.d}
                fill={path.fill}
                opacity={path.opacity}
                fillOpacity={path.fillOpacity}
                fillRule="nonzero"
                stroke={path.stroke}
                strokeWidth={path.stroke ? 1.5 : undefined}
                clipPath={path.clip !== undefined ? `url(#${prefix}-${path.id})` : undefined}
              />
            ))}
          </G>
        </Svg>
      ) : null}
    </StyledView>
  );
}
