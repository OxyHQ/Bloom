import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { chromium, firefox, webkit } from 'playwright';
const require = createRequire(import.meta.url);
const engine = process.env.BROWSER || 'chromium';
const out = process.env.OUT || `results/${engine}`;
mkdirSync(out, { recursive: true });
const report = {
  capturedAt: new Date().toISOString(),
  runnerSha256: createHash('sha256')
    .update(readFileSync(new URL(import.meta.url)))
    .digest('hex'),
  engine,
  package: require('@oxy.so/bloom/package.json').version,
  lockSha256: createHash('sha256').update(readFileSync('bun.lock')).digest('hex'),
  compiler: false,
  cases: [],
  errors: [],
};
const browser = await { chromium, firefox, webkit }[engine].launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
});
report.browser = browser.version();
const context = await browser.newContext({
  viewport: { width: 900, height: 1200 },
  reducedMotion: 'no-preference',
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.setDefaultNavigationTimeout(15000);
page.on('pageerror', (e) => report.errors.push(e.message));
const state = () => page.getByTestId('state').textContent().then(JSON.parse);
const control = (name) => page.getByRole('button', { name, exact: true }).click();
const settled = () =>
  page.getByTestId('isolated').evaluate(async (el) => {
    await Promise.all(
      Array.from(el.querySelectorAll('.bloom-composer-loader-rect')).flatMap((r) =>
        r.getAnimations().map((a) => a.ready),
      ),
    );
  });
const clocks = () =>
  page.getByTestId('isolated').evaluate((el) =>
    Array.from(el.querySelectorAll('.bloom-composer-loader-rect')).map((r) => ({
      time: r.getAnimations()[0]?.currentTime,
      play: r.getAnimations()[0]?.playState,
      width: r.getAttribute('width'),
      height: r.getAttribute('height'),
      rx: r.getAttribute('rx'),
      filter: r.getAttribute('filter'),
    })),
  );
try {
  console.log('navigate');
  await page.goto(process.env.URL || 'http://127.0.0.1:6156');
  console.log('mounted');
  await page.getByTestId('isolated').locator('.bloom-composer-loader-rect').first().waitFor();
  await page.waitForTimeout(700);
  console.log('controls');
  for (const id of ['pill', 'agent']) {
    const input = page.getByTestId(id).locator('textarea,input').first();
    await input.fill('Synthetic long draft\nSecond line preserves selection\nThird line.');
    await input.evaluate((el) => {
      el.focus();
      el.setSelectionRange(5, 19, 'backward');
      window.savedInput = el;
    });
    for (const change of [
      'Width',
      'Theme',
      'Attachment',
      'idle',
      'submitting',
      'streaming',
      'stopping',
      'error',
      'complete',
    ]) {
      console.log(`transition ${id} ${change}`);
      await control(change);
      await page.waitForTimeout(60);
      const actual = await input.evaluate((el) => ({
        same: el === window.savedInput,
        focused: document.activeElement === el,
        start: el.selectionStart,
        end: el.selectionEnd,
        direction: el.selectionDirection,
        value: el.value,
      }));
      assert.equal(actual.same, true);
      assert.equal(actual.focused, true);
      assert.equal(actual.start, 5);
      assert.equal(actual.end, 19);
      assert.equal(actual.direction, 'backward');
      assert.equal(
        actual.value,
        'Synthetic long draft\nSecond line preserves selection\nThird line.',
      );
      report.cases.push({ id, change, actual });
    }
    await control('streaming');
    const before = (await state()).stops;
    await page.getByTestId(id).getByRole('button', { name: /stop/i }).click();
    assert.equal((await state()).stops, before + 1);
    await input.press('Control+End');
    await input.pressSequentially('Z');
    assert.ok((await input.inputValue()).endsWith('Z'));
  }
  await control('streaming');
  const moving = await clocks();
  await page.waitForTimeout(250);
  const later = await clocks();
  assert.ok(later[0].time > moving[0].time);
  await control('Retain');
  await page.waitForTimeout(100);
  await settled();
  const paused = await clocks();
  await page.waitForTimeout(250);
  assert.deepEqual(await clocks(), paused);
  await control('Retain');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  await settled();
  const reduced = await clocks();
  await page.waitForTimeout(250);
  assert.deepEqual(await clocks(), reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  report.cases.push({ lifecycle: { moving, later, paused, reduced } });
  for (const theme of ['light', 'dark']) {
    if ((await state()).mode !== theme) await control('Theme');
    await page.waitForTimeout(300);
    for (const phaseMs of [0, 1000, 2000, 3000]) {
      await page.evaluate((ms) => {
        for (const el of document.querySelectorAll('.bloom-composer-loader-rect'))
          for (const a of el.getAnimations()) {
            a.pause();
            a.currentTime = ms;
          }
      }, phaseMs);
      await page.screenshot({ path: `${out}/${theme}-${phaseMs}.png` });
      writeFileSync(
        `${out}/${theme}-${phaseMs}.svg`,
        await page
          .getByTestId('isolated')
          .locator('svg')
          .first()
          .evaluate((el) => el.outerHTML),
      );
      report.cases.push({
        pngSha256: createHash('sha256')
          .update(readFileSync(`${out}/${theme}-${phaseMs}.png`))
          .digest('hex'),
        theme,
        phaseMs,
        clocks: await clocks(),
        alignment: 'CSS time only; not a native physical-band match',
      });
    }
  }
  assert.deepEqual(report.errors, []);
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.failure = error.stack;
  await page.screenshot({ path: `${out}/failure.png`, timeout: 5000 }).catch(() => {});
  process.exitCode = 1;
} finally {
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
console.log(
  JSON.stringify({ status: report.status, cases: report.cases.length, failure: report.failure }),
);
