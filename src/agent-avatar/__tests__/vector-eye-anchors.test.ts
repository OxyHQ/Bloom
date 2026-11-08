import { resolveAvatarCharacter } from '../character';
import { composeVectorCharacter } from '../vector-compose';
import { vectorAssetLoader } from '../vector-assets';
import { renderVectorFrame } from '../vector-frame';
import { CHARACTER_OPTIONS, CHARACTER_TEMPLATES } from '../../agent-creator/constants';
import type { VectorFrame } from '../vector-types';
function anchors(frame: VectorFrame) {
  const boxes = frame.paths
    .filter((p) => p.role === 'eye' && p.d.length > 0)
    .map((p) => {
      const values = (p.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      const xs = values.filter((_, i) => i % 2 === 0),
        ys = values.filter((_, i) => i % 2 === 1);
      return {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        area: (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)),
      };
    });
  const middle = (Math.min(...boxes.map((b) => b.x)) + Math.max(...boxes.map((b) => b.x))) / 2;
  return [boxes.filter((b) => b.x < middle), boxes.filter((b) => b.x >= middle)].map(
    (side) => side.sort((a, b) => b.area - a.area)[0]!.x,
  );
}
it('fits every current eye style onto the selected Todd shape anchors', async () => {
  const base = await vectorAssetLoader.shape('rounded_head_two_ears');
  const expected = anchors(renderVectorFrame(base, { action: 'idle', time: 0 }));
  for (const [eyes] of CHARACTER_OPTIONS.eyes) {
    const data = await composeVectorCharacter(
      resolveAvatarCharacter({
        shape: 'rounded_head_two_ears',
        eyes,
        eyewear: 'none',
        accessory: 'none',
        color: 'lime',
      }),
      vectorAssetLoader,
    );
    const actual = anchors(renderVectorFrame(data, { action: 'idle', time: 0 }));
    expect(Math.abs(actual[0]! - expected[0]!)).toBeLessThan(1);
    expect(Math.abs(actual[1]! - expected[1]!)).toBeLessThan(1);
    for (const action of ['reaction', 'work'] as const) {
      const frame = renderVectorFrame(data, { action, time: 0.7, yaw: 0.25, pitch: 0.1 });
      expect(frame.paths.filter((p) => p.role === 'eye').length).toBeGreaterThan(0);
      expect(JSON.stringify(frame)).not.toMatch(/NaN|Infinity/);
    }
  }
});
it('applies spacing once to the shape pair, without changing expression geometry size', async () => {
  for (const eyes of ['oval', 'sleepy_lids', 'clippo'] as const) {
    const distances = [];
    for (const eyeSpacing of [0.7, 1, 1.3]) {
      const data = await composeVectorCharacter(
        resolveAvatarCharacter({
          shape: 'rounded_head_two_ears',
          eyes,
          eyeSpacing,
          eyewear: 'none',
          accessory: 'none',
          color: 'lime',
        }),
        vectorAssetLoader,
      );
      const pair = anchors(renderVectorFrame(data, { action: 'idle', time: 0 }));
      distances.push(pair[1]! - pair[0]!);
    }
    expect(distances[0]! / distances[1]!).toBeCloseTo(0.7, 2);
    expect(distances[2]! / distances[1]!).toBeCloseTo(1.3, 2);
  }
});
it('treats a preset and its explicit resolved recipe as the same complete character', async () => {
  const recipe = resolveAvatarCharacter(CHARACTER_TEMPLATES.lime_frog!);
  const explicit = resolveAvatarCharacter({
    shape: recipe.shape,
    eyes: recipe.eyes,
    eyewear: recipe.eyewear,
    accessory: recipe.accessory,
    ...recipe.paint,
  });
  const a = await composeVectorCharacter(recipe, vectorAssetLoader),
    b = await composeVectorCharacter(explicit, vectorAssetLoader);
  for (const action of ['idle', 'reaction', 'work'] as const)
    expect(renderVectorFrame(a, { action, time: 0.7 })).toEqual(
      renderVectorFrame(b, { action, time: 0.7 }),
    );
});
