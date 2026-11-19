import {
  VECTOR_LOOP_CACHE_CHARACTERS,
  vectorLoop,
  vectorLoopFrame,
  vectorLoopIndex,
  vectorLoopTime,
  vectorLoopTracks,
} from '../vector-loop';
import { VECTOR_UNCLIPPED } from '../vector-visibility';
import type { VectorDrawPath, VectorFrame } from '../vector-types';

const path = (id: string, d: string, clip?: string): VectorDrawPath => ({
  id,
  d,
  fill: '#123456',
  opacity: 1,
  fillOpacity: 1,
  ...(clip ? { clip } : {}),
});
const frame = (...paths: VectorDrawPath[]): { drawing: VectorFrame } => ({
  drawing: { paths, viewBox: '0 0 320 320' },
});
let keys = 0;
const fresh = (duration: number) => vectorLoop(`test-loop-${++keys}`, duration);

describe('a rest loop', () => {
  it('lays its frames on a grid of about 30 a second, wrapping with the clip', () => {
    const loop = fresh(5.95);
    expect(loop.frames).toHaveLength(179);
    expect(vectorLoopIndex(loop, 0)).toBe(0);
    expect(vectorLoopTime(loop, 1)).toBeCloseTo(5.95 / 179);
    expect(vectorLoopIndex(loop, 5.95 / 179 + 1e-9)).toBe(1);
    // A clock many loops on draws the same grid frame as its first time round.
    expect(vectorLoopIndex(loop, 3 * 5.95 + 2)).toBe(vectorLoopIndex(loop, 2));
    expect(vectorLoopIndex(loop, 5.95 - 1e-9)).toBe(178);
  });

  it('draws each grid frame once, and the same loop is shared by its key', () => {
    const loop = vectorLoop('shared-recipe', 1);
    let draws = 0;
    const draw = () => (draws++, frame(path('0', 'M0 0L1 1Z')));
    const first = vectorLoopFrame(loop, 3, draw);
    expect(vectorLoopFrame(vectorLoop('shared-recipe', 1), 3, draw)).toBe(first);
    expect(draws).toBe(1);
    expect(loop.drawn).toBe(1);
  });

  it('has tracks only once complete, and fills a missing clip with one that hides nothing', () => {
    const loop = fresh(0.1);
    expect(loop.frames).toHaveLength(3);
    vectorLoopFrame(loop, 0, () => frame(path('0', 'A', 'mask-a'), path('1', 'B')));
    vectorLoopFrame(loop, 1, () => frame(path('0', 'C'), path('1', 'D')));
    expect(vectorLoopTracks(loop)).toBeNull();
    vectorLoopFrame(loop, 2, () => frame(path('0', 'E', 'mask-e'), path('1', 'F')));
    const tracks = vectorLoopTracks(loop)!;
    expect(tracks.length).toBe(3);
    expect(tracks.paths.map((track) => track.d)).toEqual([
      ['A', 'C', 'E'],
      ['B', 'D', 'F'],
    ]);
    expect(tracks.paths[0]!.clip).toEqual(['mask-a', VECTOR_UNCLIPPED, 'mask-e']);
    expect(tracks.paths[1]!.clip).toBeUndefined();
  });

  it('has no tracks when its frames do not draw the same paths', () => {
    const loop = fresh(1 / 30);
    vectorLoopFrame(loop, 0, () => frame(path('0', 'A')));
    expect(vectorLoopTracks(loop)).not.toBeNull();
    const changing = fresh(2 / 30);
    vectorLoopFrame(changing, 0, () => frame(path('0', 'A')));
    vectorLoopFrame(changing, 1, () => frame(path('1', 'A')));
    expect(vectorLoopTracks(changing)).toBeNull();
  });

  it('lets the least recently used loops go past its budget, never the one being drawn', () => {
    const old = vectorLoop('old-recipe', 1 / 30);
    vectorLoopFrame(old, 0, () => frame(path('0', 'x'.repeat(VECTOR_LOOP_CACHE_CHARACTERS / 2))));
    const big = vectorLoop('big-recipe', 1 / 30);
    vectorLoopFrame(big, 0, () => frame(path('0', 'y'.repeat(VECTOR_LOOP_CACHE_CHARACTERS))));
    expect(vectorLoop('big-recipe', 1 / 30)).toBe(big);
    expect(vectorLoop('old-recipe', 1 / 30)).not.toBe(old);
  });
});
