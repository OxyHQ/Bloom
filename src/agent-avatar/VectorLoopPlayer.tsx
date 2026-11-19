import Animated, {
  useAnimatedProps,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { ClipPath, Defs, G, Path } from 'react-native-svg';
import type { VectorLoopTracks } from './vector-loop';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Track = VectorLoopTracks['paths'][number];
type Props = {
  tracks: VectorLoopTracks;
  /** The grid frame to start on. */
  start: number;
  /** Milliseconds played, written here; the avatar reads it back when it takes over again. */
  elapsed: SharedValue<number>;
  /** The avatar's SVG id prefix, for its clip ids. */
  prefix: string;
};

/**
 * A complete loop (`vector-loop.ts`) played on the UI thread: a frame callback steps the grid frame
 * and each path takes that frame's outline, clip and opacity, all computed before. The JS thread
 * does nothing while it plays. The paths and their paint are the ones the avatar draws itself.
 */
export function VectorLoopPlayer({ tracks, start, elapsed, prefix }: Props) {
  const { length } = tracks;
  const frameMs = (tracks.duration * 1000) / length;
  const frame = useSharedValue(start);
  useFrameCallback((info) => {
    elapsed.value += info.timeSincePreviousFrame ?? 0;
    const next = (start + Math.floor(elapsed.value / frameMs)) % length;
    if (next !== frame.value) frame.value = next;
  });
  return (
    <>
      <Defs>
        {tracks.paths.map((track) =>
          track.clip ? (
            <ClipPath
              key={track.id}
              id={`${prefix}-${track.id}`}
              {...{ clipPathUnits: 'userSpaceOnUse' }}
            >
              <LoopClip outlines={track.clip} frame={frame} start={start} />
            </ClipPath>
          ) : null,
        )}
      </Defs>
      <G opacity={1}>
        {tracks.paths.map((track) => (
          <LoopPath
            key={track.id}
            track={track}
            frame={frame}
            start={start}
            clipPath={track.clip ? `url(#${prefix}-${track.id})` : undefined}
          />
        ))}
      </G>
    </>
  );
}

function LoopPath({
  track,
  frame,
  start,
  clipPath,
}: {
  track: Track;
  frame: SharedValue<number>;
  start: number;
  clipPath?: string;
}) {
  const { d, opacity } = track;
  const animatedProps = useAnimatedProps(
    () => ({ d: d[frame.value]!, opacity: opacity[frame.value]! }),
    [d, opacity, frame],
  );
  return (
    <AnimatedPath
      animatedProps={animatedProps}
      d={d[start]}
      fill={track.fill}
      opacity={opacity[start]}
      fillOpacity={track.fillOpacity}
      fillRule="nonzero"
      stroke={track.stroke}
      strokeWidth={track.stroke ? (track.strokeWidth ?? 1.5) : undefined}
      clipPath={clipPath}
    />
  );
}

function LoopClip({
  outlines,
  frame,
  start,
}: {
  outlines: string[];
  frame: SharedValue<number>;
  start: number;
}) {
  const animatedProps = useAnimatedProps(() => ({ d: outlines[frame.value]! }), [outlines, frame]);
  return (
    <AnimatedPath
      animatedProps={animatedProps}
      d={outlines[start]}
      fillRule="nonzero"
      clipRule="nonzero"
    />
  );
}
