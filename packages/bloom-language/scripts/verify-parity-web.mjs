#!/usr/bin/env node
/**
 * Browser gate for the component parity suite: in Chrome, each language node
 * of a `Language/Parity` story draws what the Bloom element beside it draws.
 *
 * The Jest suite (`parity/`) compares declarations in jsdom, which neither lays
 * out nor resolves the cascade the way a browser does. Here every pair of
 * elements (Bloom's and the language's, walked in step) is compared on its
 * tag, its attributes other than `class`, `style` and `data-testid`, its text,
 * every computed style property, and its laid-out size, in light and dark.
 *
 * Usage: start Storybook (`bun run storybook`), then
 *   node packages/bloom-language/scripts/verify-parity-web.mjs [--url http://localhost:6006]
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
const STORIES = process.argv.filter((arg) => arg.startsWith('language-parity--'));

/** Every pair of a story, compared in the page; returns the differences. */
function compareInPage() {
  const SKIP = new Set(['class', 'style', 'data-testid', 'id']);
  const differences = [];
  const describe = (element) => {
    const attributes = {};
    for (const { name, value } of [...element.attributes].sort((a, b) =>
      a.name < b.name ? -1 : 1,
    ))
      if (!SKIP.has(name)) attributes[name] = value;
    const style = getComputedStyle(element);
    const css = {};
    for (let i = 0; i < style.length; i++) css[style[i]] = style.getPropertyValue(style[i]);
    const box = element.getBoundingClientRect();
    return { tag: element.tagName, attributes, css, size: `${box.width}x${box.height}` };
  };
  const walk = (a, b, path, name) => {
    const left = describe(a);
    const right = describe(b);
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
    // The two cells are the table's; what each case draws is inside them.
    const left = [...bloom.children];
    const right = [...language.children];
    if (left.length !== right.length)
      differences.push(`[${name}]: ${left.length} roots vs ${right.length}`);
    else left.forEach((child, at) => walk(child, right[at], `/${at}`, `[${name}]`));
  }
  return { pairs: rows.length, differences };
}

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
let failed = 0;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  const index = await (await fetch(`${BASE}/index.json`)).json();
  const ids = STORIES.length
    ? STORIES
    : Object.keys(index.entries).filter((id) => id.startsWith('language-parity--'));
  for (const id of ids) {
    for (const theme of ['light', 'dark']) {
      await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
      await page.waitForSelector('[data-testid="language-0"]', { timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      const { pairs, differences } = await page.evaluate(compareInPage);
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
