/**
 * EVALUATION ONLY — `eval/teleport`, never merged.
 *
 * Drives react-native-teleport's own Portal through the case Bloom's media
 * flight exists for, and through the case their recipe arranges, asking the
 * same question Bloom's identity gate asks: is it the SAME element at the end?
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('/home/nate/Oxy/Homiio/node_modules/puppeteer-core');
const BASE = process.env.BASE ?? 'http://localhost:6006';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: false,
  args: ['--no-sandbox', '--window-size=1280,900', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 1280, height: 900 },
});
try {
  const page = await browser.newPage();
  await page.bringToFront();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

  const sample = async () => ({
    at: Date.now(),
    ...(await page.evaluate(() => {
      const found = [...document.querySelectorAll('video[data-el-id]')];
      return {
        ids: found.map((v) => v.dataset.elId),
        count: found.length,
        t: found.length ? Math.max(...found.map((v) => v.currentTime)) : null,
        paused: found.every((v) => v.paused),
      };
    })),
  });

  for (const [story, trigger, label] of [
    ['eval-teleport--teleport-origin-unmounts', 'teleport-unmounts', 'origin UNMOUNTS (expo-router web)'],
    ['eval-teleport--teleport-origin-stays', 'teleport-stays', 'origin STAYS (their recipe)'],
  ]) {
    await page.goto(`${BASE}/iframe.html?id=${story}&viewMode=story`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(`[data-testid="${trigger}"]`, { timeout: 20000 });
    await sleep(400);
    const before = await sample();
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      el?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      el?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    }, trigger);
    await sleep(90);
    const during = await sample();
    await sleep(700);
    const after = await sample();

    const stamps = [...before.ids, ...during.ids, ...after.ids];
    const identities = new Set(stamps).size;
    console.log(
      `\n${label}\n  stamps ${JSON.stringify(stamps)}  ->  ${identities} identit${identities === 1 ? 'y' : 'ies'}` +
      `\n  count  ${before.count} -> ${during.count} -> ${after.count}` +
      `\n  ct     ${before.t} -> ${during.t} -> ${after.t}` +
      `\n  paused ${before.paused} / ${during.paused} / ${after.paused}`,
    );
  }
} finally {
  await browser.close();
}
