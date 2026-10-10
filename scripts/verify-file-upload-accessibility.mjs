import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || '@playwright/test');
const browser = await chromium.launch();
const base = process.argv[2] || 'http://127.0.0.1:6273';
try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const page = await browser.newPage({ reducedMotion });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/iframe.html?id=base-file-upload--accessible-status&viewMode=story`);
    const zone = page.getByTestId('status-upload');
    await expect(zone).toBeVisible();
    const inactive = zone.locator(
      '[data-bloom-file-upload-state="hidden"], [data-bloom-file-upload-state="hiding"], [data-bloom-file-upload-sub="hidden"], [data-bloom-file-upload-sub="hiding"]',
    );
    async function verifyInactive() {
      const count = await inactive.count();
      assert(count > 0);
      for (const node of await inactive.all())
        await expect(node).toHaveAttribute('aria-hidden', 'true');
    }
    await verifyInactive();
    await page.getByRole('button', { name: 'Start upload', exact: true }).click();
    await expect(zone).toHaveAttribute('aria-busy', 'true');
    await verifyInactive();
    let snapshot = await zone.ariaSnapshot();
    assert(snapshot.includes('Uploading 2.4 MB...'), snapshot);
    assert(!snapshot.includes('Uploaded successfully!'), snapshot);
    await page.getByRole('button', { name: 'Complete upload', exact: true }).click();
    await verifyInactive();
    snapshot = await zone.ariaSnapshot();
    assert(snapshot.includes('Uploaded successfully!'), snapshot);
    assert(!snapshot.includes('Uploading 2.4 MB...'), snapshot);
    await page.getByRole('button', { name: 'Reset upload', exact: true }).click();
    await verifyInactive();
    snapshot = await zone.ariaSnapshot();
    assert(
      !snapshot.includes('Uploaded successfully!') && !snapshot.includes('Uploading 2.4 MB...'),
      snapshot,
    );
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${reducedMotion}: idle → uploading → complete → idle, inactive statuses absent from accessibility tree`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
