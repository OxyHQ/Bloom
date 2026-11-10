import { avatarViewBox } from './vector-viewbox';
import { svgA11yProps } from '../styles/svg-a11y';
import { useSvgIdPrefix } from '../styles/svg-id';
import {
  subscribeVectorFrame,
  shareVectorFrame,
  vectorStateIdentity,
  vectorFrameRecipeKey,
} from './vector-scheduler';
import {
  advanceVectorPlayback,
  playVectorAction,
  VECTOR_TRANSITION_SECONDS,
  vectorFrameDelta,
} from './vector-playback';
import { paintVectorEyeFrame } from './vector-eye-ink';
import { CHARACTER_COLORS } from './character-colors';
import { vectorWorkLook } from './vector-work-look';
import { sampleVectorPose, blendVectorPose, type VectorPose } from './vector-pose';
import { sampleVectorMotion, referenceWorkTime, type VectorMotionPose } from './vector-motion';
import {
  useCallback,
  useContext,
  useEffect,
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
import { loadVectorGeometry, paintVectorCharacter, vectorGeometryKey } from './vector-compose';
import { renderVectorFrame } from './vector-frame';
import type { VectorAction, VectorData, VectorFrame } from './vector-types';

type Props = AgentAvatarProps & { previewPart?: 'eyes' };
type Display = {
  geometry: string;
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
      <VectorStaticPortrait
        {...props}
        frame={frame ? paintVectorEyeFrame(frame, paint, eyes) : frame}
      />
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
  const geometryKey = vectorGeometryKey(resolved);
  const loadedGeometry = useRef('');
  const latestResolved = useRef(resolved);
  latestResolved.current = resolved;
  const paintedAsset = useMemo(
    () => (asset ? paintVectorCharacter(asset, resolved) : undefined),
    [asset, resolved],
  );
  const frameRecipeKey = useMemo(
    () => vectorFrameRecipeKey(asset, geometryKey, resolved.paint),
    [asset, geometryKey, resolved.paint],
  );
  const latestFrameRecipe = useRef(frameRecipeKey);
  latestFrameRecipe.current = frameRecipeKey;
  const latestAsset = useRef(paintedAsset);
  latestAsset.current = paintedAsset;
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
  const prefix = useSvgIdPrefix('bloom-vector');
  const ready = useRef(false),
    onReady = useRef(props.onReady);
  onReady.current = props.onReady;
  const loadingChange = useRef(props.onLoadingChange);
  loadingChange.current = props.onLoadingChange;
  const loading = useRef<boolean | undefined>(undefined);
  const reportLoading = useCallback((value: boolean) => {
    if (loading.current === value) return;
    loading.current = value;
    loadingChange.current?.(value);
  }, []);
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
    setFailed(false);
    reportLoading(true);
    void loadVectorGeometry(latestResolved.current, vectorAssetLoader)
      .then((value) => {
        if (!current) return;
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
        loadedGeometry.current = geometryKey;
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
        if (current) {
          setFailed(true);
          reportLoading(false);
        }
      });
    return () => {
      current = false;
    };
  }, [geometryKey, reportCapabilities]);
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
    let last: number | undefined,
      painted = 0,
      disposed = false;
    const stopped = !!paused || !!portrait || reduced;
    const tick = (timestamp: number) => {
      if (disposed) return;
      // A frame callback that brings no timestamp is read off the page's own clock; with no clock
      // at all there is nothing to advance by, and the frame is not drawn.
      const now = Number.isFinite(timestamp)
        ? timestamp
        : typeof performance === 'undefined'
          ? Number.NaN
          : performance.now();
      if (!Number.isFinite(now)) return;
      const delta = vectorFrameDelta(now, last);
      last = now;
      const asset = latestAsset.current!;
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
        const sharedKey = JSON.stringify([
          latestFrameRecipe.current,
          action,
          time,
          motion.clock,
          motion.yaw,
          motion.pitch,
          motion.lookMix,
          motion.workLook,
          motion.transitionStarted,
          motion.transitionDuration,
          vectorStateIdentity(motion.poseFrom),
          vectorStateIdentity(motion.motionFrom),
          portrait,
          previewPart,
        ]);
        const { pose, procedural, drawing } = shareVectorFrame(sharedKey, () => {
          const poseTime =
            asset.referenceFace && action === 'work' ? referenceWorkTime(time) : time;
          const targetPose = sampleVectorPose(asset, action, poseTime);
          const pose =
            motion.poseFrom && !portrait
              ? blendVectorPose(motion.poseFrom, targetPose, eased)
              : targetPose;
          const procedural = asset.referenceFace
            ? sampleVectorMotion({
                personalityKey: latestResolved.current.shape,
                time: portrait ? 0 : motion.clock,
                state: action,
                stateTime: poseTime,
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
          return { pose, procedural, drawing };
        });
        motion.lastPose = pose;
        motion.lastMotion = procedural;
        if (transition >= 1) {
          motion.poseFrom = undefined;
          motion.motionFrom = undefined;
        }
        motion.count++;
        setDisplay({
          geometry: loadedGeometry.current,
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
    };
    if (stopped) tick(typeof performance === 'undefined' ? 0 : performance.now());
    const unsubscribe = stopped ? undefined : subscribeVectorFrame(tick);
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [asset, visible, foreground, paused, portrait, reduced, previewPart, revision]);
  useEffect(() => {
    if (paused || portrait || reduced) setRevision((value) => value + 1);
  }, [resolved.paint, paused, portrait, reduced]);
  useEffect(() => {
    if (display?.geometry === geometryKey) reportLoading(false);
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
      accessible={props.accessibilityLabel !== ''}
      accessibilityRole="image"
      aria-busy={display?.geometry !== geometryKey}
      accessibilityLabel={(props.accessibilityLabel ?? props.label ?? messages.label) || undefined}
      testID={props.testID}
      {...(Platform.OS === 'web'
        ? {
            dataSet: {
              bloomVectorAvatar: '',
              geometry: display?.geometry ?? '',
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
          viewBox={avatarViewBox(display.drawing.viewBox)}
          testID="bloom-vector-drawing"
          {...svgA11yProps()}
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
            {display.drawing.paths.map((path) => {
              const currentPart =
                display.geometry === loadedGeometry.current
                  ? paintedAsset?.parts[Number(path.id)]
                  : undefined;
              const stroke = currentPart
                ? (currentPart.stroke ?? (currentPart.role === 'panel' ? path.stroke : undefined))
                : path.stroke;
              return (
                <Path
                  key={path.id}
                  d={path.d}
                  fill={
                    display.geometry === loadedGeometry.current
                      ? (paintedAsset?.parts[Number(path.id)]?.color ?? path.fill)
                      : path.fill
                  }
                  opacity={path.opacity}
                  fillOpacity={path.fillOpacity}
                  fillRule="nonzero"
                  stroke={stroke}
                  strokeWidth={
                    stroke ? (currentPart?.strokeWidth ?? path.strokeWidth ?? 1.5) : undefined
                  }
                  clipPath={path.clip !== undefined ? `url(#${prefix}-${path.id})` : undefined}
                />
              );
            })}
          </G>
        </Svg>
      ) : null}
    </StyledView>
  );
}
