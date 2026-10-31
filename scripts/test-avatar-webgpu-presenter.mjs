/** Presenter ownership, bounded submission and device-loss tests without a GPU.
 * Actual pixels and driver behavior are separately verified in a physical browser. */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
const temporary = await mkdtemp('.local/avatar-webgpu-tests-');
await writeFile(
  `${temporary}/presenter.mjs`,
  ts.transpileModule(await readFile('runtime/avatar-webgpu-presenter.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText,
);
let sequence = 0;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const drain = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};
const advanceActive = async (t, duration) => {
  for (let elapsed = 0; elapsed < duration; elapsed += 100) {
    t.mock.timers.tick(Math.min(100, duration - elapsed));
    await drain();
  }
};
function fixture({
  fallback = false,
  available = true,
  initializationError = false,
  delayInit = false,
} = {}) {
  const devices = [],
    canvases = [],
    buffers = [],
    textures = [];
  let adapterRequests = 0;
  const init = deferred();
  const resource = (list, extra = {}) => {
    const value = {
      destroyed: false,
      destroy() {
        this.destroyed = true;
      },
      ...extra,
    };
    list.push(value);
    return value;
  };
  class Canvas {
    width = 128;
    height = 128;
    clientWidth = 64;
    clientHeight = 64;
    mode = null;
    image = 'retained';
    configures = 0;
    unconfigures = 0;
    getContext(kind) {
      if (this.mode && this.mode !== kind) return null;
      this.mode = kind;
      if (kind === '2d') return { canvas: this };
      return (this.context ??= {
        configure: (config) => {
          this.configures++;
          this.device = config.device;
          this.image = 'blank';
        },
        unconfigure: () => {
          this.unconfigures++;
          this.image = 'blank';
        },
        getCurrentTexture: () => ({ createView: () => ({ canvas: this }), destroy() {} }),
      });
    }
  }
  const createDevice = () => {
    const lost = deferred(),
      jobs = [],
      events = new Map();
    const device = {
      destroyed: false,
      limits: { maxTextureDimension2D: 8192 },
      lost: lost.promise,
      jobs,
      submissions: 0,
      copies: 0,
      writes: 0,
      pipelines: 0,
      destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        lost.resolve({ message: 'test device lost' });
        for (const job of jobs) job.reject(Error('device lost'));
      },
      addEventListener: (name, callback) => events.set(name, callback),
      emitError: (error) => events.get('uncapturederror')?.({ error }),
      pushErrorScope() {},
      popErrorScope: async () => null,
      createShaderModule: (descriptor) => {
        assert(descriptor.code.includes('rect.xy+input.uv*rect.zw'));
        return {};
      },
      async createRenderPipelineAsync() {
        device.pipelines++;
        if (delayInit) await init.promise;
        if (initializationError) throw Error('compile failed');
        return { getBindGroupLayout: () => ({}) };
      },
      createSampler: () => ({}),
      createBuffer: () => resource(buffers),
      createTexture: () => resource(textures, { createView: () => ({}) }),
      createBindGroup: () => ({}),
      createCommandEncoder: () => {
        const outputs = [];
        return {
          beginRenderPass: (descriptor) => {
            outputs.push(descriptor.colorAttachments[0].view.canvas);
            return { setPipeline() {}, setBindGroup() {}, draw() {}, end() {} };
          },
          finish: () => outputs,
        };
      },
      queue: {
        writeBuffer() {
          device.writes++;
        },
        copyExternalImageToTexture(...args) {
          device.copies++;
          device.lastCopy = args;
        },
        submit(commands) {
          device.submissions++;
          for (const canvas of commands.flat()) canvas.image = 'submitted';
        },
        onSubmittedWorkDone() {
          const job = deferred();
          jobs.push(job);
          return job.promise;
        },
      },
    };
    devices.push(device);
    return device;
  };
  const visibilityHandlers = new Set();
  const documentState = {
    hidden: false,
    addEventListener(name, callback) {
      if (name === 'visibilitychange') visibilityHandlers.add(callback);
    },
    createElement() {
      const canvas = new Canvas();
      canvases.push(canvas);
      return canvas;
    },
  };
  const gpu = {
    async requestAdapter() {
      adapterRequests++;
      return available
        ? { info: { isFallbackAdapter: fallback }, requestDevice: async () => createDevice() }
        : null;
    },
    getPreferredCanvasFormat: () => 'rgba8unorm',
  };
  const priorNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
    priorDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { gpu } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentState });
  return {
    devices,
    setHidden(value) {
      documentState.hidden = value;
      for (const callback of visibilityHandlers) callback();
    },
    canvases,
    buffers,
    textures,
    init,
    get adapterRequests() {
      return adapterRequests;
    },
    Canvas,
    restore() {
      if (priorNavigator) Object.defineProperty(globalThis, 'navigator', priorNavigator);
      else delete globalThis.navigator;
      if (priorDocument) Object.defineProperty(globalThis, 'document', priorDocument);
      else delete globalThis.document;
    },
  };
}
const load = async () =>
  await import(
    pathToFileURL(`${process.cwd()}/${temporary}/presenter.mjs`).href + `?case=${sequence++}`
  );
