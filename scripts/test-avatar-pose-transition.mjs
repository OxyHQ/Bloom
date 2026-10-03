import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  multiplyMatrix,
  inverseMatrix,
  interpolateTransform,
  blendDrawPose,
  blendFramePose,
  createPoseTransition,
} from '../assets/character-runtime/pose-transition.mjs';
const identity = () =>
  Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const close = (a, b) => assert(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const draw = () => {
  const x = new Float32Array(92);
  x.set(identity());
  x.set(identity(), 16);
  return x;
};
test('quaternion pose interpolation preserves rigid lengths and endpoints', () => {
  const a = identity(),
    b = identity();
  b[0] = 0;
  b[1] = 1;
  b[4] = -1;
  b[5] = 0;
  b[12] = 4;
  const m = interpolateTransform(a, b, 0.5);
  close(m[0], Math.SQRT1_2);
  close(m[1], Math.SQRT1_2);
  close(m[12], 2);
  for (let c = 0; c < 3; c++)
    close(Math.hypot(...m.slice(c * 4, c * 4 + 3)), 1);
  assert.deepEqual([...interpolateTransform(a, b, 0)], [...a]);
  assert.deepEqual([...interpolateTransform(a, b, 1)], [...b]);
  const shear = identity();
  shear[4] = 0.5;
  assert.equal(interpolateTransform(a, shear, 0.5), null);
});
test('draw blending preserves all material/discrete bytes and coherent inverse-transpose normals', () => {
  const a = draw(),
    b = draw();
  b[0] = 2;
  b[5] = 3;
  b[10] = 4;
  b[16] = 0.5;
  b[21] = 1 / 3;
  b[26] = 0.25;
  for (let i = 32; i < 92; i++) b[i] = i + 0.125;
  const mixed = blendDrawPose(a, b, 0.5),
    allowed = new Set([
      ...Array.from({ length: 32 }, (_, i) => i),
      37,
      38,
      39,
      88,
      89,
      90,
      91,
    ]);
  for (let i = 0; i < 92; i++)
    if (!allowed.has(i)) assert.equal(mixed[i], b[i]);
  close(mixed[0], 1.5);
  close(mixed[16], 1 / 1.5);
  close(mixed[37], b[37] / 2);
  assert.deepEqual([...blendDrawPose(a, b, 1)], [...b]);
});
test('camera interpolation retains inverse projection and never changes lights or viewport', () => {
  const a = new Float32Array(116),
    b = new Float32Array(116);
  a.set(identity());
  a.set(identity(), 16);
  a[50] = 4;
  b.set(a);
  b[0] = 2;
  b[5] = 2;
  b.set(inverseMatrix(b.slice(0, 16)), 16);
  for (let i = 32; i < 116; i++) if (i < 48 || i > 51) b[i] = i + 0.25;
  const mixed = blendFramePose(a, b, 0.5);
  assert(mixed);
  const product = multiplyMatrix(mixed.slice(0, 16), mixed.slice(16, 32));
  product.forEach((v, i) => close(v, identity()[i]));
  for (let i = 32; i < 116; i++)
    if (i < 48 || i > 50) assert.equal(mixed[i], b[i]);
  assert.deepEqual([...blendFramePose(a, b, 1)], [...b]);
});
test('only reflected UBO poses change; heap offsets, native intro hold and added geometry stay isolated', () => {
  const uploads = [],
    gl = {
      UNIFORM_BUFFER: 35345,
      INVALID_INDEX: 4294967295,
      getUniformBlockIndex(_p, name) {
        return name === 'DrawBlock' ? 0 : 1;
      },
      uniformBlockBinding() {},
      useProgram() {},
      bindVertexArray() {},
      bindBuffer() {},
      bindBufferRange() {},
      bindBufferBase() {},
      bufferData() {},
      bufferSubData(_target, offset, data) {
        uploads.push({ offset, data: new Float32Array(data) });
      },
      drawElements() {},
      deleteBuffer() {},
    };
  const adapter = createPoseTransition(gl),
    ctx = adapter.context,
    p = {},
    buffer = {};
  let vao = {};
  ctx.uniformBlockBinding(p, ctx.getUniformBlockIndex(p, 'DrawBlock'), 11);
  ctx.useProgram(p);
  const submit = (data, now) => {
    adapter.beginFrame(now);
    ctx.bindVertexArray(vao);
    ctx.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    const heap = new Uint8Array(400);
    heap.set(new Uint8Array(data.buffer), 19);
    ctx.bufferData(gl.UNIFORM_BUFFER, heap, 35040, 19, 368);
    ctx.bindBufferRange(gl.UNIFORM_BUFFER, 11, buffer, 0, 368);
    ctx.drawElements(4, 12, 5123, 0);
    adapter.endFrame();
    adapter.presented(now);
  };
  const a = draw(),
    b = draw();
  b[12] = 4;
  b[32] = 0.2;
  b[37] = 0.6;
  submit(a, 0);
  assert.equal(uploads.length, 0);
  assert.equal(adapter.beginTransition(180), true);
  // A native intro hold longer than the fade must not consume its clock.
  submit(a, 500);
  submit(a, 1000);
  assert.equal(uploads.length, 0);
  submit(b, 1100);
  close(uploads.at(-1).data[12], 0);
  assert.equal(uploads.at(-1).data[32], b[32]);
  submit(b, 1190);
  close(uploads.at(-1).data[12], 2);
  const count = uploads.length;
  submit(b, 1280);
  assert.equal(uploads.length, count);
  // Unknown geometry must not borrow the pose of a body at the same offset.
  adapter.beginTransition();
  vao = {};
  submit(b, 1300);
  assert.equal(uploads.length, count);
  assert.equal(adapter.stats().unsupported, 0);
  adapter.dispose();
});
