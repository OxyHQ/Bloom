import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { splitMotionTransport } from './avatar-motion-transport.mjs';

const directory = '.local/avatar-motion-transport-tests';
await mkdir(directory, { recursive: true });
await writeFile(
  `${directory}/motion-binary.mjs`,
  ts.transpileModule(await readFile('runtime/avatar/motion-binary.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText,
);
for (const name of [
  'motion',
  'computer-loop',
  'breathing',
  'eye-blink',
  'reaction-gaze-data',
  'motion-catalog',
]) {
  let source = await readFile(`runtime/avatar/${name}.ts`, 'utf8');
  if (name === 'motion-catalog') {
    const presets = (await readdir('runtime/avatar/assets/packed-motion')).filter((p) =>
      p.endsWith('.bin'),
    );
    source = source.replace(
      /import computerReturns from '[^']+';/,
      `const computerReturns = ${await readFile('runtime/avatar/assets/motion/computer-returns.json', 'utf8')};`,
    );
    source = source.replace(
      /import\.meta\.glob\('\.\/assets\/packed-motion\/\*\.bin', \{[\s\S]*?\}\)/g,
      (match) => {
        const activity = match.includes('avatar-motion=base') ? 'base' : 'work';
        return JSON.stringify(
          Object.fromEntries(
            presets.map((name) => [
              `./assets/packed-motion/${name}`,
              `https://avatar.test/${activity}/${name}`,
            ]),
          ),
        );
      },
    );
  }
  const code = ts
    .transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
    })
    .outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'");
  await writeFile(`${directory}/${name}.mjs`, code);
}
const { decodeMotionBinary } = await import(
  pathToFileURL(`${process.cwd()}/${directory}/motion-binary.mjs`)
);
const decode = (bytes) =>
  decodeMotionBinary(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
test.after(() => rm(directory, { recursive: true, force: true }));

function withoutStrands(value) {
  if (ArrayBuffer.isView(value)) return value;
  if (Array.isArray(value)) return value.map(withoutStrands);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      withoutStrands(
        key === 'parts' && Array.isArray(child)
          ? child.filter((part) => typeof part.id !== 'string' || !part.id.startsWith('fur:'))
          : child,
      ),
    ]),
  );
}

for (const family of ['packed-motion', 'catalog-motion']) {
  test(`${family}: optional Computer transports reconstruct every retained Float64 channel exactly`, async () => {
    const files = (await readdir(`runtime/avatar/assets/${family}`)).filter((name) =>
      name.endsWith('.bin'),
    );
    let beforeBytes = 0,
      baseBytes = 0,
      workBytes = 0;
    for (const file of files) {
      const original = await readFile(`runtime/avatar/assets/${family}/${file}`);
      const saved = Buffer.from(original);
      const baseBuffer = splitMotionTransport(original, 'base');
      const workBuffer = splitMotionTransport(original, 'work');
      const base = decode(baseBuffer),
        work = decode(workBuffer);
      const expected = withoutStrands(decode(original));
      if (family === 'packed-motion') {
        assert.equal(base.computer, undefined);
        assert.equal(base.computerLoop, undefined);
        assert.equal(work.motion, undefined);
        assert.deepEqual(
          { ...base, computer: work.computer, computerLoop: work.computerLoop },
          expected,
          file,
        );
      } else {
        assert(
          base.rigs.every((rig) => !rig.work),
          `${file} no work clip in baseline`,
        );
        assert(
          work.rigs.every((rig) => !rig.idle && !rig.reaction),
          `${file} no base clip in optional work`,
        );
        assert.deepEqual(
          {
            ...base,
            rigs: base.rigs.map((rig, index) => ({ ...rig, work: work.rigs[index].work })),
          },
          expected,
          file,
        );
      }
      assert.deepEqual(original, saved, 'Frozen source is unchanged');
      beforeBytes += original.length;
      baseBytes += baseBuffer.length;
      workBytes += workBuffer.length;
    }
    assert(files.length >= 8);
    assert(baseBytes < beforeBytes / 2, `${family} base omits most optional motion data`);
    console.log(JSON.stringify({ family, files: files.length, beforeBytes, baseBytes, workBytes }));
  });
}

test('authored idle/reaction fetch no work, concurrent work requests share one exact upgrade', async () => {
  const { loadAuthoredMotion } = await import(
    pathToFileURL(`${process.cwd()}/${directory}/motion-catalog.mjs`)
  );
  const originalFetch = globalThis.fetch;
  const requests = [];
  let failWork = true;
  globalThis.fetch = async (url) => {
    requests.push(url);
    const { pathname } = new URL(url);
    const [, activity, name] = pathname.split('/');
    if (activity === 'work' && failWork) {
      failWork = false;
      return new Response('', { status: 503 });
    }
    return new Response(
      splitMotionTransport(await readFile(`runtime/avatar/assets/packed-motion/${name}`), activity),
    );
  };
  try {
    for (const name of (await readdir('runtime/avatar/assets/packed-motion')).filter((file) =>
      file.endsWith('.bin'),
    )) {
      const preset = name.replace('.bin', '');
      const baseline = loadAuthoredMotion(preset, false);
      assert.equal(
        loadAuthoredMotion(preset, false),
        baseline,
        'Initial subscribers share a fetch',
      );
      const base = await baseline;
      assert.equal(base.work, undefined);
      assert.equal(base.workLoop, undefined);
      assert.equal(
        requests.filter((url) => url.endsWith(name) && url.includes('/work/')).length,
        0,
        'No work download before a request',
      );
      if (failWork) await assert.rejects(loadAuthoredMotion(preset, true), /503/);
      const upgrade = loadAuthoredMotion(preset, true);
      assert.equal(
        loadAuthoredMotion(preset, true),
        upgrade,
        'Concurrent work requests share preparation',
      );
      const complete = await upgrade;
      assert.equal(complete.idle, base.idle, 'Existing idle clocks and prepared sampler retained');
      assert.equal(complete.reaction, base.reaction, 'Reaction gaze is prepared once');
      assert(complete.work && complete.workLoop && complete.workReturn);
      assert.equal(base.work, undefined, 'Base cache is not mutated by work preparation');
      assert.equal(
        requests.filter((url) => url.endsWith(name) && url.includes('/base/')).length,
        1,
      );
      assert.equal(
        requests.filter((url) => url.endsWith(name) && url.includes('/work/')).length,
        preset === 'alfred' ? 2 : 1,
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
