/** The default Screen binds both long-content primitives to its host's scroll owner. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const base = process.env.STORYBOOK_URL ?? 'http://localhost:6007';
  await page.goto(`${base}/iframe.html?id=foundations-screen--default-route-host&viewMode=story`);
  const viewport = page.locator('[data-bloom-screen-viewport]');
  await page.getByTestId('default-screen').waitFor();
  await viewport.waitFor();
  const read = () =>
    page.evaluate(() => {
      const owner = document.querySelector('[data-bloom-screen-viewport]');
      const panel = document.querySelector('[data-testid="default-shell-panels-main"]');
      const body = document.querySelector('[data-testid="default-screen"]');
      return {
        kind: owner.dataset.bloomScreenViewport,
        ownerCount: document.querySelectorAll('[data-bloom-screen-viewport]').length,
        panel: panel.getBoundingClientRect().toJSON(),
        body: body.getBoundingClientRect().toJSON(),
        documentTop: scrollY,
        ownerTop: owner.scrollTop,
        horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
  for (const list of [false, true]) {
    if (list) await page.getByTestId('default-toggle-list').evaluate((node) => node.click());
    let state = await read();
    assert.equal(state.kind, 'document');
    assert.equal(state.ownerCount, 1);
    assert.ok(state.horizontalOverflow <= 1);
    assert.ok(state.panel.bottom >= state.body.bottom - 1, 'document panel encloses route content');
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(200);
    assert.ok((await read()).documentTop > 300, 'document scrolls long content');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId('default-toggle-host').evaluate((node) => node.click());
    await page.waitForTimeout(300);
    state = await read();
    assert.equal(state.kind, 'element');
    assert.equal(state.ownerCount, 1);
    await viewport.evaluate((node) => {
      node.scrollTop = 500;
    });
    await page.waitForTimeout(200);
    state = await read();
    assert.ok(state.ownerTop > 300, 'Deck scrolls the column');
    assert.equal(state.documentTop, 0, 'Deck vertical scroll does not move the document');
    await viewport.evaluate((node) => {
      node.scrollTop = 0;
    });
    await page.getByTestId('default-toggle-host').evaluate((node) => node.click());
    await page.waitForTimeout(300);
    assert.equal((await read()).kind, 'document');
  }
  assert.deepEqual(errors, []);
  console.log('PASS default Screen owner: document and Deck with ScrollView and VirtualList');
} finally {
  await browser.close();
}
