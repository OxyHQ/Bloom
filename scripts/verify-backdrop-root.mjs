/**
 * Browser gate: no surface material loses its blur to a backdrop root.
 *
 * The material (`surface/web-material.ts`) paints its body and edge light as
 * `::before`/`::after` with `backdrop-filter`. In Chromium an element with
 * `opacity` below 1, any `filter` (`blur(0px)` included — only `none` is safe),
 * a `mask`, a `clip-path`, a `mix-blend-mode` or its own `backdrop-filter` is a
 * BACKDROP ROOT for everything under it: a material host below one (or on one)
 * blurs only what that element itself painted, so it turns flat and loses its
 * edge light, and gets them back the moment the trigger goes away. A fading
 * menu flickered exactly this way. Jest sees inline styles and the rules it is
 * handed; it does not see keyframes, transitions or what a browser computes, so
 * this walks every story in a real Chromium.
 *
 * For every story in `index.json`:
 *   - REST: after load, every visible material host (an element whose computed
 *     `::before`/`::after` has a `backdrop-filter`, found through the style
 *     rules that paint one, so the list cannot go stale) and every ancestor up
 *     to `<html>` must be free of the triggers above. Frames are sampled for a
 *     while, so entrance motion that settles on a trigger (`blur(0px)`) or
 *     never settles is caught as well as one held at rest.
 *   - PRESS / HOVER: the first few interactive hosts are hovered and pressed
 *     (pointer released off the control, so nothing activates) while frames
 *     are sampled: a pressed or hovered state that dims its host fails.
 *   - OPEN / CLOSE: stories of the overlay families (menus, dialogs, tooltips,
 *     toasts, popovers, selects, hover cards, sheets) open their triggers with
 *     real input and close them with Escape and an outside press, sampling
 *     every frame of both transitions.
 *
 * Controls, because "no violations" and "measured nothing" look the same:
 *   - a FLOOR on stories checked and on material hosts seen;
 *   - a POSITIVE control: a material host under `opacity: .5`, one under
 *     `filter: blur(0px)` and one under a `clip-path` must each be reported,
 *     and one under a bare `transform` must not be.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-backdrop-root.mjs [--url http://localhost:6006] [--only <id substring>]
 *     [--jobs 6] [--no-interact]
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Playwright is not a Bloom dependency: a local verification tool, resolved from
// a sibling checkout that has it (or from this one if it is ever installed).
const PLAYWRIGHT_PATHS = ['/home/nate/Oxy/Astro/node_modules/playwright', 'playwright'];
function loadPlaywright() {
  for (const candidate of PLAYWRIGHT_PATHS) {
    try {
      return require(candidate);
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`Could not resolve playwright. Tried: ${PLAYWRIGHT_PATHS.join(', ')}`);
}

const arg = (name, fallback) => {
  const at = process.argv.indexOf(name);
  return at === -1 ? fallback : process.argv[at + 1];
};
const BASE = arg('--url', 'http://localhost:6006');
const ONLY = arg('--only', null);
const JOBS = Number(arg('--jobs', '6'));
const INTERACT = !process.argv.includes('--no-interact');

const STORY_FLOOR = 1000;
const HOST_STORY_FLOOR = 200;
const OVERLAY_STORY =
  /menu|dropdown|dialog|tooltip|toast|popover|select|hover-card|sheet|command|combobox|modal|confirm|prompt|picker|drawer/;

/**
 * Runs in the page. Exposes `__bloomBackdrop.scan()` (violations right now),
 * `start()`/`stop()` (every frame in between) and `hosts()`.
 */
