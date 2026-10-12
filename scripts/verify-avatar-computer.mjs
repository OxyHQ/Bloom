/** Paired semantic Computer keyframes. Original runtime is an offline fixture only. */
import assert from 'node:assert/strict';
import { validateComputerComparison } from './avatar-computer-comparison-contract.mjs';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const output = process.env.AVATAR_COMPUTER_COMPARISON || '.local/avatar-computer-comparison-all';
const presets = (
  process.env.AVATAR_COMPUTER_PRESETS ||
  'blue_beret,alfred,purple_heart,lime_frog,coral_monocle,gus,blue_spectacles,lime_headphones'
).split(',');
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = {
  purpose:
    'Paired original Computer geometry, semantic matrices/material/camera tracks and rendered pixels at captured keyframes; no performance claim.',
  cases: [],
};
try {
  const page = await browser.newPage(),
    warnings = [],
    errors = [],
    forbidden = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warn' || m.type() === 'warning') warnings.push(m.text());
  });
  page.on('request', (r) => {
    if (/bloom-character|orbit-characters|preparation-worker|\.wasm(?:\?|$)/.test(r.url()))
      forbidden.push(r.url());
  });
  await page.setViewport({ width: 320, height: 320, deviceScaleFactor: 1 });
  const captureUrl = `${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6006'}/computer-comparison.html`;
  const navigation = await page.createCDPSession();
  navigation.on('Fetch.requestPaused', (event) =>
    navigation.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from(
        '<!doctype html><html><head><link rel="icon" href="data:,"></head><body></body></html>',
      ).toString('base64'),
    }),
  );
  await navigation.send('Fetch.enable', {
    patterns: [{ urlPattern: captureUrl, requestStage: 'Request' }],
  });
  await page.goto(captureUrl);
  await navigation.send('Fetch.disable');
  await navigation.detach();
  const setup = async (count, preset) => {
    await page.setViewport({
      width: count * 320,
      height: 320,
      deviceScaleFactor: 1,
    });
    await page.evaluate(
      async ({ count, preset }) => {
        window.engine?.dispose();
        document.body.replaceChildren();
        document.body.style.cssText = 'margin:0;background:transparent';
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `display:block;width:${count * 320}px;height:320px`;
        document.body.append(canvas);
        const [{ AuthoredAvatarEngine }, { loadAuthoredAsset, assetUrl }] = await Promise.all([
          import('/runtime/avatar/authored-engine.ts'),
          import('/runtime/avatar/catalog.ts'),
        ]);
        const assetLoader = async (preset, detail) => {
          const asset = await loadAuthoredAsset(preset, detail, true);
          const paired = await (await fetch(assetUrl(preset, 'computer-material.json'))).json();
          asset.material = paired;
          for (const part of asset.parts)
            part.fields = paired.parts.find((p) => p.id === part.id).fields;
          return asset;
        };
        window.engine = new AuthoredAvatarEngine(canvas, {
          count,
          size: 320,
          preset,
          assetLoader,
        });
        await window.engine.loaded;
        window.engine.setPaused(true);
      },
      { count, preset },
    );
    await page.waitForFunction(() => window.engine.stats().frames > 0, {
      timeout: 60000,
    });
    assert(await page.evaluate(() => window.engine.canWork(0)), 'Work assets available');
  };
  for (const preset of process.env.AVATAR_COMPUTER_UI_ONLY === '1' ? [] : presets) {
    let currentCount = 0;
    for (const [count, index, observation, time] of [
      [1, 0, 1, 0],
      [1, 0, 3, 2],
      [1, 0, 6, 5],
      [2, 0, 3, 2],
      [2, 1, 3, 2],
    ]) {
      if (count !== currentCount) {
        await setup(count, preset);
        currentCount = count;
      }
      const label = `${preset}-${count}avatars-slot${index}-${time}s`;
      if (count === 2) {
        const neighbor = presets[(presets.indexOf(preset) + 1) % presets.length];
        await page.evaluate(
          async ({ preset, neighbor, index }) => {
            await window.engine.setPresets(index === 0 ? [preset, neighbor] : [neighbor, preset]);
          },
          { preset, neighbor, index },
        );
      }
      await page.evaluate((count) => {
        window.engine.resetAppearance();
        for (let i = 0; i < count; i++) window.engine.setMotionFrame(i, 'idle', 0);
      }, count);
      const before = await page.evaluate(() => window.engine.stats().frames);
      await page.evaluate(({ index, time }) => window.engine.setMotionFrame(index, 'work', time), {
        index,
        time,
      });
      await page.waitForFunction(
        (n) => window.engine.stats().frames > n,
        { timeout: 60000 },
        before,
      );
      const details = await page.evaluate(() =>
        window.engine.batches.map((b) => ({
          id: b.part.source.id,
          fur: b.part.source.fur,
          activity: b.part.source.activity,
          visible: b.mesh.visible,
          count: b.mesh.count,
          range: b.mesh.geometry.drawRange,
          defines: b.part.material.defines,
          coverage: b.part.source.fields.coverage,
          furFields: b.part.source.fields.fur,
          pose: Array.from(b.part.motionTexture.image.data.slice(28, 48)),
          world: Array.from(b.mesh.instanceMatrix.array.slice(0, 16)),
        })),
      );
      await writeFile(`${output}/parts-${label}.json`, JSON.stringify(details, null, 2));
      const bytes = Buffer.from(
        await page.screenshot({
          omitBackground: true,
          clip: { x: index * 320, y: 0, width: 320, height: 320 },
        }),
      );
      await writeFile(`${output}/work-${label}.png`, bytes);
      const actual = PNG.sync.read(bytes),
        reference = PNG.sync.read(
          await readFile(
            `runtime/avatar/assets/${preset}/computer-reference-${observation}s.png`,
          ),
        );
      assert.equal(actual.width, reference.width);
      assert.equal(actual.height, reference.height);
      let error = 0,
        composedRGBError = 0,
        alphaError = 0,
        pixels = 0,
        max = 0;
      const diff = new PNG({ width: actual.width, height: actual.height });
      const bounds = [actual, reference].map((im) => {
        const b = { minX: im.width, minY: im.height, maxX: -1, maxY: -1 };
        for (let p = 0; p < im.width * im.height; p++)
          if (im.data[p * 4 + 3] > 20) {
            b.minX = Math.min(b.minX, p % im.width);
            b.minY = Math.min(b.minY, Math.floor(p / im.width));
            b.maxX = Math.max(b.maxX, p % im.width);
            b.maxY = Math.max(b.maxY, Math.floor(p / im.width));
          }
        return b;
      });
      for (let p = 0; p < actual.width * actual.height; p++) {
        const active = actual.data[p * 4 + 3] > 0 || reference.data[p * 4 + 3] > 0;
        if (active) {
          pixels++;
          const aa = actual.data[p * 4 + 3] / 255,
            ba = reference.data[p * 4 + 3] / 255;
          alphaError += Math.abs(actual.data[p * 4 + 3] - reference.data[p * 4 + 3]);
          for (let k = 0; k < 3; k++) {
            const bg = [245, 245, 242][k];
            composedRGBError += Math.abs(
              actual.data[p * 4 + k] * aa +
                bg * (1 - aa) -
                reference.data[p * 4 + k] * ba -
                bg * (1 - ba),
            );
          }
        }
        for (let k = 0; k < 4; k++) {
          const d = Math.abs(actual.data[p * 4 + k] - reference.data[p * 4 + k]);
          if (active) error += d;
          max = Math.max(max, d);
          diff.data[p * 4 + k] = k === 3 ? 255 : Math.min(255, d * 4);
        }
      }
      await writeFile(`${output}/difference-${label}.png`, PNG.sync.write(diff));
      let changedNeighborPixels = null;
      if (count === 2) {
        const clip = { x: (1 - index) * 320, y: 0, width: 320, height: 320 };
        const previous = PNG.sync.read(
          Buffer.from(await page.screenshot({ omitBackground: true, clip })),
        );
        const frame = await page.evaluate(() => window.engine.stats().frames);
        await page.evaluate((index) => {
          window.engine.setMotionFrame(index, 'work', 0);
          window.engine.setColor(index, '#ff6655');
        }, index);
        await page.waitForFunction(
          (frame) => window.engine.stats().frames > frame,
          { timeout: 60000 },
          frame,
        );
        const next = PNG.sync.read(
          Buffer.from(await page.screenshot({ omitBackground: true, clip })),
        );
        changedNeighborPixels = 0;
        for (let p = 0; p < previous.width * previous.height; p++)
          if ([0, 1, 2, 3].some((k) => previous.data[p * 4 + k] !== next.data[p * 4 + k]))
            changedNeighborPixels++;
      }
      report.cases.push({
        preset,
        count,
        index,
        changedNeighborPixels,
        time,
        observation,
        foregroundMeanRGBAError: error / (pixels * 4),
        foregroundCompositedRGBError: composedRGBError / (pixels * 3),
        foregroundAlphaError: alphaError / pixels,
        maxChannelError: max,
        bounds,
        stats: await page.evaluate(() => window.engine.stats()),
      });
    }
    console.log(
      JSON.stringify({
        preset,
        comparisons: report.cases
          .filter((c) => c.preset === preset)
          .map((c) => ({
            time: c.time,
            rgb: c.foregroundCompositedRGBError,
            alpha: c.foregroundAlphaError,
            bounds: c.bounds,
          })),
      }),
    );
  }
  report.glError = await page.evaluate(() => window.engine?.renderer.getContext().getError() ?? 0);
  await page.evaluate(() => window.engine?.dispose());
  await page.close();
  if (process.env.AVATAR_COMPUTER_SKIP_UI !== '1') {
    const ui = await browser.newPage();
    ui.on('pageerror', (e) => errors.push(e.message));
    ui.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    ui.on('request', (r) => {
      if (/bloom-character|orbit-characters|preparation-worker|\.wasm(?:\?|$)/.test(r.url()))
        forbidden.push(r.url());
    });
    await ui.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
    await ui.goto(
      `${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6006'}/iframe.html?id=application-agent-avatar-new-engine--fidelity&viewMode=story`,
    );
    await ui.waitForFunction(() => window.__avatarFidelity?.stats().frames > 0, {
      timeout: 60000,
    });
    const click = async (text) => {
      await ui.waitForFunction(
        (text) =>
          [...document.querySelectorAll('button')].some(
            (b) => b.textContent.trim() === text && !b.disabled,
          ),
        {},
        text,
      );
      for (const button of await ui.$$('button'))
        if (await button.evaluate((node, text) => node.textContent.trim() === text, text)) {
          assert(!(await button.evaluate((node) => node.disabled)), `${text} enabled`);
          await button.click();
          return;
        }
      throw Error(`Missing button ${text}`);
    };
    report.ui = [];
    for (const preset of presets) {
      await ui.select('[aria-label="Modelo original"]', preset);
      await ui.waitForFunction(
        (preset) =>
          window.__avatarFidelity?.stats().states[0]?.preset === preset &&
          window.__avatarFidelity.canWork(0),
        { timeout: 60000 },
        preset,
      );
      await ui.waitForFunction(() =>
        [...document.querySelectorAll('button')].some(
          (b) => b.textContent.trim() === 'Computer' && !b.disabled,
        ),
      );
      await click('Computer');
      await ui.waitForFunction(
        () =>
          window.__avatarFidelity.batches.some(
            (b) => b.part.source.activity === 'computer' && b.mesh.visible,
          ),
        { timeout: 20000 },
      );
      await ui.screenshot({ path: `${output}/story-${preset}-computer-active.png` });
      await ui.waitForFunction(() => window.__avatarFidelity.stats().states[0].motion === 'idle', {
        timeout: 60000,
      });
      const result = await ui.evaluate(() => ({
        stats: window.__avatarFidelity.stats(),
        visibleComputerParts: window.__avatarFidelity.batches.filter(
          (b) => b.part.source.activity === 'computer' && b.mesh.visible,
        ).length,
        glError: window.__avatarFidelity.renderer.getContext().getError(),
      }));
      assert.equal(result.visibleComputerParts, 0, `${preset} Computer props leave after episode`);
      assert.equal(result.stats.states[0].motion, 'idle', `${preset} resumes idle automatically`);
      assert.equal(result.glError, 0);
      assert.equal(result.stats.contexts, 1);
      report.ui.push({ preset, ...result });
    }
    await ui.select('[aria-label="Copias originales"]', '8');
    await ui.click('input[type="checkbox"]');
    await ui.waitForFunction(
      () =>
        new Set(window.__avatarFidelity.stats().states.map((s) => s.preset)).size === 8 &&
        window.__avatarFidelity.stats().states.every((_, i) => window.__avatarFidelity.canWork(i)),
      { timeout: 60000 },
    );
    await click('Computer todos');
    console.log(
      'Computer todos started',
      JSON.stringify(await ui.evaluate(() => window.__avatarFidelity.stats())),
    );
    await ui
      .waitForFunction(
        () =>
          window.__avatarFidelity.stats().states.every((s) => s.motion === 'work') &&
          window.__avatarFidelity.stats().states[0].motionTime >= 1,
        { timeout: 30000 },
      )
      .catch(async (error) => {
        console.log(
          'Mixed timeout',
          JSON.stringify(await ui.evaluate(() => window.__avatarFidelity.stats())),
          errors,
        );
        throw error;
      });
    report.mixedWork = await ui.evaluate(() => ({
      stats: window.__avatarFidelity.stats(),
      glError: window.__avatarFidelity.renderer.getContext().getError(),
    }));
    await ui.screenshot({ path: `${output}/story-all-computer.png` });
    await click('Acciones mezcladas');
    await ui.waitForFunction(
      () =>
        window.__avatarFidelity
          .stats()
          .states.every((s, i) => s.motion === ['work', 'reaction', 'idle'][i % 3]),
      { timeout: 20000 },
    );
    report.mixedActions = await ui.evaluate(() => ({
      stats: window.__avatarFidelity.stats(),
      glError: window.__avatarFidelity.renderer.getContext().getError(),
    }));
    assert.equal(report.mixedWork.glError, 0);
    assert.equal(report.mixedActions.glError, 0);
    await ui.screenshot({ path: `${output}/story-mixed-actions.png` });
    await ui.close();
  }
  report.errors = errors;
  report.warnings = warnings;
  report.forbidden = forbidden;
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  validateComputerComparison(report);
  console.log(
    JSON.stringify(
      report.cases.map(({ time, foregroundMeanRGBAError, bounds }) => ({
        time,
        foregroundMeanRGBAError,
        bounds,
      })),
    ),
  );
} finally {
  await browser.close();
}
