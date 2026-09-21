/** Check painted layout geometry in a real browser, including the shared Fab. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
  headless: true, args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6014');
  url.searchParams.set('viewMode', 'story');
  url.searchParams.set('id', 'templates-social--light-olive');
  await page.goto(url.href, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[aria-label="New post"]');
  const expanded = await page.evaluate(() => {
    const row = document.querySelector('[data-testid="sidebar-item-home"]').getBoundingClientRect();
    const fabNode = document.querySelector('[aria-label="New post"]');
    const fab = fabNode.getBoundingClientRect();
    const glyph = fabNode.querySelector('svg').getBoundingClientRect();
    const nav = document.querySelector('[data-testid="social-navigation"]').getBoundingClientRect();
    const panel = document.querySelector('[data-testid="content-panel-bleed-mask"]').getBoundingClientRect();
    return { rootPadding: getComputedStyle(document.querySelector('[data-testid="social"]')).padding, navTop: nav.top, navHeight: nav.height, viewportHeight: innerHeight, panelTop: panel.top, iconSize: glyph.width, navigationGap: panel.left - nav.right, rowLeft: row.left, rowRight: row.right, fabLeft: fab.left, fabRight: fab.right, height: fab.height };
  });
  assert.equal(expanded.rootPadding, '0px');
  assert.equal(expanded.navTop, 0);
  assert.equal(expanded.navHeight, expanded.viewportHeight);
  assert.equal(expanded.panelTop, 8);
  assert.equal(expanded.iconSize, 26);
  assert(Math.abs(expanded.navigationGap) <= 1, 'Social navigation meets the panel without an extra gap');
  assert.equal(expanded.height, 50, 'Sidebar Fab uses the 50px diameter');
  assert(Math.abs(expanded.rowLeft - expanded.fabLeft) <= 1 && Math.abs(expanded.rowRight - expanded.fabRight) <= 1, JSON.stringify(expanded));
  await page.click('[aria-label="Collapse sidebar"]');
  await new Promise(resolve => setTimeout(resolve, 400));
  const collapsed = await page.evaluate(() => {
    const sidebar = document.querySelector('[aria-label="Sidebar"]').getBoundingClientRect();
    const selectors = ['[data-testid="sidebar-header-control"] svg', '[data-testid="sidebar-item-home"] svg', '[data-testid="sidebar-item-profile"] svg', '[aria-label="New post"] svg'];
    const fab = document.querySelector('[aria-label="New post"]').getBoundingClientRect();
    const item = document.querySelector('[data-testid="sidebar-item-home"]').getBoundingClientRect();
    return { itemWidth: item.width, itemHeight: item.height, center: sidebar.left + sidebar.width / 2, centers: selectors.map(selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return rect.left + rect.width / 2; }), width: fab.width, height: fab.height };
  });
  assert(Math.abs(collapsed.itemWidth - collapsed.itemHeight) <= 1, `Collapsed navigation must remain circular: ${JSON.stringify(collapsed)}`);
  assert.equal(collapsed.width, 50);
  assert.equal(collapsed.height, 50);
  for (const center of collapsed.centers) assert(Math.abs(center - collapsed.center) <= 1, JSON.stringify(collapsed));
  console.log('Social sidebar expanded/collapsed:', { expanded, collapsed });
  if (!process.argv.includes('--shell-only')) for (const hasAction of [true, false]) for (const size of ['sm', 'md', 'lg']) for (const surface of ['plain', 'card', 'docked']) {
    url.searchParams.set('id', hasAction ? 'blocks-sidebar--primary-action' : 'blocks-sidebar--playground');
    url.searchParams.set('args', `size:${size};surface:${surface};collapsed:!true`);
    await page.goto(url.href, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[aria-label="Sidebar"]');
    const geometry = await page.evaluate(() => {
      const root = document.querySelector('[aria-label="Sidebar"]');
      const rect = root.getBoundingClientRect();
      const fab = root.querySelector('[aria-label="New post"]')?.getBoundingClientRect();
      const targets = [...root.querySelectorAll('[data-testid="sidebar-header-control"] svg, [data-testid^="sidebar-item-"] svg, [data-testid="sidebar-logo-icon"], [aria-label="Quick Search"] svg, [role="radio"] svg, [aria-label="Use light mode"] svg, [aria-label="Use dark mode"] svg')].filter(el => !el.parentElement.closest('[inert], [aria-hidden="true"]'));
      const rows = [...root.querySelectorAll('[data-testid^="sidebar-item-"]')].map(el => { const r = el.getBoundingClientRect(); return { width: r.width, height: r.height }; });
      return { rows, center: rect.left + rect.width / 2, width: fab?.width, height: fab?.height, centers: targets.map(el => { const r = el.getBoundingClientRect(); return { id: el.closest('[data-testid]')?.getAttribute('data-testid'), center: r.left + r.width / 2 }; }) };
    });
    assert.equal(geometry.width, hasAction ? 50 : undefined, `${size}/${surface} ${JSON.stringify(geometry)}`);
    assert.equal(geometry.height, hasAction ? 50 : undefined);
    for (const row of geometry.rows) assert(Math.abs(row.width - row.height) <= 1, `${size}/${surface}: navigation must remain circular ${JSON.stringify(row)}`);
    assert(geometry.centers.length >= 4, 'Header and destinations are present');
    for (const item of geometry.centers) assert(Math.abs(item.center - geometry.center) <= 1, `${size}/${surface} ${JSON.stringify(geometry)}`);
    console.log(`Sidebar ${size}/${surface}, action=${hasAction}: centered controls and circular destinations`);
  }

} finally { await browser.close(); }
