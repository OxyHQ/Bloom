import { VECTOR_UNCLIPPED } from './vector-visibility';
import type { VectorFrame } from './vector-types';

/**
 * A character at rest repeats itself. With no gesture, pointer, mood or transition, and no
 * reference face (whose procedural gaze never repeats), the frame it draws depends on one number:
 * where it is in its idle clip. So the frames of that clip are computed once, the first time
 * round, and replayed after that: its loop.
 *
 * The loop's frames sit on a fixed grid, `VECTOR_LOOP_FPS` a second, the rate frames are painted
 * at, and an avatar at rest draws the grid frame its clock is in. Every avatar with the same
 * geometry and paint shares one loop, keyed by `vectorFrameRecipeKey`.
 */
export const VECTOR_LOOP_FPS = 30;
/** The loops kept, in path characters (about bytes): Alia's is 2 M, the largest character 10 M. */
export const VECTOR_LOOP_CACHE_CHARACTERS = 24_000_000;

export type VectorLoop<Frame extends { drawing: VectorFrame }> = {
  /** Seconds the loop takes: its idle clip's duration. */
  duration: number;
  /** One slot per grid frame, filled the first time that frame is drawn. */
  frames: (Frame | undefined)[];
  /** How many slots are filled. */
  drawn: number;
  /** Path characters held, for the cache budget. */
  characters: number;
  /** Its tracks, built once every frame is drawn (`vectorLoopTracks`); `null` if it has none. */
  tracks?: VectorLoopTracks | null;
};

/**
 * A complete loop as one track per drawn path, for a player that draws it frame by frame without
 * recomputing anything: what stays the same on every frame (the paint) and what changes (outline,
 * clip and opacity, one entry per frame). A path that is clipped on some frames and not on others
 * gets `VECTOR_UNCLIPPED` on the frames it has none, which hides nothing.
 */
export type VectorLoopTracks = {
  /** Seconds the loop takes. */
  duration: number;
  /** Grid frames in it: the length of every per-frame list. */
  length: number;
  viewBox: string;
  paths: {
    id: string;
    fill: string;
    fillOpacity: number;
    stroke?: string;
    strokeWidth?: number;
    d: string[];
    opacity: number[];
    clip?: string[];
  }[];
};

const loops = new Map<string, VectorLoop<{ drawing: VectorFrame }>>();
let held = 0;

/** The loop of the avatar whose frame recipe is `key`, with an idle clip of `duration` seconds. */
export function vectorLoop<Frame extends { drawing: VectorFrame }>(
  key: string,
  duration: number,
): VectorLoop<Frame> {
  const known = loops.get(key);
  if (known) {
    loops.delete(key);
    loops.set(key, known);
    return known as VectorLoop<Frame>;
  }
  const length = Math.max(1, Math.round(duration * VECTOR_LOOP_FPS));
  const loop: VectorLoop<Frame> = {
    duration,
    frames: Array.from({ length }, () => undefined),
    drawn: 0,
    characters: 0,
  };
  loops.set(key, loop);
  return loop;
}

/** The grid frame a clock of `time` seconds is in. */
export function vectorLoopIndex(loop: VectorLoop<{ drawing: VectorFrame }>, time: number): number {
  const length = loop.frames.length;
  const elapsed = loop.duration > 0 ? ((time % loop.duration) + loop.duration) % loop.duration : 0;
  return Math.min(length - 1, Math.floor((elapsed / loop.duration) * length)) || 0;
}

/** The clip time grid frame `index` is drawn at. */
export function vectorLoopTime(loop: VectorLoop<{ drawing: VectorFrame }>, index: number): number {
  return (index * loop.duration) / loop.frames.length;
}

/** Grid frame `index`: drawn by `draw` the first time it is asked for, remembered after that. */
export function vectorLoopFrame<Frame extends { drawing: VectorFrame }>(
  loop: VectorLoop<Frame>,
  index: number,
  draw: () => Frame,
): Frame {
  const known = loop.frames[index];
  if (known) return known;
  const frame = draw();
  loop.frames[index] = frame;
  loop.drawn++;
  const characters = frame.drawing.paths.reduce(
    (sum, path) => sum + path.d.length + (path.clip?.length ?? 0),
    0,
  );
  loop.characters += characters;
  held += characters;
  // The least recently used loops go first; one in use is rebuilt by the avatar that needs it.
  for (const [key, old] of loops) {
    if (held <= VECTOR_LOOP_CACHE_CHARACTERS || old === loop) break;
    loops.delete(key);
    held -= old.characters;
  }
  return frame;
}

/**
 * The tracks of a complete loop, or `null` while frames are missing or when its frames do not
 * draw the same paths with the same paint (then it is replayed frame by frame instead).
 */
export function vectorLoopTracks(
  loop: VectorLoop<{ drawing: VectorFrame }>,
): VectorLoopTracks | null {
  if (loop.tracks !== undefined) return loop.tracks;
  if (loop.drawn < loop.frames.length) return null;
  const drawings = loop.frames.map((frame) => frame!.drawing);
  const first = drawings[0]!;
  const same = drawings.every(
    (drawing) =>
      drawing.viewBox === first.viewBox &&
      drawing.paths.length === first.paths.length &&
      drawing.paths.every((path, i) => {
        const model = first.paths[i]!;
        return (
          path.id === model.id &&
          path.fill === model.fill &&
          path.fillOpacity === model.fillOpacity &&
          path.stroke === model.stroke &&
          path.strokeWidth === model.strokeWidth
        );
      }),
  );
  loop.tracks = same
    ? {
        duration: loop.duration,
        length: loop.frames.length,
        viewBox: first.viewBox,
        paths: first.paths.map((path, i) => {
          const clipped = drawings.some((drawing) => drawing.paths[i]!.clip !== undefined);
          return {
            id: path.id,
            fill: path.fill,
            fillOpacity: path.fillOpacity,
            stroke: path.stroke,
            strokeWidth: path.strokeWidth,
            d: drawings.map((drawing) => drawing.paths[i]!.d),
            opacity: drawings.map((drawing) => drawing.paths[i]!.opacity),
            clip: clipped
              ? drawings.map((drawing) => drawing.paths[i]!.clip ?? VECTOR_UNCLIPPED)
              : undefined,
          };
        }),
      }
    : null;
  return loop.tracks;
}
