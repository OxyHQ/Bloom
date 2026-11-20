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
  advanceVectorMood,
  initialVectorMood,
  setVectorMood,
  settleVectorMood,
  vectorMoodActive,
  vectorMoodFrame,
} from './vector-mood';
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
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useScreenVisible } from '../screen/use-screen-visible';
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
import { useStaticPortraits } from './use-static-portraits';
import { useVectorAssetLoader } from './default-catalog';
import {
  loadVectorGeometry,
  paintVectorCharacter,
  VECTOR_REST_CLIPS,
  vectorGeometryKey,
} from './vector-compose';
import { renderVectorFrame } from './vector-frame';
import {
  releaseVectorLoop,
  vectorLoop,
  vectorLoopFrame,
  vectorLoopIndex,
  vectorLoopKey,
  vectorLoopTime,
  vectorLoopTracks,
  type VectorLoop,
} from './vector-loop';
import {
  nativePaint,
  nativeVectorLoop,
  VectorNativeSurface,
  viewBoxNumbers,
  type NativeVectorClock,
  type NativeVectorFrame,
  type NativeVectorLoop,
  type NativeVectorSurfaceProps,
} from './VectorNativeSurface';
import type { VectorAction, VectorData, VectorDrawPath, VectorFrame } from './vector-types';

type Props = AgentAvatarProps & { previewPart?: 'eyes' };
/** One computed frame: what is drawn, and the pose and motion a later transition starts from. */
type PaintedFrame = {
  pose: VectorPose;
  procedural?: VectorMotionPose;
  gaze: { yaw: number; pitch: number };
  drawing: VectorFrame;
};
/**
 * The rest loops the native surface has, by `vectorLoopKey`: `true` once it said it has one (from
 * memory, from an earlier start, or because it was handed over), `false` once it said it has not.
 * Where there is no native surface (the web) the JS thread replays the remembered frames itself.
 */