const tile = (target) => ({
  target,
  sourceX: 0,
  sourceY: 0,
  sourceWidth: 128,
  sourceHeight: 128,
  destinationWidth: 128,
  destinationHeight: 128,
});
const stage = { width: 128, height: 128 };
test.after(() => rm(temporary, { recursive: true, force: true }));
test('initialization shares a device and pipeline, before binding any caller canvas', async () => {
  const f = fixture({ delayInit: true });
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const first = create(() => {}),
      second = create(() => {});
    await drain();
    assert.equal(f.adapterRequests, 1);
    assert.equal(f.devices.length, 1);
    assert.equal(f.canvases.length, 0);
    f.init.resolve();
    const [a, b] = await Promise.all([first, second]);
    assert(a && b);
    assert.equal(f.devices[0].pipelines, 1);
    const canvas = new f.Canvas();
    const target = a.attach(canvas);
    assert(target);
    assert.equal(
      canvas.configures,
      0,
      'Attaching must retain existing pixels until first submission',
    );
    a.dispose();
    b.dispose();
    assert.equal(f.devices[0].destroyed, false);
  } finally {
    f.restore();
  }
});
test('unsupported, software and failed initialization never bind user canvases and cache negative results briefly', async () => {
  for (const options of [{ available: false }, { fallback: true }, { initializationError: true }]) {
    const f = fixture(options);
    try {
      const { createWebGPUAvatarPresenter: create } = await load();
      assert.equal(await create(() => {}), null);
      assert.equal(await create(() => {}), null);
      assert.equal(f.adapterRequests, 1);
      if (options.fallback) assert.equal(f.devices.length, 0);
      if (options.initializationError) assert.equal(f.devices[0].destroyed, true);
    } finally {
      f.restore();
    }
  }
});
test('prior 2D canvases stay 2D; oversized destinations fall back before binding', async () => {
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const p = await create(() => {});
    const legacy = new f.Canvas();
    legacy.getContext('2d');
    assert.equal(p.attach(legacy), null);
    assert.equal(legacy.mode, '2d');
    const huge = new f.Canvas();
    huge.clientWidth = 100000;
    assert.equal(p.attach(huge), null);
    assert.equal(huge.mode, null);
    p.dispose();
  } finally {
    f.restore();
  }
});
test('two batches bound work; successful completion is not reported before GPU completion', async () => {
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const p = await create(() => {}),
      canvas = new f.Canvas(),
      target = p.attach(canvas),
      device = f.devices[0];
    let complete = false;
    const one = p.present(stage, [tile(target)]).then((value) => {
      complete = value;
      return value;
    });
    const two = p.present(stage, [tile(target)]);
    await assert.rejects(p.present(stage, [tile(target)]), /capacity/);
    assert.equal(device.submissions, 2);
    assert.equal(complete, false);
    device.jobs[0].resolve();
    assert.equal(await one, true);
    device.jobs[1].resolve();
    assert.equal(await two, true);
    assert.equal(device.writes, 1, 'Stable tile rect reuses its uniform');
    p.dispose();
  } finally {
    f.restore();
  }
});
test('release retains pixels and frees owned buffers after submit; same canvas reattaches', async () => {
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const p = await create(() => {}),
      canvas = new f.Canvas(),
      target = p.attach(canvas),
      device = f.devices[0];
    const completion = p.present(stage, [tile(target)]);
    p.release(target);
    await drain();
    assert.equal(canvas.image, 'submitted');
    assert.equal(canvas.unconfigures, 0);
    assert.equal(f.buffers[0].destroyed, true);
    device.jobs[0].resolve();
    await completion;
    await drain();
    assert.equal(f.buffers[0].destroyed, true);
    p.dispose();
    const next = await create(() => {}),
      reattached = next.attach(canvas);
    assert.equal(canvas.image, 'submitted');
    assert.equal(canvas.configures, 1);
    const again = next.present(stage, [tile(reattached)]);
    device.jobs[1].resolve();
    await again;
    assert.equal(canvas.configures, 1);
    next.dispose();
  } finally {
    f.restore();
  }
});
test('dispose settles logical completion and releases owned resources even before GPU completion', async () => {
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const p = await create(() => {}),
      canvas = new f.Canvas(),
      target = p.attach(canvas);
    const completion = p.present(stage, [tile(target)]);
    p.dispose();
    assert.equal(await completion, false);
    await drain();
    assert.equal(f.buffers[0].destroyed, true);
    assert.equal(f.textures[0].destroyed, true);
    f.devices[0].jobs[0].resolve();
    await drain();
    assert.equal(f.buffers[0].destroyed, true);
    assert.equal(f.textures[0].destroyed, true);
    assert.equal(canvas.unconfigures, 0);
  } finally {
    f.restore();
  }
});
test('50 mount cycles keep one idle device, no live per-pool atlas or uniform resources', async () => {
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    for (let i = 0; i < 50; i++) {
      const p = await create(() => {}),
        canvas = new f.Canvas(),
        target = p.attach(canvas);
      const completion = p.present(stage, [tile(target)]);
      f.devices[0].jobs[i].resolve();
      await completion;
      p.dispose();
      await drain();
      assert.equal(canvas.image, 'submitted');
    }
    assert.equal(f.devices.length, 1);
    assert(f.buffers.every((buffer) => buffer.destroyed));
    assert(f.textures.every((texture) => texture.destroyed));
  } finally {
    f.restore();
  }
});
test('device loss interrupts both pools, reacquires once and reuses the same canvas with deferred configure', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const events = [],
      failures = [];
    const a = await create(
      (error) => failures.push(error),
      (value) => events.push(['a', value]),
    );
    const b = await create(
      (error) => failures.push(error),
      (value) => events.push(['b', value]),
    );
    const canvas = new f.Canvas(),
      target = a.attach(canvas);
    const outstanding = a.present(stage, [tile(target)]);
    f.devices[0].destroy();
    await drain();
    assert.equal(await outstanding, false);
    assert.equal(f.devices.length, 2);
    assert.deepEqual(events, [
      ['a', true],
      ['b', true],
      ['a', false],
      ['b', false],
    ]);
    assert.equal(canvas.configures, 1);
    const restored = a.present(stage, [tile(target)]);
    f.devices[1].jobs[0].resolve();
    assert.equal(await restored, true);
    assert.equal(canvas.configures, 2);
    assert.equal(failures.length, 0);
    t.mock.timers.tick(30000);
    f.devices[1].destroy();
    await drain();
    assert.equal(
      f.devices.length,
      3,
      'A later independent loss can recover after stable presentation',
    );
    a.dispose();
    b.dispose();
  } finally {
    f.restore();
    t.mock.timers.reset();
  }
});
test('consecutive device loss exhausts one recovery and fails once instead of looping', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const failures = [];
    const p = await create((error) => failures.push(error));
    f.devices[0].destroy();
    await drain();
    assert.equal(f.devices.length, 2);
    f.devices[1].destroy();
    await drain();
    assert.equal(f.devices.length, 2);
    assert.equal(failures.length, 1);
    assert.equal(await p.present(stage, []), false);
    p.dispose();
  } finally {
    f.restore();
    t.mock.timers.reset();
  }
});
test('batch timeout settles work and uses the same bounded recovery path', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const p = await create(() => {}),
      target = p.attach(new f.Canvas());
    const completion = p.present(stage, [tile(target)]);
    await advanceActive(t, 5000);
    assert.equal(await completion, false);
    assert.equal(f.devices.length, 2);
    assert.equal(f.devices[0].destroyed, true);
    p.dispose();
  } finally {
    f.restore();
    t.mock.timers.reset();
  }
});

