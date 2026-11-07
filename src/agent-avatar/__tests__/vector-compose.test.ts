import { composeVectorCharacter } from '../vector-compose';
import { resolveAvatarCharacter } from '../character';
import type { VectorAssetLoader, VectorData, VectorPart, VectorTrack } from '../vector-types';
const track: VectorTrack = {
  translation: { value: [0, 0, 0] },
  rotation: { value: [0, 0, 0, 1] },
  scale: { value: [1, 1, 1] },
};
const part = (id: number, role: string, points: number[][]): VectorPart => ({
  id,
  label: role,
  role,
  points,
  faces: [[0, 1, 2]],
  edges: [],
  color: '#101010',
});
const asset = (): VectorData => {
  const parts = [
    part(0, 'body', [
      [-1, -1, 1],
      [1, -1, 1],
      [0, 1, 1],
    ]),
    part(1, 'eye', [
      [-0.3, 0, 1.01],
      [-0.1, 0, 1.01],
      [-0.2, 0.2, 1.01],
    ]),
    part(2, 'eye', [
      [0.1, 0, 1.01],
      [0.3, 0, 1.01],
      [0.2, 0.2, 1.01],
    ]),
  ];
  const clip = { duration: 1, fps: 2, parts: parts.map(() => track) };
  return { parts, clips: { idle: clip, reaction: clip, work: clip } };
};
const loaders = (base = asset()): VectorAssetLoader => ({
  shape: jest.fn(async () => base),
  eyes: jest.fn(async () => asset()),
  eyewear: jest.fn(async () => asset()),
  accessory: jest.fn(async () => asset()),
  template: jest.fn(async () => undefined),
});
const character = () =>
  resolveAvatarCharacter({
    shape: 'circle',
    eyes: 'oval',
    eyewear: 'none',
    accessory: 'none',
    bodyColor: '#ff00aa',
  });
it('preserves approved template geometry and clips while painting without mutating cache', async () => {
  const source = asset(),
    loader = loaders();
  loader.template = jest.fn(async () => source);
  const before = JSON.stringify(source);
  const result = await composeVectorCharacter(character(), loader);
  expect(result.parts[0]!.color).toBe('#ff00aa');
  expect(result.parts[0]!.points).toBe(source.parts[0]!.points);
  expect(result.clips).toBe(source.clips);
  expect(JSON.stringify(source)).toBe(before);
  expect(loader.shape).not.toHaveBeenCalled();
});
it('removes eyes without loading donors and preserves every body animation track', async () => {
  const source = asset(),
    loader = loaders(source);
  const result = await composeVectorCharacter({ ...character(), eyes: 'none' }, loader);
  expect(result.parts.map((p) => p.role)).toEqual(['body']);
  expect(result.clips.work.parts[0]).toBe(source.clips.work.parts[0]);
  expect(loader.eyes).not.toHaveBeenCalled();
});
it('fits the complete eye group in front of the body and aligns clip indices', async () => {
  const loader = loaders();
  const result = await composeVectorCharacter(character(), loader);
  for (const p of result.parts.filter((p) => p.role === 'eye'))
    for (const point of p.points) expect(point[2]).toBeGreaterThan(1);
  for (const clip of Object.values(result.clips)) {
    expect(clip.parts).toHaveLength(result.parts.length);
    for (const t of clip.parts) expect(t).not.toBeNull();
  }
  expect(loader.eyewear).not.toHaveBeenCalled();
});
it('retains reference projection metadata and fits eyes within the gaze sphere', async () => {
  const base = asset();
  base.referenceFace = { center: [0, 0], radius: 0.7, gazeScale: 0.65 };
  const result = await composeVectorCharacter(character(), loaders(base));
  expect(result.referenceFace).toBe(base.referenceFace);
  for (const p of result.parts.filter((p) => p.role === 'eye')) {
    expect(p.face).toBe(true);
    for (const [x = 0, y = 0, z = 0] of p.points) {
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(0.7 * 0.85 + 0.00001);
      expect(z).toBeGreaterThan(0);
    }
  }
});
it('loads all requested categories independently and never mutates shared donors', async () => {
  const loader = loaders();
  const donor = asset();
  donor.parts[1]!.role = 'eyewear';
  donor.parts[2]!.role = 'accessory';
  loader.eyewear = jest.fn(async () => donor);
  loader.accessory = jest.fn(async () => donor);
  const before = JSON.stringify(donor);
  const result = await composeVectorCharacter(
    { ...character(), eyewear: 'monocle', accessory: 'bow' },
    loader,
  );
  expect(result.parts.map((p) => p.role)).toEqual(['body', 'eye', 'eye', 'eyewear', 'accessory']);
  expect(JSON.stringify(donor)).toBe(before);
});

