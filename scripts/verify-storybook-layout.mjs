/**
 * Audit every indexed Storybook story in a real browser.
 *
 * Usage:
 *   STORYBOOK_URL=http://localhost:6006 node scripts/verify-storybook-layout.mjs
 *   node scripts/verify-storybook-layout.mjs --mobile --match sankey --screenshots
 *
 * Environment:
 *   STORYBOOK_URL     Storybook base URL (default http://localhost:6006).
 *   PUPPETEER_MODULE  Module name or path (default puppeteer-core).
 *   CHROME_PATH       Chrome executable; otherwise use installed Chrome channel.
 *   OUTPUT_DIR        Report parent directory (default OS temp/bloom-storybook-layout).
 *
 * Every invocation writes a NEW run directory; previous results are never reused.
 * --match is a case-insensitive story-id substring, not a regular expression.
 * Screenshots are optional. Failures include browser errors, visible Storybook
 * error panels, empty rendering and horizontal document overflow (>1px tolerance).
 * This is a layout/render smoke test, not a test of each story's interactions.
 */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

function parseArgs(argv) {
  const options = { mobile: false, screenshots: false, match: '' };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--mobile') options.mobile = true;
    else if (arg === '--screenshots') options.screenshots = true;
    else if (arg === '--match') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--match requires a story-id substring.');
      options.match = value.toLowerCase();
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

/** Runs inside the page: inspect painted elements, not hidden error templates. */
function readPageState() {
  const visible = element => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const panel = [...document.querySelectorAll('.sb-errordisplay, #error-message')].find(visible);
  const root = document.querySelector('#storybook-root');
  const frame = root?.querySelector('[data-bloom-story-layout]');
  const content = frame ?? root;
  const hasRenderedContent = !!content?.childElementCount && [...content.querySelectorAll('*')].some(visible);
  const bodyError = document.body.classList.contains('sb-show-errordisplay');
  return {
    rendered: hasRenderedContent,
    nodeCount: root?.querySelectorAll('*').length ?? 0,
    errorPanel: panel?.textContent?.trim().slice(0, 4000) || (bodyError ? 'Storybook displayed its error state.' : null),
    documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    viewportWidth: innerWidth,
    documentHeight: document.documentElement.scrollHeight,
    layout: frame?.getAttribute('data-bloom-story-layout') ?? null,
  };
}

async function auditStory(page, entry, base, outputDir, screenshots) {
  const pageErrors = [];
  const recordError = error => pageErrors.push(error.message ?? String(error));
  page.on('pageerror', recordError);
  const result = { id: entry.id, title: entry.title, name: entry.name, file: entry.importPath, pageErrors, failures: [] };
  try {
    const url = new URL('iframe.html', base);
    url.searchParams.set('id', entry.id);
    url.searchParams.set('viewMode', 'story');
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    if (!response?.ok()) throw new Error(`Preview response: ${response?.status() ?? 'missing'}`);
    await page.waitForFunction(() => {
      const root = document.querySelector('#storybook-root');
      const content = root?.querySelector('[data-bloom-story-layout]') ?? root;
      return !!content?.childElementCount || document.body.classList.contains('sb-show-errordisplay');
    }, { timeout: 30_000, polling: 100 });
    await page.evaluate(async () => {
      let timer;
      try {
        await Promise.race([
          document.fonts?.ready ?? Promise.resolve(),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Font readiness timed out.')), 15_000); }),
        ]);
      } finally { clearTimeout(timer); }
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      // Flush effects and measurements after font layout, without networkidle
      // (streaming demos and long-lived connections intentionally never idle).
      await new Promise(resolve => setTimeout(resolve, 250));
    });
    Object.assign(result, await page.evaluate(readPageState));
    if (!result.rendered) result.failures.push('No visible story content rendered.');
    if (result.errorPanel) result.failures.push('Storybook error panel.');
    if (result.documentWidth > result.viewportWidth + 1) {
      result.failures.push(`Horizontal overflow: ${result.documentWidth}px document / ${result.viewportWidth}px viewport.`);
    }
    if (screenshots) {
      // Encode separators too: story metadata must never escape the run folder.
      const filename = `${encodeURIComponent(entry.id)}.png`;
      await page.screenshot({ path: path.join(outputDir, filename) });
      result.screenshot = filename;
    }
  } catch (error) {
    result.failures.push(error.message ?? String(error));
    result.stateOnFailure = await page.evaluate(readPageState).catch(() => null);
  } finally {
    page.off('pageerror', recordError);
  }
  if (pageErrors.length) result.failures.push(`${pageErrors.length} browser page error(s).`);
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const base = new URL(process.env.STORYBOOK_URL ?? 'http://localhost:6006');
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  const response = await fetch(new URL('index.json', base), { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Story index responded ${response.status}.`);
  const index = await response.json();
  const entries = Object.values(index.entries ?? {})
    .filter(entry => entry.type === 'story' && typeof entry.id === 'string' && entry.id.toLowerCase().includes(options.match))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!entries.length) throw new Error(`No stories matched ${JSON.stringify(options.match)}; nothing was audited.`);

  const outputParent = path.resolve(process.env.OUTPUT_DIR ?? path.join(tmpdir(), 'bloom-storybook-layout'));
  await mkdir(outputParent, { recursive: true });
  const outputDir = await mkdtemp(path.join(outputParent, options.mobile ? 'mobile-' : 'desktop-'));
  const startedAt = new Date().toISOString();
  const viewport = options.mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 };
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  const moduleName = process.env.PUPPETEER_MODULE ?? 'puppeteer-core';
  const imported = require(moduleName);
  const puppeteer = imported.default ?? imported;
  const browser = await puppeteer.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
    headless: true,
    protocolTimeout: 90_000,
    args: ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  const results = [];
  let next = 0;
  try {
    const workers = Array.from({ length: Math.min(4, entries.length) }, async () => {
      const page = await browser.newPage();
      try {
        await page.setViewport(viewport);
        // Every worker needs animation frames even when another tab is foreground.
        await page.emulateFocusedPage(true);
        page.setDefaultNavigationTimeout(60_000);
        while (next < entries.length) {
          const entry = entries[next++];
          const result = await auditStory(page, entry, base, outputDir, options.screenshots);
          results.push(result);
          if (result.failures.length) console.error(`FAIL ${entry.id}: ${result.failures.join(' ')}`);
          if (results.length % 25 === 0 || results.length === entries.length) console.log(`${results.length}/${entries.length} stories checked.`);
        }
      } finally { await page.close(); }
    });
    // Await every worker before closing the browser, including on worker failure.
    const settled = await Promise.allSettled(workers);
    for (const worker of settled) if (worker.status === 'rejected') throw worker.reason;
  } finally {
    await browser.close();
    results.sort((a, b) => a.id.localeCompare(b.id));
    await writeFile(path.join(outputDir, 'results.json'), JSON.stringify({
      startedAt, finishedAt: new Date().toISOString(), url: base.href, viewport,
      match: options.match, expectedStories: entries.length, checkedStories: results.length,
      failedStories: results.filter(result => result.failures.length).length, results,
    }, null, 2));
    console.log(`Report: ${path.join(outputDir, 'results.json')}`);
  }
  const failures = results.filter(result => result.failures.length);
  console.log(`${results.length} stories checked; ${failures.length} failed.`);
  if (failures.length || results.length !== entries.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
