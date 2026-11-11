/** A content cap constrains interaction, without changing the resting split. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  await page.goto(
    `${process.env.STORYBOOK_URL ?? 'http://localhost:6014'}/iframe.html?id=blocks-panel-groups--content-capped-split&viewMode=story`,
  );
  await page.getByTestId('groups-open').click();
  const main = page.getByTestId('groups-main');
  const likes = page.getByTestId('groups-likes');
  const divider = page.getByTestId('groups-main-divider');
  await divider.waitFor();
  const initial = await likes.boundingBox();
  assert.ok(
    Math.abs(initial.height - (await main.boundingBox()).height) < 2,
    'default split still halves',
  );
  async function start() {
    const box = await divider.boundingBox();
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    return { x, y };
  }
  await page.evaluate(() => {
    const original = HTMLElement.prototype.getBoundingClientRect;
    window.__panelBoundsReads = 0;
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (['groups-main', 'groups-likes'].includes(this.dataset.testid))
        window.__panelBoundsReads++;
      return original.call(this);
    };
  });
  let grip = await start();
  const startingReads = await page.evaluate(() => window.__panelBoundsReads);
  assert.equal(startingReads, 2, 'one bound read per paired track at gesture start');
  await page.mouse.move(grip.x, grip.y - 150, { steps: 12 });
  assert.ok(
    Math.abs((await likes.boundingBox()).height - initial.height) < 2,
    'oversized initial panel cannot grow',
  );
  await page.mouse.move(grip.x, grip.y + 70, { steps: 12 });
  const smaller = (await likes.boundingBox()).height;
  assert.ok(smaller < initial.height - 50, 'can progressively shrink without a starting snap');
  await page.mouse.move(grip.x, grip.y, { steps: 12 });
  assert.ok(
    (await likes.boundingBox()).height <= smaller + 2,
    'reversing the same gesture cannot restore excess blank space',
  );
  assert.equal(
    await page.evaluate(() => window.__panelBoundsReads),
    startingReads,
    'pointer moves do not remeasure the panels',
  );
  assert.match(
    await page.getByTestId('groups-open').getAttribute('aria-label'),
    /resize commits 0$/,
    'pointer moves do not commit React layout state',
  );
  await page.mouse.up();
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="groups-open"]')
      ?.getAttribute('aria-label')
      ?.endsWith('resize commits 1'),
  );
  grip = await start();
  await page.mouse.move(grip.x, grip.y + 600, { steps: 12 });
  await page.mouse.up();
  assert.ok(
    Math.abs((await likes.boundingBox()).height - 120) < 2,
    'authored minimum remains a stop',
  );
  grip = await start();
  await page.mouse.move(grip.x, grip.y - 600, { steps: 12 });
  await page.mouse.up();
  const capped = await likes.boundingBox();
  assert.ok(
    capped.height > 120 && capped.height < initial.height - 30,
    'real content ceiling limits subsequent growth',
  );
  const lastText = page.getByText('Likes paragraph 2.', { exact: false });
  const bottom = await lastText.boundingBox();
  assert.ok(
    Math.abs(capped.y + capped.height - bottom.y - bottom.height - 16) < 3,
    'cap fits real content and its authored padding',
  );
  await divider.focus();
  await page.keyboard.press('ArrowUp');
  assert.ok(
    (await likes.boundingBox()).height <= capped.height + 2,
    'keyboard shares the content ceiling',
  );
  console.log(
    JSON.stringify({
      initial: initial.height,
      reduced: smaller,
      capped: capped.height,
      keyboard: true,
      boundsAtStart: startingReads,
      boundsDuringMoves: 0,
      commitsDuringMoves: 0,
      commitsAtRelease: 1,
    }),
  );
} finally {
  await browser.close();
}
