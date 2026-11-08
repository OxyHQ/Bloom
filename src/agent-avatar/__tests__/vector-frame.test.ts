import { renderVectorFrame, sampleVectorChannel } from '../vector-frame';
import { SVG_SHAPES } from '../svg-catalog';
import { vectorShapeImports } from '../vector-asset-imports';
import { composeVectorCharacter } from '../vector-compose';
import { vectorAssetLoader } from '../vector-assets';
import { resolveAvatarCharacter } from '../character';
import { sampleVectorPose, blendVectorPose } from '../vector-pose';
const points = (d: string) => {
  const n = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  return Array.from({ length: n.length / 2 }, (_, i) => [n[i * 2]!, n[i * 2 + 1]!] as const);
};
function bounds(d: string) {
  const p = points(d);
  const left = Math.min(...p.map((v) => v[0])),
    right = Math.max(...p.map((v) => v[0])),
    top = Math.min(...p.map((v) => v[1])),
    bottom = Math.max(...p.map((v) => v[1]));
  return {
    left,
    right,
    top,
    bottom,
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}
const eyeBounds = (frame: ReturnType<typeof renderVectorFrame>) =>
  frame.paths.filter((p) => p.role === 'eye').map((p) => bounds(p.d));
it.each(SVG_SHAPES)(
  '%s starts centered with clean, symmetric capsule eyes and preserves its outline',
  async (shape) => {
    const asset = (await vectorShapeImports[shape]()).default;
    const neutral = renderVectorFrame(asset, { action: 'idle', time: 0 });
    const b = bounds(neutral.paths.find((p) => p.role === 'body')!.d),
      eyes = eyeBounds(neutral);
    expect((eyes[0]!.x + eyes[1]!.x) / 2).toBeCloseTo(b.x, 2);
    expect((eyes[0]!.y + eyes[1]!.y) / 2).toBeCloseTo(b.y, 2);
    expect(eyes[0]!.height / b.height).toBeGreaterThan(0.15);
    expect(eyes[0]!.height / b.height).toBeLessThan(0.4);
    expect(eyes[0]!.width / eyes[0]!.height).toBeGreaterThan(0.2);
    expect(eyes[0]!.width / eyes[0]!.height).toBeLessThan(0.6);
    for (const eye of asset.parts.filter((p) => p.role === 'eye')) {
      const center = eye.points[0]!;
      const contour = eye.points.slice(1);
      for (const point of contour) {
        const reflected = point.map((v, k) => 2 * center[k]! - v);
        expect(
          Math.min(...contour.map((p) => Math.hypot(...p.map((v, k) => v - reflected[k]!)))),
        ).toBeLessThan(0.00001);
      }
    }
    for (const action of ['idle', 'reaction', 'work'] as const) {
      const front = renderVectorFrame(asset, { action, time: 0.9 });
      const turned = renderVectorFrame(asset, {
        action,
        time: 0.9,
        look: { yaw: 0.6, pitch: 0.45, mix: 1 },
      });
      expect(turned.paths.find((p) => p.role === 'body')!.d).toBe(
        front.paths.find((p) => p.role === 'body')!.d,
      );
      expect(turned.paths.every((p) => !p.d.includes('NaN'))).toBe(true);
    }
  },
);
it.each(SVG_SHAPES)(
  '%s uses absolute gaze on both axes with mirrored foreshortening',
  async (shape) => {
    const asset = (await vectorShapeImports[shape]()).default;
    const frame = (yaw: number, pitch: number) =>
      renderVectorFrame(asset, { action: 'idle', time: 0, look: { yaw, pitch, mix: 1 } });
    const middle = eyeBounds(frame(0, 0)),
      left = eyeBounds(frame(-0.6, 0)),
      right = eyeBounds(frame(0.6, 0)),
      up = eyeBounds(frame(0, -0.45)),
      down = eyeBounds(frame(0, 0.45));
    const x = (v: typeof middle) => (v[0]!.x + v[1]!.x) / 2,
      y = (v: typeof middle) => (v[0]!.y + v[1]!.y) / 2;
    expect(x(left)).toBeLessThan(x(middle) - 10);
    expect(x(right)).toBeGreaterThan(x(middle) + 10);
    expect(y(up)).toBeLessThan(y(middle) - 10);
    expect(y(down)).toBeGreaterThan(y(middle) + 10);
    expect(left[0]!.width).toBeLessThan(left[1]!.width);
    expect(right[1]!.width).toBeLessThan(right[0]!.width);
    expect(left[0]!.width).toBeCloseTo(right[1]!.width, 2);
    if (shape === 'bot_blob') {
      const b = bounds(frame(0.6, 0.45).paths.find((p) => p.role === 'body')!.d);
      expect(b.width / b.height).toBeCloseTo(1, 3);
    }
  },
);
it.each(SVG_SHAPES)(
  '%s keeps its native capsule geometry through paint and accessory composition',
  async (shape) => {
    const original = (await vectorShapeImports[shape]()).default;
    const baseline = await composeVectorCharacter(
      resolveAvatarCharacter({
        shape,
        eyes: 'bot',
        eyewear: 'none',
        accessory: 'none',
        bodyColor: '#1084fe',
      }),
      vectorAssetLoader,
    );
    const expected = baseline.parts.filter((p) => p.role === 'eye').map((p) => p.points);
    const source = original.parts.filter((p) => p.role === 'eye').map((p) => p.points);
    // Shape-specific face anchoring may translate a capsule, never distort its contour.
    for (let eye = 0; eye < expected.length; eye++)
      for (let vertex = 0; vertex < expected[eye]!.length; vertex++)
        for (let axis = 0; axis < 3; axis++)
          expect(expected[eye]![vertex]![axis]! - expected[eye]![0]![axis]!).toBeCloseTo(
            source[eye]![vertex]![axis]! - source[eye]![0]![axis]!,
            10,
          );
    for (const accessory of ['none', 'crown'] as const) {
      const character = resolveAvatarCharacter({
        shape,
        eyes: 'bot',
        eyewear: 'none',
        accessory,
        bodyColor: '#1084fe',
      });
      const composed = await composeVectorCharacter(character, vectorAssetLoader);
      expect(composed.parts.filter((p) => p.role === 'eye').map((p) => p.points)).toEqual(expected);
    }
  },
);
it('preserves the displayed body and props when reaction→work→reaction is interrupted', async () => {
  const asset = (await vectorShapeImports.bot_blob()).default;
  const first = sampleVectorPose(asset, 'reaction', 0.8),
    work = sampleVectorPose(asset, 'work', 0.2);
  const render = (pose: typeof first) =>
    renderVectorFrame(asset, { action: 'idle', time: 0, pose });
  expect(render(blendVectorPose(first, work, 0))).toEqual(render(first));
  const displayed = blendVectorPose(first, work, 0.4),
    reaction = sampleVectorPose(asset, 'reaction', 0);
  expect(render(blendVectorPose(displayed, reaction, 0))).toEqual(render(displayed));
});
it('normalizes quaternion interpolation along the shortest arc', () => {
  const q = sampleVectorChannel({ samples: [0, 0, 0, 1, 0, 0, -1, -1] }, 4, 0.5, true);
  expect(Math.hypot(...q)).toBeCloseTo(1);
  expect(q[3]).toBeGreaterThan(0);
});

import { vectorWorkLook } from '../vector-work-look';
it.each(SVG_SHAPES)(
  '%s keeps its work scene steady while aiming toward the panel',
  async (shape) => {
    const asset = (await vectorShapeImports[shape]()).default;
    const first = renderVectorFrame(asset, {
      action: 'work',
      time: 1.4,
      look: { yaw: 0, pitch: 0, mix: 1 },
    });
    const turned = renderVectorFrame(asset, {
      action: 'work',
      time: 1.4,
      yaw: 0.6,
      pitch: 0.45,
      look: { yaw: 0.6, pitch: 0.45, mix: 1 },
    });
    const props = (f: typeof first) =>
      f.paths.filter((p) => ['hand', 'panel', 'screen'].includes(p.role ?? '')).map((p) => p.d);
    expect(props(turned)).toEqual(props(first));
    const aim = vectorWorkLook(asset);
    expect(aim.yaw).toBeGreaterThan(0.1);
    expect(aim.pitch).toBeGreaterThan(0.2);
    const eyeBottom = Math.max(...eyeBounds(turned).map((p) => p.bottom));
    const panel = turned.paths.find((p) => p.role === 'panel')!;
    expect(bounds(panel.d).top).toBeGreaterThan(eyeBottom + 2);
    expect(bounds(panel.d).bottom).toBeLessThan(320);
  },
);
it('does not mutate a captured pose while applying procedural blink', async () => {
  const asset = (await vectorShapeImports.bot_blob()).default,
    pose = sampleVectorPose(asset, 'idle', 0),
    before = JSON.stringify(pose);
  renderVectorFrame(asset, {
    action: 'idle',
    time: 0,
    pose,
    motion: { yaw: 0, pitch: 0, roll: 0, bob: 0, scale: 1, lid: 0 },
  });
  expect(JSON.stringify(pose)).toBe(before);
});
