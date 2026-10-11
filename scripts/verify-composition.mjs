/** Real pointer/keyboard checks for the composed material/scope/field/overlay scene. */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
let puppeteer;
for (const name of ['puppeteer-core', '/home/nate/Oxy/Homiio/node_modules/puppeteer-core']) {
  try {
    puppeteer = require(name);
    break;
  } catch {}
}
if (!puppeteer) throw Error('Install puppeteer-core to run browser checks.');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6008';
try {
  for (const mode of ['light', 'dark'])
    for (const width of [390, 1100]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewport({ width, height: 1000 });
      await page.goto(
        `${base}/iframe.html?id=system-composition--connected&viewMode=story&globals=theme:${mode}`,
        { waitUntil: 'networkidle0' },
      );
      await page.waitForSelector('[data-testid="composition-inherited"]');
      const height = (id) =>
        page.$eval(`[data-testid="${id}"]`, (element) => element.getBoundingClientRect().height);
      const small = await height('composition-inherited');
      const explicit = await height('composition-explicit');
      await page.$$eval('[data-testid="composition-size"] button', (buttons) =>
        buttons.find((button) => button.textContent === 'lg').click(),
      );
      await page.waitForFunction(
        (min) =>
          document.querySelector('[data-testid="composition-inherited"]').getBoundingClientRect()
            .height > min,
        {},
        small,
      );
      assert.equal(await height('composition-explicit'), explicit, 'explicit size remains stable');
      await page.click('[data-testid="composition-disable"]');
      assert.equal(
        await page.$eval('[data-testid="composition-message"]', (input) => input.disabled),
        true,
        'Field constraint reaches input',
      );
      assert.equal(
        await page.$eval('[data-testid="composition-notify"]', (control) =>
          control.getAttribute('aria-disabled'),
        ),
        'true',
      );
      await page.click('[data-testid="composition-menu"]');
      await page.waitForSelector('[data-testid="composition-edit"]', { visible: true });
      await page.click('[data-testid="composition-edit"]');
      await page.waitForSelector('[role="dialog"]', { visible: true });
      assert.equal(
        await page.$eval(
          '[role="dialog"] [data-testid="composition-message"]',
          (input) => input.disabled,
        ),
        true,
      );
      await page.click('[data-testid="composition-close"]');
      await page.waitForSelector('[role="dialog"]', { hidden: true });
      await page.click('[data-testid="composition-menu"]');
      await page.waitForSelector('[data-testid="composition-edit"]', { visible: true });
      await page.keyboard.press('Escape');
      await page.waitForSelector('[data-testid="composition-edit"]', { hidden: true });
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('data-testid')),
        'composition-menu',
        'menu returns keyboard focus',
      );
      assert.deepEqual(errors, []);
      console.log(
        JSON.stringify({
          mode,
          width,
          inheritedSize: true,
          explicitSize: true,
          fieldConstraints: true,
          dialog: true,
          keyboardFocus: true,
          errors,
        }),
      );
      await page.close();
    }
} finally {
  await browser.close();
}
