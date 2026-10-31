/** A caller's first-paint notification cannot strand the shared frame loop. */
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
  page.on('pageerror', (error) => errors.push(error.message.split('\n')[0]));
  await page.goto(`${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007'}/iframe.html`);
  const result = await page.evaluate(async () => {
    document.body.replaceChildren();
    const { attachEditorAvatar, editorPoolDiagnostics } = await import('/runtime/avatar-pool.ts');
    const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
    const { resolveCompleteEditorRecipe } = await import('/runtime/avatar/recipe.ts');
    const props = { character: resolveAvatarCharacter({ preset: 'blue_beret' }), reduced: false };
    const recipe = resolveCompleteEditorRecipe(props);
    const ready = [0, 0, 0],
      hasPixels = [false, false, false];
    let failures = 0;
    const canvases = Array.from({ length: 3 }, () => {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'display:inline-block;width:64px;height:64px';
      document.body.append(canvas);
      return canvas;
    });
    const slots = await Promise.all(
      canvases.map((canvas, index) =>
        attachEditorAvatar(
          canvas,
          props,
          recipe,
          () => {
            ready[index]++;
            const rgba = canvas
              .getContext('2d')
              .getImageData(0, 0, canvas.width, canvas.height).data;
            hasPixels[index] = rgba.some((value, offset) => offset % 4 === 3 && value > 0);
            if (index === 0) throw Error('Expected onReady callback failure');
          },
          () => failures++,
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
    await wait(() => ready.every((value) => value === 1), 'all ready callbacks');
    const before = editorPoolDiagnostics()[0].stats.frames;
    await wait(
      () => editorPoolDiagnostics()[0].stats.frames >= before + 5,
      'continued frames after caller exception',
    );
    const after = editorPoolDiagnostics()[0].stats.frames;
    for (const slot of slots) slot.dispose();
    return {
      ready,
      hasPixels,
      failures,
      continuedFrames: after - before,
      finalPools: editorPoolDiagnostics().length,
    };
  });
  assert.deepEqual(result.ready, [1, 1, 1]);
  assert.deepEqual(result.hasPixels, [true, true, true]);
  assert.equal(result.failures, 0);
  assert.ok(result.continuedFrames >= 5);
  assert.equal(result.finalPools, 0);
  assert.deepEqual(errors, ['Expected onReady callback failure']);
  console.log(JSON.stringify({ result, expectedUserCallbackErrors: errors }));
} finally {
  await browser.close();
}
