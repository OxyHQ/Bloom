/** A failing pool drains every old entry before accepting a replacement elsewhere. */
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
  const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
  await page.goto(`${origin}/iframe.html`);
  const result = await page.evaluate(async () => {
    const { attachEditorAvatar, editorPoolDiagnostics } = await import('/runtime/avatar-pool.ts');
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    const { resolveCompleteEditorRecipe } = await import('/runtime/avatar/recipe.ts');
    const props = {
      character: resolveAvatarCharacter({ preset: 'blue_beret' }),
      reduced: true,
      portrait: true,
    };
    const recipe = resolveCompleteEditorRecipe(props);
    const createCanvas = () => {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'display:block;width:64px;height:64px';
      document.body.append(canvas);
      return canvas;
    };
    document.body.replaceChildren();
    const canvases = Array.from({ length: 3 }, createCanvas),
      replacement = createCanvas();
    const callbacks = [0, 0, 0];
    let polls = 0,
      fail = false,
      recovery,
      recoveryReady = 0,
      recoveryErrors = 0;
    const original = WebGL2RenderingContext.prototype.clientWaitSync;
    WebGL2RenderingContext.prototype.clientWaitSync = function () {
      polls++;
      return fail ? this.WAIT_FAILED : this.TIMEOUT_EXPIRED;
    };
    const slots = await Promise.all(
      canvases.map((canvas, index) =>
        attachEditorAvatar(
          canvas,
          props,
          recipe,
          () => {
            throw Error('Fatal pool unexpectedly presented');
          },
          () => {
            callbacks[index]++;
            if (index === 0) {
              WebGL2RenderingContext.prototype.clientWaitSync = original;
              recovery = attachEditorAvatar(
                replacement,
                props,
                recipe,
                () => recoveryReady++,
                () => recoveryErrors++,
              );
              throw Error('Expected user callback failure');
            }
          },
        ),
      ),
    );
    const wait = async (predicate, label) => {
      const start = performance.now();
      while (!predicate()) {
        if (performance.now() - start > 20000) throw Error(`Timed out: ${label}`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    };
    await wait(() => polls > 0, 'pending calibration');
    fail = true;
    await wait(() => recoveryReady > 0, 'healthy reentrant replacement');
    const current = editorPoolDiagnostics();
    const replacementSlot = await recovery;
    for (const slot of slots) slot.dispose();
    replacementSlot.dispose();
    await new Promise((resolve) => setTimeout(resolve, 30));
    return {
      callbacks,
      recoveryReady,
      recoveryErrors,
      livePoolsDuringRecovery: current.length,
      recoveryAvatars: current[0]?.avatars,
      finalPools: editorPoolDiagnostics().length,
      stages: document.querySelectorAll('canvas[data-avatar-renderer]').length,
    };
  });
  assert.deepEqual(result.callbacks, [1, 1, 1]);
  assert.equal(result.recoveryReady, 1);
  assert.equal(result.recoveryErrors, 0);
  assert.equal(result.livePoolsDuringRecovery, 1);
  assert.equal(result.recoveryAvatars, 1);
  assert.equal(result.finalPools, 0);
  assert.equal(result.stages, 0);
  assert.deepEqual(errors, ['Expected user callback failure']);
  console.log(JSON.stringify({ result, expectedUserCallbackErrors: errors }));
} finally {
  await browser.close();
}
