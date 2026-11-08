import { loadVectorGeometry } from '../vector-compose';
import { resolveAvatarCharacter } from '../character';
import type { VectorAssetLoader, VectorData, VectorPart, VectorTrack } from '../vector-types';
const track: VectorTrack = {
  translation: { value: [0, 0, 0] },
  rotation: { value: [0, 0, 0, 1] },
  scale: { value: [1, 1, 1] },
};
const part = (id: number, role: string, x: number, z = 0): VectorPart => ({
  id,
  label: role,
  role,
  color: '#777777',
  points: [
    [x - 0.1, 0, z],
    [x + 0.1, 0, z],
    [x, 0.2, z],
  ],
  faces: [[0, 1, 2]],
  edges: [],
});
const body: VectorPart = {
  ...part(0, 'body', 0),
  points: [
    [-1, -1, 0],
    [1, -1, 0],
    [0, 1, 0],
  ],
};
const original: VectorData = {
  parts: [body, part(1, 'eye', -0.3, 0.1), part(2, 'eye', 0.3, 0.1)],
  clips: Object.fromEntries(
    ['idle', 'reaction', 'work'].map((action) => [
      action,
      { duration: 1, fps: 2, parts: [track, track, track] },
    ]),
  ) as VectorData['clips'],
};
const character = resolveAvatarCharacter({
  shape: 'circle',
  eyes: 'oval',
  eyewear: 'none',
  accessory: 'none',
  color: 'blue',
});
const loader = (base: VectorData): VectorAssetLoader => ({
  template: async () => undefined,
  shape: async () => base,
  eyes: async () => original,
  eyewear: async () => original,
  accessory: async () => original,
});
it('invalidates rest bounds when the immutable track changes while sharing source parts', async () => {
  await loadVectorGeometry(character, loader(original));
  const changed = {
    ...original,
    clips: Object.fromEntries(
      Object.entries(original.clips).map(([action, clip]) => [
        action,
        {
          ...clip,
          parts: clip.parts.map((t, i) =>
            i === 0 ? { ...t!, scale: { value: [1.4, 1.2, 1] } } : t,
          ),
        },
      ]),
    ) as VectorData['clips'],
  };
  const shared = await loadVectorGeometry(character, loader(changed));
  const uncached = await loadVectorGeometry(character, loader(structuredClone(changed)));
  expect(shared).toEqual(uncached);
});
it('recomputes bounds membership when a composed asset appends another body part', async () => {
  await loadVectorGeometry(character, loader(original));
  const changed = {
    ...original,
    parts: [...original.parts, part(3, 'body', 1.4)],
    clips: Object.fromEntries(
      Object.entries(original.clips).map(([action, clip]) => [
        action,
        { ...clip, parts: [...clip.parts, track] },
      ]),
    ) as VectorData['clips'],
  };
  expect(await loadVectorGeometry(character, loader(changed))).toEqual(
    await loadVectorGeometry(character, loader(structuredClone(changed))),
  );
});
