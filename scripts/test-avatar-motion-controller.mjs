import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const temporary = await mkdtemp('.local/motion-controller-test-');
await writeFile(
  `${temporary}/controller.mjs`,
  ts.transpileModule(
    await readFile('runtime/avatar/motion-controller.ts', 'utf8'),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    },
  ).outputText,
);
const { advanceMotion } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/controller.mjs`)
);
test.after(() => rm(temporary, { recursive: true, force: true }));

const samplers = {
  reaction: { clip: { duration: 2.5 } },
  work: { clip: { duration: 7 } },
  reactionReturnTime: 1.75,
  workReturn: { time: 3.25, idleTime: 2.5 },
};

test('Computer completes at its verified return, retaining overshoot in the idle clock', () => {
  const work = { kind: 'work', started: 100 };
  assert.equal(advanceMotion(work, samplers, 103.24), work);
  const exact = advanceMotion(work, samplers, 103.25);
  assert.deepEqual(exact, { kind: 'idle', started: 100.75 });
  const late = advanceMotion(work, samplers, 104);
  assert.equal(104 - late.started, 3.25);
  assert.equal(
    advanceMotion(late, samplers, 200),
    late,
    'Do not repeatedly reset idle',
  );
});

test('held editor frames remain inspectable beyond both action endpoints', () => {
  for (const kind of ['work', 'reaction']) {
    const held = { kind, started: 0, held: 7 };
    assert.equal(advanceMotion(held, samplers, 100), held);
  }
});

test('continuous Computer survives the short episode return and many complete cycles', () => {
  const continuous = { kind: 'work', started: 100, continuous: true };
  for (const time of [100, 103.25, 107, 113, 700])
    assert.equal(advanceMotion(continuous, samplers, time), continuous);
  assert.deepEqual(
    advanceMotion({ kind: 'work', started: 100 }, samplers, 107),
    {
      kind: 'idle',
      started: 100.75,
    },
  );
});

test('a queued reaction runs once and returns at the correct phase', () => {
  const reaction = { kind: 'reaction', started: 10, queuedReaction: true };
  assert.equal(advanceMotion(reaction, samplers, 12.49), reaction);
  const next = advanceMotion(reaction, samplers, 12.5);
  assert.deepEqual(next, { kind: 'reaction', started: 12.5 });
  assert.deepEqual(advanceMotion(next, samplers, 15), {
    kind: 'idle',
    started: 13.25,
  });
  assert.deepEqual(reaction, {
    kind: 'reaction',
    started: 10,
    queuedReaction: true,
  });
});

test('a delayed frame crossing both reactions consumes the bounded queue in one update', () => {
  assert.deepEqual(
    advanceMotion(
      { kind: 'reaction', started: 10, queuedReaction: true },
      samplers,
      20,
    ),
    { kind: 'idle', started: 13.25 },
  );
});

test('unverified endpoints stay finite instead of inventing an idle transition', () => {
  const unverified = { reaction: samplers.reaction, work: samplers.work };
  for (const kind of ['work', 'reaction']) {
    const motion = { kind, started: 0 };
    assert.equal(advanceMotion(motion, unverified, 100), motion);
  }
});

test('idle and implicit idle retain their phase', () => {
  assert.equal(advanceMotion(undefined, samplers, 100), undefined);
  const idle = { kind: 'idle', started: -8 };
  assert.equal(advanceMotion(idle, samplers, 100), idle);
});

test('avatars using shared samplers keep independent action clocks and queues', () => {
  const a = { kind: 'work', started: 4 };
  const b = { kind: 'work', started: 7 };
  assert.deepEqual(advanceMotion(a, samplers, 8), {
    kind: 'idle',
    started: 4.75,
  });
  assert.equal(advanceMotion(b, samplers, 8), b);
  assert.deepEqual(a, { kind: 'work', started: 4 });
});

test('finite Computer episodes count every cycle and return at the final verified seam', () => {
  const work = { kind: 'work', started: 10, remainingCycles: 3 };
  assert.deepEqual(advanceMotion(work, samplers, 13.25), {
    ...work,
    started: 13.25,
    remainingCycles: 2,
  });
  assert.deepEqual(advanceMotion(work, samplers, 16.6), {
    ...work,
    started: 16.5,
    remainingCycles: 1,
  });
  assert.deepEqual(advanceMotion(work, samplers, 10000), {
    kind: 'idle',
    started: 17.25,
  });
  assert.deepEqual(work, { kind: 'work', started: 10, remainingCycles: 3 });
});

for (const kind of ['reaction', 'work'])
  test(`${kind}: a late first presentation starts at zero without advancing any neighbor`, () => {
    const command = { kind, started: 2, pendingStart: true };
    const neighbor = { kind: 'idle', started: -4 };
    const first = advanceMotion(command, samplers, 100);
    assert.deepEqual(first, { kind, started: 100 });
    assert.equal(100 - first.started, 0);
    assert.equal(advanceMotion(neighbor, samplers, 100), neighbor);
    assert.equal(100 - neighbor.started, 104);
    assert.deepEqual(command, { kind, started: 2, pendingStart: true });
    assert.equal(advanceMotion(first, samplers, 100.2), first);
    const duration = kind === 'reaction' ? 2.5 : 3.25;
    assert.equal(advanceMotion(first, samplers, 100 + duration).kind, 'idle');
  });
test('presentation activation preserves held poses, continuous work and bounded queues', () => {
  for (const extras of [
    { held: 0 },
    { continuous: true },
    { remainingCycles: 3 },
    { queuedReaction: true },
  ]) {
    const command = { kind: 'work', started: 0, pendingStart: true, ...extras };
    assert.deepEqual(advanceMotion(command, samplers, 100), {
      kind: 'work',
      started: 100,
      ...extras,
    });
  }
});
