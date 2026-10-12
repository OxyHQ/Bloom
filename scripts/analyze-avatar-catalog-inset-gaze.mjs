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

const { Vector3 } = await import('three');
const reports = [];
function sphereFrame(u) {
  const yaw = Math.atan2(u.x, u.z),
    pitch = -Math.asin(Math.max(-1, Math.min(1, u.y)));
  return new Matrix4().makeRotationY(yaw).multiply(new Matrix4().makeRotationX(pitch));
}
for (const rig of rigs)
  for (const p of rig.manifest.parts.filter((p) => p.category === 'eyes')) {
    const record = rig.geometry.parts.find((q) => q.id === p.id),
      prefix = Buffer.from(record.unresolvedMaterialAndPosePrefixHex, 'hex');
    if (prefix.readUInt32LE(108) !== 0) continue;
    const at = 116 + prefix.readUInt32LE(112) + 36,
      effect = prefix[at];
    if (![2, 7].includes(effect) || [28, 31].includes(p.id)) continue;
    const f = (k) => prefix.readFloatLE(at + k),
      anchor = new Vector3().fromArray(record.pose.deformationCenter),
      K = new Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, f(82), f(86), 1, 0, 0, 0, 0, 1),
      S = new Matrix4().makeScale(f(2), f(6), f(26)),
      B = K.clone().multiply(S),
      Binv = B.clone().invert(),
      u = new Vector3(f(126) / f(2), f(130) / f(6), 0);
    u.z = Math.sqrt(1 - u.x * u.x - u.y * u.y);
    const initialInv = sphereFrame(u).invert();
    const correction = (index) => {
      const g = rig.gaze[index].draws,
        i = rig.idle[index].draws;
      return matrix(g.get(0))
        .invert()
        .multiply(matrix(g.get(p.id)))
        .multiply(matrix(i.get(p.id)).invert())
        .multiply(matrix(i.get(0)));
    };
    const shifted = (t) => {
      const M = correction(rig.gaze.findIndex((fr) => Math.abs(fr.renderTime - t) < 1e-8));
      return u.clone().applyMatrix4(Binv.clone().multiply(M).multiply(B).setPosition(0, 0, 0));
    };
    const h = shifted(3.6),
      v = shifted(5.6),
      gain = [(h.x - u.x) * 2, (v.y - u.y) * 2];
    const eye = new AvatarEyeGazeController();
    let coord = 0,
      rot = 0,
      world = 0,
      normal = 0,
      worst = null;
    for (let i = 0; i < rig.gaze.length; i++) {
      const frame = rig.gaze[i],
        neutral = rig.idle[i],
        closure = eyeClosureFromMorph(
          rigs[1].idle[i].draws.get(toddId).blocks.DrawBlock.slice(36, 40),
          'integrated',
        ),
        c = Math.max(0, Math.min(1, closure)),
        open = 1 - c * c * (3 - 2 * c);
      let dx = eye.x * f(2) * 1.4,
        dy = -eye.y * f(6) * 1.2;
      const limit = Math.min(f(2) - f(10), f(6) - f(14)),
        length = Math.hypot(dx, dy);
      if (length > limit) {
        dx *= limit / length;
        dy *= limit / length;
      }
      const n = new Vector3(u.x + dx / f(2), u.y + dy / f(6), 0);
      n.z = Math.sqrt(Math.max(0, 1 - n.x * n.x - n.y * n.y));
      const observed = correction(i),
        R = Binv.clone().multiply(observed).multiply(B).setPosition(0, 0, 0),
        inferred = u.clone().applyMatrix4(R);
      coord = Math.max(coord, inferred.distanceTo(n));
      const r = sphereFrame(inferred).multiply(initialInv);
      for (let k = 0; k < 12; k++)
        if (closure < 1e-12) rot = Math.max(rot, Math.abs(R.elements[k] - r.elements[k]));
      const predicted = B.clone().multiply(sphereFrame(n)).multiply(initialInv).multiply(Binv),
        translation = anchor.clone().sub(anchor.clone().applyMatrix4(predicted));
      predicted.setPosition(translation);
      const e = matrix(frame.draws.get(0))
          .multiply(predicted)
          .multiply(matrix(neutral.draws.get(0)).invert())
          .multiply(matrix(neutral.draws.get(p.id))),
        en = matrix(frame.draws.get(0), true)
          .multiply(predicted.clone().setPosition(0, 0, 0).invert().transpose())
          .multiply(matrix(neutral.draws.get(0), true).invert())
          .multiply(matrix(neutral.draws.get(p.id), true)),
        native = frame.draws.get(p.id).blocks.DrawBlock;
      for (let k = 0; k < 16; k++) {
        const error = Math.abs(e.elements[k] - native[k]);
        if (closure < 1e-12 && error > world) {
          world = error;
          worst = {
            time: frame.renderTime,
            k,
            input: [eye.x, eye.y],
            closure,
            predicted: e.elements[k],
            actual: native[k],
          };
        }
        if (closure < 1e-12)
          normal = Math.max(
            normal,
            Math.abs(en.elements[k] - native[k + 16]) /
              Math.max(1, ...native.slice(16, 32).map(Math.abs)),
          );
      }
      eye.advance(i ? frame.renderTime - rig.gaze[i - 1].renderTime : 0);
      for (const call of rig.calls.filter(
        (c) => c.method === 'pointer' && Math.abs(c.renderTime - frame.renderTime) < 1e-8,
      ))
        eye.point(call.args[2], call.args[3]);
    }
    reports.push({
      part: p.id,
      style: p.selection,
      effect,
      anchor: anchor.toArray(),
      radii: [f(2), f(6), f(26)],
      slope: [f(82), f(86)],
      initial: u.toArray(),
      gain,
      coord,
      rot,
      world,
      normal,
      worst,
    });
  }
await writeFile('.local/catalog-inset-gaze-model.json', JSON.stringify(reports, null, 2));
console.log(JSON.stringify(reports, null, 2));
