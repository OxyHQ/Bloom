#!/usr/bin/env node
/**
 * The web half of the no-NativeWind parity check (docs/no-nativewind.mdx):
 * in Chrome, every story of the named families draws the same in a baseline
 * Storybook (a checkout that still styles with NativeWind and Tailwind, as an
 * app ships it) and in this branch's Storybook (no NativeWind, no Tailwind).
 *
 * Each story is compared element by element, in light and dark: tag, attributes
 * other than `class`, `style`, `id` and `data-testid`, own text, every computed
 * style property (custom properties aside: what they set is compared) with its
 * `::before` and `::after`, and the laid-out size. Then each element the pointer
 * can act on (`cursor: pointer`) is hovered, then pressed, at the same point on
 * both sides, and the story compared again.
 *
 * Usage: start both Storybooks, then
 *   node scripts/no-nativewind/verify-web.mjs --base http://localhost:6106 \
 *     --next http://localhost:6206 [--width 1200] [--no-hover] <title-prefix>...
 * A title prefix is a story title's start, `Components/Dialog` for example.
 * Chrome is puppeteer's download (`~/.cache/puppeteer`) unless CHROME_PATH names one.
 */
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = (() => {
  for (const candidate of [
    'puppeteer-core',
    join(homedir(), 'Oxy/Bloom/node_modules/puppeteer-core'),
  ])
    try {
      return require(candidate);
    } catch {}
  throw new Error('puppeteer-core not found');
})();

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = join(homedir(), '.cache/puppeteer/chrome');
  return join(root, readdirSync(root).sort().at(-1), 'chrome-linux64/chrome');
}

const arg = (name, fallback) => {
  const at = process.argv.indexOf(name);
  return at === -1 ? fallback : process.argv[at + 1];
};
const BASE = arg('--base', 'http://localhost:6106');
const NEXT = arg('--next', 'http://localhost:6206');
const WIDTH = Number(arg('--width', '1200'));
const HOVER = !process.argv.includes('--no-hover');
const VALUED = new Set(['--base', '--next', '--width']);
const PREFIXES = process.argv
  .slice(2)
  .filter((a, i, all) => !a.startsWith('--') && !VALUED.has(all[i - 1]));

