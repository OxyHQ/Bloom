import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6013';
const output = process.env.PROBE_OUTPUT ?? '/tmp/bloom-composition-contracts';
const expectGap = process.argv.includes('--expect-gap');
const origin = new URL(base).origin;
const browser = await chromium.launch();
const failures = [];
const errors = [];
const checks = [];
function check(name, condition, actual) {
  checks.push({ name, passed: condition, actual });
  if (!condition) failures.push(name);
}

try {
  await fs.mkdir(output, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
    colorScheme: 'light',
    serviceWorkers: 'block',
  });
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/iframe.html?id=composition-contract-probes--continuous-chrome&viewMode=story`,
  );
  const meter = page.getByTestId('contract-collapse-meter');
  await meter.waitFor({ state: 'attached', timeout: 180_000 });
  await page.waitForTimeout(1_000);
  const readMotion = () =>
    page.evaluate(() => {
      const meterNode = document.querySelector('[data-testid="contract-collapse-meter"]');
      const header = document.querySelector('[data-testid="contract-route-header"]');
      const bar = document.querySelector('[role="tablist"]');
      if (!meterNode || !header || !bar) throw new Error('Missing public composition fixture');
      return {
        offset: window.scrollY,
        amount: meterNode.getBoundingClientRect().width,
        header: header.getBoundingClientRect().toJSON(),
        bar: bar.getBoundingClientRect().toJSON(),
      };
    });
  const initial = await readMotion();
  assert.equal(initial.offset, 0);
  assert.equal(initial.amount, 0);
  await page.mouse.move(300, 500);
  await page.mouse.wheel(0, 60);
  await page.waitForTimeout(650);
  const partial = await readMotion();
  assert.equal(partial.offset, 60, 'The actual document received the wheel gesture');
  // Independent expectations measured in the existing consumer: 60/90 of the
  // hide range, held continuously rather than timing to a direction target.
  check('continuous collapse progress', Math.abs(partial.amount - 60) <= 1, partial.amount);
  await page.waitForTimeout(1_200);
  const held = await readMotion();
  check('held partial progress', Math.abs(held.amount - 60) <= 1, held.amount);
  // The consumer's bar reaches its minimized target while the header remains
  // partial. Feeding a newly continuous header fraction straight into the bar
  // would change that behavior, even if the first two assertions passed.
  check('bar reaches its minimized target', Math.abs(held.bar.height - 44) <= 1, held.bar.height);
  check(
    'header follows the shared progress',
    Math.abs(partial.header.y - (initial.header.y - (initial.header.height * 2) / 3)) <= 1,
    { initial: initial.header, partial: partial.header },
  );
  await page.screenshot({ path: path.join(output, 'continuous-chrome.png') });

  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto(
    `${base}/iframe.html?id=composition-contract-probes--inline-compact-navigation&viewMode=story`,
  );
  await page.getByTestId('contract-panel-route').waitFor({ timeout: 180_000 });
  const draft = page.getByLabel('Navigation draft').filter({ visible: true });
  await draft.fill('Preserve navigation state');
  const navigation = [];
  for (const width of [900, 899, 900]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(1_000);
    navigation.push(
      await page.evaluate(() => {
        const panel = document.querySelector('[data-testid="contract-panel-route"]');
        if (!panel) throw new Error('Missing panel');
        const nodes = Array.from(document.querySelectorAll('[data-testid="contract-navigation"]'));
        return {
          width: innerWidth,
          panel: panel.getBoundingClientRect().toJSON(),
          navigation: nodes.map((node) => ({
            rect: node.getBoundingClientRect().toJSON(),
            inert: Boolean(node.closest('[inert]')),
            draft: node.querySelector('input')?.value,
          })),
        };
      }),
    );
    await page.screenshot({ path: path.join(output, `navigation-${width}.png`) });
  }
  const compact = navigation[1];
  const visible = compact.navigation.filter((node) => node.rect.height > 0 && !node.inert);
  check(
    'compact inline navigation',
    visible.length === 1 && visible[0].rect.bottom <= compact.panel.y + 1,
    compact,
  );
  assert.equal(
    await page.getByLabel('Navigation draft').filter({ visible: true }).inputValue(),
    'Preserve navigation state',
    'Resizing must preserve the existing navigation state',
  );
  assert.deepEqual(errors, [], 'Runtime errors invalidate a layout comparison');
  await fs.writeFile(
    path.join(output, 'results.json'),
    JSON.stringify({ checks, errors, motion: { initial, partial, held }, navigation }, null, 2),
  );
  if (expectGap) {
    assert.deepEqual(failures, [
      'continuous collapse progress',
      'held partial progress',
      'header follows the shared progress',
      'compact inline navigation',
    ]);
    console.log('Confirmed four missing contract assertions on the unchanged runtime.');
  } else {
    assert.deepEqual(
      failures,
      [],
      'Shared composition contracts must satisfy the consumer baseline',
    );
  }
} finally {
  await browser.close();
}
