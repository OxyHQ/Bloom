import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/home/nate/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const report = { packageVersion: '18.2.1', browser: await browser.version(), errors: [], checks: [] };
page.on('pageerror', (error) => report.errors.push(error.message));
const check = (name, pass, evidence = {}) => {
  report.checks.push({ name, pass, ...evidence });
  assert.ok(pass, name);
};

try {
  await page.goto('http://127.0.0.1:5182/?task=workspace');
  const document = page.getByRole('textbox', { name: 'Document draft' });
  const inspector = page.getByRole('textbox', { name: 'Inspector note' });
  await document.waitFor();
  await document.fill('Selected through the published workspace example');
  await inspector.fill('Inspector state survives resize');
  await page.evaluate(() => {
    window.documentInput = document.querySelector('input[aria-label="Document draft"]');
    window.inspectorInput = document.querySelector('input[aria-label="Inspector note"]');
  });
  for (const width of [1400, 700, 390, 1400]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(400);
    const values = [await document.inputValue(), await inspector.inputValue()];
    const sameNodes = await page.evaluate(
      () => window.documentInput === document.querySelector('input[aria-label="Document draft"]') &&
        window.inspectorInput === document.querySelector('input[aria-label="Inspector note"]'),
    );
    check(`workspace state and identity at ${width}px`,
      values[0] === 'Selected through the published workspace example' &&
      values[1] === 'Inspector state survives resize' && sameNodes,
      { width, values, sameNodes },
    );
    if (width === 390 || (width === 1400 && values[0] === 'Selected through the published workspace example')) {
      await page.evaluate(() => {
        document.activeElement?.blur();
        for (const element of document.querySelectorAll('*')) element.scrollTop = 0;
      });
      await page.waitForTimeout(100);
      await page.screenshot({ path: width === 390 ? 'workspace-390.png' : 'workspace-1400.png', fullPage: false });
    }
  }

  await page.goto('http://127.0.0.1:5182/?task=canvas');
  const status = page.getByText(/Zoom 12; standard; free; flat/);
  await status.waitFor();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Show my location' }).click();
  await page.getByRole('button', { name: 'Tilt the map' }).click();
  await page.getByRole('button', { name: /Facing 35 degrees/ }).click();
  await page.getByRole('button', { name: 'Map layers' }).click();
  await page.getByRole('menuitemradio', { name: 'Satellite' }).click();
  let mapState = await page.locator('body').innerText();
  check('canvas example wires shared map callbacks and layer picker',
    mapState.includes('Zoom 13; satellite; following; tilted'), { mapState },
  );
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole('button', { name: 'Zoom out' }).click();
  mapState = await page.locator('body').innerText();
  check('canvas controls remain available at compact width', mapState.includes('Zoom 12; satellite; following; tilted'), { mapState });
  await page.screenshot({ path: 'canvas-390.png', fullPage: false });

  await page.goto('http://127.0.0.1:5182/?task=conversation');
  const message = page.getByRole('textbox', { name: 'Message' });
  await message.waitFor();
  await message.fill('Summarize this local document');
  await message.press('Enter');
  const stop = page.getByRole('button', { name: /stop/i });
  await stop.waitFor();
  const before = await page.locator('svg rect').evaluateAll((elements) =>
    elements.filter((element) => getComputedStyle(element).animationName.includes('composer-loader'))
      .map((element) => getComputedStyle(element).strokeDashoffset),
  );
  await page.waitForTimeout(220);
  const after = await page.locator('svg rect').evaluateAll((elements) =>
    elements.filter((element) => getComputedStyle(element).animationName.includes('composer-loader'))
      .map((element) => getComputedStyle(element).strokeDashoffset),
  );
  check('conversation uses animated shared loader while busy', before.length > 0 && JSON.stringify(before) !== JSON.stringify(after), { before, after });
  await page.screenshot({ path: 'conversation-busy-390.png', fullPage: false });
  await stop.click();
  await page.waitForTimeout(250);
  check('conversation Stop returns through app callback', await page.getByRole('button', { name: /stop/i }).count() === 0);

  check('no uncaught page errors', report.errors.length === 0, { errors: report.errors });
} catch (error) {
  report.failure = String(error);
  throw error;
} finally {
  writeFileSync('runtime-results.json', JSON.stringify(report, null, 2));
  await browser.close();
}
