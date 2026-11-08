import { composeVectorCharacter } from '../vector-compose';
import { resolveAvatarCharacter } from '../character';
import { prepareReferenceHeadProjection } from '../vector-face';
import type { VectorAssetLoader, VectorData, VectorPart } from '../vector-types';
const track = {
  translation: { value: [0, 0, 0] },
  rotation: { value: [0, 0, 0, 1] },
  scale: { value: [1, 1, 1] },
};
function source(depth: number): VectorData {
  const part = (id: number, role: string, points: number[][]): VectorPart => ({
    id,
    label: role,
    role,
    points,
    faces: [[0, 1, 2]],
    edges: [],
    color: '#333333',
  });
  const parts = [
    part(0, 'body', [
      [-2, -2, 0],
      [2, -2, 0],
      [0, 2, 0],
    ]),
    part(1, 'eye', [
      [-0.2, 0, depth],
      [0.2, 0, depth],
      [0, 0.2, depth + 0.1],
    ]),
    part(2, 'eye', [
      [-0.1, 0, depth + 0.15],
      [0.1, 0, depth + 0.15],
      [0, 0.1, depth + 0.2],
    ]),
  ];
  const clip = { duration: 1, fps: 2, parts: parts.map(() => track) };
  return { parts, clips: { idle: clip, reaction: clip, work: clip } };
}
const character = resolveAvatarCharacter({ preset: 'blue_beret' });
function loader(data: VectorData): VectorAssetLoader {
  return {
    template: async () => data,
    shape: async () => data,
    eyes: async () => data,
    eyewear: async () => data,
    accessory: async () => data,
  };
}
it('seats and compresses a complete detached eye assembly without losing layer order or clips', async () => {
  const input = source(0.2),
    copy = JSON.stringify(input),
    result = await composeVectorCharacter(character, loader(input));
  expect(JSON.stringify(input)).toBe(copy);
  expect(result.clips).toBe(input.clips);
  for (let i = 1; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      expect(result.parts[i]!.points[j]!.slice(0, 2)).toEqual(
        input.parts[i]!.points[j]!.slice(0, 2),
      );
      expect(result.parts[i]!.points[j]![2]).toBeGreaterThanOrEqual(0.012 - 1e-10);
    }
  expect(result.parts[2]!.points[0]![2]).toBeGreaterThan(result.parts[1]!.points[0]![2]!);
  expect(result.parts[2]!.points[0]![2]).toBeLessThan(input.parts[2]!.points[0]![2]!);
});
it('leaves already shallow/embedded eye geometry unchanged', async () => {
  const input = source(-0.1),
    result = await composeVectorCharacter(character, loader(input));
  expect(result.parts.map((p) => p.points)).toEqual(input.parts.map((p) => p.points));
});
it('keeps the actual headwear contact pivot fixed for both yaw and pitch directions', () => {
  const face = {
      center: [0, 0] as [number, number],
      radius: 1,
      gazeScale: 0.4,
    },
    pivot = [0, 1, 0.4];
  for (const yaw of [-0.6, 0, 0.6])
    for (const pitch of [-0.45, 0, 0.45]) {
      const project = prepareReferenceHeadProjection(face, { yaw, pitch, mix: 1 }, pivot);
      expect(project(pivot)).toEqual(pivot);
      const above = project([0, 1.5, 0.4]);
      expect(Math.hypot(...above.map((v, i) => v - pivot[i]!))).toBeCloseTo(0.5, 12);
    }
});

it.each(['bot_star', 'bot_sparkle', 'bot_clover', 'bot_teardrop'] as const)(
  '%s seats its beret on a visible front contact that survives head turns',
  async (shape) => {
    const { vectorAssetLoader } = await import('../vector-assets');
    const data = await composeVectorCharacter(
      resolveAvatarCharacter({
        shape,
        eyes: 'bot',
        accessory: 'beret',
        eyewear: 'none',
        color: 'blue',
      }),
      vectorAssetLoader,
    );
    const body = data.parts.find((part) => part.role === 'body')!;
    const hats = data.parts.filter((part) => part.role === 'accessory');
    const pivot = hats[0]!.headPivot!;
    expect(pivot[2]).toBeGreaterThanOrEqual(0.012);
    expect(hats.every((part) => JSON.stringify(part.headPivot) === JSON.stringify(pivot))).toBe(
      true,
    );
    expect(hats.some((part) => part.points.some((p) => p.every((v, i) => v === pivot[i])))).toBe(
      true,
    );
    let top = -Infinity;
    for (const face of body.faces)
      for (let i = 0; i < 3; i++) {
        const a = body.points[face[i]!]!,
          b = body.points[face[(i + 1) % 3]!]!;
        const dx = b[0]! - a[0]!;
        if (Math.abs(dx) < 1e-9) continue;
        const t = (pivot[0]! - a[0]!) / dx;
        if (t >= 0 && t <= 1) top = Math.max(top, a[1]! + t * (b[1]! - a[1]!));
      }
    expect(top - pivot[1]!).toBeGreaterThan(0);
    expect(top - pivot[1]!).toBeLessThan(0.02);
    for (const yaw of [-0.6, 0, 0.6])
      for (const pitch of [-0.45, 0, 0.45]) {
        const projected = prepareReferenceHeadProjection(
          data.referenceFace!,
          { yaw, pitch, mix: 1 },
          pivot,
        )(pivot);
        expect(projected).toEqual(pivot);
      }
  },
);
