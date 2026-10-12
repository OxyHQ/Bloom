/** Prove Computer handoff from paired original observations; emit semantic clocks only. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import ts from 'typescript';

export const presets = [
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
const hash = (value) => createHash('sha256').update(value).digest('hex');

export function semanticFrames(raw) {
  const identities = new Map(raw.vertexBuffers.map((buffer) => [buffer.id, buffer.sha256]));
  return raw.frames.map((frame) => {
    const parts = frame.draws
      .map((draw) => {
        const id = identities.get(
          draw.vertexAttributes.find((a) => a.name === 'position').bufferId,
        );
        assert(id, 'Every part needs original geometry identity');
        return {
          id,
          method: draw.method,
          defines: draw.defines,
          blocks: draw.blocks,
        };
      })
      .sort(
        (a, b) => a.id.localeCompare(b.id) || JSON.stringify(a).localeCompare(JSON.stringify(b)),
      );
    // Repeated geometry (the two hands) remains a full semantic multiset;
    // no draw is dropped or paired by an unstable draw ordinal.
    return { time: frame.renderTime, signature: hash(JSON.stringify(parts)) };
  });
}

export function proveReturn(work, idle) {
  const start = work.calls.filter((c) => c.method === 'applyActivity' && c.args[0].command === 1);
  const stop = work.calls.filter((c) => c.method === 'applyActivity' && c.args[0].command === 2);
  assert.equal(start.length, 1);
  assert.equal(stop.length, 1);
  assert.equal(work.fixedStep, 60);
  assert.equal(idle.fixedStep, 60);
  assert.equal(work.diagnostic.activityMode, false);
  assert.equal(work.diagnostic.stoppingWork, false);
  const frames = semanticFrames(work),
    reference = new Map(semanticFrames(idle).map((f) => [f.time, f.signature]));
  let first = frames.length;
  while (first > 0 && reference.get(frames[first - 1].time) === frames[first - 1].signature)
    first--;
  if (first === frames.length) return null;
  const tail = frames.slice(first);
  assert(tail.length >= 60, 'Need at least one second of sustained exact native continuation');
  assert(tail[0].time > stop[0].renderTime, 'Return must follow this episode Stop');
  for (let i = 1; i < tail.length; i++)
    assert(Math.abs(tail[i].time - tail[i - 1].time - 1 / 60) < 1e-12, 'No missing tail samples');
  assert(
    first > 0 && reference.has(frames[first - 1].time),
    'Need paired preceding non-return frame',
  );
  return {
    nativeStart: start[0].renderTime,
    nativeStop: stop[0].renderTime,
    nativeReturn: tail[0].time,
    returnTime: tail[0].time - start[0].renderTime,
    nativeEnd: tail.at(-1).time,
    exactTailFrames: tail.length,
    previousNonmatchingTime: frames[first - 1].time,
    compared: [
      'geometry-sha256 identity',
      'draw method',
      'shader defines',
      'entire DrawBlock',
      'entire FrameBlock',
      'entire SkinBlock',
    ],
    excludedChannels: [],
  };
}

export async function importSampler() {
  const directory = await mkdtemp('.local/return-sampler-');
  await writeFile(
    `${directory}/motion.mjs`,
    ts.transpileModule(await readFile('runtime/avatar/motion.ts', 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    }).outputText,
  );
  const module = await import(pathToFileURL(`${process.cwd()}/${directory}/motion.mjs`));
  await rm(directory, { recursive: true, force: true });
  return module.AuthoredMotionSampler;
}

export function compareSampledReturn(Sampler, work, idle, returnTime, idleTime) {
  const a = new Sampler(work),
    b = new Sampler(idle),
    ap = a.createPose(),
    bp = b.createPose();
  a.sample(returnTime, ap);
  b.sample(idleTime, bp);
  const active = new Map(
    ap.filter((p) => !p.fields.camera || p.fields.camera[3] === 1).map((p) => [p.id, p]),
  );
  assert.equal(active.size, bp.length, 'All props gone and all base parts present');
  let matrixMax = 0,
    normalMax = 0,
    fieldMax = 0;
  for (const right of bp) {
    const left = active.get(right.id);
    assert(left, `Missing ${right.id}`);
    for (let k = 0; k < 16; k++) {
      matrixMax = Math.max(matrixMax, Math.abs(left.world.elements[k] - right.world.elements[k]));
      normalMax = Math.max(
        normalMax,
        Math.abs(left.normalMatrix.elements[k] - right.normalMatrix.elements[k]),
      );
    }
    for (const [name, values] of Object.entries(right.fields)) {
      assert(left.fields[name], `Missing shared field ${name}`);
      for (let k = 0; k < values.length; k++)
        fieldMax = Math.max(fieldMax, Math.abs(left.fields[name][k] - values[k]));
    }
    assert.deepEqual(
      left.fields.camera,
      [1, 1, 0, 1],
      'Computer camera must return to base camera',
    );
  }
  // Same existing sampler precision requirements as every Computer keyframe gate.
  assert(matrixMax < 1e-6, `World handoff error ${matrixMax}`);
  assert(normalMax < 5e-5, `Normal handoff error ${normalMax}`);
  assert(fieldMax < 1e-6, `Material handoff error ${fieldMax}`);
  return { matrixMax, normalMax, fieldMax, baseParts: bp.length };
}

export const canonicalReturnPath = 'runtime/avatar/assets/motion/computer-returns.json';

/** A diagnostic subset must never replace the application's complete return index. */
export function returnDestination(selected, requested) {
  assert(
    selected.length > 0 && new Set(selected).size === selected.length,
    'Return presets must be nonempty and unique',
  );
  assert(
    selected.every((preset) => presets.includes(preset)),
    'Unknown return preset',
  );
  const complete = selected.length === presets.length;
  const destination = resolve(requested || canonicalReturnPath);
  if (!complete) {
    assert(requested, 'Filtered return export requires explicit AVATAR_RETURN_OUTPUT');
    assert.notEqual(
      destination,
      resolve(canonicalReturnPath),
      'Filtered return export cannot replace the canonical index',
    );
  }
  return destination;
}

