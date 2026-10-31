/** Production presenter lifecycle, using an explicitly reserved external GPU
 * browser. Owns only its new tab/device; never closes the browser. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.connect({
  browserURL: process.env.AVATAR_CDP_URL || 'http://localhost:9348',
  defaultViewport: null,
  protocolTimeout: 120000,
});
const page = await browser.newPage();
let report;
try {
  await page.goto(`${process.env.AVATAR_SOURCE_URL || 'http://localhost:6007'}/iframe.html`, {
    waitUntil: 'domcontentloaded',
  });
  report = await page.evaluate(async () => {
    const check = (ok, message) => {
      if (!ok) throw Error(message);
    };
    const waitFor = async (test) => {
      const start = performance.now();
      while (!test()) {
        if (performance.now() - start > 12000) throw Error('Lifecycle event timed out');
        await new Promise((r) => setTimeout(r, 20));
      }
    };
    const devices = [],
      copies = [],
      resources = new Set(),
      adapterInfo = [];
    const request = navigator.gpu.requestAdapter.bind(navigator.gpu);
    navigator.gpu.requestAdapter = async (...args) => {
      const adapter = await request(...args);
      if (!adapter) return null;
      adapterInfo.push({
        ...adapter.info,
        vendor: adapter.info.vendor,
        architecture: adapter.info.architecture,
        isFallbackAdapter: adapter.info.isFallbackAdapter,
      });
      const requestDevice = adapter.requestDevice.bind(adapter);
      adapter.requestDevice = async (...args) => {
        const device = await requestDevice(...args);
        devices.push(device);
        for (const method of ['createTexture', 'createBuffer']) {
          const create = device[method].bind(device);
          device[method] = (...args) => {
            const resource = create(...args);
            resources.add(resource);
            const destroy = resource.destroy.bind(resource);
            resource.destroy = () => {
              resources.delete(resource);
              destroy();
            };
            return resource;
          };
        }
        const copy = device.queue.copyExternalImageToTexture.bind(device.queue);
        device.queue.copyExternalImageToTexture = (source, target, size) => {
          copies.push({ source: source.origin, destination: target.origin, size });
          copy(source, target, size);
        };
        return device;
      };
      return adapter;
    };
    const moduleSource = await (await fetch('/runtime/avatar-webgpu-presenter.ts')).arrayBuffer();
    const sourceModuleSHA256 = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', moduleSource)),
      (value) => value.toString(16).padStart(2, '0'),
    ).join('');
    const { createWebGPUAvatarPresenter: create } = await import(
      '/runtime/avatar-webgpu-presenter.ts'
    );
    const failures = [],
      recovery = [];
    const presenter = await create(
      (e) => failures.push(e.message),
      (value) => recovery.push(value),
    );
    check(presenter, 'Real hardware presenter must initialize');
    const stage = document.createElement('canvas');
    stage.width = 384;
    stage.height = 256;
    const gl = stage.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
      antialias: false,
    });
    check(gl, 'WebGL2 source');
    const draw = (only = -1) => {
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      for (let i = 0; i < 24; i++) {
        if (only >= 0 && i !== only) continue;
        const x = (i % 6) * 64,
          y = Math.floor(i / 6) * 64;
        gl.scissor(x, 256 - y - 64, 64, 64);
        const a = 0.55 + (i % 3) * 0.15;
        gl.clearColor(((i % 5) / 5) * a, (((i + 2) % 7) / 7) * a, (((i + 1) % 3) / 3) * a, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.disable(gl.SCISSOR_TEST);
      gl.flush();
    };
    const canvases = Array.from({ length: 24 }, () => {
      const c = document.createElement('canvas');
      c.style.width = c.style.height = '128px';
      document.body.append(c);
      return c;
    });
    const targets = canvases.map((c) => presenter.attach(c));
    check(targets.every(Boolean), '24 targets');
    const tiles = targets.map((target, i) => ({
      target,
      sourceX: (i % 6) * 64,
      sourceY: Math.floor(i / 6) * 64,
      sourceWidth: 64,
      sourceHeight: 64,
      destinationWidth: 128,
      destinationHeight: 128,
    }));
    draw();
    check(await presenter.present(stage, tiles), 'Full presentation');
    const retained = canvases.map((c) => c.toDataURL());
    draw(7);
    check(await presenter.present(stage, [tiles[7]]), 'Sparse presentation');
    const sparseCopy = copies.at(-1);
    check(
      JSON.stringify(sparseCopy) ===
        '{"source":{"x":63,"y":63},"destination":{"x":63,"y":63},"size":[66,66]}',
      'Sparse rectangle includes one-pixel guard',
    );
    check(
      canvases.every((c, i) => i === 7 || c.toDataURL() === retained[i]),
      '23 held targets retained',
    );
    const referencePresenter = await create((e) => failures.push(e.message));
    const referenceCanvases = canvases.map(() => document.createElement('canvas'));
    const referenceTargets = referenceCanvases.map((c) => referencePresenter.attach(c));
    check(
      await referencePresenter.present(
        stage,
        tiles.map((t, i) => ({ ...t, target: referenceTargets[i] })),
      ),
      'Full sparse reference',
    );
    check(
      canvases[7].toDataURL() === referenceCanvases[7].toDataURL(),
      'Sparse image equals full-atlas presentation; no stale neighbors',
    );
    referencePresenter.dispose();
    const beforeDispose = canvases.map((c) => c.toDataURL());
    presenter.release(targets[0]);
    check(canvases[0].toDataURL() === beforeDispose[0], 'release retains PNG');
    presenter.dispose();
    check(
      canvases.every((c, i) => c.toDataURL() === beforeDispose[i]),
      'dispose retains every PNG',
    );
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    check(
      canvases.every((c, i) => c.toDataURL() === beforeDispose[i]),
      'Dispose retains front-buffer PNG after presentation',
    );
    check(resources.size === 0, 'dispose frees owned GPU resources');
    for (let i = 0; i < 50; i++) {
      const p = await create((e) => failures.push(e.message));
      const target = p.attach(canvases[0]);
      check(target, 'Same canvas reattach');
      check(
        canvases[0].toDataURL() === beforeDispose[0],
        'Reattach before paint preserves old PNG',
      );
      check(await p.present(stage, [{ ...tiles[0], target }]), 'Cycle presentation');
      beforeDispose[0] = canvases[0].toDataURL();
      p.dispose();
      check(canvases[0].toDataURL() === beforeDispose[0], 'Cycle dispose retains PNG');
      check(resources.size === 0, 'No resource accumulation');
    }
    check(devices.length === 1, '50 cycles share one idle device');
    const p = await create(
      (e) => failures.push(e.message),
      (value) => recovery.push(value),
    );
    const target = p.attach(canvases[0]);
    check(await p.present(stage, [{ ...tiles[7], target }]), 'Recovery initial paint');
    const beforeLoss = canvases[0].toDataURL();
    devices[0].destroy();
    await waitFor(() => recovery.includes(false));
    check(
      devices.length === 2 && recovery.join(',') === 'true,false',
      'Exactly one replacement device',
    );
    check(await p.present(stage, [{ ...tiles[7], target }]), 'Repaint on new device');
    check(canvases[0].toDataURL() === beforeLoss, 'Recovered PNG unchanged');
    devices[1].destroy();
    await waitFor(() => failures.length === 1);
    check(devices.length === 2, 'Consecutive failure is bounded');
    check(
      (await p.present(stage, [{ ...tiles[7], target }])) === false,
      'Failed presenter settles callers',
    );
    p.dispose();
    check(resources.size === 0, 'Failure cleanup');
    return {
      sourceModuleSHA256,
      userAgent: navigator.userAgent,
      adapterInfo,
      devices: devices.length,
      cycles: 50,
      targets: 24,
      sparseCopy,
      retention: true,
      retainedAfterTwoFrames: true,
      sparseMatchesFull: true,
      recovery,
      failures,
      liveResources: resources.size,
      glError: gl.getError(),
    };
  });
} finally {
  await page.close();
  await browser.disconnect();
}
assert.equal(report.glError, 0);
const output = process.env.AVATAR_LIFECYCLE_OUTPUT || '.local/avatar-webgpu-lifecycle';
await mkdir(output, { recursive: true });
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
