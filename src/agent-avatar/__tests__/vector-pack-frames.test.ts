import fs from 'node:fs';
import path from 'node:path';
import { AVATAR_PRESETS } from '../catalog-ids';
import { type AvatarCharacter, resolveAvatarCharacter } from '../character';
import {
  vectorAccessoryImports,
  vectorEyeImports,
  vectorEyewearImports,
  vectorShapeImports,
  vectorTemplateImports,
} from '../vector-asset-imports';
import { vectorAssetLoader } from '../vector-assets';
import { composeVectorCharacter } from '../vector-compose';
import { renderVectorFrame, type VectorFrameOptions } from '../vector-frame';
import { createVectorAssetLoader, type VectorAssetSources } from '../vector-loader';
import type { VectorAssetImport } from '../vector-pack';
import { sampleVectorPose } from '../vector-pose';
import { VECTOR_AVATAR_VIEWBOX } from '../vector-viewbox';
import type { VectorAction, VectorData, VectorDrawPath, VectorFrame } from '../vector-types';

/**
 * Pack format 3 stores the vectors as integers in base64, and must give back exactly what the JSON
 * pack (format 2) held. This reads every asset from both packs and compares the data, then draws
 * characters from both, through the real composition and projection, and compares every path: the
 * same paths with the same vertices, each within 0.04 units (the avatar's 216-unit viewBox: under
 * 0.1 px at 512 px), opacity within 1e-3.
 *
 * The reference is the pack from before format 3, from git:
 *   git archive 4a4a42579 src/agent-avatar/vector-assets | tar -x -C <dir>
 *   BLOOM_AVATAR_REFERENCE_PACK=<dir>/src/agent-avatar/vector-assets bun run test vector-pack-frames
 *
 * It prints the largest deviations and, for every frame whose outlines changed, how much the frame
 * changes drawn at 512 px. It runs for about three minutes, and V8 aborts it now and then inside
 * Jest's vm context (Node 24.21 in most runs, Node 22.17 less often, on one machine, 2026-11-20):
 * run it again when the worker dies without a result.
 */
const reference = process.env.BLOOM_AVATAR_REFERENCE_PACK;
const TOLERANCE = 0.04;

type Packed = {
  parts: ({ geo: string } & Record<string, unknown>)[];
  clips: Record<string, Record<string, unknown>>;
  tracks: Record<string, string | null>[];
} & Record<string, unknown>;

/** A format 2 asset, read whole: every payload is a JSON string. */
function readFormat2(directory: string, file: string): VectorData {
  const read = (name: string) =>
    JSON.parse(JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')).data);
  const { parts, clips, tracks, format: _format, ...top } = read(file) as Packed;
  const blob = (hash: string) => read(path.join('blobs', `${hash}.json`));
  return {
    ...top,
    parts: parts.map(({ geo, ...part }) => ({ ...part, ...blob(geo) })),
    clips: Object.fromEntries(
      Object.entries(clips).map(([name, head]) => [
        name,
        { ...head, parts: tracks.map((entry) => (entry[name] ? blob(entry[name]!) : null)) },
      ]),
    ),
  } as unknown as VectorData;
}

function referenceLoader(directory: string) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8')) as {
    files: { kind: keyof VectorAssetSources; id: string; file: string }[];
  };
  const sources: Record<string, Record<string, () => Promise<{ default: VectorData }>>> = {};
  for (const { kind, id, file } of manifest.files)
    (sources[kind] ??= {})[id] = async () => ({ default: readFormat2(directory, file) });
  // As `vector-asset-imports.ts` maps it: the bot's eyes are its blob shape's.
  sources.eyes!.bot = sources.shape!.bot_blob!;
  return createVectorAssetLoader(sources as VectorAssetSources);
}

