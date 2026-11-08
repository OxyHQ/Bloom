import { resolveAvatarCharacter } from '../character';
import { composeVectorCharacter } from '../vector-compose';
import { vectorAssetLoader } from '../vector-assets';
import { renderVectorFrame } from '../vector-frame';
import type { VectorDrawPath } from '../vector-types';
const box = (paths: VectorDrawPath[]) => {
  const points = paths.flatMap((p) => (p.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number));
  const x = points.filter((_, i) => i % 2 === 0),
    y = points.filter((_, i) => i % 2 === 1);
  return {
    x: (Math.min(...x) + Math.max(...x)) / 2,
    y: (Math.min(...y) + Math.max(...y)) / 2,
    height: Math.max(...y) - Math.min(...y),
    width: Math.max(...x) - Math.min(...x),
  };
};
it.each(['star', 'cloud', 'bot_star', 'bot_cloud'] as const)(
  'seats the complete bow on %s and centers its face above the midpoint',
  async (shape) => {
    const source = await vectorAssetLoader.shape(shape);
    const original = JSON.stringify(
      source.parts.filter((p) => p.role === 'eye').map((p) => p.points),
    );
    for (const eyes of (shape.startsWith('bot_') ? ['oval', 'bot'] : ['oval']) as (
      | 'oval'
      | 'bot'
    )[]) {
      const data = await composeVectorCharacter(
        resolveAvatarCharacter({ shape, eyes, eyewear: 'none', accessory: 'bow', color: 'blue' }),
        vectorAssetLoader,
      );
      const frame = renderVectorFrame(data, {
        action: 'idle',
        time: 0,
        yaw: 0,
        pitch: 0,
        look: { yaw: 0, pitch: 0, mix: 1 },
      });
      const bow = frame.paths.filter((p) => p.role === 'accessory');
      expect(bow.length).toBeGreaterThan(0);
      expect(bow.every((p) => p.d.length > 0 && p.clip === undefined)).toBe(true);
      const body = box(frame.paths.filter((p) => p.role === 'body')),
        face = box(frame.paths.filter((p) => p.role === 'eye'));
      expect(Math.abs(face.x - body.x)).toBeLessThan(body.width * 0.035);
      expect(face.y).toBeLessThan(body.y - body.height * 0.03);
      expect(face.y).toBeGreaterThan(body.y - body.height * 0.13);
      for (const yaw of [-0.6, 0, 0.6])
        for (const action of ['idle', 'reaction', 'work'] as const) {
          const posed = renderVectorFrame(data, {
            action,
            time: action === 'work' ? 1.5 : 0.4,
            yaw,
            pitch: 0.35,
            look: { yaw, pitch: 0.35, mix: 1 },
          });
          expect(
            posed.paths.filter((p) => p.role === 'accessory').some((p) => p.d.length > 0),
          ).toBe(true);
          expect(JSON.stringify(posed)).not.toMatch(/NaN|Infinity/);
        }
    }
    expect(JSON.stringify(source.parts.filter((p) => p.role === 'eye').map((p) => p.points))).toBe(
      original,
    );
  },
);
