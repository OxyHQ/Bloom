import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || '@playwright/test');
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  const { entries } = await (await fetch(`${base}/index.json`)).json();
  const verifyStoryLinks = async () => {
    const targets = await page
      .locator('a[href*="path=/story/"]')
      .evaluateAll((links) =>
        links.map((link) => new URL(link.href).searchParams.get('path')?.replace('/story/', '')),
      );
    assert.ok(targets.length > 0, 'Color guidance links to related examples');
    for (const target of targets) assert.ok(entries[target], `Story link resolves: ${target}`);
  };
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const colors = [];
  for (const mode of ['light', 'dark']) {
    await page.goto(`${base}/iframe.html?id=foundations-color--presets&globals=theme:${mode}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    const caption = page.getByText('Secondary text', { exact: true }).first();
    await caption.waitFor({ timeout: 120000 });
    await expect(page.locator('html')).toHaveClass(mode === 'dark' ? /dark/ : /^(?!.*dark).*$/);
    // The theme state and the rendered palette must agree, not merely the toolbar.
    if (colors.length) {
      await expect(caption).not.toHaveCSS('color', colors[0]);
    }
    colors.push(await caption.evaluate((node) => getComputedStyle(node).color));
    await verifyStoryLinks();
  }
  assert.notEqual(colors[0], colors[1]);
  await page.goto(`${base}/iframe.html?id=foundations-color--modes&globals=theme:light`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.getByText('dark', { exact: true }).waitFor({ timeout: 120000 });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  const samples = page.getByText('Secondary text', { exact: true });
  await expect(samples).toHaveCount(2);
  const sampleColors = await samples.evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).color),
  );
  assert.notEqual(sampleColors[0], sampleColors[1]);
  await verifyStoryLinks();
  // A component matrix must scope both palettes without changing the document.
  await page.goto(`${base}/iframe.html?id=blocks-chat-people--contacts&globals=theme:light`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  const contacts = page.getByTestId('contacts');
  await expect(contacts).toHaveCount(2, { timeout: 120000 });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  const matrixColors = await contacts.evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).getPropertyValue('--foreground').trim()),
  );
  assert.ok(matrixColors.every(Boolean));
  assert.notEqual(matrixColors[0], matrixColors[1]);
  await page.goto(
    `${base}/iframe.html?id=foundations-color-system-playground--playground&globals=theme:dark`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    },
  );
  const derived = page.getByRole('button', { name: 'Derived', exact: true });
  await derived.waitFor({ timeout: 120000 });
  await verifyStoryLinks();
  await derived.click({ noWaitAfter: true });
  await expect(derived).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: 'Curated combinations', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  const primary = () =>
    page
      .locator('html')
      .evaluate((node) => getComputedStyle(node).getPropertyValue('--primary').trim());
  const originalPrimary = await primary();
  const blue = page.getByRole('button', { name: /^Blue\s+ocean · derived$/ });
  await blue.click();
  await expect(blue).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(primary).not.toBe(originalPrimary);
  const light = page.getByRole('button', { name: 'Light mode', exact: true });
  await light.click();
  await expect(light).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.goto(`${base}/iframe.html?id=foundations-color-roles-in-context--first-direction`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  const roles = page.getByRole('button', { name: 'Color roles', exact: true });
  const single = page.getByRole('button', { name: 'Single accent', exact: true });
  await expect(roles).toHaveAttribute('aria-pressed', 'true', { timeout: 120000 });
  await single.click();
  await expect(single).toHaveAttribute('aria-pressed', 'true');
  await expect(roles).toHaveAttribute('aria-pressed', 'false');
  await verifyStoryLinks();
  // This intentional negative example must remain outside the global root.
  await page.goto(`${base}/iframe.html?id=foundations-bloom-provider--without-it`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await expect(
    page.getByText('useScrollRestoration must be used within a <ScrollRestorationProvider>.', {
      exact: true,
    }),
  ).toBeVisible({ timeout: 120000 });
  await page.goto(`${base}/iframe.html?id=foundations-bloom-provider--composed`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await expect(page.getByText('Provided. Outside the provider this line throws.')).toBeVisible({
    timeout: 120000,
  });
  assert.deepEqual(errors, []);
  console.log(
    'Storybook themes: local matrices, toolbar presets, filters and provider boundaries passed',
  );
} finally {
  await browser.close();
}
