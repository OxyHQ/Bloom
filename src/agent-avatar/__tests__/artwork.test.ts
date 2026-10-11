import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { drawAvatar } from '../artwork';
import { DrawingContext, DrawingMatrix, DrawingPath } from '../drawing';
import { ENTRANCE_SECONDS, entrancePose } from '../entrance';
import { easeFace, expressionRig, faceAtSize, projectEyePoint } from '../face';
import { GRAIN_URI } from '../grain';
import { DEFAULT_CONFIG, parsePreset, type AvatarConfig } from '../model';
import { morphPaper, recordingPath, type PaperGeometry, type ShapeMorph } from '../shape-morph';
import { WORKING_SECONDS, workingPose } from '../working';
import golden from './artwork-golden.json';

/** Fixed signatures captured from the original source's command stream, with grain off.
 * These pin silhouette, materials, clipping, face projection and paper layers independently
 * of the new SVG renderer. Regenerate only after reviewing a source artwork change.
 */
describe('original artwork geometry', () => {
  test.each(golden)('$name', ({ patch, hash }) => {
    const config = { ...DEFAULT_CONFIG, ...patch, grain: 0 } as AvatarConfig;
    const context = new DrawingContext();
    drawAvatar(context, config, 0.8, expressionRig(config), [0.12, -0.16], 200);
    expect(
      createHash('sha256')
        .update(
          JSON.stringify(context.nodes, (_key, value: unknown) =>
            typeof value === 'number' ? Math.round(value * 1e8) / 1e8 : value,
          ),
        )
        .digest('hex'),
    ).toBe(hash);
  });

  it('keeps transformed cubic paths exact rather than polygonizing them', () => {
    const path = new DrawingPath();
    path.moveTo(1, 2);
    path.bezierCurveTo(3, 4, 5, 6, 7, 8);
    const projected = new DrawingPath();
    projected.addPath(path, new DrawingMatrix([2, 0, 0, -1, 10, 20]));
    expect(projected.toString()).toBe('M12 18 C16 16 20 14 24 12');
  });
  it('retains exact elliptical turn contours and mirrored winding', () => {
    const ellipse = new DrawingPath();
    ellipse.ellipse(0, 0, 76, 88, 0, 0, Math.PI * 2);
    expect(ellipse.commands.map((command) => command.kind)).toEqual(['M', 'A', 'A', 'Z']);
    expect(ellipse.commands[1]!.values.slice(0, 5)).toEqual([76, 88, 0, 0, 1]);
    const mirrored = new DrawingPath();
    mirrored.addPath(ellipse, new DrawingMatrix([-1, 0, 0, 1, 0, 0]));
    expect(mirrored.commands[1]!.values[4]).toBe(0);
    expect(mirrored.commands[1]!.values[0]).toBe(88);
    expect(mirrored.commands[1]!.values[1]).toBe(76);
  });
  it('retains the original grain seed and all 192x192 samples', () => {
    const png = Buffer.from(GRAIN_URI.split(',')[1]!, 'base64');
    const chunks: Buffer[] = [];
    let offset = 8;
    while (offset < png.length) {
      const length = png.readUInt32BE(offset),
        type = png.toString('ascii', offset + 4, offset + 8);
      if (type === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
      offset += length + 12;
    }
    const pixels = inflateSync(Buffer.concat(chunks));
    let seed = 713;
    for (let y = 0; y < 192; y++) {
      expect(pixels[y * 193]).toBe(0);
      for (let x = 0; x < 192; x++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        if (pixels[y * 193 + x + 1] !== seed >>> 24) throw new Error(`Grain differs at ${x},${y}`);
      }
    }
  });
});

describe('recipe and animation contract', () => {
  it('migrates older shapes and rejects invalid persisted recipes', () => {
    const recipe = parsePreset({
      name: 'Study',
      config: {
        ...DEFAULT_CONFIG,
        foldShape: 'soft',
        eyes: 'surprised',
        lookAt: undefined,
      },
    });
    expect(recipe.config).toMatchObject({
      foldShape: 'slender',
      eyes: 'shook',
      lookAt: 'wander',
    });
    expect(() => parsePreset({ name: 'Bad', config: { ...DEFAULT_CONFIG, hue: NaN } })).toThrow(
      'Invalid hue',
    );
    expect(() =>
      parsePreset({
        name: 'Bad',
        config: { ...DEFAULT_CONFIG, family: 'fold', material: 'mist' },
      }),
    ).toThrow('Unknown fold surface');
  });
  it('optically sizes small avatars without changing the stored recipe', () => {
    expect(faceAtSize(DEFAULT_CONFIG, 24).eyeSize).toBeCloseTo(DEFAULT_CONFIG.eyeSize * 1.35);
    expect(faceAtSize(DEFAULT_CONFIG, 64)).toBe(DEFAULT_CONFIG);
    expect(DEFAULT_CONFIG.eyeSize).toBe(22);
  });
  it('lands arrivals and multi-cycle working turns at the original resting pose', () => {
    expect(entrancePose(0)).toMatchObject({
      opacity: 0,
      scaleX: 0.1,
      faceOpacity: 0,
    });
    expect(entrancePose(ENTRANCE_SECONDS)).toMatchObject({
      opacity: 1,
      scaleX: 1,
      fold: 0,
      faceOpacity: 1,
    });
    expect(workingPose(WORKING_SECONDS / 2).turn).toBeGreaterThan(0);
    expect(workingPose(WORKING_SECONDS * 2, 2).turn).toBeCloseTo(Math.PI * 2);
    expect(workingPose(WORKING_SECONDS * 2, 2).y).toBeCloseTo(0);
  });
  it('preserves interrupted expression velocity and finite perspective', () => {
    const current = expressionRig(DEFAULT_CONFIG),
      target = expressionRig({ ...DEFAULT_CONFIG, eyes: 'happy' });
    const velocity = {};
    const midway = easeFace(current, target, velocity, 0.032);
    expect(midway.smile).toBeGreaterThan(0);
    expect(midway.smile).toBeLessThan(1);
    const retargeted = easeFace(
      midway,
      expressionRig({ ...DEFAULT_CONFIG, eyes: 'sad' }),
      velocity,
      0.032,
    );
    expect(retargeted.smile).toBeGreaterThan(0);
    expect(projectEyePoint(-21, 0, 0.5, -0.2).every(Number.isFinite)).toBe(true);
  });
  it('retargets a changing paper shape from its last rendered contour', () => {
    const geometry = (radius: number): PaperGeometry => {
      const paper = recordingPath();
      paper.moveTo(-radius, -radius);
      paper.lineTo(radius, -radius);
      paper.lineTo(radius, radius);
      paper.lineTo(-radius, radius);
      paper.closePath();
      const crease = recordingPath();
      crease.moveTo(radius, -radius);
      crease.lineTo(radius, radius);
      return {
        paper,
        back: paper,
        crease,
        sx: 1,
        gazeX: 1,
        gazeY: 1,
        faceInset: 0,
        faceY: 0,
      };
    };
    const state: ShapeMorph = { active: false, started: 0 };
    morphPaper(geometry(40), state, 'slender', 0);
    morphPaper(geometry(60), state, 'pocket', 10);
    const midway = morphPaper(geometry(60), state, 'pocket', 250);
    const retargeted = morphPaper(geometry(80), state, 'petal', 250);
    expect(retargeted.paper.toString()).toBe(midway.paper.toString());
    expect(state.active).toBe(true);
    expect(morphPaper(geometry(80), state, 'petal', 1000).paper.toString()).toBe(
      geometry(80).paper.toString(),
    );
  });
});
