/**
 * Browser verification for PageHeader's real container-width action adaptation.
 * Start Storybook first, then provide Chrome and Puppeteer Core:
 *
 *   STORYBOOK_URL=http://127.0.0.1:6138 \
 *   CHROME_PATH=/path/to/chrome \
 *   PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
 *   node scripts/verify-page-header-responsive-actions.mjs
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE_PATH ?? 'puppeteer-core');
const chrome = process.env.CHROME_PATH;
if (!chrome) throw new Error('Set CHROME_PATH to the Chromium/Chrome executable.');
const storybook = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const output = resolve(process.env.HEADER_ACTIONS_OUTPUT ?? 'docs/audits/issue-663/header-actions');
mkdirSync(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 900 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
const report = {
  story: 'composition-headers-adaptive-actions--local-width',
  viewport: { width: 1500, height: 900 },
  containerWidths: [],
  checks: [],
  errors,
};
const check = (name, pass, evidence = {}) => {
  report.checks.push({ name, pass, ...evidence });
  assert.ok(pass, name);
};
const host = '[data-testid="action-host"]';
const setHostWidth = async (width) => {
  await page.$eval(
    host,
    (element, value) => {
      element.style.width = `${value}px`;
    },
    width,
  );
  await wait(900);
  const actual = await page.$eval(host, (element) => element.getBoundingClientRect().width);
  report.containerWidths.push(actual);
  check(`container measures ${width}px`, actual === width, { expected: width, actual });
};
const aria = (selector, name) =>
  page.$eval(selector, (element, key) => element.getAttribute(key), name);

try {
  await page.goto(`${storybook}/iframe.html?id=${report.story}&viewMode=story`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('[data-testid="action-header"]');
  await wait(900);
  await page.click('[data-testid="actions-width-900"]');
  await setHostWidth(1400);
  await page.screenshot({ path: resolve(output, 'spacious.png') });

  const pin = '[data-testid="adaptive-actions-pin"]';
  await page.click(pin);
  check(
    'selected action state changes in spacious layout',
    (await aria(pin, 'aria-pressed')) === 'true',
  );

  await setHostWidth(240);
  await page.screenshot({ path: resolve(output, 'compact.png') });
  await page.click('[data-testid="adaptive-actions-overflow"]');
  await page.waitForSelector('[role="menu"]');
  check(
    'selected state is represented in compact overflow',
    await page.$eval(
      '[role="menuitemcheckbox"][aria-label="Pin document"]',
      (element) => element.getAttribute('aria-checked') === 'true',
    ),
  );
  await page.keyboard.press('ArrowDown');
  await wait(150);
  check(
    'ArrowDown moves real browser focus to the first menu item',
    (await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))) ===
      'Find in document',
  );
  await page.screenshot({ path: resolve(output, 'compact-menu-focused.png') });

  await setHostWidth(1400);
  check(
    'open menu and focused item survive compact-to-spacious resize',
    (await page.$$('[role="menu"]')).length === 1 &&
      (await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))) ===
        'Find in document',
  );
  await page.keyboard.press('Enter');
  await wait(300);
  check(
    'Enter invokes the original action handler after resize',
    (await page.$eval('[data-testid="action-result"]', (element) => element.textContent)) ===
      'Find',
  );
  check(
    'selected action state survives overflow and resize',
    (await aria(pin, 'aria-pressed')) === 'true',
  );
  check('no uncaught page errors', errors.length === 0, { errors });
  report.browser = await browser.version();
  writeFileSync(resolve(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
} catch (error) {
  report.failure = String(error);
  writeFileSync(resolve(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  throw error;
} finally {
  await browser.close();
}
