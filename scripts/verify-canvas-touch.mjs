import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_PACKAGE_JSON)('@playwright/test');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const output = process.env.CANVAS_OUTPUT ?? '.local/issue-663/canvas-touch';
mkdirSync(output, { recursive: true });
async function drag(x, y, dy) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y + (dy * i) / 12 }],
    });
    await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(700);
}
try {
  await page.goto(
    'http://localhost:6040/iframe.html?id=components-layout-canvas--persistent&viewMode=story',
  );
  await page.getByRole('button', { name: 'Change room', exact: true }).click();
  await page.getByRole('button', { name: 'Full', exact: true }).click();
  await page.waitForTimeout(700);
  const handle = page.getByTestId('fixture-panel-handle');
  const scroll = page.getByTestId('fixture-panel-scroll');
  const r = await scroll.boundingBox();
  await page.evaluate(() => {
    window.touchTrace = [];
    for (const name of [
      'pointerdown',
      'pointermove',
      'pointercancel',
      'touchstart',
      'touchmove',
      'touchcancel',
    ])
      document.addEventListener(
        name,
        (e) =>
          window.touchTrace.push({
            type: name,
            y: e.clientY ?? e.touches?.[0]?.clientY,
            prevented: e.defaultPrevented,
          }),
        false,
      );
  });
  await handle.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(600);
  const halfBody = await scroll.boundingBox();
  await drag(
    halfBody.x + halfBody.width / 2,
    Math.min(700, halfBody.y + halfBody.height - 30),
    -280,
  );
  const bodyExpanded = await handle.getAttribute('aria-valuenow');
  writeFileSync(
    `${output}/arbitration.json`,
    JSON.stringify(
      { bodyExpanded, trace: await page.evaluate(() => window.touchTrace), halfBody },
      null,
      2,
    ),
  );
  assert.equal(bodyExpanded, '2', 'Body upward drag from half must expand');
  const before = await scroll.evaluate(
    (el) =>
      [el, ...el.querySelectorAll('*')].find(
        (n) => n.scrollHeight > n.clientHeight && /auto|scroll/.test(getComputedStyle(n).overflowY),
      )?.scrollTop,
  );
  await drag(r.x + r.width / 2, Math.min(740, r.y + r.height - 30), -160);
  const after = await scroll.evaluate(
    (el) =>
      [el, ...el.querySelectorAll('*')].find(
        (n) => n.scrollHeight > n.clientHeight && /auto|scroll/.test(getComputedStyle(n).overflowY),
      )?.scrollTop,
  );
  await page.screenshot({ path: `${output}/body.png` });
  writeFileSync(`${output}/body.json`, JSON.stringify({ r, before, after }, null, 2));
  assert(after > before + 30, `Touch body failed scrolling ${before} -> ${after}`);
  assert.equal(await handle.getAttribute('aria-valuenow'), '2');
  await drag(r.x + r.width / 2, r.y + 40, 220);
  const scrolledBack = await scroll.evaluate(
    (el) =>
      [el, ...el.querySelectorAll('*')].find(
        (n) => n.scrollHeight > n.clientHeight && /auto|scroll/.test(getComputedStyle(n).overflowY),
      )?.scrollTop,
  );
  assert(scrolledBack < after, 'Scrolled content must move before panel');
  assert.equal(
    await handle.getAttribute('aria-valuenow'),
    '2',
    'Scrolled downward body drag must not collapse panel',
  );
  assert.equal(scrolledBack, 0, 'Setup must reach top before a new downward gesture');
  await drag(r.x + r.width / 2, r.y + 40, 280);
  const bodyCollapsed = await handle.getAttribute('aria-valuenow');
  assert.notEqual(bodyCollapsed, '2', 'Full body at top must collapse on a fresh downward drag');
  await page.getByRole('button', { name: 'Full', exact: true }).click();
  await page.waitForTimeout(700);
  const h = await handle.boundingBox();
  await drag(h.x + h.width / 2, h.y + h.height / 2, 260);
  const dragged = await handle.getAttribute('aria-valuenow');
  assert.notEqual(dragged, '2', 'Touch handle failed dragging panel');
  await page.getByRole('button', { name: 'Change room', exact: true }).click();
  await page.setViewportSize({ width: 600, height: 844 });
  await page.waitForTimeout(400);
  const sideRect = await scroll.boundingBox();
  const sideBefore = await scroll.evaluate(
    (el) =>
      [el, ...el.querySelectorAll('*')].find(
        (n) => n.scrollHeight > n.clientHeight && /auto|scroll/.test(getComputedStyle(n).overflowY),
      )?.scrollTop,
  );
  await drag(
    sideRect.x + sideRect.width / 2,
    Math.min(740, sideRect.y + sideRect.height - 30),
    -120,
  );
  const sideAfter = await scroll.evaluate(
    (el) =>
      [el, ...el.querySelectorAll('*')].find(
        (n) => n.scrollHeight > n.clientHeight && /auto|scroll/.test(getComputedStyle(n).overflowY),
      )?.scrollTop,
  );
  writeFileSync(
    `${output}/side.json`,
    JSON.stringify({ sideRect, sideBefore, sideAfter }, null, 2),
  );
  assert(sideAfter > sideBefore + 30, 'Lateral body must retain browser touch scrolling');
  await page.screenshot({ path: `${output}/touch.png` });
  writeFileSync(
    `${output}/result.json`,
    JSON.stringify(
      { before, after, bodyExpanded, scrolledBack, bodyCollapsed, dragged, sideBefore, sideAfter },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