test('sparse copies retain full atlas coordinates and refresh a one-texel filter guard', async () => {
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const p = await create(() => {}),
      target = p.attach(new f.Canvas()),
      source = { width: 960, height: 960 };
    const completion = p.present(source, [
      { ...tile(target), sourceX: 192, sourceY: 384, sourceWidth: 192, sourceHeight: 192 },
    ]);
    const [from, to, size] = f.devices[0].lastCopy;
    assert.deepEqual(from, { source, origin: { x: 191, y: 383 } });
    assert.deepEqual(to.origin, { x: 191, y: 383 });
    assert.deepEqual(size, [194, 194]);
    f.devices[0].jobs[0].resolve();
    await completion;
    const edge = p.present(source, [{ ...tile(target), sourceWidth: 192, sourceHeight: 192 }]);
    assert.deepEqual(f.devices[0].lastCopy[0].origin, { x: 0, y: 0 });
    assert.deepEqual(f.devices[0].lastCopy[2], [193, 193]);
    f.devices[0].jobs[1].resolve();
    await edge;
    p.dispose();
  } finally {
    f.restore();
  }
});
test('dispose cannot cancel the physical hang watchdog or retain buffers forever', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const p = await create(() => {}),
      target = p.attach(new f.Canvas());
    f.devices[0].queue.onSubmittedWorkDone = () => new Promise(() => {});
    const completion = p.present(stage, [tile(target)]);
    p.dispose();
    assert.equal(await completion, false);
    assert(f.buffers.every((value) => value.destroyed));
    assert(f.textures.every((value) => value.destroyed));
    await advanceActive(t, 5000);
    assert.equal(f.devices[0].destroyed, true);
    assert.equal(f.devices.length, 1, 'No automatic replacement is needed without any live pool');
    const replacement = await create(() => {});
    assert(replacement);
    assert.equal(f.devices.length, 2);
    replacement.dispose();
  } finally {
    f.restore();
    t.mock.timers.reset();
  }
});

