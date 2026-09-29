/**
 * Browser gate for the ambient surface CLASSES.
 *
 * `bg-ambient` / `border-ambient-hairline` resolve through CSS custom properties
 * that `SurfaceLevelProvider` publishes with react-native-css's
 * `VariableContextProvider`. Jest can see that the variables are PUBLISHED; it
 * cannot see that Tailwind compiled the utility, that the `@theme inline` block
 * kept the `var()` in it, or that the nearest provider wins in the cascade. A
 * class that silently resolves to nothing renders transparent, which on a page
 * reads as "correct".
 *
 * So this drives `Base/Surface Levels → Ambient Classes`, where every probe
 * draws a swatch painted ONLY by the classes next to one painted by the hook
 * (`useSurfaceFill()` + `hairlineOn()`), and requires the two to match in every
 * container, in both modes. It also requires the class swatch to be OPAQUE, so
 * an unresolved class (transparent) cannot pass by matching a transparent
 * reference.
 *
 * Usage: start Storybook, then
 *   CHROME_PATH=… node scripts/verify-ambient-classes.mjs [--url http://localhost:6006]
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const PUPPETEER_PATHS = ['/home/nate/Oxy/Homiio/node_modules/puppeteer-core', 'puppeteer-core'];

function loadPuppeteer() {
  for (const candidate of PUPPETEER_PATHS) {
    try {
      return require(candidate);
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`Could not resolve puppeteer-core. Tried: ${PUPPETEER_PATHS.join(', ')}`);
}

const CHROME = process.env.CHROME_PATH ?? '/opt/google/chrome/chrome';
const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';
const STORY = 'base-surface-levels--ambient-classes';
const PROBES = ['page', 'explicit', 'nested-rung', 'content-panel', 'scope-in-panel', 'color-scope', 'popover'];

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const failures = [];

try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 900 });
    await page.goto(`${BASE}/iframe.html?id=${STORY}&viewMode=story&globals=theme:${theme}`, {
      waitUntil: 'networkidle0',
    });
    await page.waitForSelector('[data-testid="page-class"]', { timeout: 30000 });

    // The popover is portaled from inside the ContentPanel. Open it with a
    // TRUSTED click at the trigger's real coordinates.
    const trigger = await page.waitForSelector('::-p-text(Open ambient popover)');
    const box = await trigger.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForSelector('[data-testid="popover-class"]', { timeout: 10000 });
    // Let the entrance settle so the swatches are read at rest.
    await new Promise((resolve) => setTimeout(resolve, 600));

    const readings = await page.evaluate((ids) => {
      const read = (testId) => {
        const el = document.querySelector(`[data-testid="${testId}"]`);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, border: cs.borderTopColor };
      };
      return Object.fromEntries(ids.map((id) => [id, { cls: read(`${id}-class`), hook: read(`${id}-hook`) }]));
    }, PROBES);

    for (const id of PROBES) {
      const { cls, hook } = readings[id];
      const label = `${theme}/${id}`;
      if (!cls || !hook) {
        failures.push(`${label}: probe not rendered`);
        continue;
      }
      const transparent = /rgba\(0, 0, 0, 0\)|transparent/.test(cls.bg);
      const ok = !transparent && cls.bg === hook.bg && cls.border === hook.border;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(22)} class ${cls.bg} / ${cls.border}   hook ${hook.bg} / ${hook.border}`);
      if (!ok) failures.push(label);
    }
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\nverify-ambient-classes: ${failures.length} failing: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\nverify-ambient-classes: every class swatch matches the hook, in both modes.');
