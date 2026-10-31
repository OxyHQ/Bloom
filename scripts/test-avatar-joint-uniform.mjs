import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { Matrix4 } from 'three';
import { WebGLUniforms } from 'three/src/renderers/webgl/WebGLUniforms.js';

const source = await readFile('runtime/avatar/authored-engine.ts', 'utf8');
const declaration = source.match(/const identityJoints = Float32Array\.from\([\s\S]*?\n\);/)?.[0];
assert(declaration);
assert(source.includes('joints: identityJoints'));
const temporary = await mkdtemp('.local/avatar-joint-uniform-');
await writeFile(`${temporary}/joints.mjs`, `${declaration}\nexport { identityJoints };`);
const { identityJoints } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/joints.mjs`).href
);
test.after(() => rm(temporary, { recursive: true, force: true }));

test('actual Three matrix-array uniform upload has identical bytes without per-draw Matrix4 copies', () => {
  const uploads = [];
  const gl = {
    ACTIVE_UNIFORMS: 0x8b86,
    getProgramParameter: () => 1,
    getActiveUniform: () => ({ name: 'skin.joints[0]', size: 24, type: 0x8b5c }),
    getUniformLocation: () => ({}),
    uniformMatrix4fv: (_location, transpose, values) => {
      assert.equal(transpose, false);
      uploads.push(new Float32Array(values));
    },
  };
  const uniforms = new WebGLUniforms(gl, {});
  let copies = 0;
  const previous = Matrix4.prototype.toArray;
  Matrix4.prototype.toArray = function (...args) {
    copies++;
    return previous.apply(this, args);
  };
  try {
    uniforms.setValue(gl, 'skin', { joints: Array.from({ length: 24 }, () => new Matrix4()) });
    assert.equal(copies, 24);
    for (let frame = 0; frame < 4; frame++)
      uniforms.setValue(gl, 'skin', { joints: identityJoints });
    assert.equal(copies, 24);
    assert.equal(uploads.length, 5);
    for (const actual of uploads.slice(1)) {
      assert.deepEqual(actual, uploads[0]);
      assert.deepEqual(new Uint8Array(actual.buffer), new Uint8Array(uploads[0].buffer));
    }
    assert.deepEqual(identityJoints, uploads[0]);
  } finally {
    Matrix4.prototype.toArray = previous;
  }
});
