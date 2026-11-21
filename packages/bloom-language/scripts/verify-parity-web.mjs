#!/usr/bin/env node
/**
 * Browser gate for the component parity suite: in Chrome, each language node
 * of a `Language/Parity` story draws what the Bloom element beside it draws.
 *
 * The Jest suite (`parity/`) compares declarations in jsdom, which neither lays
 * out nor resolves the cascade the way a browser does. Here every pair of
 * elements (Bloom's and the language's, walked in step) is compared on its
 * tag, its attributes other than `class`, `style` and `data-testid`, its text,
 * every computed style property (its `::before` and `::after` included: a
 * Surface draws its material there), and its laid-out size, in light and dark.
 *
 * Then each press host of a language cell is held: a view whose variants
 * answer its state (the anchor class `blsg`) and every pressable
 * react-native-web draws (Bloom's press host class `blsp`: the language's
 * hosts, Bloom's Avatar and EngagementAction). The pointer goes over it (at a
 * point no inner host covers), then presses, at the same place in both cells,
 * and the two cells are compared again on every computed style and size. So a
 * state variant draws what Bloom's own pressed or hovered style draws, and a
 * hover or press inside a pressable, a Bloom one included, is that one's.
 *
 * Usage: start Storybook (`bun run storybook`), then
 *   node packages/bloom-language/scripts/verify-parity-web.mjs [--url http://localhost:6006] [--width 1200]
 * Chrome is puppeteer's download (`~/.cache/puppeteer`) unless CHROME_PATH names one.
 */
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

/** puppeteer-core is not a dependency: this is a local verification tool. */
function loadPuppeteer() {
  for (const candidate of [
    'puppeteer-core',
    join(homedir(), 'Oxy/Bloom/node_modules/puppeteer-core'),
  ]) {
    try {
      return require(candidate);
    } catch {}
  }
  throw new Error('puppeteer-core not found (install it, or run from the shared Bloom checkout)');
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = join(homedir(), '.cache/puppeteer/chrome');
  const versions = readdirSync(root).sort();
  return join(root, versions.at(-1), 'chrome-linux64/chrome');
}

const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';
const argWidth = process.argv.indexOf('--width');
/** The window's width: a breakpoint variant is compared at the tier it gives. */
const WIDTH = argWidth !== -1 ? Number(process.argv[argWidth + 1]) : 1200;
const STORIES = process.argv.filter((arg) => arg.startsWith('language-parity--'));

/**
 * What a cell draws, as a tree: each element's tag, its attributes other than
 * `class`, `style`, `data-testid` and `id`, its text, every computed style
 * property (its `::before` and `::after` included) and its laid-out size. With
 * `portals` (a page that draws one side alone), what it presents into Bloom's
 * portal root (a sheet, a dialog) follows it.
 */
