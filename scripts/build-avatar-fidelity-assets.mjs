/** Convert debugger observations into explicit authoring fixtures and textures.
 * No WebGL interception, WASM, or binary engine layouts ship in the renderer.
 */
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { extendComputerShader } from './build-avatar-computer-shaders.mjs';
const input = '.local/avatar-source-inventory/materials';
const output = 'runtime/avatar/assets';
await mkdir(`${output}/blue_beret`, { recursive: true });
await copyFile(`${input}/blue-beret-original.png`, `${output}/reference.png`);
const state = JSON.parse(await readFile(`${input}/state.json`, 'utf8'));
const draws = state.draws.filter((d) => d.defines.some((s) => s.includes('FELIPE_MATERIAL')));
assert.equal(draws.length, 7);
const frameNames = [
  'viewProjection:16',
  'inverseViewProjection:16',
  'lightViewProjection:16',
  'cameraPosition',
  'keyDirectionIntensity',
  'fillDirectionIntensity',
  'ambientExposure',
  'viewport',
  'effects',
  'studioParameters',
  'errorBodyBounds',
  'characterStudio',
  'shadowParameters',
  'searchLensCenterRadius',
  'searchLensRight',
  'searchLensUp',
  'searchLensStyle',
  'searchLensOptics',
  'thinkingLightPositionStrength',
  'thinkingLightColorRadius',
];
const drawNames = [
  'world:16',
  'normalMatrix:16',
  'colorRoughness',
  'parameters',
  'referencePose',
  'emissiveMetallic',
  'coverage',
  'eyeCurveOriginAmount',
  'eyeCurveRightWidth',
  'eyeCurveUp',
  'paletteBounds',
  'paletteClosure',
  'paletteReference',
  'fur',
  'furEye0',
  'furEye1',
  'signatureDeform',
];
function named(values, names) {
  let offset = 0;
  const result = Object.fromEntries(
    names.map((entry) => {
      const [name, size = '4'] = entry.split(':');
      const value = values.slice(offset, offset + Number(size));
      offset += Number(size);
      return [name, value];
    }),
  );
  assert.equal(offset, values.length);
  return result;
}
const fixture = {
  purpose: 'One fixed pose for material/camera regression. Not an animation controller.',
  preset: 'blue_beret',
  frame: named(draws[0].uniformBlocks.FrameBlock, frameNames),
  parts: draws.slice(0, 6).map((draw) => named(draw.uniformBlocks.DrawBlock, drawNames)),
  copy: state.canvasCopies.findLast((copy) => copy.destinationCss.width === 320),
  sourceTextures: [],
};
for (const name of ['furPile', 'furCards', 'furLTC1', 'furLTC2']) {
  const texture = state.textures.find((t) => t.id === draws[0].samplers[name]);
  assert(texture);
  const bytes = await readFile(`${input}/${texture.file}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), texture.sha256);
  await writeFile(`${output}/${name}.bin`, bytes);
  fixture.sourceTextures.push({ name, ...texture, sourceFile: texture.file, file: `${name}.bin` });
}
await writeFile(`${output}/reference-pose.json`, JSON.stringify(fixture, null, 2));
for (const file of ['geometry.json', 'geometry.bin'])
  await copyFile(
    `.local/avatar-original-geometry/blue_beret/${file}`,
    `${output}/blue_beret/${file}`,
  );
// Mechanical GLSL interface port: same material calculations, named uniforms
// instead of the engine's native UBO ABI. Instance attributes are our own.
for (const [file, sourceFile] of [
  ['authored.vert.glsl', '02-vertex.glsl'],
  ['authored.frag.glsl', '03-fragment.glsl'],
]) {
  let source = await readFile(`${input}/${sourceFile}`, 'utf8');
  source = source.replace(/^#version 300 es\n/, '').replace(/^#define FELIPE_.*\n/gm, '');
  source = source.replace(/layout\(location=\d+\) /g, '');
  source = source.replace(
    /in (vec[234]|uvec4) (delta0|normal1|authoredResponse|skinJoints|skinWeights);/g,
    (_, type, name) =>
      `#ifndef FELIPE_FUR\nin ${type} ${name};\n#else\nconst ${type} ${name}=${type}(0);\n#endif`,
  );
  source = source.replace(
    /layout\(std140\) uniform (\w+) \{([\s\S]*?)\} (\w+);/g,
    (_, name, body, variable) => `struct ${name} {${body}};\nuniform ${name} ${variable};`,
  );
  assert(!source.includes('layout(std140)'));
  if (file.includes('.vert.')) {
    source = source.replace(
      'precision highp float;',
      `precision highp float;\nin mat4 instanceMatrix;\nin vec2 instanceOffset;\nin vec3 instancePigment;\n#ifdef FELIPE_FUR\nin float strandIndex;\n#else\nconst float strandIndex=0.;\n#endif\nuniform mat4 crowdProjection;\nout vec3 pigment;\nmat4 avatarWorld, avatarNormal;\n#ifdef AUTHORED_MOTION\nuniform sampler2D instancePose;\nvec4 avatarParameters, avatarSignatureDeform;\nflat out vec4 avatarColorRoughness, avatarPaletteClosure;\n#endif`,
    );
    source = source
      .replaceAll('d.world', 'avatarWorld')
      .replaceAll('d.normalMatrix', 'avatarNormal');
    source = source
      .replace('vertices[gl_VertexID]', 'vertices[gl_VertexID % 6]')
      .replace('float(gl_InstanceID)', 'strandIndex');
    source = source
      .replaceAll('d.parameters', 'avatarParameters')
      .replaceAll('d.signatureDeform', 'avatarSignatureDeform');
    source = source.replace(
      'uniform DrawBlock d;',
      'uniform DrawBlock d;\n#ifndef AUTHORED_MOTION\n#define avatarParameters d.parameters\n#define avatarSignatureDeform d.signatureDeform\n#endif',
    );
    source = source.replace(
      'void main() {',
      `void main() {\n    #ifdef AUTHORED_MOTION\n    avatarWorld=instanceMatrix;\n    avatarNormal=mat4(texelFetch(instancePose,ivec2(0,gl_InstanceID),0),texelFetch(instancePose,ivec2(1,gl_InstanceID),0),texelFetch(instancePose,ivec2(2,gl_InstanceID),0),vec4(0,0,0,1));\n    avatarParameters=texelFetch(instancePose,ivec2(3,gl_InstanceID),0);\n    avatarSignatureDeform=texelFetch(instancePose,ivec2(4,gl_InstanceID),0);\n    avatarColorRoughness=texelFetch(instancePose,ivec2(5,gl_InstanceID),0);\n    avatarPaletteClosure=texelFetch(instancePose,ivec2(6,gl_InstanceID),0);\n#else\n    avatarWorld=instanceMatrix*d.world;\n    avatarNormal=instanceMatrix*d.normalMatrix;\n#endif\n    pigment=instancePigment;`,
    );
    source = source.replace(
      'gl_Position=(f.viewProjection*vec4(world,1));',
      'gl_Position=crowdProjection*vec4(world.xy+instanceOffset,world.z,1);',
    );
    source = source.replace(
      'gl_Position = f.viewProjection*world;',
      'gl_Position = crowdProjection*vec4(world.xy+instanceOffset,world.zw);',
    );
  } else {
    source = source.replace(
      'precision highp float;',
      'precision highp float;\nin vec3 pigment;\nuniform vec2 outputInverse;',
    );
    source = source.replaceAll('gl_FragCoord.xy*f.viewport.zw', 'gl_FragCoord.xy*outputInverse');
    source = source
      .replaceAll('d.colorRoughness', 'avatarColorRoughness')
      .replaceAll('d.paletteClosure', 'avatarPaletteClosure');
    source = source.replace(
      'uniform DrawBlock d;',
      'uniform DrawBlock d;\n#ifdef AUTHORED_MOTION\nflat in vec4 avatarColorRoughness, avatarPaletteClosure;\n#else\n#define avatarColorRoughness d.colorRoughness\n#define avatarPaletteClosure d.paletteClosure\n#endif',
    );
    // Pigment is a multiplier in linear space, independent for every instance.
    source = source.replace(
      'vec3 albedo=avatarColorRoughness.xyz,',
      'vec3 albedo=avatarColorRoughness.xyz*pigment,',
    );
  }
  await writeFile(`${output}/${file}`, extendComputerShader(source, file.includes('.vert.')));
}
console.log(
  'Original geometry, four material textures, named reference pose and GLSL port generated.',
);
