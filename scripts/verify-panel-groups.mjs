/**
 * Real-browser contracts for nested splits and scrolling flows.
 * STORYBOOK_URL=http://localhost:6007 PLAYWRIGHT_MODULE=/path/to/playwright-core node scripts/verify-panel-groups.mjs
 * The fixture exercises production AppShell, PanelHost, Screen and Dialog renderers.
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
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

async function documentFrame(name) {
  const mask = test('groups-main').getByTestId('content-panel-bleed-mask');
  const frame = await mask.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(frame && Math.abs(frame.y - 8) < 1, 'document mask stays at the top viewport gutter');
  assert.ok(
    Math.abs(frame.y + frame.height - viewport.height + 8) < 1,
    'document mask stays at the bottom viewport gutter',
  );
  const png = await page.screenshot({ path: `${artifacts}/${name}.png` });
  const painted = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const samples = [1, innerHeight - 2].map((y) =>
      [...context.getImageData(Math.floor(innerWidth / 2), y, 1, 1).data].slice(0, 3),
    );
    context.fillStyle = getComputedStyle(
      document.querySelector('[data-testid="groups-shell"]'),
    ).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const expected = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    return { samples, expected };
  }, png.toString('base64'));
  assert.ok(
    painted.samples.every((sample) =>
      sample.every((value, index) => Math.abs(value - painted.expected[index]) <= 2),
    ),
    'painted top and bottom gutters mask scrolling content',
  );
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
      Math.abs(main.width - likes.width) < 0.1 &&
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
  await test('groups-open').waitFor();
  const originalMain = await test('groups-main').boundingBox();
  await test('groups-open').click();
  let geometry = await boundedSplit();
  assert.ok(
    Math.abs(geometry.main.height - geometry.likes.height) < 2,
    'split starts in equal halves',
  );
  await test('groups-close').click();
  await page.waitForFunction((height) => {
    const main = document.querySelector('[data-testid="groups-main"]')?.getBoundingClientRect();
    const likes = document.querySelector('[data-testid="groups-likes"]')?.getBoundingClientRect();
    return main && likes && Math.abs(main.height - height) < 1 && likes.height === 0;
  }, originalMain.height);
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

  for (const targetY of [20, 880, 20, 880]) {
    const grip = await divider.boundingBox();
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(grip.x + grip.width / 2, targetY, { steps: 12 });
    await page.mouse.up();
    const resized = await boundedSplit();
    assert.ok(
      resized.main.height >= 119 && resized.likes.height >= 119,
      'pointer resize stops at both panel minimum heights',
    );
  }
  await divider.focus();
  for (let step = 0; step < 60; step++) await divider.press('ArrowUp');
  geometry = await boundedSplit();
  assert.ok(
    geometry.main.height >= 119 && geometry.likes.height >= 119,
    'keyboard resize respects both minimum heights',
  );

  // Pause application JavaScript only within the same desktop presentation tier.
  // Browser CSS must still distribute both axes; presentation handoff is tested below.
  // Native pointer/keyboard commits finish their cleanup on animation frames.
  // Freeze only settled layout, not an in-flight user gesture transaction.
  await page.waitForFunction(() => !document.querySelector('[data-bloom-panel-resizing]'));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
  for (const [width, height] of [
    [1100, 420],
    [900, 320],
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
  await page.setViewportSize({ width: 1440, height: 240 });
  await page
    .getByRole('dialog', { name: 'Likes', exact: true })
    .waitFor()
    .catch(async (error) => {
      await writeFile(
        `${artifacts}/capacity-failure.json`,
        JSON.stringify(
          await page.evaluate(() => ({
            nodes: [
              ...document.querySelectorAll(
                '[data-bloom-panel-group],[data-bloom-panel-owner],[role="dialog"]',
              ),
            ].map((node) => ({
              id: node.dataset.testid,
              role: node.getAttribute('role'),
              rect: node.getBoundingClientRect().toJSON(),
              floating: getComputedStyle(node).getPropertyValue('--bloom-panel-floating'),
              visible: getComputedStyle(node).getPropertyValue('--bloom-panel-visible'),
              html: node.outerHTML.slice(0, 700),
            })),
          })),
          null,
          2,
        ),
      );
      throw error;
    });
  assert.equal(
    await test('groups-likes-screen').count(),
    1,
    'insufficient split height uses one sheet content tree',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('dialog', { name: 'Likes', exact: true }).waitFor({ state: 'hidden' });
  await boundedSplit();
  await test('groups-close').click();
  await page.waitForFunction((height) => {
    const main = document.querySelector('[data-testid="groups-main"]')?.getBoundingClientRect();
    const likes = document.querySelector('[data-testid="groups-likes"]')?.getBoundingClientRect();
    return main && likes && Math.abs(main.height - height) < 1 && likes.height === 0;
  }, originalMain.height);
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
  assert.ok(
    sheet.height <= 844 * 0.9 + 1 && sheet.y >= 844 * 0.1 - 1,
    'actual sheet surface honors its 90% viewport ceiling',
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

  await page.setViewportSize({ width: 1440, height: 900 });
  await story('capped-responsive');
  await test('groups-open').click();
  const cappedWidth = (await test('groups-main').boundingBox()).width;
  await page.setViewportSize({ width: 700, height: 900 });
  await page.getByRole('dialog', { name: 'Likes', exact: true }).waitFor();
  assert.ok(
    Math.abs((await test('groups-main').boundingBox()).width - cappedWidth) < 1,
    'shell breakpoint changes presentation while nested width stays capped',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('dialog', { name: 'Likes', exact: true }).waitFor({ state: 'hidden' });
  await boundedSplit();

  await page.setViewportSize({ width: 1440, height: 900 });
  await story('mixed-axes');
  await test('groups-open').click();
  geometry = await boundedSplit();
  const aside = await test('groups-aside').boundingBox();
  assert.ok(
    aside.x >= geometry.main.x + geometry.main.width,
    'horizontal sibling sits beside the vertical split',
  );
  assert.ok(aside.height > geometry.main.height, 'horizontal sibling keeps its full height');
  assert.ok(Math.abs(aside.y - geometry.main.y) < 1, 'mixed-axis groups align at their top');

  await story('document-split');
  await test('groups-open').waitFor();
  await test('groups-post-screen').evaluate((node) =>
    node.setAttribute('data-retained-check', 'true'),
  );
  await page.mouse.move(500, 500);
  await page.mouse.wheel(0, 200);
  await page.waitForFunction(() => window.scrollY >= 100);
  const documentOffset = await page.evaluate(() => window.scrollY);
  await documentFrame('document-before-split');
  // Preserve the reading position while invoking an offscreen header action.
  // Actual pointer hit testing is required separately in the bounded fixture.
  await test('groups-open').evaluate((node) => node.click());
  await boundedSplit();
  assert.equal(
    await test('groups-post-screen').getAttribute('data-retained-check'),
    'true',
    'document handoff retains the route DOM',
  );
  await page.waitForFunction(
    (offset) =>
      Math.abs(
        (document.querySelector(
          '[data-testid="groups-post-screen"] [data-bloom-screen-viewport="element"]',
        )?.scrollTop ?? 0) - offset,
      ) < 2,
    documentOffset,
  );
  await test('groups-close').evaluate((node) => node.click());
  await page.waitForFunction((offset) => Math.abs(window.scrollY - offset) < 2, documentOffset);
  await documentFrame('document-after-split');
  assert.equal(
    await test('groups-post-screen').getAttribute('data-retained-check'),
    'true',
    'document restoration retains the route DOM',
  );
  console.log('PASS mixed axes and document/element scroll-owner handoff');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await story('nested-split');
  for (let iteration = 0; iteration < 3; iteration++) {
    await test('groups-open').click();
    await test('groups-close').click();
  }
  await test('groups-open').click();
  await boundedSplit();
  const beforeClose = await splitGeometry();
  await page.evaluate(() => {
    window.__panelCloseFrames = [];
    const capture = () => {
      const main = document.querySelector('[data-testid="groups-main"]');
      const likes = document.querySelector('[data-testid="groups-likes"]');
      if (!main || !likes) return;
      const mainBox = main.getBoundingClientRect();
      const likesBox = likes.getBoundingClientRect();
      window.__panelCloseFrames.push({
        mainX: mainBox.x,
        mainWidth: mainBox.width,
        likesX: likesBox.x,
        likesWidth: likesBox.width,
        likesHeight: likesBox.height,
      });
      if (window.__panelCloseFrames.length < 60) requestAnimationFrame(capture);
    };
    requestAnimationFrame(capture);
  });
  await test('groups-close').click();
  await page.waitForFunction(() => window.__panelCloseFrames.length >= 60);
  const closeFrames = await page.evaluate(() => window.__panelCloseFrames);
  assert.ok(
    closeFrames.every(
      (frame) =>
        Math.abs(frame.mainX - beforeClose.main.x) < 1 &&
        Math.abs(frame.mainWidth - beforeClose.main.width) < 1,
    ),
    'vertical close keeps main panel horizontal geometry stable on every frame',
  );
  assert.ok(
    closeFrames
      .filter((frame) => frame.likesHeight > 1)
      .every(
        (frame) =>
          Math.abs(frame.likesX - beforeClose.likes.x) < 1 &&
          Math.abs(frame.likesWidth - beforeClose.likes.width) < 1,
      ),
    'vertical closing panel never collapses sideways',
  );
  await page.waitForFunction(() => {
    const main = document.querySelector('[data-testid="groups-main"]')?.getBoundingClientRect();
    return main && main.height >= innerHeight - 20;
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  console.log('PASS interrupted opening/closing with default motion');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await story('deck-switch');
  await test('groups-deck').waitFor();
  await test('groups-post-screen').evaluate((node) =>
    node.setAttribute('data-retained-check', 'true'),
  );
  const deckFrames = [];
  for (const targetWidth of [390, 620]) {
    const beforeMode = (await test('groups-main').boundingBox()).width;
    await page.evaluate(() => {
      window.__deckFrames = [];
      const capture = (time) => {
        const screen = document.querySelector('[data-testid="groups-post-screen"]');
        const main = document.querySelector('[data-testid="groups-main"]');
        let opacity = 1;
        let hidden = !screen;
        for (let node = screen; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          opacity *= Number(style.opacity);
          hidden ||= style.display === 'none' || style.visibility === 'hidden';
        }
        window.__deckFrames.push({
          time,
          width: main?.getBoundingClientRect().width ?? 0,
          x: main?.getBoundingClientRect().x ?? 0,
          opacity,
          hidden,
          retained: screen?.getAttribute('data-retained-check'),
        });
        if (window.__deckFrames.length < 75) requestAnimationFrame(capture);
      };
      requestAnimationFrame(capture);
    });
    await test('groups-deck').click();
    await page.waitForFunction(() => window.__deckFrames.length >= 75);
    const frames = await page.evaluate(() => window.__deckFrames);
    deckFrames.push({ beforeMode, targetWidth, frames });
    await writeFile(`${artifacts}/deck-motion.json`, JSON.stringify(deckFrames, null, 2));
    assert.ok(
      frames.every((frame) => frame.retained === 'true' && !frame.hidden && frame.opacity >= 0.99),
      'main content stays mounted and opaque throughout mode changes',
    );
    assert.ok(
      frames.every(
        (frame) =>
          frame.width >= Math.min(beforeMode, targetWidth) - 2 &&
          frame.width <= Math.max(beforeMode, targetWidth) + 2,
      ),
      'mode width stays between its starting and target sizes',
    );
    const moving = frames.filter(
      (frame) =>
        frame.width > Math.min(beforeMode, targetWidth) + 2 &&
        frame.width < Math.max(beforeMode, targetWidth) - 2,
    );
    assert.ok(moving.length > 4, 'mode width interpolates through intermediate frames');
    const fastSteps = frames.slice(1).map((frame, index) => ({
      gap: frame.time - frames[index].time,
      delta: Math.abs(frame.width - frames[index].width),
    }));
    assert.ok(
      fastSteps.filter((step) => step.gap < 50).every((step) => step.delta < 80),
      'mode width never jumps by a large step between adjacent normal frames',
    );
    assert.ok(Math.abs(frames.at(-1).width - targetWidth) < 2, 'mode settles at declared width');
    const unsplit = await test('groups-main').boundingBox();
    await test('groups-open').click();
    await boundedSplit();
    const splitGrip = await test('groups-main-divider').boundingBox();
    await page.mouse.move(splitGrip.x + splitGrip.width / 2, splitGrip.y + splitGrip.height / 2);
    await page.mouse.down();
    await page.mouse.move(splitGrip.x + splitGrip.width / 2, 20, { steps: 12 });
    await page.mouse.up();
    await test('groups-close').click();
    await page.waitForFunction((height) => {
      const main = document.querySelector('[data-testid="groups-main"]')?.getBoundingClientRect();
      const likes = document.querySelector('[data-testid="groups-likes"]')?.getBoundingClientRect();
      return main && likes && Math.abs(main.height - height) < 1 && likes.height === 0;
    }, unsplit.height);
  }
  await writeFile(`${artifacts}/deck-motion.json`, JSON.stringify(deckFrames, null, 2));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  console.log('PASS document/Deck mode motion: persistent opaque content and interpolated widths');

  await story('short-deck-switch');
  await test('groups-open').waitFor();
  for (const deck of [false, true]) {
    if (deck) {
      await test('groups-deck').click();
      await page.waitForFunction(
        () =>
          Math.abs(
            document.querySelector('[data-testid="groups-main"]').getBoundingClientRect().width -
              390,
          ) < 1,
      );
    }
    const closed = await test('groups-main').boundingBox();
    await test('groups-open').click();
    await boundedSplit();
    await test('groups-close').click();
    await page.waitForFunction((height) => {
      const main = document.querySelector('[data-testid="groups-main"]')?.getBoundingClientRect();
      const likes = document.querySelector('[data-testid="groups-likes"]')?.getBoundingClientRect();
      return main && likes && Math.abs(main.height - height) < 1 && likes.height === 0;
    }, closed.height);
  }
  console.log('PASS closing short and long panels leaves no empty region or separator gap');

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
  await page.setViewportSize({ width: 1100, height: 700 });
  await story('horizontal-flow');
  await test('horizontal-column-3').waitFor();
  const horizontalMetrics = () =>
    test('horizontal-shell').evaluate((shell) => {
      const owner = [...shell.querySelectorAll('*')].find(
        (node) =>
          ['auto', 'scroll'].includes(getComputedStyle(node).overflowX) &&
          node.scrollWidth > node.clientWidth + 1,
      );
      if (!owner) return null;
      owner.setAttribute('data-horizontal-scroll-check', 'true');
      return { content: owner.scrollWidth, width: owner.clientWidth };
    });
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-testid="horizontal-shell"] *')].some(
      (node) =>
        ['auto', 'scroll'].includes(getComputedStyle(node).overflowX) &&
        node.scrollWidth > node.clientWidth + 1,
    ),
  );
  const beforeHorizontal = await horizontalMetrics();
  const columnWidth = (await test('horizontal-column-0').boundingBox()).width;
  await test('horizontal-add').click();
  await test('horizontal-column-4').waitFor();
  assert.ok(
    (await horizontalMetrics()).content > beforeHorizontal.content + 300,
    'horizontal flow adds scroll extent',
  );
  assert.ok(
    Math.abs((await test('horizontal-column-0').boundingBox()).width - columnWidth) < 1,
    'horizontal flow does not shrink existing columns',
  );
  await page.locator('[data-horizontal-scroll-check="true"]').hover();
  await page.mouse.wheel(400, 0);
  await page.waitForFunction(
    () => (document.querySelector('[data-horizontal-scroll-check="true"]')?.scrollLeft ?? 0) > 100,
  );
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth + 1 &&
        document.documentElement.scrollHeight <= innerHeight + 1,
    ),
    true,
    'contained horizontal flow does not scroll the document',
  );
  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log(
    'PASS horizontal flow: columns add real horizontal scroll without shrinking or document overflow',
  );
} catch (error) {
  await page.screenshot({ path: `${artifacts}/failure.png` });
  await writeFile(
    `${artifacts}/failure-geometry.json`,
    JSON.stringify(await splitGeometry(), null, 2),
  );
  throw error;
} finally {
  await browser.close();
}
