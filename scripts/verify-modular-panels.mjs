/**
 * Real-browser contract for root modular panels: independent scroll/history,
 * document horizontal deck, pair resizing, compact visibility and stable expansion.
 * PLAYWRIGHT_MODULE may point at a locally installed playwright/core package.
 * STORYBOOK_URL=http://localhost:6007 node scripts/verify-modular-panels.mjs
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 680 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const test = (id) => page.getByTestId(id);
async function story(name, root) {
  const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6006');
  url.searchParams.set('id', `blocks-app-shell--${name}`);
  url.searchParams.set('viewMode', 'story');
  await page.goto(url.href);
  await test(root).waitFor();
  await page.waitForTimeout(400);
}
async function box(id) { return test(id).boundingBox(); }
async function viewport(id) {
  // ScrollBar targets the inner DOM viewport, not the material's wrapper.
  return test(id).evaluate((outer) => {
    const el = [outer, ...outer.querySelectorAll('*')].find((node) => {
      const css = getComputedStyle(node);
      return css.overflowX === 'auto' || css.overflowY === 'auto';
    });
    if (!el) throw new Error(`No scrolling viewport in ${outer.dataset.testid}`);
    return { width: el.clientWidth, height: el.clientHeight, scrollWidth: el.scrollWidth,
      scrollHeight: el.scrollHeight, top: el.scrollTop, left: el.scrollLeft };
  });
}
async function scroll(id, top, left = 0) {
  await test(id).evaluate((outer, offset) => {
    const el = [outer, ...outer.querySelectorAll('*')].find((node) => {
      const css = getComputedStyle(node);
      return css.overflowX === 'auto' || css.overflowY === 'auto';
    });
    el.scrollTo({ top: offset.top, left: offset.left, behavior: 'instant' });
  }, { top, left });
  await page.waitForTimeout(150);
}
try {
  await story('modular-deck', 'modular-deck-panels');
  const group = await box('modular-deck-panels');
  assert.ok(await page.evaluate(() => document.scrollingElement.scrollWidth > innerWidth), 'deck extends the page horizontally');
  assert.ok(group.height <= 900, 'columns remain vertically bounded');
  assert.equal(await test('modular-deck-panels').evaluate((node) => {
    for (let parent = node; parent && parent !== document.body; parent = parent.parentElement) {
      if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) return true;
    }
    return false;
  }), false, 'no intermediate horizontal scrollport');
  const home = 'modular-deck-panels-Home-scroll';
  const mentions = 'modular-deck-panels-Mentions-scroll';
  assert.ok((await viewport(home)).scrollHeight > (await viewport(home)).height, 'column scrolls vertically');
  await scroll(home, 160);
  await scroll(mentions, 90);
  // Programmatic click preserves the source scroll offset (unlike scrollIntoView).
  await test('deck-Home-open').evaluate((node) => node.click());
  await page.waitForTimeout(300);
  assert.equal((await viewport(home)).top, 0, 'new route starts at top');
  assert.equal((await viewport(mentions)).top, 90, 'another panel keeps its offset');
  await test('deck-Home-back').click();
  await page.waitForTimeout(300);
  assert.equal((await viewport(home)).top, 160, 'back restores panel scroll');
  assert.equal((await viewport(mentions)).top, 90, 'back does not alter sibling');
  await page.mouse.move(700, 200);
  await page.mouse.wheel(500, 0);
  await page.waitForTimeout(250);
  assert.ok(await page.evaluate(() => document.scrollingElement.scrollLeft > 0), 'horizontal wheel scrolls the page');
  assert.equal(await page.evaluate(() => window.scrollY), 0, 'page does not take over column vertical scroll');
  console.log('PASS deck: horizontal/vertical scroll and independent route restoration');

  await story('modular-inbox', 'modular-inbox-panels');
  const listId = 'modular-inbox-panels-list';
  const detailId = 'modular-inbox-panels-message';
  const before = await box(listId);
  const detail = await box(detailId);
  const grip = test(`${listId}-divider`);
  await grip.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  const after = await box(listId);
  assert.ok(after.width > before.width, 'keyboard grows list');
  assert.ok(Math.abs(after.width + (await box(detailId)).width - before.width - detail.width) < 1, 'resizing preserves pair envelope');
  for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(250);
  assert.equal((await box(listId)).width, 320, 'minimum enforced');
  await page.setViewportSize({ width: 600, height: 900 });
  await page.waitForTimeout(400);
  assert.equal(await test(listId).getAttribute('aria-hidden'), 'true', 'compact panel inaccessible');
  assert.ok(await test(listId).evaluate((node) => node.inert), 'compact panel inert');
  assert.ok((await box(detailId)).width > 500, 'active compact panel fills space');
  await page.setViewportSize({ width: 1280, height: 680 });
  console.log('PASS split: pair resize, min width and accessible compact state');

  await story('modular-expanding-feed', 'modular-feed-panels');
  const envelope = await box('modular-feed-panels');
  const mainBefore = await box('modular-feed-panels-main');
  await test('modular-expand').click();
  await page.waitForTimeout(400);
  const expanded = await box('modular-feed-panels-main');
  assert.ok(expanded.width > mainBefore.width, 'main expands');
  assert.deepEqual(await box('modular-feed-panels'), envelope, 'expansion keeps outer envelope');
  assert.equal(await test('modular-feed-panels-context').getAttribute('aria-hidden'), 'true');
  await test('modular-expand').click();
  await page.waitForTimeout(400);
  assert.equal((await box('modular-feed-panels-main')).width, mainBefore.width);
  await page.setViewportSize({ width: 800, height: 900 });
  await story('modular-responsive-workspace', 'responsive-workspace-panels');
  const editor = 'responsive-workspace-panels-editor';
  const preview = 'responsive-workspace-panels-preview';
  const editorBefore = await box(editor);
  const previewBefore = await box(preview);
  assert.equal(editorBefore.x, previewBefore.x, 'vertical panels share horizontal origin');
  assert.ok(previewBefore.y > editorBefore.y, 'preview stacks beneath editor');
  await test('workspace-editor-count').click();
  const verticalGrip = test(`${editor}-divider`);
  assert.equal(await verticalGrip.getAttribute('aria-orientation'), 'horizontal');
  await verticalGrip.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(250);
  assert.ok((await box(editor)).height > editorBefore.height, 'ArrowDown resizes height');
  assert.ok(Math.abs((await box(editor)).height + (await box(preview)).height - editorBefore.height - previewBefore.height) < 1, 'vertical pair keeps envelope');
  const handle = await verticalGrip.boundingBox();
  const hBeforeDrag = (await box(editor)).height;
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 40, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  assert.ok(Math.abs((await box(editor)).height - hBeforeDrag - 40) < 2, 'vertical pointer drag');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(400);
  assert.equal((await box(editor)).y, (await box(preview)).y, 'wide workspace shares a row');
  assert.match(await test('workspace-editor-count').innerText(), /Count 1/, 'orientation keeps local state');
  await page.setViewportSize({ width: 800, height: 900 });
  await page.waitForTimeout(400);
  assert.match(await test('workspace-editor-count').innerText(), /Count 1/);
  console.log('PASS responsive vertical: pointer/keyboard resize and state across axes');

  await story('modular-vertical-document', 'vertical-document-panels');
  assert.ok((await box('vertical-document-panels-summary')).height < 200, 'natural sections do not fill viewport');
  const scrollAncestors = await test('vertical-document-panels-activity').evaluate((node) => {
    const found = [];
    for (let el = node; el; el = el.parentElement) {
      if (['auto', 'scroll', 'hidden'].includes(getComputedStyle(el).overflowY)) found.push(el.tagName);
    }
    return found;
  });
  assert.deepEqual(scrollAncestors, [], 'document flow has no inner vertical scroll owner');
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(250);
  assert.ok(await page.evaluate(() => scrollY > 0), 'document scrolls vertical sections');
  console.log('PASS vertical document: natural sections, one document scroll');

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await story('modular-expanding-feed', 'modular-feed-panels');
  const samples = await page.evaluate(async () => {
    const main = document.querySelector('[data-testid="modular-feed-panels-main"]');
    const frame = document.querySelector('[data-testid="modular-feed-panels"]');
    document.querySelector('[data-testid="modular-expand"]').click();
    const values = [];
    for (let i = 0; i < 35; i++) {
      await new Promise(requestAnimationFrame);
      values.push({ width: main.getBoundingClientRect().width, x: frame.getBoundingClientRect().x });
    }
    return values;
  });
  assert.ok(samples.some(({ width }) => width > 621 && width < 969), 'expansion uses intermediate frames');
  assert.ok(samples.every(({ x }) => Math.abs(x - samples[0].x) < 1), 'animation does not move the outer frame');
  console.log('PASS motion: animated expansion with stable frame');
  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log('PASS expansion: stable frame and reversible panel visibility');
} finally {
  await browser.close();
}
