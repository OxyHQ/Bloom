import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

// Run against the registered-session Storybook fixture, never a product account.
// Playwright can come from the existing consumer test environment.
const require = createRequire(
  join(resolve(process.env.PLAYWRIGHT_PACKAGE_ROOT ?? '.'), 'package.json'),
);
const { chromium } = require('playwright');
const origin = process.env.BLOOM_STORYBOOK_ORIGIN ?? 'http://localhost:6017';
const output = resolve(process.env.REPORT_DIR ?? '.local/panel-session-focus');
mkdirSync(output, { recursive: true });
const source = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (let run = 0; run < 5; run += 1) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    try {
      const page = await context.newPage();
      await page.goto(
        `${origin}/iframe.html?id=composition-semantic--registered-session-workspace&viewMode=story`,
      );
      await page.getByTestId('semantic-open').click();
      const field = page.getByTestId('semantic-inspector-draft');
      await field.fill('preserved draft abc');
      await field.press('Home');
      for (let key = 0; key < 5; key += 1) await field.press('Shift+ArrowRight');
      assert.deepEqual(
        await field.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [0, 5],
      );
      for (const width of [800, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.waitForTimeout(600);
        const state = await field.evaluate((node) => ({
          selection: [node.selectionStart, node.selectionEnd],
          focused: document.activeElement === node,
          value: node.value,
        }));
        results.push({ run, width, ...state });
        assert.deepEqual(state.selection, [0, 5]);
        assert.equal(state.focused, true);
        assert.equal(state.value, 'preserved draft abc');
      }
      // Replacement, not merely a reported selection attribute.
      await field.press('X');
      assert.equal(await field.inputValue(), 'Xrved draft abc');
    } finally {
      await context.close();
    }
  }
  writeFileSync(
    join(output, 'report.json'),
    `${JSON.stringify({ source, origin, browser: browser.version(), results }, null, 2)}\n`,
  );
  console.log(`Panel session focus: ${results.length} transitions passed; ${output}/report.json`);
} finally {
  await browser.close();
}
