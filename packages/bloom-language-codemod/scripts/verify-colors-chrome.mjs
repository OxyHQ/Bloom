#!/usr/bin/env node
/**
 * A colour at an opacity in Chrome: what jsdom cannot compute.
 *
 *   node scripts/verify-colors-chrome.mjs <corpus dir>
 *
 * The language writes `bg-primary/60` as `color-mix(in oklab, var(--primary)
 * 60%, transparent)` inline; Tailwind writes its own `color-mix()` over its
 * theme variable. jsdom's style probe drops a mix of a variable, so the web
 * parity suite cannot compare them. Here Chrome computes both, for every
 * such class the corpus converted, under the theme's variables in each
 * scheme (`theme-variables.json`, written by the web parity suite), with the
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

const PROPERTY = { background: 'background-color', foreground: 'color', border: 'border-color' };
const cases = [];
for (const name of new Set(fixtures.flatMap((f) => f.classes))) {
  if (name.includes(':')) continue;
  const m = /^\.(background|foreground|border)\('(\w+)\/(\d+)'\)$/.exec(
    table[name]?.language ?? '',
  );
  if (!m) continue;
  const [, modifier, role, amount] = m;
  const css = spec.colors[role]?.[1];
  if (!css) continue;
  // The language's web value of a role (generate.mjs webColor): a fixed colour as it is, else its variable.
  const web = css.startsWith('#') || css === 'transparent' ? css : `var(--${css})`;
  cases.push({
    name,
    property: PROPERTY[modifier],
    language: `color-mix(in oklab, ${web} ${Number(amount)}%, transparent)`,
  });
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
<style>${appCss}</style><style>:root { ${root} } .probe { border-style: solid; border-width: 1px; }</style>
</head><body>${cases
      .map(
        (c, i) =>
          `<div id="a${i}" class="probe ${c.name}"></div><div id="b${i}" class="probe" style="${c.property}: ${c.language}"></div>`,
      )
      .join('')}</body></html>`;
    await page.setContent(html);
    const computed = await page.evaluate(
      (list) =>
        list.map((c, i) => [
          getComputedStyle(document.getElementById(`a${i}`))[c.camel],
          getComputedStyle(document.getElementById(`b${i}`))[c.camel],
        ]),
      cases.map((c) => ({ camel: c.property.replace(/-(\w)/g, (_, l) => l.toUpperCase()) })),
    );
    cases.forEach((c, i) => {
      const [tailwind, language] = computed[i];
      results[`${scheme} ${c.name}`] = { tailwind, language, equal: tailwind === language };
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
