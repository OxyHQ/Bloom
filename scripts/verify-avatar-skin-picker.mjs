import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const output = process.env.OUTPUT_DIR || '.local/skin-picker-review';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 1100, height: 1000 });
  await page.goto(
    `${process.env.STORYBOOK_URL || 'http://localhost:6006'}/iframe.html?id=agents-agent-creator--basic&viewMode=story`,
    { waitUntil: 'domcontentloaded', timeout: 120000 },
  );
  await page.waitForSelector('[aria-label="Custom avatar color"]', { timeout: 120000 });
  await page.click('[aria-label="Custom avatar color"]');
  await page.waitForSelector('[aria-label="Hex color"]');
  const hex = () => page.$eval('[aria-label="Hex color"]', (n) => n.value);
  const tone = (color) => {
    const rgb = color
      .slice(1)
      .match(/../g)
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    const y = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (y * 24389) / 27;
  };
  const original = await hex();
  await page.click('[aria-label="Hex color"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.type('#000000');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 200));
  const black = await hex();
  assert.ok(tone(black) >= 45);
  assert.equal(black, '#6b6b6b');
  const bodyColor = () =>
    page.$eval('[data-bloom-vector-avatar]', (node) =>
      [...node.querySelectorAll('path')]
        .filter((p) => !p.closest('defs'))
        .sort((a, b) => {
          const x = a.getBBox(),
            y = b.getBBox();
          return y.width * y.height - x.width * x.height;
        })[0]
        .getAttribute('fill')
        .toLowerCase(),
    );
  await page.waitForFunction(
    (expected) => {
      const node = document.querySelector('[data-bloom-vector-avatar]');
      return [...node.querySelectorAll('path')].some(
        (p) => p.getAttribute('fill')?.toLowerCase() === expected,
      );
    },
    {},
    black,
  );
  assert.equal(await bodyColor(), black);
  await page.evaluate(() => {
    window.skinFieldMutations = 0;
    window.skinFieldObserver = new MutationObserver(
      (records) => (window.skinFieldMutations += records.length),
    );
    window.skinFieldObserver.observe(
      document.querySelector('[data-testid="avatar-skin-color-field"]'),
      { subtree: true, attributes: true, childList: true, characterData: true },
    );
  });
  const field = await page.$('[aria-label="Saturation and brightness"]');
  const box = await field.boundingBox();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.3);
  await page.mouse.down();
  for (let i = 3; i <= 10; i++) {
    await page.mouse.move(box.x + box.width * 0.7, box.y + (box.height * i) / 10);
    await new Promise((r) => setTimeout(r, 25));
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 100));
  const bottom = await hex();
  assert.ok(tone(bottom) >= 45);
  assert.equal(await bodyColor(), bottom);
  await field.focus();
  await page.keyboard.press('ArrowDown');
  await new Promise((r) => setTimeout(r, 80));
  assert.ok(tone(await hex()) >= 45);
  const fieldMutations = await page.evaluate(() => window.skinFieldMutations);
  assert.equal(fieldMutations, 0);
  await page.evaluate(() => window.skinFieldObserver.disconnect());
  await page.screenshot({ path: `${output}/picker.png`, fullPage: true });
  await page.keyboard.press('Escape');
  for (const b of await page.$$('button,[role=button]'))
    if (await b.evaluate((n) => n.textContent.trim() === 'Undo')) {
      await b.click();
      break;
    }
  await page.click('[aria-label="Custom avatar color"]');
  assert.equal(await hex(), original);
  assert.deepEqual(errors, []);
  const report = {
    typedBlack: black,
    bottomDrag: bottom,
    minimumTone: Math.min(tone(black), tone(bottom)),
    noOpDragKeepsHistory: true,
    bodyMatchesHex: true,
    fieldMutations,
    errors,
  };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(report);
} finally {
  await browser.close();
}