test('hidden time never expires a healthy pending batch or forces device recovery', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const events = [],
      p = await create(
        () => assert.fail('unexpected failure'),
        (value) => events.push(value),
      ),
      target = p.attach(new f.Canvas());
    const completion = p.present(stage, [tile(target)]);
    await advanceActive(t, 1000);
    f.setHidden(true);
    t.mock.timers.tick(60000);
    await drain();
    assert.equal(f.devices[0].destroyed, false);
    f.setHidden(false);
    await drain();
    assert.equal(f.devices.length, 1);
    f.devices[0].jobs[0].resolve();
    assert.equal(await completion, true);
    assert.deepEqual(events, []);
    p.dispose();
  } finally {
    f.restore();
    t.mock.timers.reset();
  }
});
test('a suspended event loop does not consume the entire visible GPU deadline', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture();
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    const p = await create(() => assert.fail('unexpected failure')),
      target = p.attach(new f.Canvas());
    const completion = p.present(stage, [tile(target)]);
    t.mock.timers.tick(60000);
    await drain();
    assert.equal(f.devices[0].destroyed, false);
    f.devices[0].jobs[0].resolve();
    assert.equal(await completion, true);
    p.dispose();
  } finally {
    f.restore();
    t.mock.timers.reset();
  }
});
test('background initialization cannot time out before its GPU callback is allowed to run', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const f = fixture({ delayInit: true });
  try {
    const { createWebGPUAvatarPresenter: create } = await load();
    f.setHidden(true);
    const factory = create(() => {});
    await drain();
    t.mock.timers.tick(120000);
    await drain();
    assert.equal(f.devices[0].destroyed, false);
    f.setHidden(false);
    f.init.resolve();
    const p = await factory;
    assert(p);
    p.dispose();
  } finally {
    f.restore();
    t.mock.timers.reset();
  }
});
