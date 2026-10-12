/** Mechanical, reproducible Computer interface extension. Material equations
 * remain the original source; only per-avatar semantic inputs are redirected. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export function extendComputerShader(source, vertex) {
  // Projection zoom affects the native fur density/coverage calculation too.
  if (vertex && !source.includes('// AUTHORED_COMPUTER_FUR_BUDGET_V1')) {
    const original =
      'float pixels=d.fur.y*d.fur.z*worldScale*abs(f.viewProjection[1].y)*f.viewport.y*.5;';
    assert(source.includes(original));
    source = source.replace(
      original,
      `${original}\n// AUTHORED_COMPUTER_FUR_BUDGET_V1\n#ifdef AUTHORED_COMPUTER\n    pixels*=abs(avatarComputerCamera.y);\n#endif`,
    );
  }
  if (vertex && !source.includes('vec4 computerProjection(vec3 world);'))
    source = source.replace(
      'uniform DrawBlock d;',
      'uniform DrawBlock d;\nvec4 computerProjection(vec3 world);',
    );
  if (source.includes('// AUTHORED_COMPUTER_INTERFACE_V1'))
    return tintComputerHands(extendComputerOcclusion(source, vertex), vertex);
  const replacements = {
    referencePose: 'avatarComputerReference',
    coverage: 'avatarComputerCoverage',
    eyeCurveOriginAmount: 'avatarComputerEye0',
    eyeCurveRightWidth: 'avatarComputerEye1',
  };
  if (!vertex)
    Object.assign(replacements, {
      world: 'avatarComputerWorld',
      normalMatrix: 'avatarComputerNormal',
      parameters: 'avatarComputerParameters',
    });
  for (const [field, name] of Object.entries(replacements))
    source = source.replaceAll(`d.${field}`, name);
  const aliases = Object.entries(replacements)
    .map(([field, name]) => `#define ${name} d.${field}`)
    .join('\n');
  const common =
    'vec4 avatarComputerReference,avatarComputerCoverage,avatarComputerEye0,avatarComputerEye1;';
  const declarations = vertex
    ? `flat out highp int avatarInstanceIndex;\nvec4 avatarComputerCamera;\n${common}`
    : `flat in highp int avatarInstanceIndex;\nuniform highp sampler2D instancePose;\nmat4 avatarComputerWorld,avatarComputerNormal;\nvec4 avatarComputerParameters;\n${common}`;
  source = source.replace(
    'uniform DrawBlock d;',
    `uniform DrawBlock d;\n// AUTHORED_COMPUTER_INTERFACE_V1\n#ifdef AUTHORED_COMPUTER\n${declarations}\n#else\n${aliases}\n#endif`,
  );
  const row = vertex ? 'gl_InstanceID' : 'avatarInstanceIndex';
  const fetch = (n) => `texelFetch(instancePose,ivec2(${n},${row}),0)`;
  let initialize = `avatarComputerReference=${fetch(7)};\navatarComputerCoverage=${fetch(8)};\navatarComputerEye0=${fetch(10)};\navatarComputerEye1=${fetch(11)};`;
  if (vertex)
    initialize += `\navatarInstanceIndex=gl_InstanceID;\navatarComputerCamera=${fetch(9)};`;
  else
    initialize += `\navatarComputerParameters=${fetch(3)};\navatarComputerNormal=mat4(${fetch(0)},${fetch(1)},${fetch(2)},vec4(0,0,0,1));\navatarComputerWorld=mat4(${fetch(12)},${fetch(13)},${fetch(14)},${fetch(15)});`;
  assert(source.includes('void main() {'));
  source = source.replace(
    'void main() {',
    `void main() {\n#ifdef AUTHORED_COMPUTER\n${initialize}\n#endif`,
  );
  if (vertex) {
    const helper = `vec4 computerProjection(vec3 world) {\n#ifdef AUTHORED_COMPUTER\n    if(avatarComputerCamera.w<=0.) return vec4(2,2,2,1);\n    world.xy=world.xy*avatarComputerCamera.xy+vec2(0,avatarComputerCamera.z);\n#endif\n    return crowdProjection*vec4(world.xy+instanceOffset,world.z,1);\n}\n`;
    source = source.replace('void main() {', `${helper}void main() {`);
    assert(source.includes('gl_Position=crowdProjection*vec4(world.xy+instanceOffset,world.z,1);'));
    source = source.replace(
      'gl_Position=crowdProjection*vec4(world.xy+instanceOffset,world.z,1);',
      'gl_Position=computerProjection(world);',
    );
    assert(
      source.includes('gl_Position = crowdProjection*vec4(world.xy+instanceOffset,world.zw);'),
    );
    source = source.replace(
      'gl_Position = crowdProjection*vec4(world.xy+instanceOffset,world.zw);',
      'gl_Position = computerProjection(world.xyz);',
    );
  }
  return tintComputerHands(extendComputerOcclusion(source, vertex), vertex);
}
function tintComputerHands(source, vertex) {
  const marker = '// AUTHORED_COMPUTER_HAND_PIGMENT_V1';
  if (vertex || source.includes(marker)) return source;
  const original = 'vec3 albedo = avatarColorRoughness.xyz;';
  assert.equal(source.split(original).length, 2, 'Exactly one universal albedo initialization');
  // -40 is the original authored hand semantic. Apply the body's relative
  // pigment only to its albedo; retain captured roughness, reflectance and lighting.
  return source.replace(
    original,
    `${original}\n    ${marker}\n    if (avatarComputerReference.w == -40.0) albedo *= pigment;`,
  );
}
function extendComputerOcclusion(source, vertex) {
  if (source.includes('// AUTHORED_COMPUTER_OCCLUSION_V1')) return source;
  if (vertex) {
    const declaration = 'flat out highp int avatarInstanceIndex;';
    assert(source.includes(declaration));
    source = source.replace(
      declaration,
      `${declaration}\n// AUTHORED_COMPUTER_OCCLUSION_V1\nflat out highp vec2 avatarCanvasOffset;`,
    );
    source = source.replace(
      'avatarInstanceIndex=gl_InstanceID;',
      'avatarInstanceIndex=gl_InstanceID;\navatarCanvasOffset=instanceOffset;',
    );
  } else {
    const declaration = 'flat in highp int avatarInstanceIndex;';
    assert(source.includes(declaration));
    source = source.replace(
      declaration,
      `${declaration}\n// AUTHORED_COMPUTER_OCCLUSION_V1\nflat in highp vec2 avatarCanvasOffset;\nuniform mat4 crowdInverseProjection;\nvec4 avatarComputerCamera;`,
    );
    source = source.replace(
      'avatarComputerParameters=texelFetch(instancePose,ivec2(3,avatarInstanceIndex),0);',
      'avatarComputerParameters=texelFetch(instancePose,ivec2(3,avatarInstanceIndex),0);\navatarComputerCamera=texelFetch(instancePose,ivec2(9,avatarInstanceIndex),0);',
    );
    const original =
      'vec3 occlusionPosition(vec2 uv, float depth) {\n    vec4 p = f.inverseViewProjection*vec4(uv*2.-1.,depth*2.-1.,1.);\n    return p.xyz/p.w;\n}';
    assert(source.includes(original));
    source = source.replace(
      original,
      `vec3 occlusionPosition(vec2 uv, float depth) {
#ifdef AUTHORED_COMPUTER
    vec4 p=crowdInverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);
    vec3 world=p.xyz/p.w;
    world.xy=(world.xy-avatarCanvasOffset-vec2(0.,avatarComputerCamera.z))/avatarComputerCamera.xy;
    return world;
#else
    vec4 p=f.inverseViewProjection*vec4(uv*2.-1.,depth*2.-1.,1.);
    return p.xyz/p.w;
#endif
}`,
    );
  }
  return source;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const suffix of ['vert', 'frag']) {
    const path = `runtime/avatar/assets/authored.${suffix}.glsl`;
    await writeFile(path, extendComputerShader(await readFile(path, 'utf8'), suffix === 'vert'));
  }
}
