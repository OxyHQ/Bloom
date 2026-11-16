/** Real pointer, keyboard and touch coverage: trailing controls must survive row commands. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE_PATH ?? 'puppeteer-core');
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const reportDir = process.env.REPORT_DIR ?? '/tmp/bloom-list-trailing-controls';
await mkdir(reportDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: process.env.HEADLESS === '1',
  args: ['--no-sandbox'],
});
const cases = [
  {
    name: 'person',
    story: 'blocks-chat-people--contact-search-results',
    row: 'results-ana',
    control: 'results-ana-action',
    result: 'contacts-result',
    expected: 'Add ana',
  },
  {
    name: 'call',
    story: 'blocks-chat-calls--history',
    row: 'history-1',
    control: 'history-1-callback',
    result: 'history-result',
    expected: 'Call 1',
  },
  {
    name: 'mail-star',
    story: 'blocks-mail-mail-list--pointer-targets',
    row: 'hit-compact',
    control: 'hit-compact-star',
    attribute: 'aria-pressed',
    expected: 'true',
  },
  {
    name: 'caller-trailing',
    story: 'blocks-mail-mail-list--pointer-targets',
    row: 'hit-override',
    control: 'hit-pin',
    result: 'hit-pinned',
    expected: 'true',
  },
];
const selector = (id) => `[data-testid="${id}"]`;
const frame = (page) =>
  page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
async function bounds(page, id) {
  return page.$eval(selector(id), (element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return {
      x,
      y,
      width,
      height,
      visible: getComputedStyle(element).visibility !== 'hidden' && width > 0 && height > 0,
    };
  });
}
function stable(before, after, label) {
  assert.ok(after.visible, `${label}: control disappeared`);
  for (const key of ['x', 'y', 'width', 'height'])
    assert.ok(
      Math.abs(before[key] - after[key]) < 1,
      `${label}: ${key} moved ${before[key]} → ${after[key]}`,
    );
}
async function open(page, item, mode) {
  await page.goto(`${base}/iframe.html?id=${item.story}&viewMode=story&globals=theme:${mode}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector(selector(item.control), { visible: true });
  await page.evaluate(() => document.fonts.ready);
  await frame(page);
}
async function checkResult(page, item) {
  await page.waitForFunction(
    ({ id, attribute, expected }) => {
      const element = document.querySelector(`[data-testid="${id}"]`);
      return (attribute ? element?.getAttribute(attribute) : element?.textContent) === expected;
    },
    {},
    { id: item.result ?? item.control, attribute: item.attribute, expected: item.expected },
  );
  if (item.story.includes('mail-list'))
    assert.equal(
      await page.$eval(selector('hit-opened'), (e) => e.textContent),
      '0',
      `${item.name}: activated the row`,
    );
}
const results = [];
try {
  for (const touch of [false, true])
    for (const mode of ['light', 'dark']) {
      const page = await browser.newPage();
      page.setDefaultTimeout(90000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewport({
        width: touch ? 390 : 1280,
        height: 1000,
        isMobile: touch,
        hasTouch: touch,
      });
      assert.equal(
        await page.evaluate(() => matchMedia('(hover:hover)').matches),
        !touch,
        'Browser input media does not match the test profile; run headed Chrome or xvfb-run',
      );
      for (const item of cases) {
        if (process.env.CASE && process.env.CASE !== item.name) continue;
        await open(page, item, mode);
        await page.mouse.move(1, 990);
        await frame(page);
        const before = await bounds(page, item.control);
        const x = before.x + before.width / 2;
        const y = before.y + before.height / 2;
        if (touch) {
          assert.equal(
            await page.$eval(selector(item.row), (row) => {
              const actions = row.querySelector('[data-bloom-list-actions]');
              return !actions || getComputedStyle(actions).display === 'none';
            }),
            true,
            `${item.name}: touch reserves desktop menu space`,
          );
          await page.touchscreen.tap(x, y);
        } else {
          // Enter from outside and click the ORIGINAL center, without remeasuring/retrying.
          await page.mouse.move(x, y);
          await frame(page);
          stable(before, await bounds(page, item.control), `${item.name}/hover`);
          assert.equal(
            await page.evaluate(
              ({ id, x, y }) =>
                document
                  .querySelector(`[data-testid="${id}"]`)
                  .contains(document.elementFromPoint(x, y)),
              { id: item.control, x, y },
            ),
            true,
            `${item.name}: original center no longer targets control`,
          );
          await page.mouse.down();
          await page.mouse.up();
        }
        await checkResult(page, item);
        results.push({ case: item.name, mode, input: touch ? 'touch' : 'pointer', passed: true });
        if (!touch) {
          // Menu-open state must not hide the direct control after hover leaves.
          await open(page, item, mode);
          const initial = await bounds(page, item.control);
          await page.mouse.move(initial.x + initial.width / 2, initial.y + initial.height / 2);
          await frame(page);
          const menu = await bounds(page, `${item.row}-menu`);
          await page.mouse.click(menu.x + menu.width / 2, menu.y + menu.height / 2);
          await page.waitForSelector('[role="menu"]', { visible: true });
          await page.mouse.move(1, 990);
          await frame(page);
          stable(initial, await bounds(page, item.control), `${item.name}/menu-open`);
          await page.keyboard.press('Escape');
          // Real tab order, including focus-visible styling. No synthetic focus/click.
          await open(page, item, mode);
          await page.mouse.move(1, 990);
          const keyboardBefore = await bounds(page, item.control);
          let reached = false;
          for (let index = 0; index < 70; index++) {
            await page.keyboard.press('Tab');
            reached = await page.evaluate(
              (id) => document.activeElement?.getAttribute('data-testid') === id,
              item.control,
            );
            if (reached) break;
          }
          assert.ok(reached, `${item.name}: control absent from tab order`);
          stable(keyboardBefore, await bounds(page, item.control), `${item.name}/keyboard`);
          await page.keyboard.press('Enter');
          await checkResult(page, item);
          results.push({ case: item.name, mode, input: 'keyboard and open menu', passed: true });
        }
        await page.screenshot({
          path: `${reportDir}/${item.name}-${mode}-${touch ? 'touch' : 'desktop'}.png`,
        });
      }
      if (!process.env.CASE) {
        const passive = {
          story: 'blocks-mail-mail-list--pointer-targets',
          control: 'hit-actions-time',
        };
        await open(page, passive, mode);
        await page.mouse.move(1, 990);
        const before = await bounds(page, passive.control);
        assert.ok(before.visible);
        if (!touch) {
          await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
          await frame(page);
          assert.equal(
            (await bounds(page, passive.control)).visible,
            false,
            'Passive metadata should yield to commands',
          );
          await page.mouse.move(1, 990);
          await frame(page);
          assert.ok((await bounds(page, passive.control)).visible, 'Passive metadata must return');
        }
        results.push({
          case: 'passive metadata',
          mode,
          input: touch ? 'touch' : 'pointer',
          passed: true,
        });
      }
      assert.deepEqual(errors, [], 'Browser runtime errors');
      await page.close();
    }
  console.log(`PASS: ${results.length} trailing-control checks`);
} finally {
  await writeFile(`${reportDir}/results.json`, `${JSON.stringify(results, null, 2)}\n`);
  await browser.close();
}
