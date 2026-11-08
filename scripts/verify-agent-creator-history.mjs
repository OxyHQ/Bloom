import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const output = process.env.OUTPUT_DIR || '.local/editor-history-review';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const report = {};
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 1100, height: 1200 });
  await page.goto(
    `${process.env.STORYBOOK_URL || 'http://localhost:6006'}/iframe.html?id=agents-agent-creator--basic&viewMode=story`,
    { waitUntil: 'domcontentloaded', timeout: 120000 },
  );
  await page.waitForSelector('[aria-label="Avatar style"]', { timeout: 120000 });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const settle = () =>
    page.waitForFunction(
      () =>
        document.querySelector('[data-bloom-vector-avatar] path') &&
        document
          .querySelector('[data-testid="agent-avatar-preparation"]')
          ?.getAttribute('aria-busy') !== 'true',
      { timeout: 60000 },
    );
  const action = async (text) => {
    for (const b of await page.$$('button,[role=button]'))
      if (await b.evaluate((n, t) => n.textContent.trim() === t, text)) {
        await b.click();
        return;
      }
    throw Error(text);
  };
  const color = () =>
    page.$eval('[data-testid="agent-avatar-color-selector"]', (n) =>
      n.querySelector('[aria-pressed=true]')?.getAttribute('aria-label'),
    );
  await settle();
  const initialColor = await color();
  await page.click('[aria-label="Coral avatar"]');
  assert.equal(await color(), 'Coral avatar');
  await action('Undo');
  assert.equal(await color(), initialColor);
  await action('Redo');
  assert.equal(await color(), 'Coral avatar');
  await page.click('[aria-label="Dots"]');
  await settle();
  await action('Undo');
  await settle();
  await action('Restore original');
  await settle();
  assert.equal(await color(), initialColor);
  await action('Undo');
  await settle();
  assert.equal(await color(), 'Coral avatar');
  report.buttons = true;
  await page.click('[aria-label="Custom avatar color"]');
  await page.waitForSelector('[aria-label="Saturation and brightness"]');
  const field = await page.$('[aria-label="Saturation and brightness"]');
  const box = await field.boundingBox();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await page.mouse.down();
  for (let i = 2; i <= 8; i++) {
    await page.mouse.move(box.x + (box.width * i) / 10, box.y + box.height * 0.6);
    await wait(35);
  }
  await page.mouse.up();
  await wait(150);
  const hex = await page.$eval('[aria-label="Hex color"]', (n) => n.value);
  await page.keyboard.press('Escape');
  await action('Undo');
  assert.equal(await color(), 'Coral avatar');
  await action('Redo');
  await page.click('[aria-label="Custom avatar color"]');
  assert.equal(await page.$eval('[aria-label="Hex color"]', (n) => n.value), hex);
  await page.keyboard.press('Escape');
  report.drag = { hex, oneUndo: true };
  await page.click('[aria-label="Agent name"]');
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  const name = await page.$eval('[aria-label="Agent name"]', (n) => n.value);
  await action('Undo');
  assert.equal(await page.$eval('[aria-label="Agent name"]', (n) => n.value), name);
  report.businessFields = true;
  // Keyboard history is scoped to controls and leaves native text editing alone.
  const beforeTextUndo = await color();
  await page.click('[aria-label="Agent name"]');
  await page.keyboard.type(' text');
  await page.keyboard.down('Control');
  await page.keyboard.press('z');
  await page.keyboard.up('Control');
  assert.equal(await color(), beforeTextUndo);
  await action('Redo');
  for (const b of await page.$$('button,[role=button]'))
    if (await b.evaluate((n) => n.textContent.trim() === 'Undo')) {
      await b.focus();
      break;
    }
  await page.keyboard.down('Control');
  await page.keyboard.press('z');
  await page.keyboard.up('Control');
  assert.equal(await color(), 'Coral avatar');
  report.keyboard = true;
  // Delay the first uncached geometry import, then choose a second character.
  let held = false;
  let released = false;
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (!held && request.url().includes('/vector-assets/') && request.url().includes('.json')) {
      held = true;
      setTimeout(() => {
        released = true;
        request.continue().catch(() => {});
      }, 1800);
    } else request.continue().catch(() => {});
  });
  const select = async (title) => {
    await page.click('[aria-label="Avatar style"]');
    await page.waitForSelector('[role="option"]');
    for (const item of await page.$$('[role="option"]'))
      if (await item.evaluate((n, t) => n.textContent.trim() === t, title)) {
        await item.click();
        return;
      }
    throw Error('Missing ' + title);
  };
  await select('Cloud bot');
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="agent-avatar-preparation"]')
        ?.getAttribute('aria-busy') === 'true',
  );
  assert.equal(
    await page.$eval('[aria-label="Avatar style"]', (n) => n.textContent.includes('Cloud bot')),
    true,
  );
  await select('Star bot');
  await settle();
  const latest = await page.$eval('[data-bloom-vector-avatar]', (n) => n.dataset.geometry);
  await wait(2100);
  await settle();
  assert.equal(await page.$eval('[data-bloom-vector-avatar]', (n) => n.dataset.geometry), latest);
  assert.ok(latest.includes('bot_star'));
  assert.ok(held && released);
  report.loadRace = true;
  await action('Undo');
  await settle();
  assert.ok(
    (await page.$eval('[data-bloom-vector-avatar]', (n) => n.dataset.geometry)).includes(
      'bot_cloud',
    ),
  );
  await action('Redo');
  await settle();
  assert.ok(
    (await page.$eval('[data-bloom-vector-avatar]', (n) => n.dataset.geometry)).includes(
      'bot_star',
    ),
  );
  report.shapeHistory = true;
  await page.screenshot({ path: `${output}/editor.png`, fullPage: true });
  assert.deepEqual(errors, []);
  report.errors = errors;
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(report);
} finally {
  await browser.close();
}
