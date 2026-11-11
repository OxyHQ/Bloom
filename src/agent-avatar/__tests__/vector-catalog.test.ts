import shapeCircle from '../catalog/shape-circle';
import { createVectorAssetLoader } from '../catalog';
import { defaultVectorAssetLoader } from '../default-catalog';
import { vectorAssetLoader } from '../vector-assets';

it('an app ships only the assets it lists: a listed shape loads whole, anything else is unknown', async () => {
  const catalog = createVectorAssetLoader({ shape: { circle: shapeCircle } });
  const circle = await catalog.shape('circle');
  expect(circle.parts.length).toBeGreaterThan(0);
  for (const part of circle.parts) expect(part.points.length).toBeGreaterThan(0);
  for (const clip of Object.values(circle.clips))
    expect(clip.parts).toHaveLength(circle.parts.length);
  await expect(catalog.shape('heart')).rejects.toThrow('Unknown vector avatar asset');
  await expect(catalog.eyes('oval')).rejects.toThrow('Unknown vector avatar asset');
  await expect(catalog.template({ shape: 'circle' } as never)).resolves.toBeUndefined();
});

it('the default catalog resolves through the lazily linked full one', async () => {
  expect(await defaultVectorAssetLoader.shape('circle')).toEqual(
    await vectorAssetLoader.shape('circle'),
  );
});
