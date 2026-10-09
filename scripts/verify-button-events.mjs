/** Original focus/key/hover events on each public Button host in real Chromium. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const base = process.argv[2] || 'http://localhost:6006';
try {
  for (const mode of ['light', 'dark']) for (const hasTouch of [false, true]) for (const reducedMotion of ['reduce', 'no-preference']) {
    console.log({ mode, hasTouch, reducedMotion });
    const page = await browser.newPage({ viewport: { width: 800, height: 600 }, hasTouch, reducedMotion });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/iframe.html?id=base-button--focus-keyboard-hover&viewMode=story&globals=theme:${mode}`);
    const status = page.getByTestId('events-status');
    await status.waitFor({ timeout: 120000 });
    const state = async () => JSON.parse(await status.innerText());
    const choices = [0, 1, 2].map(index => page.locator(`#events-choice-${index}`));
    await choices[0].focus();
    await expect.poll(async () => (await state()).selected).toBe(0);
    await page.keyboard.press('ArrowDown'); await expect(choices[1]).toBeFocused();
    await page.keyboard.press('ArrowDown'); await expect(choices[2]).toBeFocused();
    await expect.poll(async () => (await state()).selected).toBe(2);
    assert.equal((await state()).presses, 0, 'selection on focus must not activate');
    assert.equal((await state()).childFocus, 1, 'slotted focus handler must remain composed');
    await page.keyboard.press('ArrowDown'); await expect(choices[0]).toBeFocused();
    await page.keyboard.press('ArrowUp'); await expect(choices[2]).toBeFocused();
    assert.ok((await state()).keyUps >= 4);
    assert.ok((await state()).blurs >= 4);
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await state()).presses).toBe(1);
    if (hasTouch) {
      await choices[1].tap();
      await expect.poll(async () => (await state()).presses).toBe(2);
      assert.equal((await state()).preview, -1, 'touch must not synthesize hover preview');
    } else {
      for (let index = 0; index < choices.length; index++) {
        await choices[index].hover();
        await expect.poll(async () => (await state()).preview).toBe(index);
        await page.mouse.move(790, 580);
        await expect.poll(async () => (await state()).preview).toBe(-1);
      }
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Focus selection, ref keyboard navigation, asChild composition, activation and non-touch hover pass across hosts, themes and motion modes.');
} finally { await browser.close(); }
