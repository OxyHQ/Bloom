import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const output = process.env.BASELINE_OUTPUT ?? '.local/goway-baseline-rerun';
mkdirSync(output, { recursive: true });
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE_JSON);
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'en-US',
});
const errors = [],
  requests = [],
  blocked = [];
await context.addInitScript(() => {
  window.__locationCalls = 0;
  for (const key of ['getCurrentPosition', 'watchPosition']) {
    const original = navigator.geolocation[key].bind(navigator.geolocation);
    navigator.geolocation[key] = (...args) => {
      window.__locationCalls++;
      return original(...args);
    };
  }
});
await context.route('**/*', async (route) => {
  const req = route.request(),
    u = new URL(req.url());
  requests.push(`${req.method()} ${u.origin}${u.pathname}`);
  if (u.hostname === 'api.oxy.so' && u.pathname.startsWith('/auth/oauth/client/'))
    return route.fulfill({
      json: {
        application: {
          id: 'fixture-app',
          name: 'GoWay baseline',
          type: 'internal',
          isOfficial: true,
          isInternal: true,
          clientId: 'fixture-goway',
          scopes: [],
        },
      },
      headers: { 'access-control-allow-origin': '*' },
    });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method()) && u.hostname !== 'localhost') {
    blocked.push(`${req.method()} ${u.origin}${u.pathname}`);
    return route.abort();
  }
  return route.continue();
});
const page = await context.newPage();
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto('http://localhost:8132', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForFunction(() => window.__gowayReliefMap, { timeout: 120000 });
  await page.waitForTimeout(5000);
  await page.evaluate(() => {
    window.__baselineMap = window.__gowayReliefMap;
    window.__baselineCanvas = document.querySelector('canvas');
    window.__baselineSearch = document.querySelector('input');
  });
  const frames = [];
  for (const width of [1440, 900, 390, 320, 1440]) {
    await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
    await page.waitForTimeout(1200);
    const data = await page.evaluate(() => {
      const map = window.__gowayReliefMap;
      return {
        width: innerWidth,
        height: innerHeight,
        mapIdentity: map === window.__baselineMap,
        canvasIdentity: document.querySelector('canvas') === window.__baselineCanvas,
        searchIdentity: document.querySelector('input') === window.__baselineSearch,
        camera: {
          center: map.getCenter().toArray(),
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        },
        locationCalls: window.__locationCalls,
        regions: [...document.querySelectorAll('[data-testid^="explore-"]')].map((n) => ({
          id: n.dataset.testid,
          ...n.getBoundingClientRect().toJSON(),
        })),
        attribution: [...document.querySelectorAll('[aria-label]')]
          .map((n) => n.getAttribute('aria-label'))
          .filter((x) => /attribution|credit|copyright|data sources/i.test(x)),
      };
    });
    frames.push(data);
    await page.screenshot({ path: `${output}/baseline-${frames.length}-${width}.png` });
  }
  writeFileSync(`${output}/baseline.json`, JSON.stringify({ errors, blocked, frames }, null, 2));
  console.log(
    frames.map((f) => ({
      width: f.width,
      mapIdentity: f.mapIdentity,
      searchIdentity: f.searchIdentity,
      camera: f.camera,
    })),
  );
} finally {
  await browser.close();
}
