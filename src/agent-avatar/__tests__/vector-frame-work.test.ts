import { renderVectorFrame } from '../vector-frame';
import type { VectorData, VectorPart, VectorTrack } from '../vector-types';
const track: VectorTrack = {
  translation: { value: [0, 0, 0] },
  rotation: { value: [0, 0, 0, 1] },
  scale: { value: [1, 1, 1] },
};
function fixture(role = 'eye', stroke?: string) {
  let reads = 0;
  const points = [
      [-0.2, 0, 1],
      [0.2, 0, 1],
      [0, 0.4, 1],
    ],
    faces = [[0, 1, 2]];
  const parts: VectorPart[] = [
    {
      id: 0,
      label: 'body',
      role: 'body',
      points: [
        [-1, -1, 0],
        [1, -1, 0],
        [0, 1, 0],
      ],
      faces,
      edges: [],
    },
    {
      id: 1,
      label: role,
      role,
      opacity: 0,
      stroke,
      get points() {
        reads++;
        return points;
      },
      faces,
      edges: [],
    },
  ];
  const clip = { duration: 1, fps: 30, parts: [track, track] };
  return {
    data: { parts, clips: { idle: clip, reaction: clip, work: clip } } as VectorData,
    reads: () => reads,
  };
}
it('does no mesh work for fully unpainted parts and retains identical visible depth', () => {
  const source = fixture();
  const frame = renderVectorFrame(source.data, { action: 'idle', time: 0.2 });
  expect(source.reads()).toBe(0);
  expect(frame.paths).toHaveLength(1);
  const without = { ...source.data, parts: source.data.parts.slice(0, 1) };
  expect(renderVectorFrame(without, { action: 'idle', time: 0.2 })).toEqual(frame);
});
it('retains zero-fill strokes and the panel implicit outline', () => {
  for (const source of [fixture('eye', '#ffffff'), fixture('panel')]) {
    const frame = renderVectorFrame(source.data, { action: 'idle', time: 0.2 });
    expect(source.reads()).toBeGreaterThan(0);
    expect(frame.paths.find((p) => p.id === '1')?.stroke).toBeDefined();
  }
});
it('preserves eyes-only bounds even for invisible eye paint', () => {
  const source = fixture();
  const frame = renderVectorFrame(source.data, { action: 'idle', time: 0.2, eyesOnly: true });
  expect(source.reads()).toBeGreaterThan(0);
  expect(frame.viewBox).not.toBe('0 0 320 320');
  expect(frame.paths[0]?.fillOpacity).toBe(0);
});
it('does not sample ignored TRS channels when a matrix defines the pose', () => {
  const source = fixture();
  const poison = {
    get samples(): number[] {
      throw new Error('unused channel sampled');
    },
  };
  source.data.clips.idle.parts[0] = {
    translation: poison,
    rotation: poison,
    scale: poison,
    matrix: { value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
  };
  expect(() => renderVectorFrame(source.data, { action: 'idle', time: 0.2 })).not.toThrow();
});
