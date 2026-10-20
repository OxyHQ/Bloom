import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage(),
    errors = [],
    forbidden = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => {
    if (/bloom-character|\.wasm(?:\?|$)|orbit-characters|preparation-worker/.test(request.url()))
      forbidden.push(request.url());
  });
  await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 1 });
  await page.goto(
    'http://localhost:6006/iframe.html?id=agents-agent-avatar-new-engine--motion-review&viewMode=story',
  );
  await page.waitForFunction(() => window.__avatarMotionReview?.engine.stats().frames > 0, {
    timeout: 60000,
  });
  const click = async (text) => {
    for (const button of await page.$$('button'))
      if (await button.evaluate((node, value) => node.textContent === value, text)) {
        await button.click();
        return;
      }
    throw Error(`Missing button: ${text}`);
  };
  const canvas = await page.$('canvas');
  const zero = await canvas.screenshot();
  await click('Comparar 3.000 s');
  await page.waitForFunction(() => document.querySelector('input[type=range]').value === '3');
  assert.notDeepEqual(await canvas.screenshot(), zero, 'A reaction checkpoint must visibly move');
  assert(await page.$('img[alt="Fotograma original sincronizado"]'));
  await click('Inicio');
  await click('Reproducir tramo');
  await page.waitForFunction(() => Number(document.querySelector('input[type=range]').value) > 0.5);
  await click('Pausar tramo');
  const paused = await canvas.screenshot();
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.deepEqual(await canvas.screenshot(), paused, 'Pause freezes the actual canvas');
  await click('Reproducir tramo');
  await page.waitForFunction(
    () => document.querySelector('[role=status]').textContent.startsWith('Fin del tramo observado'),
    { timeout: 10000 },
  );
  const endTime = await page.$eval('input[type=range]', (node) => node.value);
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(
    await page.$eval('input[type=range]', (node) => node.value),
    endTime,
    'Finite observation must not loop',
  );
  for (const preset of [
    'blue_beret',
    'alfred',
    'purple_heart',
    'coral_monocle',
    'gus',
    'blue_spectacles',
    'lime_headphones',
    'lime_frog',
  ]) {
    await page.select('[aria-label="Avatar de la captura"]', preset);
    await page.waitForFunction(
      (preset) =>
        window.__avatarMotionReview?.data.preset === preset &&
        window.__avatarMotionReview.engine.stats().frames > 0,
      { timeout: 60000 },
      preset,
    );
    assert.equal(await page.$$eval('canvas', (nodes) => nodes.length), 1);
    assert.equal(await page.evaluate(() => window.__avatarMotionReview.engine.stats().contexts), 1);
  }
  await page.select('[aria-label="Movimiento observado"]', 'idle');
  await page.waitForFunction(
    () =>
      window.__avatarMotionReview?.data.name === 'idle' &&
      window.__avatarMotionReview.engine.stats().frames > 0,
  );
  await click('Comparar 3.000 s');
  await mkdir('.local/avatar-observation-validation', { recursive: true });
  await page.screenshot({ path: '.local/avatar-observation-validation/story.png' });
  await page.evaluate(() => window.__avatarMotionReview.engine.dispose());
  assert.equal(await page.evaluate(() => window.__avatarMotionReview.engine.stats().contexts), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(forbidden, []);
  console.log(
    'PASS: synchronized reference, reaction movement, pause, finite ending, all eight preset replacements and independent renderer without WASM.',
  );
} finally {
  await browser.close();
}
