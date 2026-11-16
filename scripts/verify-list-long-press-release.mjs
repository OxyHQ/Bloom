/** CDP touch release must not turn consumed selection into a click on another row. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE_PATH ?? 'puppeteer-core');
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const output = process.env.REPORT_DIR ?? '/tmp/bloom-list-long-press';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: false,
  args: ['--no-sandbox'],
});
const results = [];
const selector = (id) => `[data-testid="${id}"]`;
const frame = (page) =>
  page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.setDefaultTimeout(90000);
    await page.setViewport({ width: 390, height: 900, hasTouch: true, isMobile: true });
    const cdp = await page.createCDPSession();
    async function load(story = 'pointer-targets', ready = 'hit-selection-link') {
      await page.goto(
        `${base}/iframe.html?id=blocks-mail-mail-list--${story}&viewMode=story&globals=theme:${mode}`,
        { waitUntil: 'domcontentloaded' },
      );
      await page.waitForSelector(selector(ready), { visible: true });
      await page.evaluate(() => document.fonts.ready);
      await frame(page);
      assert.equal(await page.evaluate(() => matchMedia('(pointer:coarse)').matches), true);
      await page.evaluate(() => {
        window.__listTouchTrace = [];
        for (const type of ['touchend', 'touchcancel', 'click'])
          document.addEventListener(type, (event) => {
            window.__listTouchTrace.push({
              type,
              target: event.target.closest?.('[data-bloom-list-row]')?.getAttribute('data-testid'),
              prevented: event.defaultPrevented,
              cancelable: event.cancelable,
            });
          });
      });
    }
    async function point(id, yOffset = 16) {
      return page.$eval(
        selector(id),
        (element, yOffset) => {
          const rect = element.getBoundingClientRect();
          const p = { x: rect.left + 140, y: rect.top + yOffset };
          if (!element.contains(document.elementFromPoint(p.x, p.y)))
            throw Error('Touch starts on another target');
          return p;
        },
        yOffset,
      );
    }
    const start = (p) =>
      cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] });
    const end = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const count = () => page.$eval(selector('hit-opened'), (el) => Number(el.textContent));
    const trace = () => page.evaluate(() => window.__listTouchTrace);
    await load();
    // Test-only external layout change models a selection header appearing.
    // No handler, renderer or app layout is replaced by this diagnostic mutation.
    await page.evaluate(() => {
      const check = document.querySelector('[data-testid="hit-selection-check"]');
      window.__heldListTarget = document.querySelector('[data-testid="hit-selection-link"]');
      const observer = new MutationObserver(() => {
        if (check.getAttribute('aria-checked') === 'true') {
          document.querySelector('[data-testid="hit-opened"]').parentElement.style.paddingTop =
            '40px';
          observer.disconnect();
        }
      });
      observer.observe(check, { attributes: true, attributeFilter: ['aria-checked'] });
    });
    const p = await point('hit-selection-link');
    const before = await page.$eval(
      selector('hit-selection-link'),
      (el) => el.getBoundingClientRect().top,
    );
    await start(p);
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="hit-selection-check"]')
          .getAttribute('aria-checked') === 'true',
    );
    await frame(page);
    const held = await page.evaluate(
      (p) => ({
        connected: window.__heldListTarget.isConnected,
        same:
          window.__heldListTarget === document.querySelector('[data-testid="hit-selection-link"]'),
        top: window.__heldListTarget.getBoundingClientRect().top,
        under: document
          .elementFromPoint(p.x, p.y)
          ?.closest('[data-bloom-list-row]')
          ?.getAttribute('data-testid'),
      }),
      p,
    );
    assert.ok(held.connected && held.same, 'The original touch target must stay mounted');
    assert.equal(held.top - before, 40);
    assert.equal(
      held.under,
      'hit-override',
      'The original point must now hit the preceding navigable row',
    );
    await end();
    await pause(100);
    const release = await trace();
    assert.equal(await count(), 0, 'Consumed long press navigated another row');
    assert.ok(
      release.some((e) => e.type === 'touchend' && e.cancelable && e.prevented),
      'Touchend must cancel the browser default',
    );
    assert.ok(
      !release.some((e) => e.type === 'click'),
      'Consumed touch emitted a compatibility click',
    );
    await page.touchscreen.tap(...Object.values(await point('hit-actions-link')));
    assert.equal(await count(), 1, 'The next ordinary tap was swallowed');
    results.push({ mode, case: 'selection shifts layout', held, release, nextTap: true });
    await page.screenshot({ path: `${output}/shift-${mode}.png` });

    // Cancelling after long-press selection must not poison the following touch.
    await load();
    await start(await point('hit-selection-link'));
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="hit-selection-check"]')
          .getAttribute('aria-checked') === 'true',
    );
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    const next = await point('hit-selection-link');
    await page.touchscreen.tap(next.x, next.y);
    assert.equal(await count(), 1);
    assert.ok((await trace()).some((e) => e.type === 'touchend' && !e.prevented));
    results.push({ mode, case: 'cancel then tap', passed: true });

    // A row without a selection or long-press callback must not cancel touchend.
    await load();
    await start(await point('hit-actions-link'));
    await pause(650);
    await end();
    assert.ok((await trace()).some((e) => e.type === 'touchend' && !e.prevented));
    const normal = await point('hit-actions-link');
    await page.touchscreen.tap(normal.x, normal.y);
    assert.equal(await count(), 1);
    results.push({ mode, case: 'no action long press then tap', passed: true });

    // Dragging vertically still scrolls and cannot accidentally select or navigate.
    await load();
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="hit-opened"]').parentElement;
      const viewport = document.createElement('div');
      viewport.style.cssText = 'height:420px;overflow-y:auto';
      container.parentElement.insertBefore(viewport, container);
      viewport.append(container);
      container.style.paddingBottom = '800px';
      window.__listScrollViewport = viewport;
    });
    const drag = await point('hit-selection-link');
    await start(drag);
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: drag.x, y: drag.y - i * 18 }],
      });
      await pause(20);
    }
    await end();
    await frame(page);
    assert.ok(
      await page.evaluate(() => window.__listScrollViewport.scrollTop > 0),
      'Touch scroll was blocked',
    );
    assert.equal(await count(), 0);
    assert.equal(
      await page.$eval(selector('hit-selection-check'), (el) => el.getAttribute('aria-checked')),
      'false',
    );
    results.push({ mode, case: 'scroll without selection', passed: true });

    // Already selecting still consumes a hold without toggling the checked item.
    await load('bulk-selection', 'inbox-bulk-roof-link');
    await start(await point('inbox-bulk-roof-link'));
    await pause(650);
    await end();
    assert.equal(
      await page.$eval(selector('inbox-bulk-roof-check'), (el) => el.getAttribute('aria-checked')),
      'true',
    );
    assert.ok((await trace()).some((e) => e.type === 'touchend' && e.prevented));
    const selected = await point('inbox-bulk-roof-link');
    await page.touchscreen.tap(selected.x, selected.y);
    assert.equal(
      await page.$eval(selector('inbox-bulk-roof-check'), (el) => el.getAttribute('aria-checked')),
      'false',
    );
    results.push({ mode, case: 'already selecting then tap', passed: true });
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(`PASS: ${results.length} real touch gesture checks`);
} finally {
  await writeFile(`${output}/results.json`, `${JSON.stringify(results, null, 2)}\n`);
  await browser.close();
}