const characters: [string, AvatarCharacter][] = [
  ...AVATAR_PRESETS.map((preset): [string, AvatarCharacter] => [preset, { preset }]),
  ['alia', { preset: 'blue_beret', accessory: 'none', color: 'orchid' }],
  ['bot', { shape: 'bot_blob', eyes: 'bot', eyewear: 'none', accessory: 'none', color: 'blue' }],
  [
    'bot star',
    { shape: 'bot_star', eyes: 'oval', eyewear: 'none', accessory: 'crown', color: 'lime' },
  ],
  [
    'composed',
    {
      shape: 'circle_two_ears',
      eyes: 'sparkle_capsules',
      eyewear: 'round_sunglasses',
      accessory: 'headphones',
      color: 'coral',
    },
  ],
];
const frames: [string, Omit<VectorFrameOptions, 'pose'>][] = [
  ...[0, 0.5, 1.25, 2.4, 3.7, 5.2].map((time): [string, Omit<VectorFrameOptions, 'pose'>] => [
    `idle ${time}s`,
    { action: 'idle', time },
  ]),
  ['idle 1.6s looking', { action: 'idle', time: 1.6, look: { yaw: 0.35, pitch: -0.2, mix: 1 } }],
  ...([0.15, 0.5, 0.9, 1.4] as const).map((time): [string, Omit<VectorFrameOptions, 'pose'>] => [
    `reaction ${time}s`,
    { action: 'reaction', time },
  ]),
  ...([0.4, 1.2, 2.5, 4] as const).map((time): [string, Omit<VectorFrameOptions, 'pose'>] => [
    `work ${time}s`,
    { action: 'work', time },
  ]),
];

const draw = (asset: VectorData, options: Omit<VectorFrameOptions, 'pose'>): VectorFrame =>
  renderVectorFrame(asset, {
    ...options,
    pose: sampleVectorPose(asset, options.action as VectorAction, options.time),
  });

