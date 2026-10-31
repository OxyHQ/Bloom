/** Public controller: real fallback routing, density changes, retention and cancellation. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewport({ width: 640, height: 480, deviceScaleFactor: 2 });
  await page.goto(`${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007'}/iframe.html`);
  const result = await page.evaluate(async () => {
    document.body.replaceChildren();
    document.body.style.height = '2000px';
    let adapterRequests = 0;
    Object.defineProperty(navigator, 'gpu', {
      configurable: true,
      value: {
        requestAdapter: async () => {
          adapterRequests++;
          return null;
        },
      },
    });
    const { attachEditorAvatar, editorPoolDiagnostics } = await import('/runtime/avatar-pool.ts');
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    const { resolveCompleteEditorRecipe } = await import('/runtime/avatar/recipe.ts');
    const props = { character: resolveAvatarCharacter({ preset: 'blue_beret' }), reduced: false };
    const recipe = resolveCompleteEditorRecipe(props);
    const canvases = [],
      slots = [],
      ready = [0, 0, 0, 0],
      readyPixels = [false, false, false, false];
    let failures = 0;
    const diagnostics = () => editorPoolDiagnostics()[0];
    const wait = async (predicate, label) => {
      const start = performance.now();
      while (!predicate()) {
        if (performance.now() - start > 20000) throw Error(`Timed out: ${label}`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    };
    const add = async (index) => {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'display:inline-block;width:64px;height:64px';
      document.body.append(canvas);
      canvases[index] = canvas;
      slots[index] = await attachEditorAvatar(
        canvas,
        props,
        recipe,
        () => {
          ready[index]++;
          readyPixels[index] = canvas
            .getContext('2d')
            .getImageData(0, 0, canvas.width, canvas.height)
            .data.some((value, offset) => offset % 4 === 3 && value > 0);
        },
        () => failures++,
      );
    };
    await add(0);
    await wait(() => ready[0] === 1, 'standalone first image');
    if (adapterRequests !== 0) throw Error('Single avatar initialized WebGPU');
    await Promise.all([1, 2, 3].map(add));
    await wait(
      () => ready.every((value) => value === 1) && diagnostics().presentation.pboFrames > 0,
      'dense PBO first image',
    );
    const dense = diagnostics().presentation;
    if (dense.webgpuTargets !== 0 || dense.canvas2dTargets !== 4 || adapterRequests !== 1)
      throw Error('Wrong fallback backend');
    const frozen = { ...props, paused: true };
    await Promise.all([1, 2, 3].map((index) => slots[index].update(frozen, recipe)));
    await wait(() => diagnostics().stats.renderedInstances === 1, 'one active avatar');
    await new Promise((resolve) => setTimeout(resolve, 80));
    const one = diagnostics().presentation;
    await wait(
      () => diagnostics().presentation.directFrames >= one.directFrames + 3,
      'single active direct copies',
    );
    if (diagnostics().presentation.pboFrames !== one.pboFrames)
      throw Error('Retained slots inflated PBO density');
    await Promise.all([1, 2, 3].map((index) => slots[index].update(props, recipe)));
    await wait(() => diagnostics().presentation.pboFrames >= one.pboFrames + 3, 'dense resume');
    canvases[3].style.width = canvases[3].style.height = '96px';
    await wait(() => canvases[3].width === 192, 'resize output');
    await new Promise((resolve) => setTimeout(resolve, 100));
    const larger = diagnostics().presentation;
    await wait(
      () => diagnostics().presentation.directFrames >= larger.directFrames + 3,
      'three small plus large direct',
    );
    if (diagnostics().presentation.pboFrames !== larger.pboFrames)
      throw Error('Large destination incorrectly included in small PBO route');
    canvases[3].style.width = canvases[3].style.height = '64px';
    await wait(
      () => canvases[3].width === 128 && diagnostics().presentation.pboFrames > larger.pboFrames,
      'small output restores PBO',
    );
    for (const canvas of canvases.slice(1)) canvas.style.transform = 'translateY(1000px)';
    await wait(() => diagnostics().stats.renderedInstances === 1, 'offscreen culling');
    await new Promise((resolve) => setTimeout(resolve, 80));
    const offscreen = diagnostics().presentation;
    await wait(
      () => diagnostics().presentation.directFrames >= offscreen.directFrames + 3,
      'offscreen single uses direct',
    );
    if (diagnostics().presentation.pboFrames !== offscreen.pboFrames)
      throw Error('Offscreen slots inflated PBO density');
    for (const canvas of canvases.slice(1)) canvas.style.transform = '';
    await wait(
      () => diagnostics().presentation.pboFrames > offscreen.pboFrames,
      'visible resume uses PBO',
    );
    // Hold real fences: queue two frames, then change all latest colors and pause.
    const originalWait = WebGL2RenderingContext.prototype.clientWaitSync;
    WebGL2RenderingContext.prototype.clientWaitSync = function () {
      return this.TIMEOUT_EXPIRED;
    };
    await wait(() => diagnostics().stats.presentationCapacity === false, 'bounded pending frames');
    const colorProps = {
      ...frozen,
      character: resolveAvatarCharacter({ preset: 'blue_beret', bodyColor: '#336699' }),
    };
    const colorRecipe = resolveCompleteEditorRecipe(colorProps);
    await Promise.all(slots.map((slot) => slot.update(colorProps, colorRecipe)));
    const heldFrames = diagnostics().stats.frames;
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (diagnostics().stats.frames !== heldFrames)
      throw Error('Engine ignored full presentation capacity');
    WebGL2RenderingContext.prototype.clientWaitSync = originalWait;
    await wait(
      () => diagnostics().stats.renderedInstances === 0,
      'latest paused color presents once',
    );
    const retained = canvases.map((canvas) => canvas.toDataURL());
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (canvases.some((canvas, index) => canvas.toDataURL() !== retained[index]))
      throw Error('Late stale batch changed paused pixels');
    const final = diagnostics().presentation;
    for (const slot of slots) slot.dispose();
    const retainedAfterDispose = canvases.every(
      (canvas, index) => canvas.toDataURL() === retained[index],
    );
    return {
      ready,
      readyPixels,
      failures,
      adapterRequests,
      dense,
      one,
      larger,
      offscreen,
      final,
      retainedAfterDispose,
      finalPools: editorPoolDiagnostics().length,
    };
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(result.ready, [1, 1, 1, 1]);
  assert.deepEqual(result.readyPixels, [true, true, true, true]);
  assert.equal(result.failures, 0);
  assert.equal(result.adapterRequests, 1);
  assert.equal(result.retainedAfterDispose, true);
  assert.equal(result.finalPools, 0);
  assert.ok(result.final.maximumPending <= 2);
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