function installProbe() {
  const MATERIAL_LAYER = /::?(before|after)\s*$/;
  let selectorCache = null;
  let selectorSheets = -1;

  function materialSelectors() {
    const sheets = [...document.styleSheets, ...(document.adoptedStyleSheets ?? [])];
    if (selectorCache && selectorSheets === sheets.length) return selectorCache;
    const found = new Set();
    const visit = (rules) => {
      for (const rule of rules) {
        if (rule.cssRules?.length) visit(rule.cssRules);
        if (!(rule instanceof CSSStyleRule)) continue;
        if (!/backdrop-filter/.test(rule.style.cssText)) continue;
        for (const part of rule.selectorText.split(',')) {
          if (!MATERIAL_LAYER.test(part.trim())) continue;
          const base = part.trim().replace(MATERIAL_LAYER, '').trim();
          if (base) found.add(base);
        }
      }
    };
    for (const sheet of sheets) {
      try {
        visit(sheet.cssRules);
      } catch {
        // cross-origin sheet: Bloom paints nothing from one
      }
    }
    selectorCache = [...found];
    selectorSheets = sheets.length;
    return selectorCache;
  }

  function componentName(node) {
    const key = Object.keys(node).find((k) => k.startsWith('__reactFiber$'));
    let fiber = key ? node[key] : null;
    const names = [];
    while (fiber && names.length < 3) {
      const type = fiber.type;
      const name =
        typeof type === 'function'
          ? type.displayName || type.name
          : typeof type === 'object' && type
            ? type.displayName || type.render?.displayName || type.render?.name || type.type?.name
            : null;
      if (
        name &&
        !/^(View|Text|Animated|AnimatedComponent|Pressable|ForwardRef|Unknown)/.test(name)
      )
        names.push(name);
      fiber = fiber.return;
    }
    return names.join('<');
  }

  function describe(node) {
    const id = node.getAttribute('data-testid');
    const cls = [...node.classList].filter((c) => !/^(css|r)-/.test(c)).slice(0, 3);
    const data = Object.keys(node.dataset ?? {}).slice(0, 3);
    return [
      node.tagName.toLowerCase(),
      id ? `#${id}` : '',
      cls.length ? `.${cls.join('.')}` : '',
      data.length ? `[${data.join(',')}]` : '',
      ` {${componentName(node)}}`,
    ].join('');
  }

  function triggersOf(style, isHost) {
    const found = [];
    const opacity = Number.parseFloat(style.opacity);
    if (opacity < 1) found.push(`opacity ${opacity}`);
    if (style.filter && style.filter !== 'none') found.push(`filter ${style.filter}`);
    const mask = style.maskImage || style.webkitMaskImage;
    if (mask && mask !== 'none') found.push(`mask ${mask.slice(0, 40)}`);
    if (style.clipPath && style.clipPath !== 'none') found.push(`clip-path ${style.clipPath}`);
    if (style.mixBlendMode && style.mixBlendMode !== 'normal')
      found.push(`mix-blend-mode ${style.mixBlendMode}`);
    const backdrop = style.backdropFilter || style.webkitBackdropFilter;
    if (backdrop && backdrop !== 'none') found.push(`backdrop-filter ${isHost ? '(host)' : ''}`);
    return found;
  }

  function isMaterial(node) {
    const before = getComputedStyle(node, '::before');
    const after = getComputedStyle(node, '::after');
    const painted = (s) =>
      s.content !== 'none' && (s.backdropFilter || s.webkitBackdropFilter || 'none') !== 'none';
    return painted(before) || painted(after);
  }

  function hosts() {
    const selectors = materialSelectors();
    if (selectors.length === 0) return [];
    const nodes = new Set();
    for (const selector of selectors) {
      try {
        for (const node of document.querySelectorAll(selector)) nodes.add(node);
      } catch {
        // a selector only a pseudo-class-aware engine accepts; skip it
      }
    }
    return [...nodes].filter((node) => {
      const box = node.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return false;
      if (typeof node.checkVisibility === 'function' && !node.checkVisibility()) return false;
      return isMaterial(node);
    });
  }

  function scan() {
    const out = [];
    const list = hosts();
    for (const host of list) {
      for (let node = host; node && node.nodeType === 1; node = node.parentElement) {
        const hits = triggersOf(getComputedStyle(node), node === host);
        for (const hit of hits) {
          out.push({
            host: describe(host),
            at: node === host ? 'host' : describe(node),
            trigger: hit,
          });
        }
      }
    }
    return { hosts: list.length, violations: out };
  }

  let sampling = null;
  function start() {
    sampling = { frames: 0, maxHosts: 0, seen: new Map(), running: true };
    const state = sampling;
    const tick = () => {
      if (!state.running) return;
      const result = scan();
      state.frames++;
      state.maxHosts = Math.max(state.maxHosts, result.hosts);
      for (const v of result.violations) {
        const key = `${v.host} @ ${v.at} :: ${v.trigger.replace(/[\d.]+/g, '#')}`;
        const entry = state.seen.get(key) ?? { ...v, frames: 0, values: new Set() };
        entry.frames++;
        if (entry.values.size < 6) entry.values.add(v.trigger);
        state.seen.set(key, entry);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function stop() {
    const state = sampling;
    if (!state) return { frames: 0, maxHosts: 0, violations: [] };
    state.running = false;
    sampling = null;
    return {
      frames: state.frames,
      maxHosts: state.maxHosts,
      violations: [...state.seen.values()].map((v) => ({ ...v, values: [...v.values] })),
    };
  }
  function interactiveHosts(limit) {
    return hosts()
      .map((host) => host.closest('button, a[href], [role="button"], [tabindex]') ?? null)
      .filter((node, i, all) => node && all.indexOf(node) === i)
      .slice(0, limit)
      .map((node) => {
        const box = node.getBoundingClientRect();
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      })
      .filter((p) => p.x > 0 && p.y > 0 && p.x < innerWidth && p.y < innerHeight);
  }
  function triggers(limit) {
    const root = document.querySelector('#storybook-root') ?? document.body;
    return [
      ...root.querySelectorAll(
        'button, [role="button"], [aria-haspopup], [role="combobox"], [data-testid*="trigger"]',
      ),
    ]
      .filter((node) => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && box.top >= 0 && box.bottom <= innerHeight;
      })
      .slice(0, limit)
      .map((node) => {
        const box = node.getBoundingClientRect();
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      });
  }
  window.__bloomBackdrop = {
    scan,
    start,
    stop,
    hosts: () => hosts().length,
    interactiveHosts,
    triggers,
  };
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch({
  channel: 'chromium',
  args: ['--force-prefers-reduced-motion=no-preference'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: 'no-preference',
  colorScheme: 'light',
});
await context.addInitScript(installProbe);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sampled(page, action) {
  await page.evaluate(() => window.__bloomBackdrop.start());
  try {
    await action();
  } finally {
    // the page may have navigated: a fresh probe has nothing to stop
  }
  return page
    .evaluate(() => window.__bloomBackdrop.stop())
    .catch(() => ({ frames: 0, maxHosts: 0, violations: [] }));
}

async function open(page, id) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=theme:light`, {
        waitUntil: 'load',
        timeout: 45000,
      });
      await page
        .waitForFunction(
          () => (document.querySelector('#storybook-root')?.childElementCount ?? 0) > 0,
          null,
          { timeout: 15000 },
        )
        .catch(() => undefined);
      return true;
    } catch {
      // one retry: a dev server can drop a connection mid-crawl
    }
  }
  return false;
}

async function auditStory(page, id) {
  const phases = [];
  if (!(await open(page, id))) return { id, error: 'navigation failed', phases, hosts: 0 };
  const url = page.url();
  const backHome = async () => {
    if (page.url() !== url) await open(page, id);
  };

  phases.push(['rest', await sampled(page, () => sleep(900))]);
  if (INTERACT) {
    const points = await page.evaluate(() => window.__bloomBackdrop.interactiveHosts(3));
    for (const point of points) {
      phases.push([
        'hover/press',
        await sampled(page, async () => {
          await page.mouse.move(point.x, point.y, { steps: 2 });
          await sleep(220);
          await page.mouse.down();
          await sleep(180);
          await page.mouse.move(2, 2, { steps: 2 });
          await page.mouse.up();
          await sleep(120);
        }),
      ]);
      await backHome();
    }
    if (OVERLAY_STORY.test(id)) {
      const targets = await page.evaluate(() => window.__bloomBackdrop.triggers(4));
      for (const point of targets) {
        phases.push([
          'open/close',
          await sampled(page, async () => {
            await page.mouse.move(point.x, point.y, { steps: 3 });
            await sleep(500);
            await page.mouse.click(point.x, point.y);
            await sleep(700);
            await page.keyboard.press('Escape');
            await sleep(600);
            await page.mouse.click(3, 3);
            await sleep(500);
          }),
        ]);
        await backHome();
      }
    }
  }
  const hosts = Math.max(0, ...phases.map(([, p]) => p.maxHosts));
  return { id, phases, hosts };
}

async function positiveControl(page) {
  await open(page, 'foundations-color--modes');
  return page.evaluate(() => {
    const mount = document.querySelector('#storybook-root') ?? document.body;
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(
      '.ctl-host { position: relative; isolation: isolate; width: 80px; height: 40px; }' +
        '.ctl-host::before { content: ""; position: absolute; inset: 0; backdrop-filter: blur(8px); }',
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    const make = (outer) => {
      const wrap = document.createElement('div');
      Object.assign(wrap.style, outer);
      const host = document.createElement('div');
      host.className = 'ctl-host';
      wrap.appendChild(host);
      mount.appendChild(wrap);
      return wrap;
    };
    const cases = [
      make({ opacity: '0.5' }),
      make({ filter: 'blur(0px)' }),
      make({ clipPath: 'inset(0)' }),
    ];
    const dirty = window.__bloomBackdrop.scan();
    for (const wrap of cases) wrap.remove();
    const clean = make({ transform: 'scale(0.9)' });
    const after = window.__bloomBackdrop.scan();
    clean.remove();
    const mine = (r) => r.violations.filter((v) => v.host.includes('ctl-host'));
    return { dirty: mine(dirty).map((v) => v.trigger), clean: mine(after).length };
  });
}

const indexResponse = await fetch(`${BASE}/index.json`);
if (!indexResponse.ok) throw new Error(`index.json: HTTP ${indexResponse.status} at ${BASE}`);
const index = await indexResponse.json();
const stories = Object.values(index.entries ?? {})
  .filter((entry) => entry.type === 'story')
  .map((entry) => entry.id)
  .filter((id) => (ONLY ? id.includes(ONLY) : true));

let exitCode = 0;
try {
  const controlPage = await context.newPage();
  const control = await positiveControl(controlPage);
  await controlPage.close();
  const controlOk =
    control.dirty.some((t) => t.startsWith('opacity')) &&
    control.dirty.some((t) => t.startsWith('filter')) &&
    control.dirty.some((t) => t.startsWith('clip-path')) &&
    control.clean === 0;
  console.log(
    `control: ${JSON.stringify(control)} → ${controlOk ? 'detects each trigger (good)' : 'BLIND (gate is vacuous)'}`,
  );
  if (!controlOk) exitCode = 1;

  if (!ONLY && stories.length < STORY_FLOOR) {
    console.log(`FAIL  only ${stories.length} stories in the index (floor ${STORY_FLOOR})`);
    exitCode = 1;
  }

  const queue = [...stories];
  const results = [];
  const worker = async () => {
    const page = await context.newPage();
    page.on('dialog', (dialog) => dialog.dismiss().catch(() => undefined));
    while (queue.length) {
      const id = queue.shift();
      try {
        results.push(await auditStory(page, id));
      } catch (error) {
        results.push({ id, error: String(error).slice(0, 160), phases: [], hosts: 0 });
      }
      if (results.length % 100 === 0) console.error(`… ${results.length}/${stories.length}`);
    }
    await page.close();
  };
  await Promise.all(Array.from({ length: Math.max(1, JOBS) }, worker));

  let failing = 0;
  let withHosts = 0;
  for (const result of results.sort((a, b) => a.id.localeCompare(b.id))) {
    if (result.hosts > 0) withHosts++;
    const violations = result.phases.flatMap(([phase, p]) =>
      p.violations.map((v) => ({ phase, ...v })),
    );
    if (result.error) console.log(`ERROR ${result.id}: ${result.error}`);
    if (violations.length === 0) continue;
    failing++;
    console.log(`FAIL  ${result.id}`);
    const unique = new Map();
    for (const v of violations) {
      const key = `${v.phase} ${v.host} @ ${v.at} ${v.trigger.split(' ')[0]}`;
      if (!unique.has(key)) unique.set(key, v);
    }
    for (const v of unique.values())
      console.log(`        [${v.phase}] ${v.host}\n           at ${v.at}: ${v.values.join(' | ')}`);
  }
  console.log(
    `\nchecked ${results.length} stories (${withHosts} with material hosts), ${failing} with a backdrop root over a material host`,
  );
  if (!ONLY && withHosts < HOST_STORY_FLOOR) {
    console.log(
      `FAIL  only ${withHosts} stories painted a material host (floor ${HOST_STORY_FLOOR})`,
    );
    exitCode = 1;
  }
  if (failing > 0 || results.some((r) => r.error)) exitCode = 1;
} finally {
  await browser.close();
}
process.exit(exitCode);
