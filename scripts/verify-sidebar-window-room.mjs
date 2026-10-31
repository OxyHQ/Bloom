import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || '@playwright/test');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  // Explicit navigation placement uses a Screen scope around the compositor;
  // the shell still owns the window corner and the real sidebar remains clickable.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/iframe.html?id=composition-app-shell-sidebar-playground--explicit-placement&args=size:sm;surface:docked;variant:panel;collapsed:true;window:oxyos`,
      { waitUntil: 'domcontentloaded', timeout: 120000 },
    );
    const controls = page.getByTestId('sidebar-playground-window-controls');
    const band = page.getByTestId('sidebar-window-band');
    const expand = page.getByRole('button', { name: 'Expand sidebar', exact: true });
    await expect(controls).toHaveCount(1, { timeout: 120000 });
    await expect(page.getByTestId('sidebar-playground-screen-window-controls')).toHaveCount(0);
    await expect(band).toHaveCSS('height', '52px', { timeout: 120000 });
    const [buttons, trigger] = await Promise.all([controls.boundingBox(), expand.boundingBox()]);
    assert.ok(buttons && trigger, 'window controls and sidebar trigger have bounds');
    assert.ok(
      trigger.y >= buttons.y + buttons.height,
      'sidebar trigger clears the window controls',
    );
    await expand.click();
    await expect(page.getByRole('button', { name: 'Collapse sidebar', exact: true })).toBeVisible();
    assert.deepEqual(errors, []);
    console.log({ explicitPlacement: true, passed: true });
    await page.close();
  }

  // The adaptive shell uses a Reanimated mapper without the worklets plugin.
  // Its clearance must follow the measured navigation host in both directions.
  for (const direction of ['ltr', 'rtl']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((dir) => {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          document.documentElement.dir = dir;
        },
        { once: true },
      );
    }, direction);
    await page.goto(
      `${base}/iframe.html?id=composition-app-shell-sidebar-playground--adaptive&args=size:sm;surface:docked;variant:panel;window:oxyos`,
      { waitUntil: 'domcontentloaded', timeout: 120000 },
    );
    const navigation = page.getByTestId('sidebar-playground-navigation-sidebar-frame');
    const clearance = page.getByTestId('sidebar-playground-header-clearance');
    await expect(navigation).toHaveCSS('width', '232px', { timeout: 120000 });
    await expect(clearance).toHaveCSS('padding-inline-start', '0px');
    await page.evaluate(() => {
      window.__adaptiveRoomSamples = [];
      window.__adaptiveRoomSampling = true;
      const sample = () => {
        if (!window.__adaptiveRoomSampling) return;
        const nav = document.querySelector(
          '[data-testid="sidebar-playground-navigation-sidebar-frame"]',
        );
        const header = document.querySelector(
          '[data-testid="sidebar-playground-header-clearance"]',
        );
        if (nav && header)
          window.__adaptiveRoomSamples.push(
            nav.getBoundingClientRect().width +
              parseFloat(getComputedStyle(header).paddingInlineStart),
          );
        requestAnimationFrame(sample);
      };
      sample();
    });
    await page
      .getByRole('button', { name: 'Collapse sidebar', exact: true })
      .click({ noWaitAfter: true });
    await expect(navigation).toHaveCSS('width', '45px', { timeout: 120000 });
    await expect(clearance).toHaveCSS('padding-inline-start', '43px', { timeout: 120000 });
    assert.equal(await clearance.evaluate((node) => getComputedStyle(node).direction), direction);
    await page
      .getByRole('button', { name: 'Expand sidebar', exact: true })
      .click({ noWaitAfter: true });
    await expect(navigation).toHaveCSS('width', '232px', { timeout: 120000 });
    await expect(clearance).toHaveCSS('padding-inline-start', '0px', { timeout: 120000 });
    const samples = await page.evaluate(() => {
      window.__adaptiveRoomSampling = false;
      return window.__adaptiveRoomSamples;
    });
    assert.ok(samples.length > 2, `${direction}: adaptive transitions produced no samples`);
    assert.ok(
      samples.every((width) => width >= 87),
      `${direction}: adaptive header entered the controls room: ${samples}`,
    );
    assert.deepEqual(errors, []);
    console.log({ adaptive: true, direction, passed: true });
    await page.close();
  }

  for (const [size, expanded, collapsed] of [
    ['sm', 232, 45],
    ['md', 260, 55],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/iframe.html?id=composition-app-shell-sidebar-playground--playground&args=size:${size};surface:docked;variant:panel;window:oxyos`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 120000,
      },
    );
    const navigation = page.getByTestId('sidebar-playground-navigation');
    await expect(navigation).toHaveCSS('width', `${expanded}px`, { timeout: 120000 });
    await page.evaluate(() => {
      window.__bloomRoomSamples = [];
      window.__bloomRoomSampling = true;
      const sample = () => {
        if (!window.__bloomRoomSampling) return;
        const header = document.querySelector('[data-bloom-page-header-bar]');
        const shell = document.querySelector('[data-testid="sidebar-playground"]');
        if (header && shell) {
          window.__bloomRoomSamples.push(
            header.getBoundingClientRect().left +
              parseFloat(getComputedStyle(header).paddingInlineStart) -
              shell.getBoundingClientRect().left,
          );
        }
        requestAnimationFrame(sample);
      };
      sample();
    });
    await page
      .getByRole('button', { name: 'Collapse sidebar', exact: true })
      .click({ noWaitAfter: true });
    await expect(navigation).toHaveCSS('width', `${collapsed}px`, { timeout: 120000 });
    await page
      .getByRole('button', { name: 'Expand sidebar', exact: true })
      .click({ noWaitAfter: true });
    await expect(navigation).toHaveCSS('width', `${expanded}px`, { timeout: 120000 });
    const samples = await page.evaluate(() => {
      window.__bloomRoomSampling = false;
      return window.__bloomRoomSamples;
    });
    assert.ok(samples.length > 2, 'Both transitions must produce samples');
    assert.ok(
      samples.every((start) => start >= 87.5),
      `${size}: header invaded the 88px controls room: ${samples}`,
    );
    await expect(page.getByTestId('sidebar-playground-window-controls')).toHaveCount(1);
    assert.deepEqual(errors, []);
    console.log({
      size,
      samples: samples.length,
      minimumLeading: Math.min(...samples),
      passed: true,
    });
    await page.close();
  }

  // Compact geometry also applies to rails and to each material presentation.
  // Read the logical edge so the same contract is exercised in both directions.
  for (const direction of ['ltr', 'rtl']) {
    for (const [index, surface] of ['card', 'plain', 'docked'].entries()) {
      for (const variant of ['panel', 'rail']) {
        const size = ['sm', 'md', 'lg'][index];
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.addInitScript((dir) => {
          document.addEventListener(
            'DOMContentLoaded',
            () => {
              document.documentElement.dir = dir;
            },
            { once: true },
          );
        }, direction);
        await page.goto(
          `${base}/iframe.html?id=composition-app-shell-sidebar-playground--playground&args=size:${size};surface:${surface};variant:${variant};collapsed:true;railWidth:64;railLabels:hidden;window:oxyos&globals=theme:${direction === 'rtl' ? 'dark' : 'light'}`,
          { waitUntil: 'domcontentloaded', timeout: 120000 },
        );
        const header = page.locator('[data-bloom-page-header-bar]');
        await expect(header).toBeVisible({ timeout: 120000 });
        const leading = await header.evaluate((node) => {
          const shell = document.querySelector('[data-testid="sidebar-playground"]');
          const box = node.getBoundingClientRect();
          const outer = shell.getBoundingClientRect();
          return (
            (document.documentElement.dir === 'rtl'
              ? outer.right - box.right
              : box.left - outer.left) + parseFloat(getComputedStyle(node).paddingInlineStart)
          );
        });
        assert.ok(leading >= 87.5, `${direction}/${surface}/${variant}: room ${leading}`);
        await page
          .getByTestId('sidebar-playground-navigation')
          .getByRole('button', { name: 'Calendar', exact: true })
          .click({ noWaitAfter: true });
        await expect(header).toContainText('Calendar');
        await expect(page.getByTestId('sidebar-playground-window-controls')).toHaveCount(1);
        assert.deepEqual(errors, []);
        console.log({ direction, surface, variant, size, leading, passed: true });
        await page.close();
      }
    }
  }

  for (const [window, fullscreen, controls] of [
    ['web', false, 'bloom'],
    ['oxyos', true, 'bloom'],
    ['oxyos', false, 'platform'],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(
      `${base}/iframe.html?id=composition-app-shell-sidebar-playground--playground&args=window:${window};fullscreen:${fullscreen};controls:${controls};collapsed:true;size:sm`,
      { waitUntil: 'domcontentloaded', timeout: 120000 },
    );
    await expect(page.locator('[data-bloom-page-header-bar]')).toBeVisible({ timeout: 120000 });
    await expect(page.getByTestId('sidebar-playground-window-controls')).toHaveCount(0);
    console.log({ window, fullscreen, controls, passed: true });
    await page.close();
  }
} finally {
  await browser.close();
}
