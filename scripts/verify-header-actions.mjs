/** Local-width packing and focus continuity with real RNW, menus and layout. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('/home/nate/Oxy/Homiio/node_modules/puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
try {
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewport({ width: 1100, height: 900 });
    await page.goto(
      `${base}/iframe.html?id=composition-headers-adaptive-actions--local-width&viewMode=story&globals=theme:${mode}`,
      { waitUntil: 'networkidle0' },
    );
    await page.waitForSelector('[data-testid="adaptive-actions-stop"]', { visible: true });
    await page.evaluate(() => {
      window.__headerStop = document.querySelector('[data-testid="adaptive-actions-stop"]');
    });
    for (const width of [900, 640, 390, 320, 240]) {
      await page.click(`[data-testid="actions-width-${width}"]`);
      await page.waitForFunction(
        (width) =>
          Math.abs(
            document.querySelector('[data-testid="action-host"]').getBoundingClientRect().width -
              width,
          ) < 1,
        {},
        width,
      );
      await page.waitForFunction(() => {
        const stop = document.querySelector('[data-testid="adaptive-actions-stop"]');
        const host = document.querySelector('[data-testid="action-host"]').getBoundingClientRect();
        const box = stop.getBoundingClientRect();
        return stop === window.__headerStop && box.width > 0 && box.right <= host.right + 1;
      });
    }
    await page.$eval('[data-testid="action-host"]', (host) => {
      host.style.width = '0px';
    });
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="adaptive-actions"]').getBoundingClientRect().width ===
        0,
    );
    await page.click('[data-testid="actions-width-320"]');
    await page.waitForSelector('[data-testid="adaptive-actions-find"]', { visible: true });
    await page.focus('[data-testid="adaptive-actions-find"]');
    await page.$eval('[data-testid="action-host"]', (host) => {
      host.style.width = '240px';
    });
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('data-testid') === 'adaptive-actions-overflow',
    );
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="adaptive-actions-menu-find"]', { visible: true });
    await page.focus('[data-testid="adaptive-actions-menu-find"]');
    await page.evaluate(() => {
      window.__headerMenuItem = document.activeElement;
      document.querySelector('[data-testid="action-host"]').style.width = '900px';
    });
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="action-host"]').getBoundingClientRect().width === 900,
    );
    assert.equal(
      await page.evaluate(
        () =>
          document.activeElement === window.__headerMenuItem && window.__headerMenuItem.isConnected,
      ),
      true,
    );
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => document.querySelector('[data-testid="action-result"]').textContent === 'Find',
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        mode,
        localWidths: [240, 320, 390, 640, 900],
        zeroWidthCap: true,
        essentialIdentity: true,
        focusTransfer: true,
        openMenuContinuity: true,
        errors,
      }),
    );
    await page.goto(
      `${base}/iframe.html?id=composition-headers-adaptive-actions--responsive-navigation&viewMode=story&globals=theme:${mode}`,
      { waitUntil: 'networkidle0' },
    );
    await page.waitForSelector('[data-testid="navigation-menu"]');
    await page.evaluate(() => {
      window.__navigationMenu = document.querySelector('[data-testid="navigation-menu"]');
    });
    for (const width of [900, 390, 900, 390]) {
      await page.click(`[data-testid="navigation-width-${width}"]`);
      await page.waitForFunction(
        (width) => {
          const menu = document.querySelector('[data-testid="navigation-menu"]');
          const visible = menu.getBoundingClientRect().width > 0;
          return visible === width < 777;
        },
        {},
        width,
      );
      const geometry = await page.evaluate(() => {
        const menu = document.querySelector('[data-testid="navigation-menu"]');
        const start = document.querySelector('[data-testid="navigation-header-start"]');
        const title = document.querySelector('[data-testid="navigation-header-title-block"]');
        return {
          identity: menu === window.__navigationMenu,
          direct: menu.parentElement === start,
          menuWidth: menu.getBoundingClientRect().width,
          titleInset: title.getBoundingClientRect().left - start.getBoundingClientRect().left,
        };
      });
      assert.equal(geometry.identity, true);
      assert.equal(geometry.direct, true);
      if (width >= 777) assert.equal(geometry.titleInset, 0, 'hidden menu leaves no flex gap');
      else assert.ok(geometry.titleInset > geometry.menuWidth, 'visible menu retains leading gap');
      console.log(JSON.stringify({ mode, width, navigation: geometry }));
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