it('keeps eyelid parameters and donor-relative movement instead of freezing custom eyes', async () => {
  const base = asset();
  const donor = asset();
  donor.clips = Object.fromEntries(
    Object.entries(donor.clips).map(([action, clip]) => [
      action,
      {
        ...clip,
        parts: clip.parts.map((value, index) =>
          index === 0
            ? value
            : {
                ...track,
                translation: { samples: [0, 0, 0, 0, 0.1, 0, 0, 0, 0] },
                parameters: { samples: [0, 0, 0, 0, 0, 0, 0.5, 0.25, 0, 0, 0, 0] },
              },
        ),
      },
    ]),
  ) as VectorData['clips'];
  const loader = loaders(base);
  loader.eyes = jest.fn(async () => donor);
  const before = JSON.stringify(donor);
  const result = await composeVectorCharacter(character(), loader);
  const eye = result.clips.reaction.parts[1]!;
  expect(eye.parameters?.samples).toEqual([0, 0, 0, 0, 0, 0, 0.5, 0.25, 0, 0, 0, 0]);
  expect(eye.matrix?.samples?.slice(16, 32)).not.toEqual(eye.matrix?.samples?.slice(0, 16));
  expect(JSON.stringify(donor)).toBe(before);
});

it('preserves a flat shape’s original eye contours and carriers when adding headwear', async () => {
  const base = asset();
  base.referenceFace = { center: [0, 0], radius: 1, gazeScale: 0.4 };
  const accessory = asset();
  accessory.parts.push(
    part(3, 'accessory', [
      [-0.1, 1, 0.1],
      [0.1, 1, 0.1],
      [0, 1.2, 0.1],
    ]),
  );
  accessory.clips = Object.fromEntries(
    Object.entries(accessory.clips).map(([action, clip]) => [
      action,
      { ...clip, parts: [...clip.parts, track] },
    ]),
  ) as VectorData['clips'];
  const loader = loaders(base);
  loader.accessory = jest.fn(async () => accessory);
  const result = await composeVectorCharacter(
    { ...character(), shape: 'bot_blob', eyes: 'bot', accessory: 'crown' },
    loader,
  );
  expect(loader.eyes).not.toHaveBeenCalled();
  for (const index of [1, 2]) {
    expect(result.parts[index]).toBe(base.parts[index]);
    for (const action of ['idle', 'reaction', 'work'] as const)
      expect(result.clips[action].parts[index]).toBe(base.clips[action].parts[index]);
  }
});

it('changes native eye spacing as translation without resizing either eye or mutating the asset', async () => {
  const base = asset();
  base.referenceFace = { center: [0, 0], radius: 1, gazeScale: 0.4 };
  const snapshot = JSON.stringify(base);
  const result = await composeVectorCharacter(
    { ...character(), shape: 'bot_blob', eyes: 'bot', eyeSpacing: 1.2 },
    loaders(base),
  );
  for (const index of [1, 2]) {
    const before = base.parts[index]!.points,
      after = result.parts[index]!.points;
    expect(after[1]![0]! - after[0]![0]!).toBeCloseTo(before[1]![0]! - before[0]![0]!);
    expect(after[1]![1]! - after[0]![1]!).toBeCloseTo(before[1]![1]! - before[0]![1]!);
    expect(after[0]![0]).not.toBe(before[0]![0]);
  }
  expect(JSON.stringify(base)).toBe(snapshot);
});
