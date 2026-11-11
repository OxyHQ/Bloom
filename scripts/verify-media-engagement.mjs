/** Shared media rail, activation motion and linear scrim in a real browser. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const artifacts = process.env.ARTIFACT_DIR ?? '.local/media-api-validation/browser';
await mkdir(artifacts, { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 900, height: 700 },
    reducedMotion: 'no-preference',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${process.env.STORYBOOK_URL ?? 'http://localhost:6014'}/iframe.html?id=base-engagement-bar--media-rail&viewMode=story`,
  );
  const like = page.getByTestId('media-like');
  await like.waitFor({ state: 'visible' });
  assert.equal(await like.innerText(), '0');
  const geometry = await page.evaluate(() => {
    const action = document.querySelector('[data-testid="media-like"]');
    const replies = document.querySelector('[data-testid="media-replies"]');
    const share = document.querySelector('[data-testid="media-share"]');
    const bar = document.querySelector('[data-testid="media-actions"]');
    return {
      icon: action.querySelector('svg').getBoundingClientRect().toJSON(),
      action: action.getBoundingClientRect().toJSON(),
      replies: replies.getBoundingClientRect().toJSON(),
      share: share.getBoundingClientRect().toJSON(),
      bar: bar.getBoundingClientRect().toJSON(),
      direction: getComputedStyle(action).flexDirection,
    };
  });
  assert.equal(geometry.direction, 'column');
  assert.equal(geometry.icon.width, 28);
  assert.ok(geometry.replies.y >= geometry.action.bottom);
  assert.ok(geometry.share.y >= geometry.replies.bottom);
  assert.ok(
    geometry.bar.bottom >= geometry.share.bottom,
    'trailing actions retain their intrinsic height',
  );
  const frames = await page.evaluate(async () => {
    const action = document.querySelector('[data-testid="media-like"]');
    const frames = [];
    action.click();
    const started = performance.now();
    await new Promise((resolve) => {
      function sample(now) {
        frames.push({
          elapsed: now - started,
          width: action.querySelector('svg')?.getBoundingClientRect().width,
          text: action.textContent,
          height: action.getBoundingClientRect().height,
        });
        if (now - started < 550) requestAnimationFrame(sample);
        else resolve();
      }
      requestAnimationFrame(sample);
    });
    return frames;
  });
  assert.equal(await like.getAttribute('aria-pressed'), 'true');
  assert.equal(await like.innerText(), '1');
  assert.ok(
    frames.some((frame) => frame.width < 27 || frame.width > 29),
    'accepted activation plays the shared glyph pop',
  );
  assert.ok(
    Math.abs(frames.at(-1).height - geometry.action.height) < 1,
    '0→1 preserves the count slot height',
  );
  const scrim = await page.getByTestId('media-header-scrim').boundingBox();
  const shot = await page.screenshot();
  await writeFile(`${artifacts}/media-rail.png`, shot);
  const pixels = await page.evaluate(
    async ({ data, bounds }) => {
      const img = new Image();
      img.src = data;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
      return [0.02, 0.5, 0.98].map((fraction) => [
        ...context.getImageData(
          Math.floor(bounds.x + 12),
          Math.floor(bounds.y + bounds.height * fraction),
          1,
          1,
        ).data,
      ]);
    },
    { data: `data:image/png;base64,${shot.toString('base64')}`, bounds: scrim },
  );
  assert.ok(pixels[0][0] < 8, 'top is opaque black');
  assert.ok(Math.abs(pixels[1][0] - 64) < 6, 'midpoint is half opacity over the 128 gray fixture');
  assert.ok(pixels[2][0] > 120, 'bottom reaches transparency without a clipped tail');
  assert.deepEqual(errors, []);
  await writeFile(
    `${artifacts}/result.json`,
    JSON.stringify({ geometry, frames, scrim, pixels }, null, 2),
  );
  console.log(
    'PASS shared vertical rail, 28px activation pop, zero count roll, trailing sizing and painted linear scrim midpoint',
  );
} finally {
  await browser.close();
}