function describeInPage(testid, portals) {
  const SKIP = new Set(['class', 'style', 'data-testid', 'id']);
  // React's useId counts across the page; an id is compared by its order in its cell.
  const REACT_ID = /_r_[0-9a-z]+_|(?<=[-_:«#])r[0-9a-z]+(?=[-_:»)]|$)/g;
  const map = new Map();
  const ids = (text) =>
    text.replace(REACT_ID, (id) => {
      if (!map.has(id)) map.set(id, `id${map.size}`);
      return map.get(id);
    });
  const describe = (element) => {
    const attributes = {};
    for (const { name, value } of [...element.attributes].sort((a, b) =>
      a.name < b.name ? -1 : 1,
    ))
      if (!SKIP.has(name)) attributes[name] = ids(value);
    const style = getComputedStyle(element);
    // A running animation (a skeleton's shimmer) is sampled when it is read and
    // synced to when it mounted: what it animates is compared by its animation.
    const animated = element.getAnimations().length > 0;
    const MOVING = new Set(['opacity', 'transform', 'animation-delay']);
    const css = {};
    // Custom properties are inputs, named per instance (React ids); what they set is compared.
    for (let i = 0; i < style.length; i++)
      if (!style[i].startsWith('--') && !(animated && MOVING.has(style[i])))
        css[style[i]] = ids(style.getPropertyValue(style[i]));
    // What a pseudo-element draws (Surface's material is its ::before and ::after).
    for (const pseudo of ['::before', '::after']) {
      const drawn = getComputedStyle(element, pseudo);
      if (drawn.content === 'none' || drawn.content === 'normal') continue;
      for (let i = 0; i < drawn.length; i++)
        if (!drawn[i].startsWith('--'))
          css[`${pseudo} ${drawn[i]}`] = ids(drawn.getPropertyValue(drawn[i]));
    }
    // Layout rounds a fraction of a pixel differently at different places on the page.
    const box = element.getBoundingClientRect();
    const px = (n) => Math.round(n * 100) / 100;
    const text = [...element.childNodes]
      .filter((child) => child.nodeType === 3)
      .map((child) => child.textContent)
      .join('');
    return {
      tag: element.tagName,
      attributes,
      css,
      size: `${px(box.width)}x${px(box.height)}`,
      text,
      children: [...element.children].map(describe),
    };
  };
  const roots = [...document.querySelector(`[data-testid="${testid}"]`).children];
  if (portals) roots.push(...(document.getElementById('bloom-portal-root')?.children ?? []));
  return roots.map(describe);
}

/**
 * The differences between two described cells. `full` compares tags,
 * attributes and text too; a held state compares what it draws (style, size).
 */
function compareTrees(left, right, name, full = true) {
  const differences = [];
  const walk = (a, b, path) => {
    const at = `${name} ${path}`;
    if (full && a.tag !== b.tag) differences.push(`${at}: <${a.tag}> vs <${b.tag}>`);
    if (full && JSON.stringify(a.attributes) !== JSON.stringify(b.attributes))
      differences.push(
        `${at}: attributes ${JSON.stringify(a.attributes)} vs ${JSON.stringify(b.attributes)}`,
      );
    for (const property of new Set([...Object.keys(a.css), ...Object.keys(b.css)]))
      if (a.css[property] !== b.css[property])
        differences.push(`${at}: ${property} ${a.css[property]} vs ${b.css[property]}`);
    if (a.size !== b.size) differences.push(`${at}: size ${a.size} vs ${b.size}`);
    if (full && a.text !== b.text) differences.push(`${at}: text "${a.text}" vs "${b.text}"`);
    if (a.children.length !== b.children.length) {
      differences.push(`${at}: ${a.children.length} children vs ${b.children.length}`);
      return;
    }
    a.children.forEach((child, index) => walk(child, b.children[index], `${path}/${index}`));
  };
  if (left.length !== right.length)
    differences.push(`${name}: ${left.length} roots vs ${right.length}`);
  else left.forEach((child, at) => walk(child, right[at], `/${at}`));
  return differences;
}

/**
 * The table's cases: the index, the name, an isolated case's frame story
 * args, and whether drawing nothing is the case's claim. Only `bloom-<n>` cells are rows: an overlay a case presents
 * portals its own `bloom-…` test ids into the page.
 */
function rowsInPage() {
  return [...document.querySelectorAll('[data-testid^="bloom-"]')]
    .filter((cell) => /^bloom-\d+$/.test(cell.dataset.testid))
    .map((cell) => ({
      index: Number(cell.dataset.testid.slice('bloom-'.length)),
      name: cell.previousElementSibling?.textContent ?? '',
      frame: cell.dataset.parityFrame ?? null,
      empty: cell.dataset.parityEmpty !== undefined,
    }));
}

/**
 * The press hosts of a cell (an anchor, a pressable), by path, each with a
 * point (relative to its box) where the pointer is over it and no press host
 * inside it.
 */
function pressHostsInPage(testid) {
  const HOSTS = '.blsg, .blsp';
  const cell = document.querySelector(`[data-testid="${testid}"]`);
  const hosts = [];
  const walk = (element, path) => {
    if (element.matches(HOSTS)) {
      const box = element.getBoundingClientRect();
      let point = null;
      for (let y = 1; y < box.height && !point; y += 2)
        for (let x = 1; x < box.width && !point; x += 2) {
          const hit = document.elementFromPoint(box.x + x, box.y + y);
          if (hit && hit.closest(HOSTS) === element) point = { x, y };
        }
      if (point) hosts.push({ path, point });
    }
    [...element.children].forEach((child, at) => walk(child, `${path}/${at}`));
  };
  [...cell.children].forEach((child, at) => walk(child, `/${at}`));
  return hosts;
}

function elementAtPathInPage(testid, path) {
  let element = document.querySelector(`[data-testid="${testid}"]`);
  for (const index of path.split('/').slice(1)) element = element?.children[Number(index)];
  if (!element) return null;
  const box = element.getBoundingClientRect();
  return { x: box.x, y: box.y };
}

/**
 * What the two sides draw, read with their page in front (Chrome throttles a
 * page in the background, its frames and its input, which an isolated case's
 * own pages would otherwise make of the table's). Two cells of one page are
 * read in one call, so a motion that JS drives (a spinner) is read in the same
 * frame on both sides.
 */
async function describeSides(sides) {
  const [left, right] = sides;
  if (left.page === right.page) {
    await left.page.bringToFront();
    return left.page.evaluate(
      `[${[left, right].map(({ testid }) => `(${describeInPage})(${JSON.stringify(testid)}, false)`).join(', ')}]`,
    );
  }
  const out = [];
  for (const { page, testid } of sides) {
    await page.bringToFront();
    out.push(await page.evaluate(describeInPage, testid, true));
  }
  return out;
}

/**
 * Waits until what a page that draws one side alone stops changing: a sheet or
 * a dialog it presents plays its entrance first (by CSS or by JS), and the
 * table's comparison is of what rests. Gives up after 10s; a motion that never
 * ends (a spinner) then shows as a difference, not a pass.
 */
async function atRest(page) {
  let last = '';
  for (let tries = 0; tries < 40; tries++) {
    const now = JSON.stringify(await page.evaluate(describeInPage, 'parity-frame', true));
    if (now === last) return;
    last = now;
    await new Promise((done) => setTimeout(done, 250));
  }
}

/** Waits for what a page draws: its first cell, its fonts, then the transitions it starts. */
async function settle(page, testid) {
  await page.waitForSelector(`[data-testid="${testid}"]`, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Holds each press host of a case, hovered then pressed, on both sides; each
 * side is `{ page, testid }` (a table cell, or an isolated case's own page).
 */
async function compareHeldStates(sides, name) {
  const differences = [];
  // Each side alone in its page: what it portals is its own.
  const alone = sides[0].page !== sides[1].page;
  await sides[1].page.bringToFront();
  const hosts = await sides[1].page.evaluate(pressHostsInPage, sides[1].testid);
  for (const { path, point } of hosts) {
    for (const state of ['hovered', 'pressed']) {
      const drawn = [];
      for (const { page, testid } of sides) {
        await page.bringToFront();
        const origin = await page.evaluate(elementAtPathInPage, testid, path);
        if (!origin) {
          differences.push(`${name} ${state} ${path}: no ${testid} element`);
          continue;
        }
        await page.mouse.move(origin.x + point.x, origin.y + point.y);
        if (state === 'pressed') await page.mouse.down();
        // Bloom's Pressable draws its state on React's next render; a
        // transition it starts (an action's wash) is compared where it ends.
        await page.evaluate(async () => {
          await new Promise((done) => setTimeout(done, 50));
          const finite = document
            .getAnimations()
            .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
          await Promise.all(finite.map((animation) => animation.finished.catch(() => {})));
        });
        drawn.push(await page.evaluate(describeInPage, testid, alone));
        if (state === 'pressed') await page.mouse.up();
        await page.mouse.move(0, 0);
      }
      if (drawn.length === 2)
        differences.push(...compareTrees(drawn[0], drawn[1], `${name} ${state} ${path}`, false));
    }
  }
  return differences;
}

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
let failed = 0;
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => console.log(`     page error: ${error.message}`));
  await page.setViewport({ width: WIDTH, height: 900 });
  const index = await (await fetch(`${BASE}/index.json`)).json();
  const ids = STORIES.length
    ? STORIES
    : Object.keys(index.entries).filter((id) => id.startsWith('language-parity--'));
  // An isolated case's sides, each alone in a page of the same viewport.
  const framePages = [await browser.newPage(), await browser.newPage()];
  for (const framePage of framePages) {
    framePage.on('pageerror', (error) => console.log(`     page error: ${error.message}`));
    await framePage.setViewport({ width: WIDTH, height: 900 });
  }
  for (const id of ids) {
    for (const theme of ['light', 'dark']) {
      await page.bringToFront();
      await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
      await settle(page, 'language-0');
      const rows = await page.evaluate(rowsInPage);
      const differences = [];
      const held = [];
      // Every case at rest first, then each one's press hosts held.
      for (const { index, name, frame, empty } of rows) {
        const label = `[${name}]`;
        let sides = [
          { page, testid: `bloom-${index}` },
          { page, testid: `language-${index}` },
        ];
        if (frame) {
          sides = [];
          for (const [at, side] of ['bloom', 'language'].entries()) {
            const framePage = framePages[at];
            await framePage.bringToFront();
            await framePage.goto(
              `${BASE}/iframe.html?id=language-parity-frame--one-side&viewMode=story&args=${frame};side:${side}&globals=theme:${theme}`,
            );
            await settle(framePage, 'parity-frame');
            await atRest(framePage);
            sides.push({ page: framePage, testid: 'parity-frame' });
          }
        }
        const [left, right] = await describeSides(sides);
        // Two empty cells are equal and prove nothing, unless that is the case's claim.
        if ((left.length === 0) !== empty)
          differences.push(`${label}: ${empty ? 'draws something' : 'draws nothing'}`);
        differences.push(...compareTrees(left, right, label));
        // An isolated case's pages are its own until the next one loads them.
        if (frame) differences.push(...(await compareHeldStates(sides, label)));
        else held.push({ sides, label });
      }
      for (const { sides, label } of held)
        differences.push(...(await compareHeldStates(sides, label)));
      if (differences.length > 0) failed += 1;
      console.log(`${differences.length ? 'FAIL' : 'ok  '} ${id} ${theme}: ${rows.length} pairs`);
      for (const difference of differences.slice(0, 40)) console.log(`     ${difference}`);
      if (differences.length > 40) console.log(`     … ${differences.length - 40} more`);
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
