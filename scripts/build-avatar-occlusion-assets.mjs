/** Build-only mechanical port of the original AO shaders; no engine execution. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const input = '.local/avatar-source-inventory/materials';
const output = 'runtime/avatar/assets';
const sources = [
  [
    '10-vertex.glsl',
    'ao.vert.glsl',
    '0f9d44a621504d8702b9b2673368b14e789a86599a87f0d96bf076b18979c235',
  ],
  [
    '11-fragment.glsl',
    'ao.frag.glsl',
    '01c2cc1cf1d46f8fe0fe37a5c2729a3cefc83820ad9746a49f3ed3da2620d21d',
  ],
];
const digest = (source) => createHash('sha256').update(source).digest('hex');
await mkdir(output, { recursive: true });
const manifest = [];
for (const [sourceFile, file, expected] of sources) {
  const original = await readFile(`${input}/${sourceFile}`, 'utf8');
  assert.equal(digest(original), expected, `pinned original shader ${sourceFile}`);
  assert(original.startsWith('#version 300 es\n'));
  let source = original.replace(/^#version 300 es\n/, '');
  if (file.includes('.frag.')) {
    let blocks = 0;
    source = source.replace(/layout\(std140\) uniform FrameBlock \{([\s\S]*?)\} f;/g, (_, body) => {
      blocks++;
      return `struct FrameBlock {${body}};\nuniform FrameBlock f;`;
    });
    assert.equal(blocks, 1, 'one original frame block');
    assert(source.includes('#ifdef ORBIT_ORTHOGRAPHIC_AO'));
    assert(source.includes('#ifdef ORBIT_RESOLVE_AO'));
    source = source.replace(
      'uniform FrameBlock f;',
      `uniform FrameBlock f;
// Per-avatar camera and sampling density in the shared depth atlas.
uniform sampler2D avatarCameras;
uniform vec4 avatarGrid;
vec2 avatarPixel(vec2 uv) {
    vec2 origin=f.viewport.xy*.5-avatarGrid.xy*avatarGrid.z*.5;
    return vec2(uv.x,1.-uv.y)*f.viewport.xy-origin;
}
ivec2 avatarCell(vec2 uv) { return ivec2(floor(avatarPixel(uv)/max(avatarGrid.z,1.))); }
vec2 avatarScale(vec2 uv) {
    if(avatarGrid.z<=0.)return vec2(1.);
    ivec2 cell=avatarCell(uv);
    int index=cell.y*int(avatarGrid.x)+cell.x;
    if(any(lessThan(cell,ivec2(0)))||cell.x>=int(avatarGrid.x)||index>=int(avatarGrid.w))return vec2(1.);
    return max(texelFetch(avatarCameras,ivec2(index,0),0).xy,vec2(.0001));
}
bool sameAvatar(vec2 a,vec2 b) { return avatarGrid.z<=0.||all(equal(avatarCell(a),avatarCell(b))); }
float avatarPixels() { return avatarGrid.z>0.?avatarGrid.z:min(f.viewport.x,f.viewport.y); }
uvec2 avatarNoisePixel(vec2 uv) {
    if(avatarGrid.z<=0.)return uvec2(uv*f.viewport.xy);
    vec2 local=mod(avatarPixel(uv),avatarGrid.z);
    return uvec2(max(vec2(local.x,avatarGrid.z-local.y),vec2(0.)));
}`,
    );
    const units = 'vec2 worldPerPixel=units.xy*f.viewport.zw;';
    assert(source.includes(units));
    source = source.replace(units, 'units.xy/=avatarScale(uv);\n    ' + units);
    source = source.replaceAll('min(f.viewport.x,f.viewport.y)>128.', 'avatarPixels()>128.');
    source = source.replaceAll('min(f.viewport.x,f.viewport.y)>256.', 'avatarPixels()>256.');
    source = source.replaceAll(
      'uvec2 pixel = uvec2(uv*f.viewport.xy);',
      'uvec2 pixel = avatarNoisePixel(uv);',
    );
    source = source.replace(
      'float footprint = 2.*max(length(f.inverseViewProjection[0].xyz)/float(size.x),\n                             length(f.inverseViewProjection[1].xyz)/float(size.y));',
      'vec2 cameraScale=avatarScale(uv);\n    float footprint = 2.*max(length(f.inverseViewProjection[0].xyz)/(float(size.x)*cameraScale.x),\n                             length(f.inverseViewProjection[1].xyz)/(float(size.y)*cameraScale.y));',
    );
    source = source.replaceAll(
      'float sampleDepth = texture(cameraDepth,sampleUV).r;',
      'if(!sameAvatar(uv,sampleUV))continue;\n            float sampleDepth = texture(cameraDepth,sampleUV).r;',
    );
    source = source.replace(
      'float depth=texture(cameraDepth,sampleUV).r;',
      'if(!sameAvatar(uv,sampleUV))continue;\n        float depth=texture(cameraDepth,sampleUV).r;',
    );
  }
  assert(!source.includes('layout(std140)'));
  await writeFile(`${output}/${file}`, source);
  manifest.push({
    file,
    sha256: digest(source),
    sourceFile,
    sourceSha256: expected,
  });
}
await writeFile(
  `${output}/ao-provenance.json`,
  `${JSON.stringify({ transformation: 'Remove GLSL version; replace FrameBlock UBO. Preserve sampling/resolve equations in each avatar camera space: per-avatar projected units, pixel budgets and noise phase; reject samples from other cells of the shared depth atlas.', shaders: manifest }, null, 2)}\n`,
);
console.log('Original AO and fullscreen shaders exported with verified source hashes.');
