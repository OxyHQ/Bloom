import { composeVectorCharacter } from '../vector-compose';
import { resolveAvatarCharacter } from '../character';
import { AVATAR_EYES } from '../catalog-ids';
import type { VectorAssetLoader, VectorData, VectorPart } from '../vector-types';
const track = {
  translation: { value: [0, 0, 0] },
  rotation: { value: [0, 0, 0, 1] },
  scale: { value: [1, 1, 1] },
};
function source(): VectorData {
  const make = (id: number, role: string, points: number[][]): VectorPart => ({
    id,
    label: role,
    role,
    points,
    faces: [[0, 1, 2]],
    edges: [],
    color: '#111111',
  });
  const parts = [
    make(0, 'body', [
      [-1, -1, 0],
      [1, -1, 0],
      [0, 1, 0],
    ]),
    make(1, 'eye', [
      [-0.4, 0, 0.1],
      [-0.2, 0, 0.1],
      [-0.3, 0.2, 0.1],
    ]),
    make(2, 'eye', [
      [0.2, 0, 0.1],
      [0.4, 0, 0.1],
      [0.3, 0.2, 0.1],
    ]),
  ];
  const clip = { duration: 1, fps: 2, parts: parts.map(() => track) };
  return { parts, clips: { idle: clip, reaction: clip, work: clip } };
}
function loader(base: VectorData, template = false): VectorAssetLoader {
  return {
    template: async () => (template ? base : undefined),
    shape: async () => base,
    eyes: async () => base,
    eyewear: async () => base,
    accessory: async () => base,
  };
}
const size = (p: VectorPart, axis: number) =>
  Math.max(...p.points.map((p) => p[axis]!)) - Math.min(...p.points.map((p) => p[axis]!));
it('uses the same Clippo sizing for the preset and its canonical manual recipe', async () => {
  const data = source(),
    preset = resolveAvatarCharacter({ preset: 'clippo' }),
    manual = resolveAvatarCharacter({
      shape: 'clippo',
      eyes: 'clippo',
      eyewear: 'none',
      accessory: 'none',
      bodyColor: '#999b9d',
    });
  const a = await composeVectorCharacter(preset, loader(data, true)),
    b = await composeVectorCharacter(manual, loader(data, true));
  expect(a.parts.map((p) => p.points)).toEqual(b.parts.map((p) => p.points));
  expect(a.parts[0]!.points).toEqual(data.parts[0]!.points);
  expect(a.clips).toBe(data.clips);
  expect(size(a.parts[1]!, 0)).toBeCloseTo(size(data.parts[1]!, 0) * 1.2, 10);
});
it.each(AVATAR_EYES)(
  'enlarges the whole %s donor style only on the clip-shaped body',
  async (eyes) => {
    const data = source();
    const recipe = {
      eyes,
      eyewear: 'none' as const,
      accessory: 'none' as const,
      color: 'blue' as const,
    };
    const a = await composeVectorCharacter(
      resolveAvatarCharacter({ ...recipe, shape: 'circle' }),
      loader(data),
    );
    const b = await composeVectorCharacter(
      resolveAvatarCharacter({ ...recipe, shape: 'clippo' }),
      loader(data),
    );
    const left = a.parts.filter((p) => p.role === 'eye'),
      right = b.parts.filter((p) => p.role === 'eye');
    expect(right).toHaveLength(left.length);
    left.forEach((part, i) => {
      for (const axis of [0, 1])
        expect(size(right[i]!, axis)).toBeCloseTo(size(part, axis) * 1.2, 9);
    });
    expect(b.parts[0]!.points).toEqual(a.parts[0]!.points);
    expect(data.parts[1]!.points[0]).toEqual([-0.4, 0, 0.1]);
  },
);
