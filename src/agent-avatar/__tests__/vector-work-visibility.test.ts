import { renderVectorFrame } from '../vector-frame';
import { sampleVectorPose, blendVectorPose } from '../vector-pose';
import { vectorShapeImports, vectorTemplateImports } from '../vector-asset-imports';
import { SVG_SHAPES } from '../svg-catalog';
const assets = [
  ...SVG_SHAPES.map((id) => [id, vectorShapeImports[id]] as const),
  ...Object.entries(vectorTemplateImports),
] as const;
it.each(assets)(
  '%s keeps screen text and hands within panel visibility throughout exit',
  async (_, load) => {
    const asset = (await load()).default;
    let textSeen = false;
    for (let t = asset.clips.work.duration - 1; t <= asset.clips.work.duration; t += 0.07) {
      const drawing = renderVectorFrame(asset, { action: 'work', time: t });
      const panel = drawing.paths.find((p) => p.role === 'panel');
      for (const content of drawing.paths.filter((p) => p.role === 'screen' || p.role === 'hand')) {
        expect(panel).toBeDefined();
        expect(content.opacity).toBeLessThanOrEqual(panel!.opacity);
        expect(content.d.length).toBeGreaterThan(0);
        if (content.role === 'screen') textSeen = true;
      }
    }
    // Exercise interrupted exits from a fully visible work pose as well as authored exit tracks.
    const work = sampleVectorPose(asset, 'work', 1),
      idle = sampleVectorPose(asset, 'idle', 0);
    for (const amount of [0.1, 0.35, 0.7, 0.95, 1]) {
      const drawing = renderVectorFrame(asset, {
        action: 'idle',
        time: 0,
        pose: blendVectorPose(work, idle, amount),
      });
      const panel = drawing.paths.find((p) => p.role === 'panel');
      for (const glyph of drawing.paths.filter((p) => p.role === 'screen')) {
        expect(panel).toBeDefined();
        expect(glyph.opacity).toBeLessThanOrEqual(panel!.opacity);
        textSeen = true;
      }
    }
    expect(textSeen).toBe(true);
  },
);
it('uses fractional panel camera visibility without double-fading its children', async () => {
  const asset = (await vectorShapeImports.bot_blob()).default;
  const pose = sampleVectorPose(asset, 'work', 1);
  asset.parts.forEach((p, i) => {
    if (!pose[i]) return;
    if (p.role === 'panel') {
      pose[i]!.coverage = { value: [0.5, 0, 0, 0] };
      pose[i]!.camera = { value: [1, 1, 0, 0.25] };
    } else if (p.role === 'screen') {
      pose[i]!.coverage = { value: [1, 0, 0, 0] };
      pose[i]!.camera = { value: [1, 1, 0, 1] };
    }
  });
  const drawing = renderVectorFrame(asset, { action: 'work', time: 1, pose });
  const panel = drawing.paths.find((p) => p.role === 'panel')!;
  expect(panel.opacity).toBe(0.125);
  const text = drawing.paths.filter((p) => p.role === 'screen');
  expect(text.length).toBeGreaterThan(0);
  text.forEach((p) => expect(p.opacity).toBe(panel.opacity));
});
