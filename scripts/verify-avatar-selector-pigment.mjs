/** Real editor: rendered wheel paint is bounded; saved/entered color is not. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { Color } from 'three';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const { PNG } = require('pngjs');
const output = '.local/avatar-selector-pigment';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { colors: [], errors: [] };
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 1200 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', (error) => report.errors.push(error.message));
  const origin = process.env.AVATAR_TEST_ORIGIN || 'http://localhost:6006';
  await page.goto(
    `${origin}/iframe.html?id=application-agent-avatar-characters--editor&viewMode=story`,
  );
  await page.waitForSelector('[aria-label="Custom avatar color"]', { timeout: 90000 });
  for (const [hex, bounded] of [
    ['#000000', '#7e7e7e'],
    ['#ffffff', '#d7d7d7'],
    ['#080019', '#7f7e80'],
    ['#0000ff', '#6c6cff'],
    ['#4778ff', '#4778ff'],
  ]) {
    if (hex === '#4778ff') {
      await page.click('[aria-label="Blue avatar"]');
      await page.waitForFunction(() => {
        const saved = JSON.parse(
          document.querySelector('[data-testid="universal-avatar-config"]').textContent,
        );
        return saved.selections.color === 'blue' && saved.bodyColor === undefined;
      });
    } else {
      await page.click('[aria-label="Custom avatar color"]');
      const input = await page.waitForSelector('input[aria-label="Hex color"]');
      await input.click({ clickCount: 3 });
      await input.type(hex);
      await input.press('Enter');
      await page.waitForFunction(
        (hex) =>
          JSON.parse(document.querySelector('[data-testid="universal-avatar-config"]').textContent)
            .bodyColor === hex,
        {},
        hex,
      );
      assert.equal(await input.evaluate((node) => node.value.toLowerCase()), hex);
      await page.keyboard.press('Escape');
      await page.waitForSelector('input[aria-label="Hex color"]', { hidden: true });
    }
    const expected = new Color(bounded).getStyle();
    await page.waitForFunction(
      (expected) => {
        const chips = [
          ...document.querySelectorAll(
            '[role="group"][aria-label="Agent emotion"] [role="button"]',
          ),
        ];
        return (
          chips.length === 12 &&
          chips.every(
            (chip) =>
              getComputedStyle(chip).backgroundColor.replaceAll(' ', '') ===
              expected.replaceAll(' ', ''),
          )
        );
      },
      {},
      expected,
    );
    const chips = await page.$$('[role="group"][aria-label="Agent emotion"] [role="button"]');
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector(
          '[role="group"][aria-label="Agent emotion"] [aria-label="Clippo"] canvas',
        );
        return (
          canvas &&
          canvas
            .getContext('2d')
            .getImageData(0, 0, canvas.width, canvas.height)
            .data.some((v, i) => i % 4 === 3 && v > 20)
        );
      },
      { timeout: 90000 },
    );
    const chip = await page.$('[role="group"][aria-label="Agent emotion"] [aria-label="Clippo"]');
    const png = PNG.sync.read(await chip.screenshot({ path: `${output}/${hex.slice(1)}.png` }));
    const rgb = bounded
      .slice(1)
      .match(/../g)
      .map((value) => parseInt(value, 16));
    let matching = 0;
    for (let i = 0; i < png.data.length; i += 4)
      if (png.data[i + 3] > 250 && rgb.every((v, c) => Math.abs(png.data[i + c] - v) <= 1))
        matching++;
    assert(matching > 50, `${hex}: actual painted eye-chip background differs from engine pigment`);
    report.colors.push({ hex, bounded, chips: chips.length, matchingPixels: matching });
  }
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
