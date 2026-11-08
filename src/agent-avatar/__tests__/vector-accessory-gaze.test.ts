import { resolveAvatarCharacter } from '../character';
import { vectorAssetLoader } from '../vector-assets';
import { composeVectorCharacter } from '../vector-compose';
import { renderVectorFrame } from '../vector-frame';
import { projectReferenceHeadPoint } from '../vector-face';
import type { VectorData } from '../vector-types';
const face: NonNullable<VectorData['referenceFace']> = {
  center: [0, 0.12],
  radius: 1,
  gazeScale: 1,
};

describe('head accessory gaze', () => {
  it('turns the whole attachment rigidly without an eye-plane offset', () => {
    const points = [
      [-1, 0.12, 0.1],
      [1, 0.12, 0.1],
      [0, 1.2, 0],
    ];
    for (const yaw of [-0.6, 0, 0.6])
      for (const pitch of [-0.45, 0, 0.45]) {
        const moved = points.map((p) => projectReferenceHeadPoint(face, p, { yaw, pitch, mix: 1 }));
        const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]!));
        expect(distance(moved[0]!, moved[1]!)).toBeCloseTo(distance(points[0]!, points[1]!), 10);
        expect(distance(moved[1]!, moved[2]!)).toBeCloseTo(distance(points[1]!, points[2]!), 10);
        if (yaw !== 0) expect(moved[0]![2]).not.toBe(points[0]![2]);
        if (pitch !== 0) expect(moved[2]![2]).not.toBe(points[2]![2]);
      }
  });
  it('preserves neutral alignment and smoothly blends external gaze influence', () => {
    const p = [0.5, 1, 0.2];
    expect(projectReferenceHeadPoint(face, p, { yaw: 0, pitch: 0, mix: 1 })).toEqual(p);
    expect(projectReferenceHeadPoint(face, p, { yaw: 0.6, pitch: 0.4, mix: 0 })).toBe(p);
    const first = projectReferenceHeadPoint(face, p, { yaw: 0.6, pitch: 0.4, mix: 0.00001 });
    expect(Math.hypot(...p.map((v, i) => first[i]! - v))).toBeLessThan(0.0001);
  });
  it.each(['bot_blob', 'bot_wedge'] as const)(
    '%s assigns eyewear and headwear distinct carriers',
    async (shape) => {
      const data = await composeVectorCharacter(
        resolveAvatarCharacter({
          shape,
          eyes: 'bot',
          eyewear: 'round_sunglasses',
          accessory: 'headphones',
          color: 'blue',
        }),
        vectorAssetLoader,
      );
      expect(data.parts.filter((p) => p.role === 'accessory').length).toBeGreaterThan(0);
      for (const p of data.parts) {
        if (p.role === 'accessory') {
          expect(p.head).toBe(true);
          expect(p.face).toBe(false);
        }
        if (p.role === 'eyewear') {
          expect(p.face).toBe(true);
          expect(p.head).toBe(false);
        }
        if (p.role === 'body') expect(p.head).not.toBe(true);
      }
    },
  );
  it('renders headwear turning in every action while the circular body stays unchanged', async () => {
    const data = await composeVectorCharacter(
      resolveAvatarCharacter({
        shape: 'bot_blob',
        eyes: 'bot',
        eyewear: 'none',
        accessory: 'headphones',
        color: 'blue',
      }),
      vectorAssetLoader,
    );
    for (const action of ['idle', 'work', 'reaction'] as const) {
      const center = renderVectorFrame(data, {
        action,
        time: 0.7,
        look: { yaw: 0, pitch: 0, mix: 1 },
      });
      for (const [yaw, pitch] of [
        [-0.6, 0],
        [0.6, 0],
        [0, -0.45],
        [0, 0.45],
      ]) {
        const turned = renderVectorFrame(data, {
          action,
          time: 0.7,
          look: { yaw: yaw!, pitch: pitch!, mix: 1 },
        });
        expect(turned.paths.filter((p) => p.role === 'body').map((p) => p.d)).toEqual(
          center.paths.filter((p) => p.role === 'body').map((p) => p.d),
        );
        expect(turned.paths.filter((p) => p.role === 'accessory').map((p) => p.d)).not.toEqual(
          center.paths.filter((p) => p.role === 'accessory').map((p) => p.d),
        );
      }
    }
  });

  it('keeps legacy bodies on their existing global gaze carrier', async () => {
    const data = await composeVectorCharacter(
      resolveAvatarCharacter({
        shape: 'circle',
        eyes: 'oval',
        eyewear: 'none',
        accessory: 'headphones',
        color: 'blue',
      }),
      vectorAssetLoader,
    );
    expect(data.referenceFace).toBeUndefined();
    expect(data.parts.filter((p) => p.role === 'accessory').every((p) => !p.head)).toBe(true);
  });
});
