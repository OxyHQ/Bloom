/** The shared slot contract runs without a DOM, on both presentation hosts. */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const temporary = await mkdtemp('.local/avatar-controller-');
const source = await readFile('runtime/avatar-controller.ts', 'utf8');
await writeFile(
  `${temporary}/controller.mjs`,
  ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText,
);
const { createAvatarSlotController, createAvatarReconciler } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/controller.mjs`).href
);
test.after(() => rm(temporary, { recursive: true, force: true }));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
function fixture() {
  const initial = { character: {}, reduced: false, interactive: true };
  const recipe = { preset: 'blue_beret', capabilities: {} };
  const state = { props: initial, ready: true, visible: true, dirty: false, painted: true };
  const calls = [];
  let disposed = false;
  const engine = Object.fromEntries(
    [
      'idle',
      'setWander',
      'setGaze',
      'setColor',
      'clearColor',
      'work',
      'entrance',
      'react',
      'setInstancePaused',
      'setInstanceRendering',
    ].map((name) => [name, (...args) => calls.push([name, ...args])]),
  );
  engine.prepareWork = async () => true;
  engine.setPreset = async (...args) => {
    calls.push(['setPreset', ...args]);
  };
  const dispose = () => {
    disposed = true;
    calls.push(['dispose']);
  };
  const controller = createAvatarSlotController(engine, 3, state, recipe, {
    isDisposed: () => disposed,
    wait: (promise) => promise,
    dispose,
  });
  return { controller, engine, state, initial, recipe, calls, dispose };
}

test('keys are edges, color and preset transitions retain independent slot identity', async () => {
  const f = fixture();
  await f.controller.update(f.initial, f.recipe);
  const next = { ...f.initial, reactionKey: 1, workingKey: 1, workingCycles: 2, entranceKey: 1 };
  await f.controller.update(next, { ...f.recipe, color: '#336699' });
  await f.controller.update({ ...next }, { ...f.recipe, color: '#336699' });
  assert.deepEqual(
    f.calls.filter(([name]) => ['react', 'work', 'entrance'].includes(name)),
    [
      ['work', 3, false, 2],
      ['entrance', 3],
      ['react', 3],
    ],
  );
  assert.equal(f.calls.filter(([name]) => name === 'setColor').length, 1);
  await f.controller.update(next, { ...f.recipe, preset: 'alfred' });
  assert.ok(
    f.calls.some(
      ([name, slot, preset]) => name === 'setPreset' && slot === 3 && preset === 'alfred',
    ),
  );
  assert.ok(f.calls.some(([name, slot]) => name === 'clearColor' && slot === 3));
  assert.equal(f.state.ready, true);
  assert.equal(f.state.dirty, true);
});

test('optional work keeps idle presentable and accepts pause immediately during loading', async () => {
  const f = fixture(),
    work = deferred();
  f.engine.prepareWork = () => work.promise;
  const pending = f.controller.update({ ...f.initial, workingKey: 1 }, f.recipe);
  assert.equal(f.state.ready, true);
  f.controller.setPresentation({ ...f.initial, paused: true });
  assert.deepEqual(f.calls.filter(([name]) => name === 'setInstancePaused').at(-1), [
    'setInstancePaused',
    3,
    true,
  ]);
  work.resolve(true);
  await pending;
  assert.equal(f.state.props.paused, true);
  assert.deepEqual(f.calls.filter(([name]) => name === 'setInstancePaused').at(-1), [
    'setInstancePaused',
    3,
    true,
  ]);
});

test('superseding a held work request permits the replacement before old network completion', async () => {
  const f = fixture(),
    work = deferred(),
    superseded = deferred();
  f.engine.prepareWork = () => work.promise;
  let current = true;
  const pending = f.controller.update(
    { ...f.initial, workingKey: 1 },
    f.recipe,
    () => current,
    superseded.promise,
  );
  current = false;
  superseded.resolve();
  await pending;
  await f.controller.update(f.initial, { ...f.recipe, preset: 'alfred' });
  assert.ok(f.calls.some(([name, , preset]) => name === 'setPreset' && preset === 'alfred'));
  assert.equal(
    f.calls.some(([name]) => name === 'work'),
    false,
  );
  work.resolve(true);
  await Promise.resolve();
  assert.equal(
    f.calls.some(([name]) => name === 'work'),
    false,
  );
});

test('stale recipe completion restores presentation without applying stale color or action', async () => {
  const f = fixture(),
    load = deferred();
  f.engine.setPreset = () => load.promise;
  let current = true;
  const pending = f.controller.update(
    { ...f.initial, reactionKey: 1 },
    { ...f.recipe, preset: 'alfred', color: '#ff0000' },
    () => current,
  );
  current = false;
  f.controller.setPresentation({ ...f.initial, reduced: true });
  load.resolve();
  await pending;
  assert.equal(f.state.ready, true);
  assert.equal(f.state.props.reduced, true);
  assert.equal(
    f.calls.some(([name]) => ['setColor', 'react'].includes(name)),
    false,
  );
});

test('invisible and frozen presentation never enables an invisible slot or entrance', async () => {
  const f = fixture();
  f.state.visible = false;
  await f.controller.update({ ...f.initial, portrait: true, entranceKey: 1 }, f.recipe);
  assert.equal(
    f.calls.some(([name]) => name === 'entrance'),
    false,
  );
  assert.deepEqual(f.calls.filter(([name]) => name === 'setInstanceRendering').at(-1), [
    'setInstanceRendering',
    3,
    false,
  ]);
});

test('disposal prevents a late optional work completion from starting an action', async () => {
  const f = fixture(),
    work = deferred();
  f.engine.prepareWork = () => work.promise;
  const pending = f.controller.update({ ...f.initial, workingKey: 1 }, f.recipe);
  f.dispose();
  work.resolve(true);
  await pending;
  assert.equal(
    f.calls.some(([name]) => name === 'work'),
    false,
  );
});

test('a failed resource disposes its host and reports the original error', async () => {
  const f = fixture(),
    error = new Error('work unavailable');
  f.engine.prepareWork = async () => {
    throw error;
  };
  await assert.rejects(
    f.controller.update({ ...f.initial, workingKey: 1 }, f.recipe),
    (value) => value === error,
  );
  assert.equal(f.calls.filter(([name]) => name === 'dispose').length, 1);
});

function reconcilerFixture(update = async () => {}) {
  const initial = { character: {}, reduced: false };
  const calls = [],
    presentations = [],
    capabilities = [],
    errors = [],
    disposals = [];
  const controller = createAvatarReconciler(
    initial,
    {
      update: async (...args) => {
        calls.push(args);
        await update(...args);
      },
      setPresentation: (props) => presentations.push(props),
      dispose: () => disposals.push('slot'),
    },
    {
      resolveRecipe: (props) => ({
        preset: 'blue_beret',
        capabilities: { key: props.reactionKey ?? 'initial' },
      }),
      onCapabilities: (value) => capabilities.push(value.key),
      onError: () => errors.push('error'),
      onDispose: () => disposals.push('host'),
    },
  );
  return { initial, controller, calls, presentations, capabilities, errors, disposals };
}

test('an immediate new update after a no-op is drained before its promise settles', async () => {
  const f = reconcilerFixture();
  const first = f.controller.update(f.initial);
  const next = { ...f.initial, reactionKey: 1 };
  const second = f.controller.update(next);
  await Promise.all([first, second]);
  assert.deepEqual(
    f.calls.map(([props]) => props),
    [next],
  );
  assert.deepEqual(f.capabilities, ['initial', 1]);
});

test('an update queued in the completion microtask is not stranded', async () => {
  let f, queued;
  f = reconcilerFixture(async (props) => {
    if (props.reactionKey === 1)
      queueMicrotask(() => {
        queued = f.controller.update({ ...f.initial, reactionKey: 2 });
      });
  });
  await f.controller.update({ ...f.initial, reactionKey: 1 });
  await queued;
  assert.deepEqual(
    f.calls.map(([props]) => props.reactionKey),
    [1, 2],
  );
  assert.equal(f.capabilities.at(-1), 2);
});

test('repeating the pending props reference does not cancel its action', async () => {
  const held = deferred();
  let superseded = false;
  const f = reconcilerFixture(async (_props, _recipe, _current, cancellation) => {
    void cancellation.then(() => {
      superseded = true;
    });
    await held.promise;
  });
  const next = { ...f.initial, reactionKey: 1 };
  const first = f.controller.update(next);
  const repeated = f.controller.update(next);
  assert.equal(first, repeated);
  assert.equal(superseded, false);
  held.resolve();
  await first;
  assert.equal(superseded, false);
  assert.deepEqual(f.capabilities, ['initial', 1]);
});

test('new constraints apply immediately and supersede an old action before completion', async () => {
  const old = deferred();
  const f = reconcilerFixture(async (props, _recipe, _current, cancellation) => {
    if (props.reactionKey === 1) await Promise.race([old.promise, cancellation]);
  });
  const first = f.controller.update({ ...f.initial, reactionKey: 1 });
  const latest = { ...f.initial, reactionKey: 2, paused: true };
  const second = f.controller.update(latest);
  assert.equal(f.presentations.at(-1), latest);
  await second;
  assert.deepEqual(
    f.calls.map(([props]) => props.reactionKey),
    [1, 2],
  );
  assert.deepEqual(f.capabilities, ['initial', 2]);
  old.resolve();
  await first;
});

test('failure disposes once and subsequent updates are inert', async () => {
  const f = reconcilerFixture(async () => {
    throw Error('resource unavailable');
  });
  await f.controller.update({ ...f.initial, reactionKey: 1 });
  f.controller.dispose();
  assert.equal(f.controller.update({ ...f.initial, reactionKey: 2 }), undefined);
  assert.deepEqual(f.errors, ['error']);
  assert.deepEqual(f.disposals, ['host', 'slot']);
});
