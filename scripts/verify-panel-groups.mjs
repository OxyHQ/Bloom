/**
 * Real-browser contracts for nested splits and scrolling flows.
 * STORYBOOK_URL=http://localhost:6007 PLAYWRIGHT_MODULE=/path/to/playwright-core node scripts/verify-panel-groups.mjs
 * The fixture exercises production AppShell, PanelHost, Screen and Dialog renderers.
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const test = (id) => page.getByTestId(id);
const artifacts = process.env.ARTIFACT_DIR ?? '.local/panel-groups';
await mkdir(artifacts, { recursive: true });

async function story(name) {
  const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6007');
  url.searchParams.set('id', `blocks-panel-groups--${name}`);
  url.searchParams.set('viewMode', 'story');
  await page.goto(url.href);
}

function screenViewport(name) {
  return test(`groups-${name}-screen`).locator('[data-bloom-screen-viewport="element"]');
}

async function splitGeometry() {
  return page.evaluate(() => {
    const box = (id) => {
      const node = document.querySelector(`[data-testid="${id}"]`);
      if (!node) return null;
      const { x, y, width, height, bottom } = node.getBoundingClientRect();
      return { x, y, width, height, bottom };
    };
    return {
      main: box('groups-main'),
      likes: box('groups-likes'),
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      width: innerWidth,
      height: innerHeight,
    };
  });
}

async function boundedSplit() {
  await page.waitForFunction(() => {
    const main = document.querySelector('[data-testid="groups-main"]')?.getBoundingClientRect();
    const likes = document.querySelector('[data-testid="groups-likes"]')?.getBoundingClientRect();
    return (
      main &&
      likes &&
      main.height > 0 &&
      likes.height > 0 &&
      main.bottom <= likes.top + 1 &&
      likes.bottom <= innerHeight + 1
    );
  });
  const geometry = await splitGeometry();
  assert.ok(
    geometry.documentWidth <= geometry.width + 1,
    'split has no document horizontal overflow',
  );
  assert.ok(
    geometry.documentHeight <= geometry.height + 1,
    'split has no document vertical overflow',
  );
  assert.ok(
    Math.abs(geometry.main.width - geometry.likes.width) < 1,
    'vertical siblings have the same width',
  );
  return geometry;
}

try {
  await story('nested-split');
  await test('groups-open').click();
  let geometry = await boundedSplit();
  assert.ok(
    Math.abs(geometry.main.height - geometry.likes.height) < 2,
    'split starts in equal halves',
  );
  await test('groups-close').click();
  await test('groups-post-saved').click();
  await test('groups-post-screen').evaluate((node) =>
    node.setAttribute('data-retained-check', 'true'),
  );
  const postViewport = screenViewport('post');
  await postViewport.hover();
  await page.mouse.wheel(0, 180);
  await page.waitForFunction(
    () =>
      (document.querySelector(
        '[data-testid="groups-post-screen"] [data-bloom-screen-viewport="element"]',
      )?.scrollTop ?? 0) >= 100,
  );
  const readingOffset = await postViewport.evaluate((node) => node.scrollTop);
  await test('groups-open').click();
  await boundedSplit();
  assert.equal(
    await test('groups-post-screen').getAttribute('data-retained-check'),
    'true',
    'opening preserves the post DOM',
  );
  assert.equal(
    await test('groups-post-saved').textContent(),
    'Saved',
    'opening preserves local React state',
  );
  assert.ok(
    Math.abs((await postViewport.evaluate((node) => node.scrollTop)) - readingOffset) < 2,
    'opening preserves reading offset',
  );
  await screenViewport('likes').hover();
  await page.mouse.wheel(0, 140);
  await page.waitForFunction(
    () =>
      (document.querySelector(
        '[data-testid="groups-likes-screen"] [data-bloom-screen-viewport="element"]',
      )?.scrollTop ?? 0) >= 80,
  );
  assert.ok(
    Math.abs((await postViewport.evaluate((node) => node.scrollTop)) - readingOffset) < 2,
    'likes scroll independently of the post',
  );

  const divider = test('groups-main-divider');
  const handle = await divider.boundingBox();
  assert.ok(handle, 'vertical split exposes its resize handle');
  const beforeDrag = await splitGeometry();
  const x = handle.x + handle.width / 2;
  const y = handle.y + handle.height / 2;
  assert.equal(
    await divider.evaluate(
      (node, point) => node.contains(document.elementFromPoint(point.x, point.y)),
      { x, y },
    ),
    true,
    'divider is the pointer hit target',
  );
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 60, { steps: 10 });
  await page.mouse.up();
  await page.waitForFunction(
    (height) =>
      (document.querySelector('[data-testid="groups-main"]')?.getBoundingClientRect().height ?? 0) >
      height + 40,
    beforeDrag.main.height,
  );
  await boundedSplit();

  // Pause application JavaScript only within the same desktop presentation tier.
  // Browser CSS must still distribute both axes; presentation handoff is tested below.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  for (const [width, height] of [
    [1100, 420],
    [900, 260],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    geometry = await boundedSplit();
    assert.ok(
      geometry.main.height > 30 && geometry.likes.height > 30,
      'short window retains both panels',
    );
  }
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: false });
  await test('groups-close').click();
  assert.equal(
    await test('groups-post-screen').getAttribute('data-retained-check'),
    'true',
    'closing preserves the post DOM',
  );
  assert.ok(
    Math.abs((await postViewport.evaluate((node) => node.scrollTop)) - readingOffset) < 2,
    'closing preserves reading offset',
  );
  await page.screenshot({ path: `${artifacts}/split-closed.png` });
  console.log(
    'PASS nested split: equal shares, real independent scroll, retained content, resize handle, CSS-only resizing',
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await test('groups-open').click();
  await page.getByRole('dialog', { name: 'Likes', exact: true }).waitFor();
  assert.equal(
    await test('groups-likes-screen').count(),
    1,
    'mobile sheet renders one likes content tree',
  );
  const sheet = await page.getByRole('dialog', { name: 'Likes', exact: true }).boundingBox();
  assert.ok(
    sheet && sheet.y >= 0 && sheet.y + sheet.height <= 845,
    'mobile sheet stays within the viewport',
  );
  await page.screenshot({ path: `${artifacts}/mobile-sheet.png` });
  await test('groups-close').click();
  await page.getByRole('dialog', { name: 'Likes', exact: true }).waitFor({ state: 'hidden' });
  assert.equal(
    await test('groups-open').evaluate((node) => node.contains(document.activeElement)),
    true,
    'closing returns focus to its trigger',
  );
  assert.equal(
    await test('groups-post-screen').getAttribute('data-retained-check'),
    'true',
    'mobile handoff preserves post DOM',
  );
  console.log(
    'PASS mobile web: one bottom-sheet content tree, pointer dismissal, trigger focus restoration',
  );

  await page.setViewportSize({ width: 1200, height: 600 });
  await story('email-flow');
  await test('flow-email-2').waitFor();
  const flowMetrics = () =>
    test('flow-shell').evaluate((shell) => {
      const scrolling = [...shell.querySelectorAll('*')].filter(
        (node) =>
          ['auto', 'scroll'].includes(getComputedStyle(node).overflowY) &&
          node.scrollHeight > node.clientHeight + 1,
      );
      const owner = scrolling[0];
      if (!owner) return null;
      owner.setAttribute('data-flow-scroll-check', 'true');
      return { count: scrolling.length, height: owner.clientHeight, content: owner.scrollHeight };
    });
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-testid="flow-shell"] *')].some(
      (node) =>
        ['auto', 'scroll'].includes(getComputedStyle(node).overflowY) &&
        node.scrollHeight > node.clientHeight + 1,
    ),
  );
  const beforeFlow = await flowMetrics();
  assert.equal(beforeFlow.count, 1, 'emails share one vertical scroll owner');
  const firstEmail = await test('flow-email-0').boundingBox();
  await test('flow-email-0').evaluate((node) => node.setAttribute('data-retained-check', 'true'));
  await test('flow-add').click();
  await test('flow-email-3').waitFor();
  const afterFlow = await flowMetrics();
  assert.ok(
    afterFlow.content > beforeFlow.content + 50,
    'adding an email extends the scroll content',
  );
  assert.ok(
    Math.abs((await test('flow-email-0').boundingBox()).height - firstEmail.height) < 1,
    'adding leaves previous email height unchanged',
  );
  assert.equal(
    await test('flow-email-0').getAttribute('data-retained-check'),
    'true',
    'adding retains existing email DOM',
  );
  const owner = page.locator('[data-flow-scroll-check="true"]');
  await owner.hover();
  await page.mouse.wheel(0, 400);
  await page.waitForFunction(
    () => (document.querySelector('[data-flow-scroll-check="true"]')?.scrollTop ?? 0) > 100,
  );
  assert.equal(
    await page.evaluate(() => window.scrollY),
    0,
    'flow scroll remains in its shared viewport',
  );
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  await page.setViewportSize({ width: 1000, height: 360 });
  const resizedFlow = await flowMetrics();
  assert.ok(
    resizedFlow.height < afterFlow.height,
    'flow viewport follows height resize with JS paused',
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1),
    true,
    'flow viewport stays bounded',
  );
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: false });
  await page.screenshot({ path: `${artifacts}/email-flow.png` });
  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log(
    'PASS email flow: natural heights, one common real scroller, growing content, retained panels, CSS-only resizing',
  );
} finally {
  await browser.close();
}