const nativeLoops = new Map<string, boolean>();
let lastCapture = 0;
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
  if (props.previewPart === 'eyes') return <VectorEyePreview {...props} />;
  return <AnimatedVectorCharacterAvatar {...props} />;
}
/** The eye picker's still eyes, from the offline portraits (loaded on first use). */
function VectorEyePreview(props: Props) {
  const portraits = useStaticPortraits();
  const resolved = resolveAvatarCharacter(props.character),
    eyes = resolved.eyes;
  const frame = eyes === 'none' ? undefined : portraits?.vectorEyePortraits[eyes];
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
function AnimatedVectorCharacterAvatar(props: Props) {
  const { character, size = 64, paused, portrait, interactive, previewPart, mood } = props;
  const { messages } = useMessages(AGENT_AVATAR_MESSAGES, props.locale);
  const catalog = useVectorAssetLoader(props.catalog);
  const reduced = usePrefersReducedMotion(),
    // Its screen in front and the app in the foreground: a covered scene, another tab page or a
    // backgrounded app draws no frames.
    screenVisible = useScreenVisible();
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
  /** The clock of the rest loop the native surface plays, if it does; the JS thread draws nothing meanwhile. */
  const [looping, setLooping] = useState<NativeVectorClock>();
  const loopSession = useRef<
    { key: string; loop: VectorLoop<PaintedFrame>; asset: VectorData } & NativeVectorClock
  >(undefined);
  /** The rest loop the native surface is asked about, and the loop handed to it when it has not got it. */
  const [restKey, setRestKey] = useState<string>();
  const [handedLoop, setHandedLoop] = useState<{ key: string; loop: NativeVectorLoop }>();
  const [capture, setCapture] = useState(0);
  const captures = useRef(new Map<number, (data: string | null) => void>());
  const drawn = useRef(false);
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
      if (VectorNativeSurface)
        return drawn.current
          ? new Promise((resolve) => {
              const id = ++lastCapture;
              captures.current.set(id, (data) =>
                resolve(data ? { uri: 'data:image/png;base64,' + data } : null),
              );
              setCapture(id);
            })
          : null;
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
    mood: initialVectorMood(mood),
  });
  const previous = useRef({
    idle: props.idleKey,
    reaction: props.reactionKey,
    work: props.workingKey,
    entrance: props.entranceKey,
    mood,
  });
  const latestMood = useRef(mood);
  latestMood.current = mood;
  const cycles = useRef(props.workingCycles);
  cycles.current = props.workingCycles;
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  /**
   * Takes the drawing back from the native surface: the clock moves on by what it played (both read
   * the same monotonic clock), and the surface keeps the frame it got to on screen until the JS
   * thread draws one. Called before anything changes the motion (a gesture, a mood, the pointer) and
   * whenever the frame loop restarts, so the character carries on from where it was.
   */
  const endLoop = useCallback(() => {
    const session = loopSession.current;
    if (!session) return;
    loopSession.current = undefined;
    const seconds = Math.max(0, (performance.now() - session.epoch) / 1000),
      motion = state.current;
    advanceVectorPlayback(motion, session.asset, seconds);
    advanceVectorMood(motion.mood, latestMood.current, seconds);
    // The pose of that frame, which a gesture blends from: at rest it is the idle clip's pose at the
    // frame's grid time, as the loop drew it.
    motion.lastPose = sampleVectorPose(
      session.asset,
      'idle',
      vectorLoopTime(session.loop, vectorLoopIndex(session.loop, motion.time)),
    );
    setLooping(undefined);
    setDisplay((shown) => shown && { ...shown, time: motion.time });
  }, []);
  const onLoop = useCallback<NonNullable<NativeVectorSurfaceProps['onLoop']>>(
    ({ nativeEvent: { key, ready } }) => {
      nativeLoops.set(key, ready);
      if (ready) setHandedLoop((handed) => (handed?.key === key ? undefined : handed));
      // The surface lost a loop it was playing: the JS thread draws it again.
      else if (loopSession.current?.key === key) endLoop();
    },
    [endLoop],
  );
  const onCapture = useCallback<NonNullable<NativeVectorSurfaceProps['onCapture']>>(
    ({ nativeEvent: { id, data } }) => {
      captures.current.get(id)?.(data);
      captures.current.delete(id);
    },
    [],
  );
  /**
   * The character is first loaded at rest (`VECTOR_REST_CLIPS`): its idle tracks and the geometry
   * they draw, which is what an avatar shows almost always (a mood is drawn on the idle clip). Its
   * gestures (`reaction`, and `work` with the computer and hands only it shows) are loaded the
   * first time one is asked for; meanwhile the idle animation carries on, and the gesture starts
   * when its tracks arrive. An interactive avatar asks ahead, when the pointer reaches it.
   */
  const fullGeometry = useRef<string | null>(null);
  const loadingFull = useRef<string | null>(null);
  const pendingAction = useRef<VectorAction | null>(null);
  const ensureFull = useCallback(() => {
    const key = vectorGeometryKey(latestResolved.current);
    if (fullGeometry.current === key || loadingFull.current === key) return;
    loadingFull.current = key;
    void loadVectorGeometry(latestResolved.current, catalogRef.current).then(
      (value) => {
        if (vectorGeometryKey(latestResolved.current) !== key) return;
        fullGeometry.current = key;
        loadedGeometry.current = key;
        if (value.referenceFace) state.current.workLook = vectorWorkLook(value);
        // The loop may have been handed over again while this loaded: its clock first.
        endLoop();
        setAsset(value);
        const action = pendingAction.current;
        pendingAction.current = null;
        if (action) playVectorAction(state.current, action, action === 'work' ? cycles.current : 1);
        setRevision((revision) => revision + 1);
      },
      () => {
        if (loadingFull.current === key) loadingFull.current = null;
      },
    );
  }, [endLoop]);
  const play = useCallback(
    (action: VectorAction) => {
      endLoop();
      if (action !== 'idle' && fullGeometry.current !== vectorGeometryKey(latestResolved.current)) {
        pendingAction.current = action;
        ensureFull();
        return;
      }
      pendingAction.current = null;
      playVectorAction(state.current, action, action === 'work' ? cycles.current : 1);
      setRevision((value) => value + 1);
    },
    [ensureFull, endLoop],
  );
  useEffect(() => {
    let current = true;
    setFailed(false);
    reportLoading(true);
    // A new character starts at rest again; its gestures load when one is first asked for.
    fullGeometry.current = null;
    loadingFull.current = null;
    void loadVectorGeometry(latestResolved.current, catalog, VECTOR_REST_CLIPS)
      .then((value) => {
        // Gone, or overtaken by the full character a gesture asked for in the meantime.
        if (!current || fullGeometry.current === geometryKey) return;
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
  }, [geometryKey, reportCapabilities, catalog]);
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
    if (mood === previous.current.mood) return;
    endLoop();
    setVectorMood(state.current.mood, mood, previous.current.mood);
    previous.current.mood = mood;
    // A still character repaints into the new mood; a running one restarts its frame loop.
    setRevision((value) => value + 1);
  }, [mood, endLoop]);
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
    if (!asset || !visible || !screenVisible) return;
    // The UI thread plays the loop until something changes; then the JS thread takes over again.
    if (looping) return endLoop;
    let last: number | undefined,
      painted = 0,
      paintedIndex = -1,
      disposed = false;
    const stopped = !!paused || !!portrait || reduced;
    const tick = (timestamp: number) => {
      if (disposed || loopSession.current) return;
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
        advanceVectorMood(motion.mood, latestMood.current, delta);
      } else settleVectorMood(motion.mood, latestMood.current);
      // At rest the frame is one of the loop's, drawn once and remembered (`vector-loop.ts`), and
      // each grid frame is painted in turn; otherwise a frame is painted 30 times a second.
      const resting =
        !stopped &&
        motion.action === 'idle' &&
        !motion.poseFrom &&
        !motion.motionFrom &&
        motion.entrance >= 1 &&
        motion.yaw === 0 &&
        motion.pitch === 0 &&
        !vectorMoodActive(motion.mood) &&
        !asset.referenceFace &&
        !previewPart;
      const loop = resting
        ? vectorLoop<PaintedFrame>(latestFrameRecipe.current, asset.clips.idle.duration)
        : undefined;
      const index = loop ? vectorLoopIndex(loop, motion.time) : 0;
      const transition = Math.min(
        1,
        Math.max(0, (motion.clock - motion.transitionStarted) / motion.transitionDuration),
      );
      const eased = transition * transition * (3 - 2 * transition);
      const feeling = !portrait && vectorMoodActive(motion.mood) ? { ...motion.mood } : undefined;
      const draw = (action: VectorAction, time: number): PaintedFrame => {
        const poseTime = asset.referenceFace && action === 'work' ? referenceWorkTime(time) : time;
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
        // The mood goes over the blended motion, never into it: a transition captures the
        // motion without the mood, which carries on through the transition on its own clock.
        const framed = vectorMoodFrame(
          asset,
          procedural,
          { yaw: portrait ? 0 : motion.yaw, pitch: portrait ? 0 : motion.pitch },
          feeling,
        );
        const drawing = renderVectorFrame(asset, {
          action,
          time,
          ...framed,
          eyesOnly: previewPart === 'eyes',
          pose,
        });
        return { pose, procedural, gaze: framed.look ?? framed, drawing };
      };
      // Where there is a native surface, a loop it has is played by it, from where the clock is.
      const key =
        loop && VectorNativeSurface
          ? vectorLoopKey(
              loop,
              JSON.stringify([
                vectorGeometryKey(latestResolved.current),
                latestResolved.current.paint,
              ]),
              asset.clips.idle,
              () => vectorLoopFrame(loop, 0, () => draw('idle', vectorLoopTime(loop, 0))).drawing,
            )
          : undefined;
      if (key !== undefined) {
        setRestKey(key);
        // Once a frame is on screen, so the surface is there to play it.
        if (nativeLoops.get(key) && motion.count > 0) {
          const clock = { epoch: performance.now(), time: motion.time };
          loopSession.current = { key, loop: loop!, asset, ...clock };
          releaseVectorLoop(loop!);
          setLooping(clock);
          return;
        }
      }
      if (loop ? index !== paintedIndex : !painted || stopped || now - painted >= 1000 / 30) {
        painted = painted ? now - ((now - painted) % (1000 / 30)) : now;
        paintedIndex = loop ? index : -1;
        const action = portrait ? 'idle' : motion.action,
          time = loop ? vectorLoopTime(loop, index) : portrait ? 0 : motion.time;
        const sharedKey = () =>
          JSON.stringify([
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
            feeling?.sadness,
            feeling?.declineTime,
            portrait,
            previewPart,
          ]);
        const { pose, procedural, gaze, drawing } = loop
          ? vectorLoopFrame(loop, index, () => draw(action, time))
          : shareVectorFrame(sharedKey(), () => draw(action, time));
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
          gazeYaw: gaze.yaw,
          gazePitch: gaze.pitch,
          tracking: motion.lookMix,
        });
      }
      // A complete loop the native surface said it has not got is handed to it once.
      const tracks = key !== undefined && nativeLoops.get(key) === false && vectorLoopTracks(loop!);
      if (tracks)
        setHandedLoop((handed) =>
          handed?.key === key
            ? handed
            : { key: key!, loop: nativeVectorLoop(tracks, avatarViewBox(tracks.viewBox)) },
        );
    };
    if (stopped) tick(typeof performance === 'undefined' ? 0 : performance.now());
    const unsubscribe = stopped ? undefined : subscribeVectorFrame(tick);
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [
    asset,
    visible,
    screenVisible,
    paused,
    portrait,
    reduced,
    previewPart,
    revision,
    looping,
    endLoop,
  ]);
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
  drawn.current = !!display;
  /** The paint a drawn path is shown with: the current paint, when the frame is of the current geometry. */
  const paintOf = (path: VectorDrawPath) => {
    const part =
      display?.geometry === loadedGeometry.current
        ? paintedAsset?.parts[Number(path.id)]
        : undefined;
    const stroke = part
      ? (part.stroke ?? (part.role === 'panel' ? path.stroke : undefined))
      : path.stroke;
    return {
      fill: part?.color ?? path.fill,
      stroke,
      strokeWidth: stroke ? (part?.strokeWidth ?? path.strokeWidth ?? 1.5) : undefined,
    };
  };
  const nativeFrame = useMemo<NativeVectorFrame | undefined>(
    () =>
      VectorNativeSurface && display
        ? {
            revision: display.count,
            viewBox: viewBoxNumbers(avatarViewBox(display.drawing.viewBox)),
            opacity: display.entrance,
            paths: display.drawing.paths.map((path) => ({
              d: path.d,
              ...(path.clip !== undefined ? { clip: path.clip } : {}),
              ...nativePaint(paintOf(path)),
              opacity: path.opacity,
              fillOpacity: path.fillOpacity,
            })),
          }
        : undefined,
    // `paintOf` reads only `display` and `paintedAsset`.
    [display, paintedAsset],
  );
  const gaze = (x: number, y: number, width: number, height: number) => {
    if (!interactive || paused || portrait || reduced) return;
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return;
    endLoop();
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
              mood: mood ?? 'neutral',
            },
          }
        : {})}
      onPointerEnter={() => {
        if (interactive && !paused && !portrait && !reduced) ensureFull();
      }}
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
      ) : display && VectorNativeSurface ? (
        <VectorNativeSurface
          style={{ width: '100%', height: '100%' }}
          pointerEvents="none"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          testID="bloom-vector-drawing"
          frame={nativeFrame}
          loopKey={restKey}
          loopTracks={handedLoop?.key === restKey ? handedLoop?.loop : undefined}
          loopClock={looping}
          capture={capture}
          onLoop={onLoop}
          onCapture={onCapture}
        />
      ) : display ? (
        <Svg
          ref={svg}
          width="100%"
          height="100%"
          viewBox={avatarViewBox(display.drawing.viewBox)}
          testID="bloom-vector-drawing"
          {...svgA11yProps()}
        >
          <>
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
                const paint = paintOf(path);
                return (
                  <Path
                    key={path.id}
                    d={path.d}
                    fill={paint.fill}
                    opacity={path.opacity}
                    fillOpacity={path.fillOpacity}
                    fillRule="nonzero"
                    stroke={paint.stroke}
                    strokeWidth={paint.strokeWidth}
                    clipPath={path.clip !== undefined ? `url(#${prefix}-${path.id})` : undefined}
                  />
                );
              })}
            </G>
          </>
        </Svg>
      ) : null}
    </StyledView>
  );
}
