#!/usr/bin/env node
/**
 * A colour at an opacity in Chrome: what jsdom cannot compute.
 *
 *   node scripts/verify-colors-chrome.mjs <corpus dir>
 *
 * The language writes `bg-primary/60` as `var(--bl-primary-60)` inline (the
 * `var()` react-native-web passes through), the custom property declared in
 * its ink sheet as `color-mix(in srgb, var(--primary) 60%, transparent)`;
 * Tailwind writes its own `color-mix()` over its theme variable, in oklab. jsdom
 * drops a mix's percentage, so the web parity suite cannot compare them
 * exactly. Here Chrome computes both and paints each over white and over
 * black: the two are equal when they paint the same pixels (a mix with
 * transparent is the colour at that alpha in either space, written as
 * `oklab()` or `color(srgb …)`), for every such class the corpus converted, under the
 * theme's variables in each scheme (`theme-variables.json`), with the ink
 * sheet the language declared in that suite (`language-ink.css`) and the
 * app's own stylesheet (`app.generated.css`). Writes `parity-chrome-colors.json`.
 *
 * Chrome is puppeteer's download (`~/.cache/puppeteer`) unless CHROME_PATH
 * names one; puppeteer-core is the shared Bloom checkout's, as
 * `packages/bloom-language/scripts/verify-parity-web.mjs` takes it.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const corpus = process.argv[2];
if (!corpus) throw new Error('usage: verify-colors-chrome.mjs <corpus dir>');

const require = createRequire(import.meta.url);
const puppeteer = (() => {
  for (const at of ['puppeteer-core', join(homedir(), 'Oxy/Bloom/node_modules/puppeteer-core')]) {
    try {
      return require(at);
    } catch {}
  }
  throw new Error('puppeteer-core not found');
})();
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = join(homedir(), '.cache/puppeteer/chrome');
  for (const version of existsSync(root) ? readdirSync(root).sort().reverse() : []) {
    const path = join(root, version, 'chrome-linux64/chrome');
    if (existsSync(path)) return path;
  }
  throw new Error('no Chrome: set CHROME_PATH');
}

const spec = JSON.parse(
  readFileSync(join(here, '../../bloom-language/spec/language.json'), 'utf8'),
);
const table = JSON.parse(
  readFileSync(join(here, '../../bloom-language/codemod/classnames.generated.json'), 'utf8'),
).utilities;
const fixtures = JSON.parse(readFileSync(join(corpus, 'fixtures.generated.json'), 'utf8'));
const appCss = readFileSync(join(corpus, 'app.generated.css'), 'utf8');
const variables = JSON.parse(readFileSync(join(corpus, 'theme-variables.json'), 'utf8'));
const ink = readFileSync(join(corpus, 'language-ink.css'), 'utf8');

const PROPERTY = { background: 'background-color', foreground: 'color', border: 'border-color' };
const cases = [];
for (const name of new Set(fixtures.flatMap((f) => f.classes))) {
  if (name.includes(':')) continue;
  const m = /^\.(background|foreground|border)\('(\w+)\/(\d+)'\)$/.exec(
    table[name]?.language ?? '',
  );
  if (!m) continue;
  const [, modifier, role, amount] = m;
  if (!spec.colors[role]) continue;
  // The language's web value of a role at an opacity (style.ts webInk).
  cases.push({ name, property: PROPERTY[modifier], language: `var(--bl-${role}-${amount})` });
}

const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true });
const results = {};
try {
  const page = await browser.newPage();
  for (const scheme of ['light', 'dark']) {
    const root = Object.entries(variables[scheme])
      .map(([k, v]) => `${k}: ${v};`)
      .join(' ');
    const html = `<!doctype html><html class="${scheme === 'dark' ? 'dark' : ''}"><head>
<style>${appCss}</style><style>${ink}</style><style>:root { ${root} } .probe { border-style: solid; border-width: 1px; }</style>
</head><body>${cases
      .map(
        (c, i) =>
          `<div id="a${i}" class="probe ${c.name}"></div><div id="b${i}" class="probe" style="${c.property}: ${c.language}"></div>`,
      )
      .join('')}</body></html>`;
    await page.setContent(html);
    const computed = await page.evaluate(
      (list) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        // The pixels a colour paints over white and over black.
        const pixels = (color) =>
          ['#ffffff', '#000000']
            .map((ground) => {
              context.fillStyle = ground;
              context.fillRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              return [...context.getImageData(0, 0, 1, 1).data].join(',');
            })
            .join(' ');
        return list.map((c, i) => {
          const pair = [`a${i}`, `b${i}`].map(
            (id) => getComputedStyle(document.getElementById(id))[c.camel],
          );
          return [...pair, pixels(pair[0]) === pixels(pair[1])];
        });
      },
      cases.map((c) => ({ camel: c.property.replace(/-(\w)/g, (_, l) => l.toUpperCase()) })),
    );
    cases.forEach((c, i) => {
      const [tailwind, language, equal] = computed[i];
      results[`${scheme} ${c.name}`] = { tailwind, language, equal };
    });
  }
} finally {
  await browser.close();
}
writeFileSync(join(corpus, 'parity-chrome-colors.json'), `${JSON.stringify(results, null, 1)}\n`);
const failed = Object.entries(results).filter(([, r]) => !r.equal);
console.log(
  `${Object.keys(results).length - failed.length} of ${Object.keys(results).length} equal in Chrome`,
);
for (const [name, r] of failed) console.log(`  ${name}: ${r.tailwind} vs ${r.language}`);
process.exit(failed.length ? 1 : 0);
