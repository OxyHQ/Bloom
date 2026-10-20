import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage(),
    errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  await page.goto(
    'http://localhost:6006/iframe.html?id=agents-agent-avatar-new-engine--fidelity&viewMode=story',
  );
  await page.waitForFunction(() => window.__avatarFidelity?.stats().frames > 0, { timeout: 60000 });
  await mkdir('.local/avatar-fidelity', { recursive: true });
  await page.screenshot({ path: '.local/avatar-fidelity/story.png' });
  const canvas = await page.$('canvas[aria-label="Avatar con geometría original"]');
  const initial = await canvas.screenshot();
  const firstFrames = await page.evaluate(() => window.__avatarFidelity.stats().frames);
  await page.waitForFunction(
    (firstFrames) => window.__avatarFidelity.stats().frames > firstFrames + 60,
    {},
    firstFrames,
  );
  assert(
    !Buffer.from(await canvas.screenshot()).equals(Buffer.from(initial)),
    'animation starts without a click',
  );
  const click = async (text) => {
    const buttons = await page.$$('button');
    for (const button of buttons) {
      if (await button.evaluate((node, text) => node.textContent === text, text)) {
        await button.click();
        return;
      }
    }
    throw Error(`Missing button ${text}`);
  };
  const rect = await canvas.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2 + 70, rect.y + rect.height / 2 - 40);
  const pointer = await page.evaluate(() => window.__avatarFidelity.stats().states[0].pointer);
  assert(
    pointer.active && pointer.yaw > 0 && pointer.pitch < 0,
    'Fidelity wires actual DOM drag to the renderer',
  );
  await page.mouse.up();
  assert.equal(
    await page.evaluate(() => window.__avatarFidelity.stats().states[0].pointer.active),
    false,
  );
  assert.equal(await page.evaluate(() => window.__avatarFidelity.stats().frameRateLimit), 60);
  await page.select('[aria-label="Límite de refresco"]', '30');
  await new Promise((resolve) => setTimeout(resolve, 150));
  const cadenceStart = await page.evaluate(() => ({
    frames: window.__avatarFidelity.stats().frames,
    at: performance.now(),
  }));
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const cadenceEnd = await page.evaluate(() => ({
    frames: window.__avatarFidelity.stats().frames,
    at: performance.now(),
  }));
  const cadence =
    ((cadenceEnd.frames - cadenceStart.frames) * 1000) / (cadenceEnd.at - cadenceStart.at);
  assert(
    cadence > 0 && cadence < 35,
    `30 fps pacing should actually limit submissions: ${cadence}`,
  );
  await page.evaluate(() => window.__avatarFidelity.setMaxFrameRate(1));
  await new Promise((resolve) => setTimeout(resolve, 100));
  const slowFrames = await page.evaluate(() => window.__avatarFidelity.stats().frames);
  await new Promise((resolve) => setTimeout(resolve, 250));
  assert.equal(
    await page.evaluate(() => window.__avatarFidelity.stats().frames),
    slowFrames,
    'Pacing skips real submissions',
  );
  await page.evaluate(() => window.__avatarFidelity.setColor(0, '#cc6688'));
  await page.waitForFunction(
    (n) => window.__avatarFidelity.stats().frames > n,
    { timeout: 750 },
    slowFrames,
  );
  await page.select('[aria-label="Límite de refresco"]', 'screen');
  assert.equal(await page.evaluate(() => window.__avatarFidelity.stats().frameRateLimit), null);
  await page.select('[aria-label="Límite de refresco"]', '60');
  await click('Restablecer comparación');
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const reference = await canvas.screenshot();
  await click('Probar movimiento');
  const before = await page.evaluate(() => window.__avatarFidelity.stats().frames);
  await page.waitForFunction(
    (before) => window.__avatarFidelity.stats().frames > before + 60,
    {},
    before,
  );
  assert(
    !Buffer.from(await canvas.screenshot()).equals(Buffer.from(reference)),
    'live geometry moves',
  );
  await click('Restablecer comparación');
  await page.waitForFunction(
    () => document.querySelector('button:nth-of-type(2)')?.textContent === 'Probar movimiento',
  );
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  assert(
    Buffer.from(await canvas.screenshot()).equals(Buffer.from(reference)),
    'reset restores exact fixed reference pose',
  );
  await page.select('[aria-label="Copias originales"]', '4');
  await page.waitForFunction(
    () => window.__avatarFidelity.stats().count === 4 && window.__avatarFidelity.stats().rows === 1,
  );
  assert.equal(await page.evaluate(() => window.__avatarFidelity.stats().drawCalls), 16);
  await page.select('[aria-label="Modelo original"]', 'gus');
  await page.waitForFunction(() =>
    window.__avatarFidelity.stats().states.every((s) => s.preset === 'gus'),
  );
  await page.select('[aria-label="Copias originales"]', '24');
  await page.click('label input[type="checkbox"]');
  await page.waitForFunction(() => window.__avatarFidelity.stats().presets.length === 8);
  assert.equal(await page.evaluate(() => window.__avatarFidelity.stats().contexts), 1);
  await page.screenshot({ path: '.local/avatar-fidelity/story-mixed.png', fullPage: true });
  await click('Restablecer comparación');
  await page.waitForFunction(() => {
    const s = window.__avatarFidelity.stats();
    return s.count === 1 && s.states[0].preset === 'gus' && s.width === 320;
  });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: Storybook autoplays without a click, live motion, exact pose reset, four instances / sixteen draws, no browser errors.',
  );
} finally {
  await browser.close();
}
