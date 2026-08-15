/**
 * Browser gate: every story actually RENDERS something.
 *
 * A Storybook build succeeding proves the stories compile, not that they draw.
 * A story whose component throws on mount, or whose provider stack is missing a
 * piece, still builds — Storybook catches the error, shows its own panel, and
 * `#storybook-root` stays empty. The sidebar looks complete either way, which
 * is exactly how this harness rendered every story against an inert font system
 * for months without anyone noticing.
 *
 * What it asserts, per story id from `index.json`:
 *   - `#storybook-root` has at least one element child and some laid-out area;
 *   - no error the preview surfaced (Storybook's own error panel).
 *
 * Two controls, because "found no failures" and "measured nothing" look
 * identical from the outside:
 *   - a FLOOR on the number of stories checked, so an empty index fails;
 *   - a NEGATIVE control against a story id that does not exist, which must be
 *     reported as empty — if a nonexistent story passes, the emptiness check is
 *     not measuring emptiness.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-stories-render.mjs --url http://localhost:6006
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const PUPPETEER_PATHS = [
  '/home/nate/Oxy/Homiio/node_modules/puppeteer-core',
  'puppeteer-core',
];

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
const argOnly = process.argv.indexOf('--only');
const ONLY = argOnly !== -1 ? process.argv[argOnly + 1] : null;

/** Below this, assume the index failed to load rather than that Bloom shrank. */
const STORY_FLOOR = 150;

const indexResponse = await fetch(`${BASE}/index.json`);
if (!indexResponse.ok) {
  throw new Error(`index.json: HTTP ${indexResponse.status} — is Storybook running at ${BASE}?`);
}
const index = await indexResponse.json();
const entries = Object.values(index.entries ?? index.stories ?? {});
const stories = entries
  .filter((entry) => entry.type !== 'docs')
  .filter((entry) => (ONLY ? entry.id.includes(ONLY) : true));

if (!ONLY && stories.length < STORY_FLOOR) {
  console.log(`FAIL  only ${stories.length} stories in the index (floor ${STORY_FLOOR})`);
  process.exit(1);
}

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: ['--window-size=1280,900', '--force-prefers-reduced-motion=no-preference'],
  defaultViewport: { width: 1280, height: 900 },
});

/** Load one story and report what `#storybook-root` ended up holding. */
async function probe(page, id) {
  const errors = [];
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(message.text());
  };
  const onPageError = (error) => errors.push(String(error.message ?? error));
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  try {
    // One retry: a dev server dropping a connection mid-crawl aborts the
    // navigation, and reporting that as "the story renders nothing" would be a
    // false failure of exactly the kind this gate exists to avoid.
    let navigated = false;
    for (let attempt = 0; attempt < 2 && !navigated; attempt++) {
      try {
        await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });
        navigated = true;
      } catch (error) {
        errors.push(`navigation attempt ${attempt + 1}: ${String(error).slice(0, 120)}`);
      }
    }
    if (!navigated) return { children: 0, area: 0, text: 0, panel: 'navigation failed twice' };
    // Give the story a moment to mount; a component that throws still resolves
    // the navigation, so waiting on the network says nothing about rendering.
    await page.waitForFunction(
      () => {
        const root = document.querySelector('#storybook-root');
        return (
          (root && root.childElementCount > 0) ||
          (() => {
            const panel = document.querySelector('#error-message, .sb-errordisplay');
            return panel != null && panel.getClientRects().length > 0;
          })()
        );
      },
      { timeout: 15000 },
    ).catch(() => undefined);

    return await page.evaluate(() => {
      const root = document.querySelector('#storybook-root');
      if (!root) return { children: 0, area: 0, text: 0, panel: 'no #storybook-root' };
      const rects = [...root.querySelectorAll('*')].map((el) => el.getBoundingClientRect());
      const area = rects.reduce((max, rect) => Math.max(max, rect.width * rect.height), 0);
      // Storybook keeps its error panel in the DOM at all times and merely
      // hides it, so testing for EXISTENCE reports every story as broken —
      // which is indistinguishable from every story actually being broken.
      const panelNode = document.querySelector('#error-message, .sb-errordisplay');
      const errorPanel =
        panelNode &&
        (panelNode.offsetWidth > 0 || panelNode.offsetHeight > 0 || panelNode.getClientRects().length > 0)
          ? panelNode
          : null;
      return {
        children: root.childElementCount,
        area: Math.round(area),
        text: (root.textContent ?? '').trim().length,
        panel: errorPanel ? (errorPanel.textContent ?? '').trim().slice(0, 160) : null,
      };
    });
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    Object.assign(errors, errors);
    // Attach the collected errors to the returned object via a closure-free
    // channel: the caller reads them from the array it can see.
    probe.lastErrors = errors;
  }
}

try {
  const page = await browser.newPage();

  // NEGATIVE CONTROL: a story that does not exist must read as empty. If this
  // "passes", the emptiness check cannot distinguish drawn from not-drawn and
  // every OK below is meaningless.
  const control = await probe(page, 'this-story-does-not-exist--nope');
  const controlEmpty = control.children === 0 || control.panel != null;
  console.log(
    `control: nonexistent story → children=${control.children} panel=${control.panel ? 'yes' : 'no'}` +
      ` → ${controlEmpty ? 'reads as empty (good)' : 'READS AS RENDERED (gate is vacuous)'}`,
  );
  if (!controlEmpty) process.exitCode = 1;

  const failures = [];
  let checked = 0;

  for (const story of stories) {
    const result = await probe(page, story.id);
    const errors = probe.lastErrors ?? [];
    checked++;
    const empty = result.children === 0 || result.area === 0;
    if (empty || result.panel) {
      failures.push({ id: story.id, title: story.title, name: story.name, result, errors });
      console.log(
        `EMPTY ${story.id} — children=${result.children} area=${result.area} text=${result.text}` +
          (result.panel ? ` panel="${result.panel}"` : ''),
      );
      for (const error of errors.slice(0, 3)) console.log(`        ${error.slice(0, 200)}`);
    }
  }

  console.log(`\nchecked ${checked} stories, ${failures.length} rendered nothing`);
  if (failures.length > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
