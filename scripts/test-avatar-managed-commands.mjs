import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

let namespace = 0;
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
async function fixture() {
  const previous = {
    document: globalThis.document,
    IntersectionObserver: globalThis.IntersectionObserver,
    ResizeObserver: globalThis.ResizeObserver,
  };
  const events = [],
    leases = [];
  const budget = {
    register(options) {
      const lease = {
        options,
        updates: [],
        update(value) {
          this.updates.push(value);
        },
        painted() {},
        dispose() {
          if (lease.value) options.suspend(lease.value);
        },
      };
      leases.push(lease);
      return lease;
    },
  };
  globalThis.__managedCommandBudget = budget;
  globalThis.document = {
    hidden: false,
    createElement: () => ({ getContext: () => ({ drawImage() {} }) }),
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      this.callback([{ isIntersecting: true }]);
    }
    disconnect() {}
  };
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  const url = (value) => 'data:text/javascript,' + encodeURIComponent(value);
  const source = (
    await readFile(
      new URL(
        '../assets/character-runtime/managed-avatar.mjs',
        import.meta.url,
      ),
      'utf8',
    )
  )
    .replace(
      "'./render-budget.mjs'",
      JSON.stringify(
        url(
          'export const renderBudget=globalThis.__managedCommandBudget; // fixture ' +
            namespace,
        ),
      ),
    )
    .replace(
      "'./resolution.mjs'",
      JSON.stringify(
        new URL('../assets/character-runtime/resolution.mjs', import.meta.url)
          .href,
      ),
    );
  const { createManagedAvatar } = await import(
    url(source + '\n// fixture ' + namespace++)
  );
  let callbacks;
  const state = { ready: true, pending: false };
  let previousWork = 0,
    previousReaction = 0;
  const controller = {
    diagnostics: () => ({ ...state }),
    update(props, silent) {
      events.push({ kind: 'update', silent, props });
      if (!silent) {
        if (props.workingKey !== previousWork) events.push({ kind: 'work' });
        if (props.reactionKey !== previousReaction)
          events.push({ kind: 'react' });
      }
      previousWork = props.workingKey;
      previousReaction = props.reactionKey;
    },
    work() {
      events.push({ kind: 'work' });
    },
    react() {
      events.push({ kind: 'react' });
    },
    dispose() {
      events.push({ kind: 'dispose' });
    },
  };
  const canvas = {
    width: 64,
    height: 64,
    clientWidth: 64,
    clientHeight: 64,
    addEventListener() {},
    removeEventListener() {},
  };
  let props = {
    config: {
      motion: 35,
      character: { preset: 'test-body' },
      lookAt: 'center',
    },
    workingKey: 0,
    reactionKey: 0,
    interactive: true,
  };
  const managed = createManagedAvatar(
    canvas,
    props,
    {},
    async (_, initial, nextCallbacks) => {
      callbacks = nextCallbacks;
      return controller;
    },
  );
  const lease = leases[0];
  lease.value = await lease.options.start();
  callbacks.onReady();
  callbacks.onPaint();
  await flush();
  events.length = 0;
  return {
    managed,
    state,
    events,
    callbacks,
    update(patch) {
      props = { ...props, ...patch };
      managed.update(props);
    },
    edit(patch) {
      props = {
        ...props,
        ...patch,
        config: {
          ...props.config,
          character: {
            ...props.config.character,
            selections: { accessory: 'felipe_beret' },
          },
        },
      };
      managed.update(props);
    },
    async paint() {
      callbacks.onPaint();
      await flush();
    },
    async cleanup() {
      managed.dispose();
      await flush();
      for (const [key, value] of Object.entries(previous))
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
      delete globalThis.__managedCommandBudget;
    },
  };
}

test('combined appearance and Work waits for the replacement controller and delivers once', async () => {
  const f = await fixture();
  try {
    f.edit({ workingKey: 1 });
    assert.equal(
      f.events[0].silent,
      true,
      'Old ready controller must not consume the replacement command',
    );
    f.state.ready = false;
    f.state.pending = true;
    f.callbacks.onReady();
    await flush();
    assert.equal(f.events.filter((e) => e.kind === 'work').length, 0);
    f.state.ready = true;
    f.state.pending = false;
    await f.paint();
    await f.paint();
    f.callbacks.onReady();
    await flush();
    assert.equal(f.events.filter((e) => e.kind === 'work').length, 1);
    assert.equal(f.managed.diagnostics().pending, false);
  } finally {
    await f.cleanup();
  }
});

test('in-place edit retains Work then React through unsettled paints without requiring another onReady', async () => {
  const f = await fixture();
  try {
    f.edit({ workingKey: 1, reactionKey: 1 });
    assert.equal(f.events[0].silent, true);
    f.state.pending = true;
    f.callbacks.onPaint(false);
    await flush();
    await f.paint();
    assert.deepEqual(
      f.events.filter((e) => e.kind !== 'update'),
      [],
    );
    f.state.pending = false;
    await f.paint();
    await f.paint();
    assert.deepEqual(
      f.events.filter((e) => e.kind !== 'update').map((e) => e.kind),
      ['work', 'react'],
    );
  } finally {
    await f.cleanup();
  }
});

test('pausing or disposal cancels retained commands and resume does not replay them', async () => {
  const f = await fixture();
  try {
    f.edit({ reactionKey: 1 });
    f.state.pending = true;
    f.update({ paused: true });
    f.state.pending = false;
    await f.paint();
    f.update({ paused: false });
    await f.paint();
    assert.equal(f.events.filter((e) => e.kind === 'react').length, 0);
    f.update({
      workingKey: 1,
      config: {
        motion: 35,
        lookAt: 'center',
        character: { preset: 'test-body', bodyColor: '#ffaa22' },
      },
    });
    assert.equal(f.events.at(-1).silent, true);
    f.callbacks.onReady();
    f.managed.dispose();
    await flush();
    assert.equal(f.events.filter((e) => e.kind === 'work').length, 0);
  } finally {
    await f.cleanup();
  }
});

test('warm commands use the existing controller once without replay on later paints', async () => {
  const f = await fixture();
  try {
    f.update({ workingKey: 1 });
    assert.equal(f.events[0].silent, false);
    await f.paint();
    f.callbacks.onReady();
    await flush();
    assert.equal(f.events.filter((e) => e.kind === 'work').length, 1);
  } finally {
    await f.cleanup();
  }
});
