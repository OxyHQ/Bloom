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
it('retains reference projection metadata without resizing an already fitted eye pair', async () => {
  const base = asset();
  base.referenceFace = { center: [0, 0], radius: 0.7, gazeScale: 0.65 };
  const result = await composeVectorCharacter(character(), loaders(base));
  expect(result.referenceFace).toBe(base.referenceFace);
  const eyes = result.parts.filter((p) => p.role === 'eye');
  for (const [index, p] of eyes.entries()) {
    expect(p.face).toBe(true);
    const original = base.parts[index + 1]!;
    for (const [i, q] of p.points.entries()) {
      expect(q[0]).toBeCloseTo(original.points[i]![0]!);
      expect(q[1]).toBeCloseTo(original.points[i]![1]!);
      expect(q[2]).toBeGreaterThan(0);
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

it('places custom eye pieces on their native tangent plane without bending the contour', async () => {
  const base = asset();
  base.referenceFace = {
    center: [0, 0],
    radius: 1,
    gazeScale: 0.4,
    eyePlanes: [
      { center: [-0.2, 0.1, 0.8], normal: [-0.3, 0, 1] },
      { center: [0.2, 0.1, 0.8], normal: [0.3, 0, 1] },
    ],
  };
  const result = await composeVectorCharacter(character(), loaders(base));
  for (const p of result.parts.filter((p) => p.role === 'eye')) {
    const cx = p.points.reduce((n, q) => n + q[0]!, 0) / p.points.length;
    const offsets = p.points.map(
      (q) => q[2]! - (0.8 - (q[0]! - (cx < 0 ? -0.2 : 0.2)) * (cx < 0 ? -0.3 : 0.3)),
    );
    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThanOrEqual(0.004001);
  }
});

it('does not rotate an intrinsically horizontal eye style toward the target oval axis', async () => {
  const donor = asset();
  for (const [index, cx] of [
    [1, -0.2],
    [2, 0.2],
  ]) {
    donor.parts[index!]!.points = [
      [cx! - 0.15, 0, 1.01],
      [cx! + 0.15, 0, 1.01],
      [cx! + 0.15, 0.04, 1.01],
      [cx! - 0.15, 0.04, 1.01],
    ];
    donor.parts[index!]!.faces = [
      [0, 1, 2],
      [0, 2, 3],
    ];
  }
  const loader = loaders();
  loader.eyes = jest.fn(async () => donor);
  const result = await composeVectorCharacter({ ...character(), eyes: 'sleepy_lids' }, loader);
  for (const eye of result.parts.filter((p) => p.role === 'eye')) {
    const width =
      Math.max(...eye.points.map((p) => p[0]!)) - Math.min(...eye.points.map((p) => p[0]!));
    const height =
      Math.max(...eye.points.map((p) => p[1]!)) - Math.min(...eye.points.map((p) => p[1]!));
    expect(width / height).toBeGreaterThan(6);
  }
});

it('fits a custom pair as one group instead of squeezing it into native capsule centers', async () => {
  const base = asset();
  base.referenceFace = { center: [0, 0], radius: 0.7, gazeScale: 0.4 };
  base.parts[1]!.points = [
    [-0.08, 0, 1],
    [-0.04, 0, 1],
    [-0.06, 0.2, 1],
  ];
  base.parts[2]!.points = [
    [0.04, 0, 1],
    [0.08, 0, 1],
    [0.06, 0.2, 1],
  ];
  const donor = asset(),
    loader = loaders(base);
  loader.eyes = jest.fn(async () => donor);
  const result = await composeVectorCharacter(
    { ...character(), shape: 'bot_blob', eyes: 'dots' },
    loader,
  );
  const eyes = result.parts.filter((p) => p.role === 'eye');
  const center = (p: VectorPart) =>
    (Math.min(...p.points.map((q) => q[0]!)) + Math.max(...p.points.map((q) => q[0]!))) / 2;
  const width = (p: VectorPart) =>
    Math.max(...p.points.map((q) => q[0]!)) - Math.min(...p.points.map((q) => q[0]!));
  expect((center(eyes[1]!) - center(eyes[0]!)) / width(eyes[0]!)).toBeCloseTo(
    (center(donor.parts[2]!) - center(donor.parts[1]!)) / width(donor.parts[1]!),
  );
});
