/** Verify painted SVG placeholders, not merely their presence in the DOM. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/iframe.html?id=base-avatar--custom-placeholder&viewMode=story`,
  );
  for (const shape of ['circle', 'squircle']) {
    const avatar = page.getByTestId(`placeholder-${shape}`);
    await avatar.waitFor({ timeout: 120000 });
    const pixels = async () => {
      const png = (await avatar.screenshot()).toString('base64');
      return page.evaluate(async (data) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const rgba = context.getImageData(24, 24, 48, 48).data;
        let dark = 0;
        for (let i = 0; i < rgba.length; i += 4) {
          if (rgba[i] < 80 && rgba[i + 1] < 80 && rgba[i + 2] < 80) dark++;
        }
        return dark;
      }, png);
    };
    assert.ok(
      (await pixels()) > 100,
      `${shape}: caller SVG is actually painted over its background`,
    );
    // Negative control: restore the old unpositioned foreground paint order.
    await avatar
      .locator('svg')
      .last()
      .evaluate((svg) => {
        svg.parentElement.replaceWith(svg);
      });
    assert.equal(
      await pixels(),
      0,
      `${shape}: removing the foreground layer reproduces the covered icon`,
    );
  }
  console.log('Custom SVG avatar placeholders paint visibly for circle and squircle backgrounds.');
} finally {
  await browser.close();
}