/** A path's subpaths as vertex lists (`M`, `L`, `H`, `V`, `Z`: all the frame writes). */
function outline(d: string): number[][][] {
  const subpaths: number[][][] = [];
  let x = 0,
    y = 0;
  for (const [, command, list] of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const n = list!.trim()
      ? list!
          .trim()
          .split(/[\s,]+/)
          .map(Number)
      : [];
    if (command === 'M') subpaths.push([]);
    const vertices = subpaths[subpaths.length - 1];
    if (command === 'M' || command === 'L')
      for (let i = 0; i < n.length; i += 2) vertices!.push([(x = n[i]!), (y = n[i + 1]!)]);
    else if (command === 'H') for (const v of n) vertices!.push([(x = v), y]);
    else if (command === 'V') for (const v of n) vertices!.push([x, (y = v)]);
    else if (command !== 'Z') throw new Error(`Unexpected path command ${command}`);
  }
  return subpaths;
}
const shape = (o: number[][][]) => o.map((subpath) => subpath.length).join();
const count = (o: number[][][]) => o.reduce((sum, subpath) => sum + subpath.length, 0);
// Drawn coverage at 512 px through the avatar's viewBox, 4 x 4 samples a pixel (nonzero, as the
// avatar fills paths and clips), to say how much a changed outline changes what is drawn.
const PIXELS = 512;
const SAMPLES = 4;
const SIZE = PIXELS * SAMPLES;
const [VIEW_X, VIEW_Y, VIEW_SIZE] = VECTOR_AVATAR_VIEWBOX.split(' ').map(Number) as [
  number,
  number,
  number,
];
function coverage(d: string): Uint8Array {
  const rows: { x: number; winding: number }[][] = Array.from({ length: SIZE }, () => []);
  const toSample = (v: number, origin: number) => ((v - origin) / VIEW_SIZE) * SIZE - 0.5;
  for (const subpath of outline(d))
    for (let i = 0; i < subpath.length; i++) {
      const a = subpath[i]!,
        b = subpath[(i + 1) % subpath.length]!;
      const ax = toSample(a[0]!, VIEW_X),
        ay = toSample(a[1]!, VIEW_Y),
        bx = toSample(b[0]!, VIEW_X),
        by = toSample(b[1]!, VIEW_Y);
      if (ay === by) continue;
      const from = Math.max(0, Math.ceil(Math.min(ay, by)));
      const to = Math.min(SIZE, Math.ceil(Math.max(ay, by)));
      for (let row = from; row < to; row++)
        rows[row]!.push({
          x: ax + ((row - ay) / (by - ay)) * (bx - ax),
          winding: by > ay ? 1 : -1,
        });
    }
  const inside = new Uint8Array(SIZE * SIZE);
  rows.forEach((crossings, row) => {
    crossings.sort((p, q) => p.x - q.x);
    let winding = 0;
    for (let i = 0; i < crossings.length - 1; i++) {
      winding += crossings[i]!.winding;
      if (winding === 0) continue;
      const start = Math.max(0, Math.ceil(crossings[i]!.x));
      const end = Math.min(SIZE, Math.ceil(crossings[i + 1]!.x));
      inside.fill(1, row * SIZE + start, row * SIZE + Math.max(start, end));
    }
  });
  return inside;
}
/** Per pixel, the share of it a path covers, after its clip. */
function drawn(path: { d: string; clip?: string }): Float32Array {
  const fill = coverage(path.d);
  const clip = path.clip === undefined ? undefined : coverage(path.clip);
  const pixels = new Float32Array(PIXELS * PIXELS);
  for (let i = 0; i < fill.length; i++)
    if (fill[i] && (!clip || clip[i])) {
      const x = (i % SIZE) / SAMPLES,
        y = Math.floor(i / SIZE / SAMPLES);
      pixels[y * PIXELS + Math.floor(x)]! += 1 / (SAMPLES * SAMPLES);
    }
  return pixels;
}
/** A frame's fills composited in paint order on white, as RGB from 0 to 1 (strokes left out). */
function picture(paths: VectorDrawPath[]): Float32Array {
  const image = new Float32Array(PIXELS * PIXELS * 3).fill(1);
  for (const path of paths) {
    if (!/^#[0-9a-f]{6}$/i.test(path.fill)) throw new Error(`Unexpected fill ${path.fill}`);
    const rgb = [1, 3, 5].map((i) => Number.parseInt(path.fill.slice(i, i + 2), 16) / 255);
    const alpha = path.opacity * path.fillOpacity;
    const cover = drawn(path);
    for (let i = 0; i < cover.length; i++) {
      if (!cover[i]) continue;
      for (let c = 0; c < 3; c++)
        image[i * 3 + c]! += (rgb[c]! - image[i * 3 + c]!) * cover[i]! * alpha;
    }
  }
  return image;
}
/** The largest change to one pixel's colour (0 to 1), and how many pixels changed by a tenth. */
function pictureChange(a: VectorDrawPath[], b: VectorDrawPath[]) {
  const before = picture(a),
    after = picture(b);
  let largest = 0,
    changed = 0;
  for (let i = 0; i < PIXELS * PIXELS; i++) {
    let change = 0;
    for (let c = 0; c < 3; c++)
      change = Math.max(change, Math.abs(before[i * 3 + c]! - after[i * 3 + c]!));
    if (change > largest) largest = change;
    if (change >= 0.1) changed++;
  }
  return { largest, changed };
}

const imports: Record<string, Record<string, VectorAssetImport>> = {
  shape: vectorShapeImports,
  eyes: vectorEyeImports,
  eyewear: vectorEyewearImports,
  accessory: vectorAccessoryImports,
  template: vectorTemplateImports,
};

if (!reference) {
  it.skip('compares frames with a format 2 pack: set BLOOM_AVATAR_REFERENCE_PACK to its vector-assets directory', () => {});
} else {
  it('reads every asset exactly as the JSON pack held it', async () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(reference, 'manifest.json'), 'utf8')) as {
      files: { kind: string; id: string; file: string }[];
    };
    for (const { kind, id, file } of manifest.files) {
      const { default: data } = await imports[kind]![id]!();
      expect(data).toStrictEqual(readFormat2(reference, file));
    }
    expect(manifest.files).toHaveLength(70);
  });

  it('draws every frame as the JSON pack did', async () => {
    const before = referenceLoader(reference);
    const worst = { d: 0, clip: 0, opacity: 0 };
    const worstAt = { d: '', clip: '', opacity: '' };
    const problems: string[] = [];
    // Every frame with a path that changed shape or moved past the tolerance: how much it changed.
    const changes: { where: string; largest: number; changed: number }[] = [];
    let compared = 0;
    for (const [name, character] of characters) {
      const resolved = resolveAvatarCharacter(character);
      const [old, now] = await Promise.all([
        composeVectorCharacter(resolved, before),
        composeVectorCharacter(resolved, vectorAssetLoader),
      ]);
      for (const [label, options] of frames) {
        const a = draw(old, options).paths;
        const b = draw(now, options).paths;
        const where = `${name}, ${label}`;
        let moved = false;
        if (a.map((p) => p.id).join() !== b.map((p) => p.id).join()) {
          problems.push(`${where}: paths ${a.map((p) => p.id)} became ${b.map((p) => p.id)}`);
          continue;
        }
        a.forEach((pathA, i) => {
          const pathB = b[i]!;
          const at = `${where}, path ${pathA.id} (${pathA.role})`;
          const opacity = Math.max(
            Math.abs(pathA.opacity - pathB.opacity),
            Math.abs(pathA.fillOpacity - pathB.fillOpacity),
          );
          if (opacity > worst.opacity) [worst.opacity, worstAt.opacity] = [opacity, at];
          if (pathA.fill !== pathB.fill || pathA.role !== pathB.role)
            problems.push(`${at}: fill or role changed`);
          for (const key of ['d', 'clip'] as const) {
            const oa = outline(pathA[key] ?? ''),
              ob = outline(pathB[key] ?? '');
            if (shape(oa) !== shape(ob)) {
              problems.push(`${at} ${key}: ${count(oa)} vertices became ${count(ob)}`);
              moved = true;
              continue;
            }
            const vb = ob.flat();
            oa.flat().forEach((p, k) => {
              const off = Math.hypot(p[0]! - vb[k]![0]!, p[1]! - vb[k]![1]!);
              if (off > TOLERANCE) moved = true;
              if (off > worst[key]) [worst[key], worstAt[key]] = [off, at];
            });
          }
          compared++;
        });
        if (moved) changes.push({ where, ...pictureChange(a, b) });
      }
    }
    changes.sort((p, q) => q.largest - p.largest || q.changed - p.changed);
    console.log(
      `Compared ${compared} paths in ${characters.length * frames.length} frames.\n` +
        `Largest vertex deviation where the outline kept its vertices:\n` +
        `  d ${worst.d} units (${worstAt.d})\n  clip ${worst.clip} units (${worstAt.clip})\n` +
        `  opacity ${worst.opacity} (${worstAt.opacity})\n` +
        `${problems.length} outlines changed their vertices. ${changes.length} frames have a path ` +
        `that changed shape or moved past ${TOLERANCE} units; drawn at ${PIXELS} px, the largest ` +
        `change to one pixel's colour (0 to 1) and the pixels that changed by a tenth or more:\n  ` +
        changes.map((c) => `${c.where}: ${c.largest.toFixed(3)}, ${c.changed} px`).join('\n  ') +
        (problems.length ? `\nVertex counts:\n  ${problems.join('\n  ')}` : ''),
    );
    expect(problems).toEqual([]);
    expect(worst.d).toBeLessThanOrEqual(TOLERANCE);
    expect(worst.clip).toBeLessThanOrEqual(TOLERANCE);
    expect(worst.opacity).toBeLessThanOrEqual(1e-3);
  }, 600_000);
}
