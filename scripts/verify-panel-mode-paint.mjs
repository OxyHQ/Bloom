/** Whole-frame panel mode and opening continuity, with both public motion policies. */
import assert from 'node:assert/strict';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const output = process.env.ARTIFACT_DIR ?? '.local/panel-mode-paint';
await mkdir(output, { recursive: true });
try {
  for (const story of ['deck-switch', 'simultaneous-deck-switch']) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'no-preference',
    });
    await page.goto(
      `${process.env.STORYBOOK_URL ?? 'http://localhost:6014'}/iframe.html?id=blocks-panel-groups--${story}&viewMode=story`,
    );
    await page.getByTestId('groups-open').waitFor();
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 300);
    await page.waitForFunction(() => scrollY >= 290);
    await page.evaluate(() => {
      window.__readingScreen = document.querySelector('[data-testid="groups-post-screen"]');
      window.__readingAnchor = [...window.__readingScreen.querySelectorAll('*')].find(
        (node) =>
          !node.children.length &&
          node.textContent.startsWith('Post paragraph') &&
          node.getBoundingClientRect().top >= 64,
      );
      window.__readingAnchorY = window.__readingAnchor.getBoundingClientRect().y;
    });
    const cdp = await page.context().newCDPSession(page);
    let phase = 'initial',
      index = 0;
    const writes = [];
    const paints = [];
    cdp.on('Page.screencastFrame', (event) => {
      const file = `${story}-${phase}-${String(index++).padStart(4, '0')}.png`;
      paints.push({ file, phase, metadata: event.metadata, retained: true });
      writes.push(writeFile(`${output}/${file}`, Buffer.from(event.data, 'base64')));
      void cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId });
    });
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
    const captures = [];
    async function capture(name, button) {
      phase = name;
      await page.evaluate(() => {
        window.__modePaint = [];
        const start = performance.now();
        function frame(time) {
          const screen = document.querySelector('[data-testid="groups-post-screen"]');
          const viewport = screen?.querySelector('[data-bloom-screen-viewport]');
          const main = document.querySelector('[data-testid="groups-main"]');
          const likes = document.querySelector('[data-testid="groups-likes"]');
          const content = screen?.querySelector(
            '[data-testid="groups-post-screen-scroll-content"]',
          );
          let opacity = 1,
            hidden = !content;
          for (let node = content; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            opacity *= Number(style.opacity);
            hidden ||= style.display === 'none' || style.visibility === 'hidden';
          }
          const kind = viewport?.dataset.bloomScreenViewport;
          window.__modePaint.push({
            time: time - start,
            main: main?.getBoundingClientRect().toJSON(),
            likes: likes?.getBoundingClientRect().toJSON(),
            kind,
            offset: kind === 'document' ? scrollY : viewport?.scrollTop,
            opacity,
            anchorY: window.__readingAnchor?.getBoundingClientRect().y,
            hidden,
            retained: screen === window.__readingScreen,
          });
          if (window.__modePaint.length < 75) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
      await page.getByTestId(button).evaluate((node) => node.click());
      await page.waitForFunction(() => window.__modePaint.length >= 75);
      const frames = await page.evaluate(() => window.__modePaint);
      captures.push({ phase: name, frames });
      await writeFile(`${output}/${story}.json`, JSON.stringify(captures, null, 2));
      assert.ok(
        frames.every((frame) => frame.retained && !frame.hidden && frame.opacity >= 0.99),
        `${name}: retained reading content remains painted`,
      );
      assert.ok(
        frames.every((frame) => frame.offset >= 290),
        `${name}: reading offset never drops to the top`,
      );
      return frames;
    }
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const mode of ['enter', 'exit']) {
        const frames = await capture(`${mode}-${cycle}`, 'groups-deck');
        assert.ok(
          frames.every((frame) => frame.main.height >= 882),
          `${mode}: main never collapses below its visible viewport`,
        );
        if (mode === 'exit')
          assert.ok(
            Math.abs(frames.at(-1).offset - 300) < 2,
            'round trip preserves reading position after width reflow',
          );
      }
    }
    for (const mode of ['normal', 'deck']) {
      if (mode === 'deck') await capture('prepare-deck', 'groups-deck');
      const frames = await capture(`open-${mode}`, 'groups-open');
      const bounded = frames.filter((frame) => frame.kind === 'element');
      assert.ok(bounded[0].main.height >= 850, `${mode}: split opens from the complete viewport`);
      assert.ok(
        bounded.every((frame) => frame.main.height >= 436 && frame.main.height <= 885),
        `${mode}: primary never collapses to its minimum`,
      );
      assert.ok(
        bounded.filter((frame) => frame.main.height > 446 && frame.main.height < 876).length >= 4,
        `${mode}: primary shrinks through intermediate heights`,
      );
      assert.ok(
        Math.abs(bounded.at(-1).main.height - 438) < 2,
        `${mode}: split settles at equal halves`,
      );
      await capture(`close-${mode}`, 'groups-close');
    }
    await cdp.send('Page.stopScreencast');
    await Promise.all(writes);
    if (!process.env.KEEP_ALL_PAINTS) {
      for (const phase of new Set(paints.map((paint) => paint.phase))) {
        const samples = paints.filter((paint) => paint.phase === phase);
        const kept = new Set([samples[0], samples[Math.floor(samples.length / 2)], samples.at(-1)]);
        for (const paint of samples) {
          paint.retained = kept.has(paint);
          if (!paint.retained) await unlink(`${output}/${paint.file}`);
        }
      }
    }
    await writeFile(`${output}/${story}-paints.json`, JSON.stringify(paints, null, 2));
    await page.close();
    console.log(
      `PASS ${story}: repeated whole-frame mode switches and progressive split opening, ${index} compositor screenshots`,
    );
  }
} finally {
  await browser.close();
}
