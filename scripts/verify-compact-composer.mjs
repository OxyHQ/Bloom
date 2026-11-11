/** Verify the real editor, fixed toolbar and focus/limit behavior in Chromium. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const dir = process.env.ARTIFACT_DIR ?? '.local/compact-composer/browser';
await mkdir(dir, { recursive: true });
const reports = [];
try {
  for (const width of [390, 1100]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const mode = width === 390 ? 'light' : 'dark';
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${process.env.STORYBOOK_URL ?? 'http://localhost:6014'}/iframe.html?id=blocks-compact-composer--editable&viewMode=story&globals=theme:${mode}`,
    );
    const editor = page.getByTestId('compact-composer');
    const field = editor.locator('textarea');
    await field.waitFor();
    await field.evaluate((node) => {
      window.retainedComposerInput = node;
    });
    await page.getByRole('button', { name: 'Focus editor', exact: true }).click();
    await page.waitForFunction(() => document.activeElement === window.retainedComposerInput);
    await field.fill('A retained draft');
    await editor.getByTestId('compact-composer-maximize').focus();
    await page.waitForFunction(
      () =>
        JSON.parse(document.querySelector('[data-testid="compact-status"]').textContent).focused,
    );
    await field.fill('x'.repeat(250));
    await field.press('a');
    assert.equal(await field.inputValue(), 'x'.repeat(250), 'rejected edit keeps exact draft');
    assert.equal(
      await editor
        .locator('[data-bloom-glyph-attention]')
        .evaluate((node) => getComputedStyle(node).animationName),
      'bloom-glyph-attention-a',
    );
    await field.press('b');
    assert.equal(
      await editor
        .locator('[data-bloom-glyph-attention]')
        .evaluate((node) => getComputedStyle(node).animationName),
      'bloom-glyph-attention-b',
    );
    await page.getByRole('button', { name: 'Toggle busy', exact: true }).click();
    await field.fill('Still editable');
    assert.equal(await field.inputValue(), 'Still editable');
    assert.equal(await editor.getByTestId('compact-composer-submit').isDisabled(), true);
    await page.getByRole('button', { name: 'Toggle busy', exact: true }).click();
    await page.getByRole('button', { name: 'Load long draft', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('textarea').value.length === 300);
    const scroll = editor.getByTestId('compact-composer-scroll');
    const toolbar = editor.getByTestId('compact-composer-toolbar');
    const before = await toolbar.boundingBox();
    await scroll.hover();
    await page.mouse.wheel(0, 600);
    await page.waitForFunction(() =>
      [...document.querySelectorAll('[data-testid="compact-composer-scroll"] *')].some(
        (node) => node.scrollTop > 100,
      ),
    );
    const after = await toolbar.boundingBox();
    assert.ok(Math.abs(before.y - after.y) < 1, 'toolbar stays fixed outside editor scroller');
    assert.ok(after.y + after.height <= 800, 'toolbar remains in viewport');
    const fieldAndScroll = await field.evaluate((node) => ({
      same: node === window.retainedComposerInput,
      scrollHeight: node.scrollHeight,
      height: node.clientHeight,
      scroller: document.querySelector('[data-testid="compact-composer-scroll"]').clientHeight,
    }));
    assert.ok(fieldAndScroll.same);
    assert.ok(
      fieldAndScroll.height > fieldAndScroll.scroller,
      'outer viewport owns long draft scrolling',
    );
    await page.screenshot({ path: `${dir}/${width}-long.png` });
    await page.getByRole('button', { name: 'Clear draft', exact: true }).click();
    await editor.getByRole('button', { name: 'Attach media', exact: true }).click();
    await editor.getByTestId('compact-composer-submit').click();
    await page.waitForFunction(
      () =>
        JSON.parse(document.querySelector('[data-testid="compact-status"]').textContent)
          .submitted === 1,
    );
    await editor.getByRole('button', { name: 'Remove attachment', exact: true }).click();
    await page.getByTestId('outside').focus();
    await page.waitForFunction(
      () =>
        !JSON.parse(document.querySelector('[data-testid="compact-status"]').textContent).focused,
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await field.fill('x'.repeat(250));
    await field.press('a');
    assert.equal(
      await editor
        .locator('[data-bloom-glyph-attention]')
        .evaluate((node) => getComputedStyle(node).animationName),
      'none',
    );
    assert.equal(await field.evaluate((node) => node === window.retainedComposerInput), true);
    assert.deepEqual(errors, []);
    reports.push({
      width,
      mode,
      before,
      after,
      fieldAndScroll,
      rejectedAttempts: 2,
      busyEditable: true,
      attachmentSubmit: true,
      reducedMotion: true,
    });
    await page.close();
  }
  await writeFile(`${dir}/report.json`, JSON.stringify(reports, null, 2));
  console.log(
    'PASS compact composer: stable input, focus, limit, pending edits, fixed toolbar, attachment submission, reduced motion at 390/1100',
  );
} finally {
  await browser.close();
}
