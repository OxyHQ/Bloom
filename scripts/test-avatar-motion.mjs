/** Run with node --test scripts/test-avatar-motion.mjs after offline asset build. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import * as THREE from 'three';
const temporary = await mkdtemp('.local/motion-contract-');
await writeFile(
  `${temporary}/motion.mjs`,
  ts.transpileModule(await readFile('runtime/avatar/motion.ts', 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText,
);
const { AuthoredMotionSampler } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/motion.mjs`).href
);
const asset = JSON.parse(await readFile('runtime/avatar/assets/motion/blue_beret.json', 'utf8'));
const source =
  process.env.AVATAR_MOTION_SOURCE ||
  asset.evidence?.source ||
  '.local/avatar-runtime-motion/blue_beret';
const evidence = asset.evidence
  ? Object.fromEntries(
      ['idle', 'reaction'].map((kind) => [kind, { start: asset.evidence[kind].nativeStart }]),
    )
  : JSON.parse(await readFile(`${source}/semantic-validation.json`, 'utf8'));
test.after(async () => {
  await rm(temporary, { recursive: true, force: true });
});
for (const name of ['idle', 'reaction'])
  test(`${name}: sampled keyframes reproduce observed part matrices and normals`, async () => {
    const { frames } = JSON.parse(await readFile(`${source}/${name}-raw.json`, 'utf8'));
    const sampler = new AuthoredMotionSampler(asset.clips[name]),
      pose = sampler.createPose();
    for (const time of sampler.clip.times) {
      const frame = frames.find((f) => Math.abs(f.renderTime - evidence[name].start - time) < 1e-8);
      assert(frame, `Missing observed keyframe ${time}`);
      sampler.sample(time, pose);
      for (let i = 0; i < pose.length; i++) {
        const original = frame.draws[i].blocks.DrawBlock;
        for (let k = 0; k < 16; k++)
          assert(
            Math.abs(pose[i].world.elements[k] - original[k]) < 1e-6,
            `${name} ${time} ${i} matrix[${k}]`,
          );
        for (const k of [0, 1, 2, 4, 5, 6, 8, 9, 10])
          assert(Math.abs(pose[i].normalMatrix.elements[k] - original[16 + k]) < 5e-5);
        for (let k = 0; k < 4; k++)
          assert(Math.abs(pose[i].fields.signatureDeform[k] - original[88 + k]) < 1e-8);
      }
    }
  });
test('idle wraps with exact quiet seam; reaction clamps independently for two avatars', () => {
  const idle = new AuthoredMotionSampler(asset.clips.idle),
    a = idle.createPose(),
    b = idle.createPose();
  idle.sample(0, a);
  idle.sample(idle.clip.duration, b);
  assert.deepEqual(a, b);
  idle.sample(idle.clip.duration - 1e-5, b);
  for (let i = 0; i < a.length; i++)
    for (let k = 0; k < 16; k++)
      assert(Math.abs(a[i].world.elements[k] - b[i].world.elements[k]) < 1e-6);
  const reaction = new AuthoredMotionSampler(asset.clips.reaction),
    first = reaction.createPose(),
    second = reaction.createPose();
  reaction.sample(0.5, first);
  const held = JSON.stringify(first);
  reaction.sample(1.5, second);
  assert.equal(JSON.stringify(first), held);
  assert.notDeepEqual(first, second);
  reaction.sample(reaction.clip.duration, first);
  reaction.sample(1e6, second);
  assert.deepEqual(first, second);
});
test('invalid topology, timestamps and channel lengths fail explicitly', () => {
  const bad = structuredClone(asset.clips.idle);
  bad.times[1] = 0;
  assert.throws(() => new AuthoredMotionSampler(bad), /increase/);
  const badChannel = structuredClone(asset.clips.idle);
  badChannel.parts[0].translation = { value: [0, 0] };
  assert.throws(() => new AuthoredMotionSampler(badChannel), /channel/);
  const sampler = new AuthoredMotionSampler(asset.clips.idle);
  assert.throws(() => sampler.sample(NaN, sampler.createPose()), /sampling/);
});

test('export rejects an animated field that the seven-texel renderer cannot upload', async () => {
  const raw = JSON.parse(await readFile(`${source}/idle-raw.json`, 'utf8'));
  raw.frames[Math.floor(raw.frames.length / 2)].draws[0].blocks.DrawBlock[44] += 0.25;
  await writeFile(`${temporary}/idle-raw.json`, JSON.stringify(raw));
  for (const file of ['reaction-raw.json', 'report.json'])
    await writeFile(`${temporary}/${file}`, await readFile(`${source}/${file}`));
  const run = spawnSync(process.execPath, ['scripts/build-avatar-motion-assets.mjs'], {
    env: {
      ...process.env,
      AVATAR_PRESET: 'blue_beret',
      AVATAR_MOTION_SOURCE: temporary,
      AVATAR_MOTION_DESTINATION: `${temporary}/output`,
    },
    encoding: 'utf8',
  });
  assert.equal(run.status, 1, run.stderr);
  const diagnostic = JSON.parse(await readFile(`${temporary}/semantic-validation.json`, 'utf8'));
  assert.equal(diagnostic.idle.rejected, true);
  assert.match(diagnostic.idle.reason, /emissiveMetallic/);
  await assert.rejects(readFile(`${temporary}/output/blue_beret.json`), {
    code: 'ENOENT',
  });
});

test('finite observations retain animated color/closure without claiming an idle loop or terminal reaction', async () => {
  const raw = JSON.parse(await readFile(`${source}/idle-raw.json`, 'utf8'));
  const index = Math.floor(raw.frames.length / 2);
  raw.frames[index].draws[0].blocks.DrawBlock[32] += 0.125;
  raw.frames[index].draws[0].blocks.DrawBlock[68] += 0.25;
  await writeFile(`${temporary}/idle-raw.json`, JSON.stringify(raw));
  const reaction = JSON.parse(await readFile(`${source}/reaction-raw.json`, 'utf8'));
  // A recording ending immediately after a submitted frame is expressly NOT
  // evidence that the reaction finished, but is a valid diagnostic interval.
  reaction.finishedAt = reaction.frames.at(-1).presentedAt;
  await writeFile(`${temporary}/reaction-raw.json`, JSON.stringify(reaction));
  await writeFile(`${temporary}/report.json`, await readFile(`${source}/report.json`));
  const run = spawnSync(process.execPath, ['scripts/build-avatar-motion-assets.mjs'], {
    env: {
      ...process.env,
      AVATAR_PRESET: 'blue_beret',
      AVATAR_MOTION_DIAGNOSTIC: '1',
      AVATAR_MOTION_SOURCE: temporary,
      AVATAR_MOTION_DESTINATION: `${temporary}/observations`,
    },
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const observation = JSON.parse(
    await readFile(`${temporary}/observations/blue_beret.json`, 'utf8'),
  );
  assert.equal(observation.schema, 'bloom.avatar.motion-observations');
  assert.equal(observation.clips, undefined);
  for (const clip of Object.values(observation.observations)) {
    assert.equal(clip.loop, false);
    assert.equal(clip.endSemantics, 'observation-boundary');
  }
  const clip = observation.observations.idle;
  const sampler = new AuthoredMotionSampler(clip),
    pose = sampler.createPose();
  for (let i = 0; i < clip.times.length; i++) {
    sampler.sample(clip.times[i], pose);
    assert.deepEqual(
      pose[0].fields.colorRoughness,
      raw.frames[i].draws[0].blocks.DrawBlock.slice(32, 36),
    );
    assert.deepEqual(
      pose[0].fields.paletteClosure,
      raw.frames[i].draws[0].blocks.DrawBlock.slice(68, 72),
    );
  }
});

test('shader variant changes reject finite observations as well as runtime clips', async () => {
  for (const name of ['idle', 'reaction']) {
    const raw = JSON.parse(await readFile(`${source}/${name}-raw.json`, 'utf8'));
    raw.frames[Math.floor(raw.frames.length / 2)].draws[0].defines[1] +=
      '\n#define UNREPRESENTED_VARIANT 1';
    await writeFile(`${temporary}/${name}-raw.json`, JSON.stringify(raw));
  }
  for (const diagnostic of [false, true]) {
    const run = spawnSync(process.execPath, ['scripts/build-avatar-motion-assets.mjs'], {
      env: {
        ...process.env,
        AVATAR_PRESET: 'blue_beret',
        AVATAR_MOTION_DIAGNOSTIC: diagnostic ? '1' : '0',
        AVATAR_MOTION_SOURCE: temporary,
        AVATAR_MOTION_DESTINATION: `${temporary}/rejected`,
      },
      encoding: 'utf8',
    });
    assert.equal(run.status, 1, run.stdout + run.stderr);
    const report = JSON.parse(
      await readFile(
        `${temporary}/${diagnostic ? 'observation' : 'semantic'}-validation.json`,
        'utf8',
      ),
    );
    for (const clip of Object.values(report))
      assert.match(clip.reason, /shader variant transition/);
    await assert.rejects(readFile(`${temporary}/rejected/blue_beret.json`), {
      code: 'ENOENT',
    });
  }
});

function affineFixture() {
  return {
    duration: 1,
    loop: false,
    times: [0, 1],
    parts: [
      {
        id: 'mesh:test',
        translation: { samples: [1, 2, 3, -2, 4, 5] },
        rotation: { samples: [0, 0, 0, 1, 0, 1, 0, 0] },
        scale: { value: [1, 2, -0.5] },
        shear: { samples: [0.3, -0.2, 0.4, -0.1, 0.5, 0.2] },
        normalCorrection: { value: [0.001, 0, 0, 0, -0.002, 0, 0, 0, 0.003] },
        fields: {},
      },
    ],
  };
}
// Independently assemble T * R * upper-triangular stretch/shear. A raw lerp of
// the endpoint matrices would collapse at the middle of this 180-degree turn.
function expectedAffine(time) {
  const clip = affineFixture(),
    part = clip.parts[0];
  const position = new THREE.Vector3(1, 2, 3).lerp(new THREE.Vector3(-2, 4, 5), time);
  const rotation = new THREE.Quaternion().slerp(new THREE.Quaternion(0, 1, 0, 0), time);
  const [xy, xz, yz] = [0, 1, 2].map(
    (k) => part.shear.samples[k] * (1 - time) + part.shear.samples[3 + k] * time,
  );
  const stretch = new THREE.Matrix4().set(1, xy, xz, 0, 0, 2, yz, 0, 0, 0, -0.5, 0, 0, 0, 0, 1);
  const world = new THREE.Matrix4()
    .makeTranslation(position)
    .multiply(new THREE.Matrix4().makeRotationFromQuaternion(rotation))
    .multiply(stretch);
  const basis = new THREE.Matrix3().getNormalMatrix(world).elements;
  const normal = new THREE.Matrix4();
  for (let column = 0; column < 3; column++)
    for (let row = 0; row < 3; row++)
      normal.elements[column * 4 + row] =
        basis[column * 3 + row] + part.normalCorrection.value[column * 3 + row];
  return { world, normal };
}
function assertMatrixNear(actual, expected, tolerance = 1e-12) {
  for (let k = 0; k < 16; k++)
    assert(
      Math.abs(actual.elements[k] - expected.elements[k]) < tolerance,
      `matrix[${k}] ${actual.elements[k]} != ${expected.elements[k]}`,
    );
}
test('affine interpolation retains shear and reflection without singularities through a 180-degree turn', () => {
  const sampler = new AuthoredMotionSampler(affineFixture()),
    pose = sampler.createPose();
  let previous;
  for (let step = 0; step <= 1000; step++) {
    const time = step / 1000,
      expected = expectedAffine(time);
    sampler.sample(time, pose);
    assertMatrixNear(pose[0].world, expected.world);
    assertMatrixNear(pose[0].normalMatrix, expected.normal);
    assert(Math.abs(pose[0].world.determinant() + 1) < 1e-12);
    if (previous)
      for (let k = 0; k < 16; k++) assert(Math.abs(previous[k] - pose[0].world.elements[k]) < 0.02);
    previous = [...pose[0].world.elements];
  }
});
test('sampler rejects singular scales, orientation crossings, malformed shear and nonunit rotations', () => {
  const singular = affineFixture();
  singular.parts[0].scale.value[2] = 0;
  assert.throws(() => new AuthoredMotionSampler(singular), /Singular/);
  const crossing = affineFixture();
  crossing.parts[0].scale = { samples: [1, 2, -0.5, 1, 2, 0.5] };
  assert.throws(() => new AuthoredMotionSampler(crossing), /singularity/);
  const malformed = affineFixture();
  malformed.parts[0].shear = { value: [1, 2] };
  assert.throws(() => new AuthoredMotionSampler(malformed), /channel/);
  const badNormal = affineFixture();
  badNormal.parts[0].normalCorrection.value[0] = Infinity;
  assert.throws(() => new AuthoredMotionSampler(badNormal), /channel/);
  const badRotation = affineFixture();
  badRotation.parts[0].rotation = { value: [0, 0, 0, 0] };
  assert.throws(() => new AuthoredMotionSampler(badRotation), /quaternion/);
});
test('offline exporter preserves reflected affine source matrices and rejects singular or orientation-changing sources', async () => {
  const folder = `${temporary}/affine`;
  await (await import('node:fs/promises')).mkdir(folder);
  await writeFile(`${folder}/report.json`, await readFile(`${source}/report.json`));
  const original = JSON.parse(await readFile(`${source}/idle-raw.json`, 'utf8'));
  original.frames = original.frames.slice(0, 3);
  for (let i = 0; i < original.frames.length; i++) {
    const expected = expectedAffine(i / 2),
      data = original.frames[i].draws[0].blocks.DrawBlock;
    data.splice(0, 16, ...expected.world.elements);
    data.splice(16, 16, ...expected.normal.elements);
  }
  for (const mode of ['valid', 'singular', 'orientation']) {
    const raw = structuredClone(original),
      data = raw.frames[1].draws[0].blocks.DrawBlock;
    if (mode === 'singular') data[0] = data[1] = data[2] = 0;
    if (mode === 'orientation') for (let k = 8; k < 11; k++) data[k] = -data[k];
    await writeFile(`${folder}/idle-raw.json`, JSON.stringify(raw));
    const run = spawnSync(process.execPath, ['scripts/build-avatar-motion-assets.mjs'], {
      env: {
        ...process.env,
        AVATAR_PRESET: 'blue_beret',
        AVATAR_MOTION_SOURCE: folder,
        AVATAR_MOTION_DESTINATION: `${folder}/${mode}`,
        AVATAR_MOTION_DIAGNOSTIC: '1',
      },
      encoding: 'utf8',
    });
    if (mode === 'valid') {
      assert.equal(run.status, 0, run.stdout + run.stderr);
      const output = JSON.parse(await readFile(`${folder}/${mode}/blue_beret.json`, 'utf8'));
      assert.equal(output.version, 2);
      const clip = output.observations.idle,
        sampler = new AuthoredMotionSampler(clip),
        pose = sampler.createPose();
      for (let i = 0; i < clip.times.length; i++) {
        sampler.sample(clip.times[i], pose);
        assertMatrixNear(pose[0].world, expectedAffine(i / 2).world);
        assertMatrixNear(pose[0].normalMatrix, expectedAffine(i / 2).normal);
      }
    } else {
      assert.equal(run.status, 1, run.stdout + run.stderr);
      const report = JSON.parse(await readFile(`${folder}/observation-validation.json`, 'utf8'));
      assert.match(report.idle.reason, mode === 'singular' ? /Singular/ : /orientation/);
    }
  }
});

test('all sixteen finite observations preserve every captured affine world and normal matrix', async () => {
  for (const preset of [
    'blue_beret',
    'alfred',
    'purple_heart',
    'lime_frog',
    'coral_monocle',
    'gus',
    'blue_spectacles',
    'lime_headphones',
  ]) {
    const exported = JSON.parse(
      await readFile(`.local/avatar-motion-observations/${preset}.json`, 'utf8'),
    );
    assert.equal(exported.version, 2);
    const geometry = JSON.parse(
      await readFile(`.local/avatar-original-geometry/${preset}/geometry.json`, 'utf8'),
    );
    const hashes = new Map(
      geometry.parts.flatMap((part) => [
        [part.vertices.sha256, `mesh:${part.id}`],
        ...(part.fur ? [[part.fur.sha256, `fur:${part.id}`]] : []),
      ]),
    );
    for (const name of ['idle', 'reaction']) {
      const raw = JSON.parse(
        await readFile(`.local/avatar-runtime-motion/${preset}/${name}-raw.json`, 'utf8'),
      );
      const identities = new Map(
        (raw.vertexBuffers || []).map((buffer) => [buffer.id, hashes.get(buffer.sha256)]),
      );
      const clip = exported.observations[name],
        sampler = new AuthoredMotionSampler(clip),
        pose = sampler.createPose();
      assert.equal(clip.loop, false);
      assert.equal(clip.endSemantics, 'observation-boundary');
      assert.equal(clip.times.length, raw.frames.length);
      for (let frame = 0; frame < clip.times.length; frame++) {
        sampler.sample(clip.times[frame], pose);
        const mapped = new Map(
          raw.frames[frame].draws.map((draw, index) => [
            raw.vertexBuffers
              ? identities.get(draw.vertexAttributes.find((a) => a.name === 'position').bufferId)
              : pose[index].id,
            draw,
          ]),
        );
        for (const part of pose) {
          const data = mapped.get(part.id).blocks.DrawBlock;
          assertMatrixNear(part.world, new THREE.Matrix4().fromArray(data), 1e-12);
          assertMatrixNear(part.normalMatrix, new THREE.Matrix4().fromArray(data, 16), 1e-10);
        }
      }
    }
  }
});

test('blue reaction hold is observed natively while render clock continues; idle recurrence is measured', async () => {
  assert.equal(asset.reactionEnd, 'hold');
  const raw = JSON.parse(await readFile(`${source}/reaction-raw.json`, 'utf8'));
  assert.equal(raw.frames.at(-1).renderTime, asset.evidence.reaction.nativeEnd);
  assert.equal(
    raw.finishedRenderTime - raw.frames.at(-1).renderTime,
    asset.evidence.reaction.noFurtherSubmissionsSeconds,
  );
  assert(asset.evidence.reaction.noFurtherSubmissionsSeconds > 10);
  assert.equal(raw.diagnostic.pending, false);
  assert.equal(raw.diagnostic.suspended, false);
  assert.equal(asset.evidence.idle.seamError, 0);
  assert(asset.evidence.idle.completeCycleMax < 1e-12);
  assert(asset.evidence.idle.comparedOverlapFrames >= 300);
});

test('Exact endpoint sampling retains near-singular eyelid scale and normal basis', () => {
  const tiny = 1.0000001e-9;
  assert.notEqual(1 + (tiny - 1), tiny, 'Fixture must distinguish interpolation cancellation');
  const sampler = new AuthoredMotionSampler({
    duration: 1,
    loop: false,
    times: [0, 1],
    parts: [
      {
        id: 'mesh:eye',
        translation: { value: [0, 0, 0] },
        rotation: { samples: [0, 0, 0, 1, 0, 0, 0, 1] },
        scale: { samples: [1, 1, 1, 1, tiny, 1] },
        fields: { parameters: { samples: [1, 0, 0, 0, tiny, 0, 0, 0] } },
      },
    ],
  });
  const pose = sampler.createPose();
  sampler.sample(1, pose);
  assert.equal(pose[0].world.elements[5], tiny);
  assert.equal(pose[0].normalMatrix.elements[5], 1 / tiny);
  assert.equal(pose[0].fields.parameters[0], tiny);
  sampler.sample(0, pose);
  assert.equal(pose[0].world.elements[5], 1);
});
