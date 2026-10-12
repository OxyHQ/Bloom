/** Offline analytical fit and independent transient validation of catalog gaze. */
import { readFile, writeFile } from 'node:fs/promises';
import { Matrix4 } from 'three';
import ts from 'typescript';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const code = ts
  .transpileModule(await readFile('runtime/avatar/eye-gaze-controller.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  })
  .outputText.replace(/(['"])three\1/g, JSON.stringify(import.meta.resolve('three')));
const { AvatarEyeGazeController, eyeClosureFromMorph } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
);
const matrix = (draw, normal = false) =>
  new Matrix4().fromArray(draw.blocks.DrawBlock, normal ? 16 : 0);
const rigs = [];
for (const rig of [0, 1]) {
  const root = `.local/avatar-catalog-rig/rig${rig}`;
  const geometry = await read(`${root}/combined-geometry.json`),
    manifest = await read(`${root}/manifest.json`);
  const idle = await read(`${root}/lime_frog/idle-raw.json`),
    gaze = await read(`${root}/lime_frog/gaze-raw.json`);
  const identity = new Map(geometry.parts.map((p) => [p.vertices.sha256, p.id]));
  const map = (raw) => {
    const ids = new Map(raw.vertexBuffers.map((b) => [b.id, identity.get(b.sha256)]));
    return raw.frames.map((f) => ({
      ...f,
      draws: new Map(
        f.draws.map((d) => [
          ids.get(d.vertexAttributes.find((a) => a.name === 'position')?.bufferId),
          d,
        ]),
      ),
    }));
  };
  rigs.push({ geometry, manifest, idle: map(idle), gaze: map(gaze), calls: gaze.calls });
}
const toddId = rigs[1].manifest.parts.find((p) => p.selection === 'todd' && p.sourcePart === 1).id;
const output = [];
function solve(rows) {
  const a = Array.from({ length: 5 }, (_, i) =>
    Array.from({ length: 6 }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0)),
  );
  for (let k = 0; k < 5; k++) {
    const pivot = a[k][k];
    if (Math.abs(pivot) < 1e-14) throw Error('Underdetermined gaze surface');
    for (let j = k; j < 6; j++) a[k][j] /= pivot;
    for (let i = 0; i < 5; i++)
      if (i !== k) {
        const v = a[i][k];
        for (let j = k; j < 6; j++) a[i][j] -= v * a[k][j];
      }
  }
  return a.map((r) => r[5]);
}
for (const rig of rigs)
  for (const p of rig.manifest.parts.filter((p) => p.category === 'eyes')) {
    const record = rig.geometry.parts.find((q) => q.id === p.id),
      prefix = Buffer.from(record.unresolvedMaterialAndPosePrefixHex, 'hex');
    if (prefix.readUInt32LE(108) !== 0) continue;
    const at = 116 + prefix.readUInt32LE(112) + 36,
      effect = prefix[at];
    if (![3, 5].includes(effect)) continue;
    const anchor = record.pose.deformationCenter,
      halfSize = [prefix.readFloatLE(at + 2), prefix.readFloatLE(at + 6)];
    const correction = (index) => {
      const g = rig.gaze[index].draws,
        i = rig.idle[index].draws;
      return matrix(i.get(p.id))
        .invert()
        .multiply(matrix(i.get(0)))
        .multiply(matrix(g.get(0)).invert())
        .multiply(matrix(g.get(p.id)));
    };
    const h = correction(rig.gaze.findIndex((f) => Math.abs(f.renderTime - 3.6) < 1e-8)).elements;
    const v = correction(rig.gaze.findIndex((f) => Math.abs(f.renderTime - 5.6) < 1e-8)).elements;
    const surface = Math.abs(h[8]) < 1e-8 && Math.abs(v[9]) < 1e-8;
    const angularGain = [
      2 * Math.acos(Math.max(-1, Math.min(1, h[0]))),
      2 * Math.acos(Math.max(-1, Math.min(1, v[5]))),
    ];
    const translationGain = [
      ((h[12] - anchor[0] * (1 - h[0]) + anchor[2] * h[8]) / halfSize[0]) * 2,
      ((v[13] - anchor[1] * (1 - v[5]) + anchor[2] * v[9]) / halfSize[1]) * 2,
    ];
    const profile = {
      anchor,
      halfSize,
      angularGain,
      translationGain,
      blink: 'external',
      blinkMultiplier: effect === 3 ? 6 : 1,
      ...(surface
        ? {
            surface: {
              curvature: [prefix.readFloatLE(at + 50), prefix.readFloatLE(at + 54)],
              slope: [prefix.readFloatLE(at + 82), prefix.readFloatLE(at + 86)],
            },
          }
        : {}),
    };
    if (effect === 3) {
      const dx = h[12],
        dy = v[13];
      const ax = -h[2] / dx,
        ay = -v[6] / dy;
      profile.angularGain = [0, 0];
      profile.surface = {
        curvature: [ax, ay],
        crossCurvature: (-h[6] / dx - v[2] / dy) / 2,
        slope: [
          (h[14] + h[2] * anchor[0] + h[6] * anchor[1] + (ax * dx * dx) / 2) / dx,
          (v[14] + v[2] * anchor[0] + v[6] * anchor[1] + (ay * dy * dy) / 2) / dy,
        ],
      };
      const input = new AvatarEyeGazeController(),
        rows = [];
      for (let index = 0; index < rig.gaze.length; index++) {
        const frame = rig.gaze[index];
        const closure = eyeClosureFromMorph(
          rigs[1].idle[index].draws.get(toddId).blocks.DrawBlock.slice(36, 40),
          'integrated',
        );
        const c = Math.max(0, Math.min(1, closure * 6)),
          openness = 1 - c * c * (3 - 2 * c);
        const x = input.x * openness,
          y = input.y * openness;
        if (index % 2 === 0 && Math.abs(x) + Math.abs(y) > 1e-5) {
          const m = correction(index).elements;
          rows.push([x, y, x * x, y * y, x * y, m[14] + m[2] * anchor[0] + m[6] * anchor[1]]);
        }
        input.advance(index ? frame.renderTime - rig.gaze[index - 1].renderTime : 0);
        for (const call of rig.calls.filter(
          (c) => c.method === 'pointer' && Math.abs(c.renderTime - frame.renderTime) < 1e-8,
        ))
          input.point(call.args[2], call.args[3]);
      }
      const q = solve(rows),
        tx = halfSize[0] * translationGain[0],
        ty = halfSize[1] * translationGain[1];
      profile.surface.depth = {
        slope: [q[0] / tx, q[1] / ty],
        curvature: [(-2 * q[2]) / (tx * tx), (-2 * q[3]) / (ty * ty)],
        crossCurvature: -q[4] / (tx * ty),
      };
    } else if (!surface) {
      profile.angularGain = [0.042, 0.028];
      profile.translationGain = [0.07, -0.042];
    }
    const eyes = new AvatarEyeGazeController();
    let max = 0,
      maxNormal = 0,
      worst;
    const cw = new Matrix4(),
      cn = new Matrix4();
    for (let index = 0; index < rig.gaze.length; index++) {
      const actual = rig.gaze[index],
        neutral = rig.idle[index];
      const closure = eyeClosureFromMorph(
        rigs[1].idle[index].draws.get(toddId).blocks.DrawBlock.slice(36, 40),
        'integrated',
      );
      eyes.writeCorrection(profile, closure, cw, cn);
      const delta = matrix(actual.draws.get(0)).multiply(matrix(neutral.draws.get(0)).invert());
      const expected = delta
        .clone()
        .multiply(matrix(neutral.draws.get(p.id)))
        .multiply(cw);
      const normalDelta = matrix(actual.draws.get(0), true).multiply(
        matrix(neutral.draws.get(0), true).invert(),
      );
      const expectedNormal = normalDelta
        .multiply(matrix(neutral.draws.get(p.id), true))
        .multiply(cn);
      const d = actual.draws.get(p.id).blocks.DrawBlock,
        magnitude = Math.max(1, ...d.slice(16, 32).map(Math.abs));
      for (let k = 0; k < 16; k++) {
        const error = Math.abs(expected.elements[k] - d[k]);
        if (error > max) {
          max = error;
          worst = {
            time: actual.renderTime,
            k,
            actual: d[k],
            expected: expected.elements[k],
            closure,
            x: eyes.x,
            y: eyes.y,
          };
        }
        maxNormal = Math.max(
          maxNormal,
          Math.abs(expectedNormal.elements[k] - d[16 + k]) / magnitude,
        );
      }
      eyes.advance(index ? actual.renderTime - rig.gaze[index - 1].renderTime : 0);
      for (const call of rig.calls.filter(
        (c) => c.method === 'pointer' && Math.abs(c.renderTime - actual.renderTime) < 1e-8,
      ))
        eyes.point(call.args[2], call.args[3]);
    }
    output.push({
      style: p.selection,
      part: p.sourcePart,
      effect,
      surface,
      profile,
      max,
      maxNormal,
      worst,
    });
  }
await writeFile('.local/avatar-catalog-gaze/analysis.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output.map(({ profile, ...rest }) => rest)));
