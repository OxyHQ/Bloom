import fs from 'node:fs';
import { Matrix4 } from 'three';
const read = (p) => JSON.parse(fs.readFileSync(p));
const generic = read(
  process.env.AVATAR_CATALOG_COMPUTER_RAW || '.local/avatar-catalog-computer/circle/work-raw.json',
);
const named = read('.local/avatar-computer-source/lime_frog/work-raw.json');
const template = Object.entries(
  read('runtime/avatar/assets/lime_frog/material.json').parts[0].fields,
);
function fields(d) {
  let at = 0;
  return Object.fromEntries(
    template.map(([k, v]) => [k, d.blocks.DrawBlock.slice(at, (at += v.length))]),
  );
}
const frames = new Map(named.frames.map((f) => [f.renderTime, f]));
let anchor,
  maximum = 0,
  handMax = 0,
  bodyMax = 0,
  matrices = [];
const kind = (f, k) => f.draws.map(fields).filter((p) => p.referencePose[3] === k);
for (const f of generic.frames) {
  if (f.renderTime < 3 || f.renderTime > 6.3) continue;
  const n = frames.get(f.renderTime);
  if (!n) continue;
  const gp = kind(f, -4)[0],
    np = kind(n, -4)[0];
  if (!gp || !np) continue;
  const gbody = new Matrix4().fromArray(fields(f.draws[0]).world),
    nbody = new Matrix4().fromArray(fields(n.draws[0]).world);
  bodyMax = Math.max(bodyMax, ...gbody.elements.map((v, k) => Math.abs(v - nbody.elements[k])));
  const delta = new Matrix4()
    .fromArray(gp.world)
    .multiply(new Matrix4().fromArray(np.world).invert());
  const local = gbody.clone().invert().multiply(delta).multiply(nbody);
  anchor ??= delta.clone();
  maximum = Math.max(maximum, ...delta.elements.map((v, k) => Math.abs(v - anchor.elements[k])));
  const gh = kind(f, -40),
    nh = kind(n, -40);
  for (let i = 0; i < gh.length; i++) {
    const pred = delta.clone().multiply(new Matrix4().fromArray(nh[i].world));
    handMax = Math.max(handMax, ...pred.elements.map((v, k) => Math.abs(v - gh[i].world[k])));
  }
  if (matrices.length < 2 || f.renderTime === 5)
    matrices.push({ time: f.renderTime, local: local.toArray(), delta: delta.toArray() });
}
console.log(JSON.stringify({ bodyMax, localVaries: maximum, handMax, matrices }, null, 2));
