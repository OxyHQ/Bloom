/** Offline Computer contract: byte-exact meshes and semantic poses, independent of renderer. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { extendComputerShader } from './build-avatar-computer-shaders.mjs';
const presets = process.env.AVATAR_PRESET
  ? [process.env.AVATAR_PRESET]
  : [
      'blue_beret',
      'alfred',
      'purple_heart',
      'lime_frog',
      'coral_monocle',
      'gus',
      'blue_spectacles',
      'lime_headphones',
    ];
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const tmp = await mkdtemp('.local/computer-contract-');
await writeFile(
  `${tmp}/motion.mjs`,
  ts.transpileModule(
    await readFile('runtime/avatar/motion.ts', 'utf8'),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    },
  ).outputText,
);
const { AuthoredMotionSampler } = await import(
  pathToFileURL(`${process.cwd()}/${tmp}/motion.mjs`)
);
test.after(() => rm(tmp, { recursive: true, force: true }));
for (const preset of presets) {
  const base = `runtime/avatar/assets/${preset}`;
  const [raw, geometry, motion, material, binary] = await Promise.all([
    read(`.local/avatar-computer-source/${preset}/work-raw.json`),
    read(`${base}/computer-geometry.json`),
    read(`${base}/computer-motion.json`),
    read(`${base}/computer-material.json`),
    readFile(`${base}/computer-geometry.bin`),
  ]);
  const identity = new Map(
    geometry.parts.flatMap((p) => [
      [p.vertices.sha256, `mesh:${p.id}`],
      ...(p.fur ? [[p.fur.sha256, `fur:${p.id}`]] : []),
    ]),
  );
  const buffers = new Map(
    raw.geometryBuffers.map((b) => [b.id, Buffer.from(b.bytes)]),
  );
  const physical = new Map();
  const baseMeshCount = geometry.baseMeshCount;
  assert(Number.isInteger(baseMeshCount) && baseMeshCount > 0);
  assert.equal(baseMeshCount, motion.validation.baseMeshes);
  let nextId = baseMeshCount;
  for (const frame of raw.frames)
    for (const draw of frame.draws) {
      const attr = draw.vertexAttributes.find((a) => a.name === 'position');
      if (!physical.has(attr.bufferId)) {
        const match = identity.get(hash(buffers.get(attr.exportBufferId)));
        physical.set(
          attr.bufferId,
          match?.startsWith('fur:') ||
            Number(match?.split(':')[1]) < baseMeshCount
            ? match
            : `mesh:${nextId++}`,
        );
      }
    }
  test(`${preset}: original vertex/index bytes and draw state match exported Computer parts`, () => {
    assert.equal(hash(binary), geometry.buffer.sha256);
    let checked = 0;
    for (const frame of raw.frames)
      for (const draw of frame.draws) {
        const vertex = buffers.get(
            draw.vertexAttributes.find((a) => a.name === 'position')
              .exportBufferId,
          ),
          id = physical.get(
            draw.vertexAttributes.find((a) => a.name === 'position').bufferId,
          );
        assert(id, 'Original geometry has exact exported identity');
        const p = geometry.parts[Number(id.split(':')[1])],
          range = id.startsWith('fur:') ? p.fur : p.vertices;
        assert(
          binary
            .subarray(range.byteOffset, range.byteOffset + range.byteLength)
            .equals(vertex),
        );
        if (!id.startsWith('fur:')) {
          const range = p.indices[0];
          assert(
            binary
              .subarray(range.byteOffset, range.byteOffset + range.byteLength)
              .equals(
                buffers
                  .get(draw.indexBufferId)
                  .subarray(draw.args[3], draw.args[3] + draw.args[1] * 2),
              ),
          );
          const m = material.parts[p.id];
          assert.equal(m.transparent, draw.renderState.blend);
          assert.equal(m.depthWrite, draw.renderState.depthWrite);
        }
        checked++;
      }
    assert(checked > 3000);
  });
  test(`${preset}: every Work keyframe reproduces native world, normal, fields, visibility and painter order`, () => {
    const sampler = new AuthoredMotionSampler(motion.clip),
      pose = sampler.createPose();
    const start = raw.calls.find(
      (c) => c.method === 'applyActivity' && c.args[0].command === 1,
    ).renderTime;
    for (const time of motion.clip.times) {
      const frame = raw.frames.find(
        (f) => Math.abs(f.renderTime - start - time) < 1e-8,
      );
      assert(frame);
      sampler.sample(time, pose);
      const visible = new Map(
        frame.draws.map((draw) => [
          physical.get(
            draw.vertexAttributes.find((a) => a.name === 'position').bufferId,
          ),
          draw,
        ]),
      );
      let order = -1;
      for (const id of visible.keys()) {
        const next = motion.validation.renderOrder.indexOf(id);
        assert(next > order);
        order = next;
      }
      for (const p of pose) {
        const draw = visible.get(p.id);
        assert.equal(
          p.fields.camera[3],
          draw ? 1 : 0,
          `${time} ${p.id} visibility`,
        );
        if (!draw) continue;
        let at = 0;
        for (const [name, value] of Object.entries(material.parts[0].fields)) {
          const original = draw.blocks.DrawBlock.slice(at, at + value.length);
          at += value.length;
          const actual =
            name === 'world'
              ? p.world.elements
              : name === 'normalMatrix'
                ? p.normalMatrix.elements
                : p.fields[name];
          for (let k = 0; k < value.length; k++)
            assert(
              Math.abs(actual[k] - original[k]) <
                (name === 'normalMatrix' ? 5e-5 : 1e-6),
              `${time} ${p.id} ${name}[${k}]`,
            );
        }
      }
    }
    assert.equal(motion.clip.loop, false);
    assert.equal(motion.endState.activityMode, false);
  });
}
test('Computer shader extension is idempotent and projection helper is declared before fur', async () => {
  for (const suffix of ['vert', 'frag']) {
    const source = await readFile(
      `runtime/avatar/assets/authored.${suffix}.glsl`,
      'utf8',
    );
    assert.equal(extendComputerShader(source, suffix === 'vert'), source);
    if (suffix === 'vert') {
      assert(
        source.indexOf('vec4 computerProjection(vec3 world);') <
          source.indexOf('void felipeFurVertex()'),
      );
      assert(source.includes('pixels*=abs(avatarComputerCamera.y)'));
    } else {
      const handPatch =
        '\n    // AUTHORED_COMPUTER_HAND_PIGMENT_V1\n    if (avatarComputerReference.w == -40.0) albedo *= pigment;';
      assert.equal(
        source.split(handPatch).length,
        2,
        'Exactly one explicit authored hand tint',
      );
      const untinted = source.replace(handPatch, '');
      // Regenerating an existing port changes only this input assignment.
      // The rest of the original material, including roughness/specular, is identical.
      assert.equal(extendComputerShader(untinted, false), source);
      assert(
        source.includes('vec3 albedo = avatarColorRoughness.xyz;' + handPatch),
      );
    }
  }
});
