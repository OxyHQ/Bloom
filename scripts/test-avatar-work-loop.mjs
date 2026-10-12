/** Offline native evidence only. A periodic prop clock is not a full-state loop. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Vector3, Quaternion } from 'three';
const path = '.local/avatar-work-controller/alfred/cycles6/work-raw.json';
const bytes = await readFile(path),
  raw = JSON.parse(bytes);
const idleBytes = await readFile('.local/avatar-runtime-motion-actions/alfred/idle-raw.json');
const idle = JSON.parse(idleBytes);
const key = (d) => d.vertexAttributes.find((a) => a.name === 'position').bufferId;
const at = (frames, time) => {
  const f = frames.find((f) => Math.abs(f.renderTime - time) < 1e-8);
  assert(f, `Missing paired native time ${time}`);
  return f;
};
const matrix = (d, offset = 0) => new Matrix4().fromArray(d.blocks.DrawBlock, offset);
const maxDiff = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const pairs = raw.frames
  .filter((f) => f.renderTime >= 4 && f.renderTime < 10)
  .map((f) => [f, at(raw.frames, f.renderTime + 6)]);
const report = {
  preset: 'alfred',
  periodSeconds: 6,
  pairs: pairs.length,
  parts: {},
  bodyBreathing: { worldMaximum: 0, normalRelativeMaximum: 0 },
  limitation:
    'Native finite observation. Does not establish a periodic body/idle clock, arbitrary-phase Stop, or a runtime controller.',
  sha256: {
    work: createHash('sha256').update(bytes).digest('hex'),
    idle: createHash('sha256').update(idleBytes).digest('hex'),
  },
};
test('six-second native Computer loop preserves all prop channels and draw topology in both directions', () => {
  assert.equal(pairs.length, 360);
  for (const [a, b] of pairs) {
    const props = (f) => f.draws.filter((d) => [-4, -24, -40].includes(d.blocks.DrawBlock[43]));
    const left = props(a),
      right = props(b);
    assert.deepEqual(left.map(key), right.map(key), `Prop topology at ${a.renderTime}`);
    for (let p = 0; p < left.length; p++) {
      assert.deepEqual(
        left[p],
        right[p],
        `Complete native prop draw ${key(left[p])} at ${a.renderTime}`,
      );
      const id = key(left[p]);
      report.parts[id] = (report.parts[id] || 0) + 1;
    }
  }
});
test('body and accessories retain the independent native breathing phase across Computer cycles', () => {
  let differences = 0;
  for (const [a, b] of pairs) {
    const ai = at(idle.frames, a.renderTime).draws[0],
      bi = at(idle.frames, b.renderTime).draws[0];
    const sa = new Vector3(),
      sb = new Vector3();
    matrix(ai).decompose(new Vector3(), new Quaternion(), sa);
    matrix(bi).decompose(new Vector3(), new Quaternion(), sb);
    const bodyA = matrix(a.draws[0]),
      bodyB = bodyA
        .clone()
        .multiply(new Matrix4().makeScale(sb.x / sa.x, sb.y / sa.y, sb.z / sa.z));
    bodyB.elements[13] += bi.blocks.DrawBlock[13] - ai.blocks.DrawBlock[13];
    const delta = bodyB.clone().multiply(bodyA.clone().invert());
    const normal = delta.clone().invert().transpose();
    normal.setPosition(0, 0, 0);
    normal.elements[3] = normal.elements[7] = normal.elements[11] = 0;
    const parts = (f) =>
      f.draws.filter((d) => ![-4, -16, -24, -40].includes(d.blocks.DrawBlock[43]));
    const left = parts(a),
      right = parts(b);
    assert.deepEqual(left.map(key), right.map(key));
    for (let p = 0; p < left.length; p++) {
      assert.deepEqual(left[p].blocks.DrawBlock.slice(32), right[p].blocks.DrawBlock.slice(32));
      assert.deepEqual(left[p].blocks.FrameBlock, right[p].blocks.FrameBlock);
      assert.deepEqual(left[p].blocks.SkinBlock, right[p].blocks.SkinBlock);
      const world = delta.clone().multiply(matrix(left[p])),
        n = normal.clone().multiply(matrix(left[p], 16));
      const wd = maxDiff(world.elements, matrix(right[p]).elements);
      const nd =
        maxDiff(n.elements, matrix(right[p], 16).elements) /
        Math.max(1, ...matrix(right[p], 16).elements.map(Math.abs));
      report.bodyBreathing.worldMaximum = Math.max(report.bodyBreathing.worldMaximum, wd);
      report.bodyBreathing.normalRelativeMaximum = Math.max(
        report.bodyBreathing.normalRelativeMaximum,
        nd,
      );
      if (maxDiff(matrix(left[p]).elements, matrix(right[p]).elements) > 1e-6) differences++;
    }
  }
  assert(differences > 0, 'Negative control: looping the captured whole-body pose must fail');
  assert(report.bodyBreathing.worldMaximum < 1e-6, JSON.stringify(report.bodyBreathing));
  assert(report.bodyBreathing.normalRelativeMaximum < 1e-6, JSON.stringify(report.bodyBreathing));
});
test('Computer contact shadows follow the independent breathing width', () => {
  let worldMax = 0,
    normalRelativeMax = 0;
  for (const [a, b] of pairs) {
    const ai = at(idle.frames, a.renderTime).draws[0],
      bi = at(idle.frames, b.renderTime).draws[0];
    const sa = new Vector3(),
      sb = new Vector3();
    matrix(ai).decompose(new Vector3(), new Quaternion(), sa);
    matrix(bi).decompose(new Vector3(), new Quaternion(), sb);
    const ratio = sb.x / sa.x;
    const left = a.draws.filter((d) => d.blocks.DrawBlock[43] === -16),
      right = b.draws.filter((d) => d.blocks.DrawBlock[43] === -16);
    assert.equal(left.length, 2);
    assert.deepEqual(left.map(key), right.map(key));
    for (let p = 0; p < left.length; p++) {
      assert.deepEqual(left[p].blocks.DrawBlock.slice(32), right[p].blocks.DrawBlock.slice(32));
      const w = matrix(left[p]).multiply(new Matrix4().makeScale(ratio, ratio, 1));
      const n = matrix(left[p], 16).multiply(new Matrix4().makeScale(1 / ratio, 1 / ratio, 1));
      worldMax = Math.max(worldMax, maxDiff(w.elements, matrix(right[p]).elements));
      normalRelativeMax = Math.max(
        normalRelativeMax,
        maxDiff(n.elements, matrix(right[p], 16).elements) /
          Math.max(1, ...matrix(right[p], 16).elements.map(Math.abs)),
      );
    }
  }
  report.shadows = { worldMax, normalRelativeMax };
  assert(worldMax < 4e-7, JSON.stringify(report.shadows));
  assert(normalRelativeMax < 4e-7, JSON.stringify(report.shadows));
});
test.after(async () => {
  await writeFile(
    '.local/avatar-work-controller/alfred/six-second-loop-report.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report));
});