export async function build() {
  const selected = process.env.AVATAR_PRESET?.split(',') || presets;
  const destination = returnDestination(selected, process.env.AVATAR_RETURN_OUTPUT);
  const Sampler = await importSampler(),
    entries = {};
  for (const preset of selected) {
    const workPath = `.local/avatar-computer-source/${preset}/work-raw.json`;
    const idlePath =
      preset === 'blue_beret'
        ? process.env.AVATAR_RETURN_BLUE_IDLE ||
          '.local/avatar-return-source/blue_beret/idle-raw.json'
        : `.local/avatar-runtime-motion-actions/${preset}/idle-raw.json`;
    const workBytes = await readFile(workPath),
      idleBytes = await readFile(idlePath);
    const proof = proveReturn(JSON.parse(workBytes), JSON.parse(idleBytes));
    assert(proof, `${preset}: no proven return in paired observation`);
    const motionPath = `runtime/avatar/assets/motion/${preset}.json`,
      computerPath = `runtime/avatar/assets/${preset}/computer-motion.json`;
    const motion = await read(motionPath),
      computer = await read(computerPath);
    const idleNativeStart = motion.evidence?.idle?.nativeStart;
    assert(Number.isFinite(idleNativeStart), `${preset}: idle phase evidence missing`);
    const idleTime = proof.nativeReturn - idleNativeStart;
    assert(
      idleTime >= 0 && idleTime <= motion.clips.idle.duration,
      'Handoff must lie inside observed idle, without assuming periodic repetition',
    );
    const sampler = compareSampledReturn(
      Sampler,
      computer.clip,
      motion.clips.idle,
      proof.returnTime,
      idleTime,
    );
    entries[preset] = {
      ...proof,
      idleTime,
      idleNativeStart,
      sampler,
      sources: {
        work: { path: workPath, sha256: hash(workBytes) },
        idle: { path: idlePath, sha256: hash(idleBytes) },
        motion: { path: motionPath, sha256: hash(await readFile(motionPath)) },
        computer: {
          path: computerPath,
          sha256: hash(await readFile(computerPath)),
        },
      },
    };
    console.log(
      `${preset}: exact ${proof.exactTailFrames} frames; Work ${proof.returnTime} → idle ${idleTime}; world error ${sampler.matrixMax}`,
    );
  }
  const output = {
    schema: 'bloom.avatar.computer-returns',
    version: 1,
    limitations: [
      'Observed single-cycle Work episodes at native command time 3. Arbitrary command-phase entry and different workingCycles are not proven by these fixtures.',
      'Exact full-block paired tail proves the native handoff, not unobserved future idle behavior.',
    ],
    presets: entries,
  };
  await writeFile(destination, JSON.stringify(output, null, 2) + '\n');
  return output;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await build();
