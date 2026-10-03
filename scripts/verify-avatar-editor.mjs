/** Actual Storybook controls: default Clippo, interchangeable eyes, shape wheel,
 * and saved recipe. No synthetic click dispatch.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const expectedPortraits = JSON.parse(
  execFileSync(
    'bun',
    [
      '-e',
      "import {CHARACTER_OPTIONS} from './src/agent-creator/constants'; console.log(JSON.stringify(CHARACTER_OPTIONS.shape.filter(([id]) => !id.startsWith('legacy:') && id !== 'clippo').length));",
    ],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
  ),
);
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1200 },
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (
      response.status() >= 400 &&
      response.url().includes('/bloom-character/')
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(
    `${base}/iframe.html?id=application-agent-avatar-characters--clippo&viewMode=story`,
  );
  const preview = '[data-testid="clippo-preview"] canvas';
  await page.waitForFunction(
    (selector) => {
      const canvas = document.querySelector(selector);
      return canvas
        ?.getContext('2d')
        ?.getImageData(0, 0, canvas.width, canvas.height)
        .data.some((v, i) => i % 4 === 3 && v > 24);
    },
    preview,
    { timeout: 180000 },
  );
  const clippo = page.getByRole('button', { name: 'Clippo', exact: true });
  const todd = page.getByRole('button', { name: 'Todd', exact: true });
  assert.equal(await clippo.getAttribute('aria-pressed'), 'true');
  assert.equal(await clippo.isEnabled(), true);
  assert.equal(
    await clippo.locator('svg').count(),
    1,
    'Clippo eye chip uses static artwork',
  );
  await page.evaluate(async () => {
    window.editorRuntime =
      await import('/bloom-character/runtime.mjs?v=universal-parts-3');
  });
  const settle = async () => {
    await page.waitForTimeout(500);
    await page.waitForFunction(
      () => {
        const stats = window.editorRuntime.runtimeStats();
        return (
          !stats.instances &&
          !stats.legacy.pending &&
          !stats.legacy.preparationActive &&
          !stats.legacy.preparationWaiters
        );
      },
      {},
      { timeout: 180000 },
    );
    assert.equal(
      await page.getByText('Avatar unavailable', { exact: true }).count(),
      0,
    );
  };
  await settle();
  await page.waitForFunction(
    (expectedPortraits) => {
      const canvases = [
        ...document.querySelectorAll(
          '[data-testid="clippo-shared-eyes"] canvas',
        ),
      ];
      return (
        canvases.length === expectedPortraits &&
        canvases.every((canvas) =>
          canvas
            .getContext('2d')
            ?.getImageData(0, 0, canvas.width, canvas.height)
            .data.some((value, index) => index % 4 === 3 && value > 24),
        )
      );
    },
    expectedPortraits,
    { timeout: 180000 },
  );
  await page.screenshot({
    path: '/tmp/bloom-story-clippo.png',
    fullPage: true,
  });
  await clippo.click();
  await settle();
  assert.equal(
    await todd.isEnabled(),
    true,
    'Explicit default retains capabilities under the saved recipe key',
  );
  await todd.click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[aria-label="Todd"][aria-pressed]')
        ?.getAttribute('aria-pressed') === 'true',
  );
  await settle();
  const shapes = page.getByRole('listbox', {
    name: 'Avatar shape',
    exact: true,
  });
  assert.equal(
    await shapes.locator('canvas').count(),
    0,
    'The shape wheel renders silhouettes only',
  );
  await shapes.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await todd.getAttribute('aria-pressed'),
    'true',
    'Changing body retains the shared eye choice',
  );
  await settle();
  await clippo.click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[aria-label="Clippo"][aria-pressed]')
        ?.getAttribute('aria-pressed') === 'true',
  );
  await page
    .getByRole('button', { name: 'Reload saved avatar', exact: true })
    .click();
  assert.equal(
    await clippo.getAttribute('aria-pressed'),
    'true',
    'Clippo eye choice survives serialized recipe',
  );
  await settle();
  assert.deepEqual(errors, []);
  await page.screenshot({
    path: '/tmp/bloom-story-clippo-edited.png',
    fullPage: true,
  });
  await page.goto(
    `${base}/iframe.html?id=application-agent-avatar-characters--single-eye&viewMode=story`,
  );
  await page.waitForFunction(
    () => {
      const canvases = [
        ...document.querySelectorAll(
          '[data-testid="cyclops-shared-eyes"] canvas',
        ),
      ];
      return (
        canvases.length === 21 &&
        canvases.every((canvas) =>
          canvas
            .getContext('2d')
            ?.getImageData(0, 0, canvas.width, canvas.height)
            .data.some((value, index) => index % 4 === 3 && value > 24),
        )
      );
    },
    {},
    { timeout: 180000 },
  );
  assert.equal(
    await page.getByText('Avatar unavailable', { exact: true }).count(),
    0,
  );
  assert.equal(
    await page
      .getByRole('button', { name: 'Single eye', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  assert.equal(
    await page
      .getByRole('slider', { name: 'Eye spacing', exact: true })
      .count(),
    0,
  );
  assert.deepEqual(errors, []);
  await page.screenshot({
    path: '/tmp/bloom-story-single-eye.png',
    fullPage: true,
  });
  console.log(
    'PASS: Clippo controls and saved recipe, plus Single Eye across all 21 shapes in Storybook.',
  );
} finally {
  await browser.close();
}
