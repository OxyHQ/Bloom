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
      window.__paintFrames.push({ time, opacity, hidden, visible, scrollY, mainStyle: mainStyle && {interpolateSize:mainStyle.interpolateSize,flexBasis:mainStyle.flexBasis,flexGrow:mainStyle.flexGrow,minHeight:mainStyle.minHeight,maxHeight:mainStyle.maxHeight}, documentHeight: document.documentElement.scrollHeight, viewportHeight: innerHeight, elementOffset: screen?.querySelector('[data-bloom-screen-viewport="element"]')?.scrollTop, main: main?.getBoundingClientRect().toJSON(), likes: likes?.getBoundingClientRect().toJSON() });
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
  console.log(`PASS split close paint continuity: ${frames.length} RAF samples and ${paints.length} compositor screenshots`);
} finally {
  await browser.close();
}
