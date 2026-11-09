/** Real CSS clocks, pointer input, retained Screen, resize and reduced motion.
 * Start this checkout's Storybook, then run with STORYBOOK_URL, CHROME_PATH,
 * and optionally PUPPETEER_PATH pointing to an installed puppeteer-core.
 * Outputs are local evidence, not claims about native filters or hardware.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core');
const url = process.env.STORYBOOK_URL || 'http://localhost:6006';
const output = resolve(process.env.OUT || '.local/composer-loader-lifecycle');
mkdirSync(output, { recursive: true });
const index = await (await fetch(`${url}/index.json`)).json();
const story = Object.values(index.entries).find(
  (entry) =>
    entry.importPath === './src/composer-loader/ComposerLoader.stories.tsx' &&
    entry.exportName === 'Lifecycle',
);
assert(story, 'Lifecycle story missing: check which checkout the server serves');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const report = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  workingTree: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
  diffSha256: createHash('sha256')
    .update(execFileSync('git', ['diff', 'HEAD']))
    .digest('hex'),
  packages: Object.fromEntries(
    [
      'react',
      'react-native',
      'react-native-web',
      'react-native-svg',
      'react-native-reanimated',
      'expo-blur',
    ].map((name) => [name, require(`${name}/package.json`).version]),
  ),
  story: story.id,
  browser: await browser.version(),
  cases: [],
};
const delay = (ms) => new Promise((done) => setTimeout(done, ms));
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewport({ width: 768, height: 1200, deviceScaleFactor: 1 });
  await page.goto(`${url}/iframe.html?id=${story.id}&viewMode=story`);
  await page.waitForSelector('[data-testid="lifecycle-isolated"] .bloom-composer-loader-rect');
  const sample = () =>
    page.evaluate(() => {
      const root = document.querySelector('[data-testid="lifecycle-isolated"]');
      const svg = root.querySelector('svg');
      const box = svg.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        viewBox: svg.getAttribute('viewBox'),
        clocks: Array.from(svg.querySelectorAll('rect')).map((rect) => ({
          playState: rect.getAnimations()[0]?.playState,
          time: rect.getAnimations()[0]?.currentTime,
          dash: getComputedStyle(rect).strokeDashoffset,
        })),
      };
    });
  const settlePaint = () => delay(50);
  const waitState = async (state) => {
    await page.waitForFunction(
      (expected) => {
        const rects = document.querySelectorAll(
          '[data-testid="lifecycle-isolated"] .bloom-composer-loader-rect',
        );
        return (
          rects.length === 3 &&
          [...rects].every((rect) => rect.getAnimations()[0]?.playState === expected)
        );
      },
      {},
      state,
    );
    await settlePaint();
  };
  const click = (id) => page.click(`[data-testid="${id}"]`);
  await waitState('running');
  await delay(300);
  const before = await sample();
  await delay(200);
  const moving = await sample();
  assert(moving.clocks[0].time > before.clocks[0].time);
  report.cases.push({ name: 'active clock', before, after: moving });
  // Record at least two 4.5-second laps at the same scale for visual review.
  if (process.env.RECORD_VIDEO === '1') {
    const recording = await page.screencast({ path: `${output}/active.webm`, fps: 30 });
    await delay(9500);
    await recording.stop();
  }
  await click('loader-toggle');
  await waitState('paused');
  const inactive = await sample();
  await delay(250);
  const inactiveLater = await sample();
  assert.deepEqual(inactiveLater.clocks, inactive.clocks);
  report.cases.push({ name: 'inactive settles', before: inactive, after: inactiveLater });
  await click('loader-toggle');
  await waitState('running');
  await click('loader-pause');
  await waitState('paused');
  const paused = await sample();
  await delay(250);
  assert.deepEqual((await sample()).clocks, paused.clocks);
  await click('loader-pause');
  await waitState('running');
  assert((await sample()).clocks[0].time >= paused.clocks[0].time);
  report.cases.push({ name: 'explicit pause preserves phase', paused, resumed: await sample() });
  await click('loader-retain');
  await waitState('paused');
  const retained = await sample();
  await delay(250);
  assert.deepEqual((await sample()).clocks, retained.clocks);
  await click('loader-retain');
  await waitState('running');
  report.cases.push({ name: 'retained Screen', paused: retained, resumed: await sample() });
  await click('loader-toggle');
  await delay(100);
  await click('loader-retain');
  await waitState('paused');
  const interruptedFade = await page.$eval('[data-testid="lifecycle-isolated-light"]', (node) => ({
    duration: getComputedStyle(node).transitionDuration,
    opacity: getComputedStyle(node).opacity,
    animations: node.getAnimations().length,
  }));
  assert.equal(interruptedFade.duration, '0s');
  assert.equal(interruptedFade.opacity, '0');
  assert.equal(interruptedFade.animations, 0);
  report.cases.push({ name: 'hide during fade cancels opacity work', interruptedFade });
  await click('loader-retain');
  await click('loader-toggle');
  await waitState('running');
  await page.click('[data-testid="lifecycle-agent"] [aria-label="Stop generating"]');
  await waitState('paused');
  report.cases.push({ name: 'AgentChat Stop uses real handler', stopped: await sample() });
  await click('loader-toggle');
  await waitState('running');
  const backgroundTab = await browser.newPage();
  await backgroundTab.bringToFront();
  await waitState('paused');
  const background = await sample();
  await delay(200);
  assert.deepEqual((await sample()).clocks, background.clocks);
  await page.bringToFront();
  await backgroundTab.close();
  await waitState('running');
  report.cases.push({ name: 'background tab', background, resumed: await sample() });
  // Same input node, focused selection and value, across all required web widths.
  await page.evaluate(() => {
    const input = document.querySelector('[data-testid="lifecycle-pill-input"] textarea');
    if (!input) throw new Error('ComposerPill textarea missing');
    input.focus();
    input.setSelectionRange(2, 12);
    window.__loaderInput = input;
  });
  for (const width of [320, 390, 768, 1024, 1440, 390]) {
    await page.setViewport({ width, height: 1200, deviceScaleFactor: 1 });
    await delay(150);
    const measured = await sample();
    const viewBox = measured.viewBox.split(' ').map(Number);
    assert(Math.abs(viewBox[2] - measured.width) < 1, 'viewBox must follow measured local width');
    assert(Math.abs(viewBox[3] - measured.height) < 1, 'viewBox must follow measured local height');
    const input = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="lifecycle-pill-input"] textarea');
      return {
        same: input === window.__loaderInput,
        focused: input === document.activeElement,
        start: input.selectionStart,
        end: input.selectionEnd,
        value: input.value,
      };
    });
    assert.equal(input.same, true);
    assert.equal(input.focused, true);
    assert.equal(input.start, 2);
    assert.equal(input.end, 12);
    assert.equal(input.value, 'A draft preserved across every transition');
    report.cases.push({ name: `resize ${width}`, measured, input });
  }
  await click('loader-height');
  await delay(150);
  const tall = await sample();
  assert.equal(tall.height, 160);
  report.cases.push({ name: 'height resize', tall });
  await page.screenshot({ path: `${output}/tall-390.png`, fullPage: true });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await waitState('paused');
  const reduced = await sample();
  await delay(200);
  assert.deepEqual((await sample()).clocks, reduced.clocks);
  report.cases.push({ name: 'reduced motion', reduced });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await waitState('running');
  // Scroll the exact same mounted tree entirely beyond the viewport.
  await page.evaluate(() => {
    document.body.style.minHeight = '4000px';
    window.scrollTo(0, 3000);
  });
  await waitState('paused');
  const offscreen = await sample();
  await delay(200);
  assert.deepEqual((await sample()).clocks, offscreen.clocks);
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitState('running');
  report.cases.push({ name: 'offscreen', offscreen, resumed: await sample() });
  await page.evaluate(() => {
    document.body.style.minHeight = '';
  });
  await page.setViewport({ width: 768, height: 1200, deviceScaleFactor: 1 });
  await page.screenshot({ path: `${output}/active-768.png`, fullPage: true });
  assert.deepEqual(errors, []);
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(`Passed ${report.cases.length} browser cases; evidence: ${output}`);
} finally {
  await browser.close();
}
