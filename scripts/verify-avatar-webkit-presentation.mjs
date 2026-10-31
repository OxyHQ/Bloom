/** Linux Playwright WebKit coverage; this is not an iOS hardware audit. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const playwright = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright-core',
);
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
const browser = await playwright.webkit.launch({ headless: true });
const report = {
  scope: 'Linux Playwright WebKit; no iOS device or Safari-product claim',
  cases: [],
  errors: [],
};
try {
  const page = await browser.newPage({
    viewport: { width: 640, height: 512 },
    deviceScaleFactor: 2,
  });
  page.on('pageerror', (error) => report.errors.push(error.message));
  await page.route('**/avatar-webkit-presentation.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><body style="margin:0">' }),
  );
  await page.goto(`${origin}/avatar-webkit-presentation.html`);
  report.capabilities = await page.evaluate(() => ({
    ua: navigator.userAgent,
    webgl2: !!document.createElement('canvas').getContext('webgl2'),
    bitmaprenderer: !!document.createElement('canvas').getContext('bitmaprenderer'),
    offscreen2d:
      typeof OffscreenCanvas !== 'undefined' && !!new OffscreenCanvas(1, 1).getContext('2d'),
    transfer:
      typeof OffscreenCanvas !== 'undefined' &&
      typeof OffscreenCanvas.prototype.transferToImageBitmap === 'function',
  }));
  assert.equal(report.capabilities.webgl2, true);
  for (const size of [64, 96, 112, 320]) {
    const result = await page.evaluate(async (size) => {
      const { createAvatar } = await import('/runtime/avatar-runtime.ts');
      const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
      const canvas = document.createElement('canvas');
      canvas.style.cssText = `display:block;width:${size}px;height:${size}px`;
      document.body.append(canvas);
      let resolveReady,
        rejectReady,
        readyCount = 0;
      const ready = new Promise((resolve, reject) => {
        resolveReady = resolve;
        rejectReady = reject;
      });
      const controller = await createAvatar(
        canvas,
        {
          character: resolveAvatarCharacter({ preset: 'blue_beret' }),
          reduced: true,
          portrait: true,
        },
        {
          onReady: () => {
            readyCount++;
            resolveReady();
          },
          onError: () => rejectReady(Error('Runtime presentation failed')),
        },
      );
      await Promise.race([
        ready,
        new Promise((_, reject) =>
          setTimeout(() => reject(Error('Runtime readiness timeout')), 30000),
        ),
      ]);
      const stage = document.querySelector('canvas[data-avatar-renderer="shared-editor-scene"]');
      if (!stage) throw Error('Missing actual shared WebGL stage');
      const gl = stage.getContext('webgl2'),
        debug = gl.getExtension('WEBGL_debug_renderer_info');
      const width = canvas.width,
        height = canvas.height;
      const pixels = (source) => {
        const copy = document.createElement('canvas');
        copy.width = width;
        copy.height = height;
        const context = copy.getContext('2d');
        context.drawImage(source, 0, 0);
        return context.getImageData(0, 0, width, height).data;
      };
      const before = pixels(canvas);
      const scratch = new OffscreenCanvas(width, height),
        context = scratch.getContext('2d');
      context.drawImage(stage, 0, 0, stage.width, stage.height, 0, 0, width, height);
      const bitmap = scratch.transferToImageBitmap();
      const destination = document.createElement('canvas');
      destination.width = width;
      destination.height = height;
      const presenter = destination.getContext('bitmaprenderer');
      presenter.transferFromImageBitmap(bitmap);
      bitmap.close();
      const after = pixels(destination);
      let changedPixels = 0,
        maxDifference = 0,
        nontransparent = 0,
        partialAlpha = 0;
      for (let index = 0; index < before.length; index += 4) {
        let delta = 0;
        for (let channel = 0; channel < 4; channel++)
          delta = Math.max(delta, Math.abs(before[index + channel] - after[index + channel]));
        if (delta) changedPixels++;
        maxDifference = Math.max(maxDifference, delta);
        if (after[index + 3]) nontransparent++;
        if (after[index + 3] > 0 && after[index + 3] < 255) partialAlpha++;
      }
      const png = destination.toDataURL('image/png');
      const image = new Image();
      image.src = png;
      await image.decode();
      if (image.naturalWidth !== width || image.naturalHeight !== height)
        throw Error('Bitmap snapshot dimensions differ');
      const result = {
        size,
        width,
        height,
        readyCount,
        changedPixels,
        maxDifference,
        nontransparent,
        partialAlpha,
        snapshot: png.startsWith('data:image/png;base64,'),
        gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      };
      controller.dispose();
      canvas.remove();
      return result;
    }, size);
    report.cases.push(result);
    console.log(JSON.stringify(result));
    assert.equal(result.readyCount, 1);
    assert(result.nontransparent > 0);
    assert(result.partialAlpha > 0);
    assert(result.snapshot);
    assert.equal(result.changedPixels, 0);
    assert.equal(result.maxDifference, 0);
  }
  assert.equal(report.errors.length, 0, report.errors.join('\n'));
} finally {
  await mkdir('.local/avatar-webkit-presentation', { recursive: true });
  await writeFile(
    '.local/avatar-webkit-presentation/report.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await browser.close();
}
