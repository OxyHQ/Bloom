/** Capture real paints and descendant visibility through a scrolled, resized split close. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
const output = process.env.ARTIFACT_DIR ?? '.local/panel-groups-paint';
await mkdir(output, { recursive: true });
try {
  await page.goto(`${process.env.STORYBOOK_URL ?? 'http://localhost:6014'}/iframe.html?id=blocks-panel-groups--document-split&viewMode=story`);
  await page.getByTestId('groups-open').waitFor();
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 300);
  await page.waitForFunction(() => scrollY > 200);
  await page.getByTestId('groups-open').evaluate(node => node.click());
  const viewport = page.getByTestId('groups-post-screen').locator('[data-bloom-screen-viewport="element"]');
  await viewport.waitFor();
  await page.waitForTimeout(700);
  const grip = await page.getByTestId('groups-main-divider').boundingBox();
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + grip.width / 2, 250, { steps: 15 });
  await page.mouse.up();
  await viewport.hover();
  await page.mouse.wheel(0, 160);
  await page.waitForTimeout(400);
  const readingOffset = await viewport.evaluate(node => node.scrollTop);
  assert.ok(readingOffset > 300, 'fixture scrolls the bounded main beyond its opening position');
  const cdp = await page.context().newCDPSession(page);
  let index = 0;
  const paints = [];
  const writes = [];
  cdp.on('Page.screencastFrame', event => {
    const name = `paint-${String(index++).padStart(3, '0')}.png`;
    paints.push({ name, ...event.metadata });
    writes.push(writeFile(`${output}/${name}`, Buffer.from(event.data, 'base64')));
    void cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId });
  });
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  await page.evaluate(() => {
    window.__paintFrames = [];
    const reading = document.querySelector('[data-testid="groups-post-screen-scroll-content"]');
    window.__readingAnchor = [...reading.querySelectorAll('*')].find(node => !node.children.length && node.textContent.startsWith('Post paragraph') && node.getBoundingClientRect().top >= 64);
    window.__readingAnchorY = window.__readingAnchor.getBoundingClientRect().y;
    const capture = time => {
      const screen = document.querySelector('[data-testid="groups-post-screen"]');
      const content = screen?.querySelector('[data-testid="groups-post-screen-scroll-content"]');
      const main = document.querySelector('[data-testid="groups-main"]');
      const mainStyle = main && getComputedStyle(main);
      const likes = document.querySelector('[data-testid="groups-likes"]');
      let opacity = 1;
      let hidden = !content;
      for (let node = content; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        opacity *= Number(style.opacity);
        hidden ||= style.display === 'none' || style.visibility === 'hidden';
      }
      const paragraphs = [...(content?.querySelectorAll('*') ?? [])].filter(node => !node.children.length && node.textContent.startsWith('Post paragraph'));
      const visible = paragraphs.map(node => {
        const rect = node.getBoundingClientRect();
        const x = rect.x + rect.width / 2;
        const y = Math.max(80, rect.y) + Math.min(rect.height, 20) / 2;
        return { text: node.textContent, x, y, hit: y < innerHeight - 8 && y >= rect.y && node.contains(document.elementFromPoint(x, y)) };
      }).filter(item => item.hit);
      window.__paintFrames.push({ time, opacity, hidden, visible, scrollY, anchorY: window.__readingAnchor?.getBoundingClientRect().y, anchorText: window.__readingAnchor?.textContent, mainStyle: mainStyle && {interpolateSize:mainStyle.interpolateSize,flexBasis:mainStyle.flexBasis,flexGrow:mainStyle.flexGrow,minHeight:mainStyle.minHeight,maxHeight:mainStyle.maxHeight}, documentHeight: document.documentElement.scrollHeight, viewportHeight: innerHeight, elementOffset: screen?.querySelector('[data-bloom-screen-viewport="element"]')?.scrollTop, main: main?.getBoundingClientRect().toJSON(), likes: likes?.getBoundingClientRect().toJSON() });
      if (window.__paintFrames.length < 90) requestAnimationFrame(capture);
    };
    requestAnimationFrame(capture);
  });
  await page.waitForFunction(() => window.__paintFrames.length >= 2);
  await page.getByTestId('groups-close').evaluate(node => node.click());
  await page.waitForFunction(() => window.__paintFrames.length >= 90);
  await cdp.send('Page.stopScreencast');
  await Promise.all(writes);
  const frames = await page.evaluate(() => window.__paintFrames);
  await writeFile(`${output}/frames.json`, JSON.stringify({ readingOffset, frames, paints }, null, 2));
  assert.ok(frames.every(frame => !frame.hidden && frame.opacity >= 0.99), 'reading content remains painted during owner restoration');
  assert.ok(frames.every(frame => frame.visible.length > 0), 'every animation frame exposes reading text at a real hit-test point');
  assert.equal(frames.at(-1).likes.height, 0, 'closed auxiliary occupies no height');
  assert.ok(Math.abs(frames.at(-1).scrollY - readingOffset) < 2, 'closing transfers the latest bounded reading offset to the document');
  assert.ok(frames.every(frame => Math.abs(frame.anchorY - frames[0].anchorY) < 4), 'the same visible paragraph keeps its painted position throughout the owner change');
  const boundedFrames = frames.filter(frame => frame.elementOffset !== undefined);
  assert.ok(boundedFrames.filter(frame => frame.main.height > frames[0].main.height + 2 && frame.likes.height > 2).length >= 3, 'primary expands through intermediate painted heights');
  assert.ok(boundedFrames.every((frame, index) => index === 0 || frame.main.height >= boundedFrames[index - 1].main.height - 1), 'primary expansion never reverses during close');
  console.log(`PASS split close paint continuity: ${frames.length} RAF samples and ${paints.length} compositor screenshots`);

  // Reopening before exit finishes must cancel the old document-owner handoff.
  await page.getByTestId('groups-open').evaluate(node => node.click());
  await viewport.waitFor();
  await page.waitForTimeout(650);
  await page.getByTestId('groups-close').evaluate(node => node.click());
  await page.waitForTimeout(120);
  await page.getByTestId('groups-open').evaluate(node => node.click());
  await page.waitForTimeout(750);
  assert.equal(await viewport.count(), 1, 'rapid reopen keeps the element scroll owner');
  assert.ok(Math.abs(await viewport.evaluate(node => node.scrollTop) - readingOffset) < 2, 'rapid reopen retains the latest reading offset');
  assert.equal(await page.evaluate(() => scrollY), 0, 'cancelled handoff never scrolls the document');
  assert.ok((await page.getByTestId('groups-likes').boundingBox()).height >= 119, 'reopened auxiliary remains visible after stale exit would finish');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByTestId('groups-close').evaluate(node => node.click());
  await page.waitForFunction(() => !document.querySelector('[data-testid="groups-post-screen"] [data-bloom-screen-viewport="element"]'));
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - readingOffset) < 2, 'reduced-motion close transfers reading immediately');
  const activeTransitions = await page.getByTestId('groups-workspace').evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation instanceof CSSTransition && animation.playState === 'running').length);
  assert.equal(activeTransitions, 0, 'reduced-motion closure has no running CSS transitions');
  console.log('PASS rapid reopen cancels stale document handoff; reduced-motion close has zero active transitions');
} finally {
  await browser.close();
}
