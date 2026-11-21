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

/** Every pair of a story, compared in the page; returns the differences. */
function compareInPage() {
  const SKIP = new Set(['class', 'style', 'data-testid', 'id']);
  const differences = [];
  // React's useId counts across the page; an id is compared by its order in its case.
  const REACT_ID = /_r_[0-9a-z]+_|(?<=[-_:«#])r[0-9a-z]+(?=[-_:»)]|$)/g;
  let maps = [new Map(), new Map()];
  const ids = (side, text) =>
    text.replace(REACT_ID, (id) => {
      const map = maps[side];
      if (!map.has(id)) map.set(id, `id${map.size}`);
      return map.get(id);
    });
  const describe = (element, side) => {
    const attributes = {};
    for (const { name, value } of [...element.attributes].sort((a, b) =>
      a.name < b.name ? -1 : 1,
    ))
      if (!SKIP.has(name)) attributes[name] = ids(side, value);
    const style = getComputedStyle(element);
    // A running animation (a skeleton's shimmer) is sampled when it is read and
    // synced to when it mounted: what it animates is compared by its animation.
    const animated = element.getAnimations().length > 0;
    const MOVING = new Set(['opacity', 'transform', 'animation-delay']);
    const css = {};
    // Custom properties are inputs, named per instance (React ids); what they set is compared.
    for (let i = 0; i < style.length; i++)
      if (!style[i].startsWith('--') && !(animated && MOVING.has(style[i])))
        css[style[i]] = ids(side, style.getPropertyValue(style[i]));
    // What a pseudo-element draws (Surface's material is its ::before and ::after).
    for (const pseudo of ['::before', '::after']) {
      const drawn = getComputedStyle(element, pseudo);
      if (drawn.content === 'none' || drawn.content === 'normal') continue;
      for (let i = 0; i < drawn.length; i++)
        if (!drawn[i].startsWith('--'))
          css[`${pseudo} ${drawn[i]}`] = ids(side, drawn.getPropertyValue(drawn[i]));
    }
    // Layout rounds a fraction of a pixel differently at different places on the page.
    const box = element.getBoundingClientRect();
    const px = (n) => Math.round(n * 100) / 100;
    return { tag: element.tagName, attributes, css, size: `${px(box.width)}x${px(box.height)}` };
  };
  const walk = (a, b, path, name) => {
    const left = describe(a, 0);
    const right = describe(b, 1);
    const at = `${name} ${path}`;
    if (left.tag !== right.tag) differences.push(`${at}: <${left.tag}> vs <${right.tag}>`);
    if (JSON.stringify(left.attributes) !== JSON.stringify(right.attributes))
      differences.push(
        `${at}: attributes ${JSON.stringify(left.attributes)} vs ${JSON.stringify(right.attributes)}`,
      );
    for (const property of new Set([...Object.keys(left.css), ...Object.keys(right.css)])) {
      if (left.css[property] !== right.css[property])
        differences.push(`${at}: ${property} ${left.css[property]} vs ${right.css[property]}`);
    }
    if (left.size !== right.size) differences.push(`${at}: size ${left.size} vs ${right.size}`);
    const text = (node) =>
      [...node.childNodes]
        .filter((child) => child.nodeType === 3)
        .map((child) => child.textContent)
        .join('');
    if (text(a) !== text(b)) differences.push(`${at}: text "${text(a)}" vs "${text(b)}"`);
    const ka = [...a.children];
    const kb = [...b.children];
    if (ka.length !== kb.length) {
      differences.push(`${at}: ${ka.length} children vs ${kb.length}`);
      return;
    }
    ka.forEach((child, index) => walk(child, kb[index], `${path}/${index}`, name));
  };
  const rows = document.querySelectorAll('[data-testid^="bloom-"]');
  for (const bloom of rows) {
    const index = bloom.dataset.testid.slice('bloom-'.length);
    const language = document.querySelector(`[data-testid="language-${index}"]`);
    const name = bloom.previousElementSibling?.textContent ?? index;
    maps = [new Map(), new Map()];
    // The two cells are the table's; what each case draws is inside them.
    const left = [...bloom.children];
    const right = [...language.children];
    if (left.length !== right.length)
      differences.push(`[${name}]: ${left.length} roots vs ${right.length}`);
    else left.forEach((child, at) => walk(child, right[at], `/${at}`, `[${name}]`));
  }
  return { pairs: rows.length, differences };
}

/** What a cell draws, element by element: every computed style and the laid-out size. */
function describeCellInPage(testid) {
  const cell = document.querySelector(`[data-testid="${testid}"]`);
  const out = [];
  const walk = (element, path) => {
    const style = getComputedStyle(element);
    const css = {};
    for (let i = 0; i < style.length; i++)
      if (!style[i].startsWith('--')) css[style[i]] = style.getPropertyValue(style[i]);
    for (const pseudo of ['::before', '::after']) {
      const drawn = getComputedStyle(element, pseudo);
      if (drawn.content === 'none' || drawn.content === 'normal') continue;
      for (let i = 0; i < drawn.length; i++)
        if (!drawn[i].startsWith('--'))
          css[`${pseudo} ${drawn[i]}`] = drawn.getPropertyValue(drawn[i]);
    }
    const box = element.getBoundingClientRect();
    const px = (n) => Math.round(n * 100) / 100;
    out.push({ path, tag: element.tagName, css, size: `${px(box.width)}x${px(box.height)}` });
    [...element.children].forEach((child, index) => walk(child, `${path}/${index}`));
  };
  [...cell.children].forEach((child, index) => walk(child, `/${index}`));
  return out;
}

/**
 * The press hosts of a language cell (an anchor, a pressable), by path, each
 * with a point (relative to its box) where the pointer is over it and no press
 * host inside it.
 */
function pressHostsInPage(index) {
  const HOSTS = '.blsg, .blsp';
  const cell = document.querySelector(`[data-testid="language-${index}"]`);
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

/** Holds each press host of each case, hovered then pressed, in both cells; returns the differences. */
async function compareHeldStates(page) {
  const differences = [];
  const count = await page.evaluate(
    () => document.querySelectorAll('[data-testid^="bloom-"]').length,
  );
  for (let index = 0; index < count; index++) {
    const hosts = await page.evaluate(pressHostsInPage, index);
    for (const { path, point } of hosts) {
      for (const state of ['hovered', 'pressed']) {
        const drawn = [];
        for (const side of ['bloom', 'language']) {
          const origin = await page.evaluate(elementAtPathInPage, `${side}-${index}`, path);
          if (!origin) {
            differences.push(`[case ${index}] ${state} ${path}: no ${side} element`);
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
          drawn.push(await page.evaluate(describeCellInPage, `${side}-${index}`));
          if (state === 'pressed') await page.mouse.up();
          await page.mouse.move(0, 0);
        }
        if (drawn.length !== 2) continue;
        const [left, right] = drawn;
        if (left.length !== right.length) {
          differences.push(
            `[case ${index}] ${state} ${path}: ${left.length} vs ${right.length} elements`,
          );
          continue;
        }
        left.forEach((a, at) => {
          const b = right[at];
          for (const property of new Set([...Object.keys(a.css), ...Object.keys(b.css)]))
            if (a.css[property] !== b.css[property])
              differences.push(
                `[case ${index}] ${state} ${path} at ${a.path}: ${property} ${a.css[property]} vs ${b.css[property]}`,
              );
          if (a.size !== b.size)
            differences.push(
              `[case ${index}] ${state} ${path} at ${a.path}: size ${a.size} vs ${b.size}`,
            );
        });
      }
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
  for (const id of ids) {
    for (const theme of ['light', 'dark']) {
      await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
      await page.waitForSelector('[data-testid="language-0"]', { timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const { pairs, differences } = await page.evaluate(compareInPage);
      differences.push(...(await compareHeldStates(page)));
      if (differences.length > 0) failed += 1;
      console.log(`${differences.length ? 'FAIL' : 'ok  '} ${id} ${theme}: ${pairs} pairs`);
      for (const difference of differences.slice(0, 40)) console.log(`     ${difference}`);
      if (differences.length > 40) console.log(`     … ${differences.length - 40} more`);
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