/** Every element under the story root: what it draws, by its path. */
function describeInPage() {
  const SKIP = new Set(['class', 'style', 'data-testid', 'id']);
  const REACT_ID = /_r_[0-9a-z]+_|(?<=[-_:«#])r[0-9a-z]+(?=[-_:»)]|$)/g;
  const map = new Map();
  const ids = (text) =>
    text.replace(REACT_ID, (id) => {
      if (!map.has(id)) map.set(id, `id${map.size}`);
      return map.get(id);
    });
  const out = [];
  const walk = (element, path) => {
    const attributes = {};
    for (const { name, value } of [...element.attributes].sort((a, b) =>
      a.name < b.name ? -1 : 1,
    ))
      if (!SKIP.has(name) && !name.startsWith('data-bloom-hook')) attributes[name] = ids(value);
    const style = getComputedStyle(element);
    const animated = element.getAnimations().length > 0;
    const MOVING = new Set(['opacity', 'transform', 'animation-delay']);
    const css = {};
    for (let i = 0; i < style.length; i++)
      if (!style[i].startsWith('--') && !(animated && MOVING.has(style[i])))
        css[style[i]] = ids(style.getPropertyValue(style[i]));
    for (const pseudo of ['::before', '::after']) {
      const drawn = getComputedStyle(element, pseudo);
      if (drawn.content === 'none' || drawn.content === 'normal') continue;
      for (let i = 0; i < drawn.length; i++)
        if (!drawn[i].startsWith('--'))
          css[`${pseudo} ${drawn[i]}`] = ids(drawn.getPropertyValue(drawn[i]));
    }
    const box = element.getBoundingClientRect();
    const px = (n) => Math.round(n * 100) / 100;
    const text = [...element.childNodes]
      .filter((child) => child.nodeType === 3)
      .map((child) => child.textContent)
      .join('');
    out.push({
      path,
      tag: element.tagName,
      attributes,
      css,
      text,
      size: `${px(box.width)}x${px(box.height)}`,
      at: { x: box.x + Math.min(4, box.width / 2), y: box.y + Math.min(4, box.height / 2) },
      pointer: style.cursor === 'pointer' && box.width > 0 && box.height > 0,
    });
    [...element.children].forEach((child, index) => walk(child, `${path}/${index}`));
  };
  const root = document.querySelector('#storybook-root');
  [...root.children].forEach((child, index) => walk(child, `/${index}`));
  // Portals (menus, dialogs) render beside the root.
  [...document.body.children]
    .filter(
      (child) =>
        child !== root &&
        child.id !== 'storybook-docs' &&
        child.id !== 'storybook-highlights-root' &&
        child.tagName === 'DIV' &&
        ![...child.classList].some((name) => name.startsWith('sb-')),
    )
    .forEach((child, index) => walk(child, `/portal${index}`));
  return out;
}

function compare(left, right, label, differences) {
  const byPath = new Map(right.map((entry) => [entry.path, entry]));
  if (left.length !== right.length)
    differences.push(`${label}: ${left.length} elements vs ${right.length}`);
  for (const a of left) {
    const b = byPath.get(a.path);
    if (!b) {
      differences.push(`${label} ${a.path}: <${a.tag}> missing`);
      continue;
    }
    const at = `${label} ${a.path} <${a.tag.toLowerCase()}>`;
    if (a.tag !== b.tag) differences.push(`${at}: <${a.tag}> vs <${b.tag}>`);
    if (JSON.stringify(a.attributes) !== JSON.stringify(b.attributes))
      differences.push(
        `${at}: attributes ${JSON.stringify(a.attributes)} vs ${JSON.stringify(b.attributes)}`,
      );
    for (const property of new Set([...Object.keys(a.css), ...Object.keys(b.css)]))
      if (a.css[property] !== b.css[property])
        differences.push(`${at}: ${property} ${a.css[property]} vs ${b.css[property]}`);
    if (a.size !== b.size) differences.push(`${at}: size ${a.size} vs ${b.size}`);
    if (a.text !== b.text) differences.push(`${at}: text "${a.text}" vs "${b.text}"`);
  }
}

async function open(page, base, id, theme) {
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, {
    waitUntil: 'networkidle0',
    timeout: 120000,
  });
  // A story draws into the root, or only into a portal beside it (a dialog).
  await page.waitForFunction(
    () =>
      document.querySelector('#storybook-root')?.children.length ||
      [...document.body.children].some(
        (child) =>
          child.id !== 'storybook-root' &&
          child.id !== 'storybook-docs' &&
          child.id !== 'storybook-highlights-root' &&
          child.tagName === 'DIV' &&
          ![...child.classList].some((name) => name.startsWith('sb-')) &&
          child.children.length,
      ),
    { timeout: 240000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await new Promise((resolve) => setTimeout(resolve, 400));
}

const index = await (await fetch(`${NEXT}/index.json`)).json();
const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && PREFIXES.some((prefix) => entry.title.startsWith(prefix)),
);
if (stories.length === 0) {
  console.error(`no stories under ${PREFIXES.join(', ')}`);
  process.exit(2);
}
const browser = await puppeteer.launch({
  executablePath: findChrome(),
  args: ['--no-sandbox', `--window-size=${WIDTH},900`, '--force-color-profile=srgb'],
  defaultViewport: { width: WIDTH, height: 900 },
});
const [left, right] = [await browser.newPage(), await browser.newPage()];
let failed = 0;
for (const story of stories) {
  for (const theme of ['light', 'dark']) {
    const label = `${story.title} › ${story.name} [${theme}]`;
    const differences = [];
    try {
      await Promise.all([open(left, BASE, story.id, theme), open(right, NEXT, story.id, theme)]);
      const [a, b] = await Promise.all([
        left.evaluate(describeInPage),
        right.evaluate(describeInPage),
      ]);
      compare(a, b, label, differences);
      if (HOVER && differences.length === 0) {
        for (const target of a.filter((entry) => entry.pointer).slice(0, 12)) {
          for (const action of ['hover', 'press']) {
            await Promise.all(
              [left, right].map(async (page) => {
                await page.mouse.move(target.at.x, target.at.y);
                if (action === 'press') await page.mouse.down();
                await new Promise((resolve) => setTimeout(resolve, 250));
              }),
            );
            const [ha, hb] = await Promise.all([
              left.evaluate(describeInPage),
              right.evaluate(describeInPage),
            ]);
            compare(ha, hb, `${label} ${action} ${target.path}`, differences);
            if (action === 'press') await Promise.all([left.mouse.up(), right.mouse.up()]);
            await Promise.all([left.mouse.move(0, 0), right.mouse.move(0, 0)]);
          }
          if (differences.length) break;
        }
      }
    } catch (error) {
      differences.push(`${label}: ${error.message} ${error.cause?.message ?? ""}`);
    }
    if (differences.length) {
      failed++;
      console.log(`✗ ${label}\n  ${differences.slice(0, 30).join('\n  ')}`);
    } else console.log(`✓ ${label}`);
  }
}
await browser.close();
console.log(`${stories.length * 2 - failed}/${stories.length * 2} identical`);
process.exit(failed ? 1 : 0);
