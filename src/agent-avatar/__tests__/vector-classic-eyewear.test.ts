import { resolveAvatarCharacter } from '../character';
import { composeVectorCharacter } from '../vector-compose';
import { vectorAssetLoader } from '../vector-assets';
import type { AvatarShapeId } from '../catalog-ids';

it.each<AvatarShapeId>(['bot_blob', 'bot_cloud', 'bot_wedge', 'bot_star', 'circle'])(
  'keeps classic lens halves on their own side of the bridge on %s',
  async (shape) => {
    const source = await vectorAssetLoader.eyewear('classic_sunglasses');
    const donor = source.parts.find((part) => part.role === 'eyewear')!;
    const result = await composeVectorCharacter(
      resolveAvatarCharacter({
        shape,
        eyes: shape.startsWith('bot_') ? 'bot' : 'oval',
        eyewear: 'classic_sunglasses',
        accessory: 'none',
        color: 'blue',
      }),
      vectorAssetLoader,
    );
    const glasses = result.parts.find((part) => part.role === 'eyewear')!;
    const eyes = result.parts.filter((part) => part.role === 'eye');
    const centers = eyes.map((part) => {
      const x = part.points.map((p) => p[0]!);
      return (Math.min(...x) + Math.max(...x)) / 2;
    });
    const middle = (Math.min(...centers) + Math.max(...centers)) / 2;
    let checked = 0;
    donor.points.forEach((point, index) => {
      // Exclude the shared bridge itself; the lens rims must not cross one another.
      if (Math.abs(point[0]!) < 0.06) return;
      expect((glasses.points[index]![0]! - middle) * Math.sign(point[0]!)).toBeGreaterThanOrEqual(
        -0.005,
      );
      checked++;
    });
    expect(checked).toBeGreaterThan(100);
  },
);
