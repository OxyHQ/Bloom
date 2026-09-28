/** Real pointer/keyboard gate for Bloom's independently framed panes. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('/home/nate/Oxy/Homiio/node_modules/puppeteer-core');
const index = process.argv.indexOf('--url');
const base = index < 0 ? 'http://localhost:6006' : process.argv[index + 1];
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto(`${base}/iframe.html?id=blocks-app-shell--separated-panes&viewMode=story`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="separated-divider"]');
  const measure = () => page.evaluate(() => {
    const get = id => document.querySelector(`[data-testid="separated-${id}"]`);
    const list = get('pane-list').getBoundingClientRect();
    const detail = get('pane-detail').getBoundingClientRect();
    const handle = get('divider');
    const box = handle.getBoundingClientRect();
    const x = box.left + box.width / 2, y = box.top + box.height / 2;
    const hit = document.elementFromPoint(x, y);
    return { width: list.width, gap: detail.left - list.right, centered: Math.abs(x - (list.right + detail.left) / 2) < 1, onHandle: hit === handle || handle.contains(hit), x, y };
  });
  let m = await measure();
  if (m.width !== 360 || m.gap !== 12 || !m.centered || !m.onHandle) throw new Error(`Invalid initial frame: ${JSON.stringify(m)}`);
  await page.mouse.move(m.x, m.y); await page.mouse.down(); await page.mouse.move(m.x + 60, m.y, { steps: 8 }); await page.mouse.up();
  m = await measure();
  if (Math.abs(m.width - 420) > 1 || m.gap !== 12 || !m.centered) throw new Error(`Pointer resize failed: ${JSON.stringify(m)}`);
  await page.focus('[data-testid="separated-divider"]'); await page.keyboard.press('ArrowLeft');
  m = await measure();
  if (Math.abs(m.width - 404) > 1) throw new Error(`Keyboard resize failed: ${JSON.stringify(m)}`);
  for (let n = 0; n < 30; n++) await page.keyboard.press('ArrowLeft');
  if ((await measure()).width !== 280) throw new Error('Minimum width failed');
  for (let n = 0; n < 30; n++) await page.keyboard.press('ArrowRight');
  if ((await measure()).width !== 520) throw new Error('Maximum width failed');
  console.log('PASS: 12px panel gutter, centered real pointer target, drag +60px, keyboard -16px, min280/max520');
} finally { await browser.close(); }
