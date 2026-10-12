/** Resource/state contract checks without a GPU. Shader compilation is a browser gate. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import * as THREE from 'three';

await mkdir('.local', { recursive: true });
const temporary = await mkdtemp('.local/occlusion-contract-');
let source = await readFile('runtime/avatar/occlusion.ts', 'utf8');
for (const [name, file] of [
  ['vertexShader', 'ao.vert.glsl'],
  ['fragmentShader', 'ao.frag.glsl'],
]) {
  const shader = await readFile(`runtime/avatar/assets/${file}`, 'utf8');
  source = source.replace(
    new RegExp(`import ${name} from [^;]+;`),
    `const ${name} = ${JSON.stringify(shader)};`,
  );
}
await writeFile(
  `${temporary}/occlusion.mjs`,
  ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2020,
    },
  }).outputText,
);
const { AuthoredOcclusion } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/occlusion.mjs`).href
);
const fixture = JSON.parse(await readFile('runtime/avatar/assets/reference-pose.json', 'utf8'));
function harness() {
  const original = new THREE.WebGLRenderTarget(73, 91);
  const draws = [];
  const renderer = {
    target: original,
    autoClear: true,
    xr: { enabled: true },
    fail: false,
    getRenderTarget() {
      return this.target;
    },
    getActiveCubeFace() {
      return 0;
    },
    getActiveMipmapLevel() {
      return 0;
    },
    setRenderTarget(target) {
      this.target = target;
    },
    render(scene) {
      if (this.fail) throw Error('injected render failure');
      draws.push({ target: this.target, material: scene.children[0].material });
    },
  };
  const ao = new AuthoredOcclusion(renderer, fixture.frame);
  return { renderer, original, draws, ao };
}
const projection = new THREE.Matrix4().makeOrthographic(-2, 2, 2, -2, 0.1, 20);
await test('two live passes reuse target textures and resize in physical pixels', () => {
  const { ao, draws, renderer, original } = harness();
  const depth = new THREE.DepthTexture(321, 245);
  const output = ao.render(depth, projection, 321, 245);
  assert.equal(draws.length, 2);
  assert.deepEqual([draws[0].target.width, draws[0].target.height], [161, 123]);
  assert.deepEqual([draws[1].target.width, draws[1].target.height], [321, 245]);
  assert.equal(draws[0].material.defines.ORBIT_ORTHOGRAPHIC_AO, 1);
  assert.equal(draws[1].material.defines.ORBIT_RESOLVE_AO, 1);
  assert.equal(draws[1].material.uniforms.ambientOcclusion.value, draws[0].target.texture);
  assert.equal(ao.render(depth, projection, 321, 245), output);
  assert.equal(ao.render(depth, projection, 640, 480), output);
  assert.equal(draws[0].target, draws[4].target);
  assert.equal(renderer.target, original);
  assert.equal(renderer.autoClear, true);
  assert.equal(renderer.xr.enabled, true);
  const frame = draws[0].material.uniforms.f.value;
  assert.deepEqual(frame.viewport.toArray(), [640, 480, 1 / 640, 1 / 480]);
  assert.deepEqual(frame.effects.toArray(), fixture.frame.effects);
  assert(frame.inverseViewProjection.equals(projection.clone().invert()));
  assert.notEqual(frame.viewport, fixture.frame.viewport);
  ao.dispose();
  original.dispose();
  depth.dispose();
});
await test('render failure restores renderer state and disposal is idempotent', () => {
  const { ao, renderer, original } = harness();
  renderer.fail = true;
  assert.throws(() => ao.render(new THREE.Texture(), projection, 320, 320), /injected/);
  assert.equal(renderer.target, original);
  assert.equal(renderer.autoClear, true);
  assert.equal(renderer.xr.enabled, true);
  ao.dispose();
  ao.dispose();
  assert.throws(() => ao.resize(10, 10), /disposed/);
  original.dispose();
});
await test('perspective, singular matrices and invalid dimensions are rejected', () => {
  const { ao, original } = harness();
  const depth = new THREE.Texture();
  assert.throws(
    () => ao.render(depth, new THREE.PerspectiveCamera().projectionMatrix, 320, 320),
    /orthographic/,
  );
  assert.throws(
    () => ao.render(depth, new THREE.Matrix4().makeScale(0, 0, 0), 320, 320),
    /invertible/,
  );
  assert.throws(() => ao.resize(0, 10), /positive/);
  assert.throws(() => ao.resize(10.5, 10), /positive/);
  ao.dispose();
  original.dispose();
  depth.dispose();
});
await rm(temporary, { recursive: true, force: true });
