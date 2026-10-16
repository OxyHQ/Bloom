// @ts-check
/**
 * Add Remix Icon glyphs to `src/icons/remix/` and regenerate its barrel.
 *
 *   node scripts/add-remix-icons.mjs <remixicon-package-dir> <name>...
 *
 * <remixicon-package-dir> is an unpacked `remixicon` npm package (the directory
 * holding its `package.json` and `icons/<Category>/<name>.svg`); <name> is the
 * kebab name remixicon.com shows (`check-line`, `sort-alphabet-asc`, `text`).
 *
 * Each name becomes `src/icons/remix/Ri<PascalName>.tsx`, the name Remix's own
 * React package gives it: every `-` segment capitalised, digits kept
 * (`dice-5-line` → `RiDice5Line`, `link-m` → `RiLinkM`). One `<path>` becomes a
 * `createSinglePathSVG` call, several a `createMultiPathSVG` call; the `d`
 * strings are copied verbatim. A glyph that already exists is left untouched.
 *
 * The SVG is read as DATA, never trusted: it must be a 24×24 `<svg>` holding
 * only `<path d>` elements whose `d` is path syntax and nothing else. Anything
 * else (another shape, a transform, a fill rule, an unknown name) is REPORTED
 * and nothing is written, rather than drawn wrong.
 *
 * `src/icons/remix/index.ts` is then rewritten from the directory listing,
 * sorted by code unit, so it is never hand-edited. With no names the script
 * only regenerates the barrel.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'src', 'icons', 'remix');

const [pkgDir, ...names] = process.argv.slice(2);
if (!pkgDir) {
  console.error('usage: add-remix-icons.mjs <remixicon-package-dir> <name>...');
  process.exit(2);
}

const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
if (pkg.name !== 'remixicon') {
  console.error(`${pkgDir} is not the remixicon package (name: ${pkg.name})`);
  process.exit(2);
}

/** `<Category>/<name>.svg` for every glyph in the package, by name. */
const iconsDir = join(pkgDir, 'icons');
/** @type {Map<string, string>} */
const categoryOf = new Map();
for (const category of readdirSync(iconsDir, { withFileTypes: true })) {
  if (!category.isDirectory()) continue;
  for (const file of readdirSync(join(iconsDir, category.name))) {
    if (file.endsWith('.svg')) categoryOf.set(file.slice(0, -4), category.name);
  }
}

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PATH_DATA = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\-+eE\s]+$/;

/** `dice-5-line` → `RiDice5Line`. */
function componentName(name) {
  return `Ri${name
    .split('-')
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('')}`;
}

/**
 * The `d` of every `<path>` in a Remix SVG, or the reason it cannot be drawn by
 * the TEMPLATE helpers (which fill every path on a 24×24 viewBox).
 * @returns {{ paths: string[] } | { error: string }}
 */
function readPaths(svg) {
  const root = svg.match(/^\s*<svg\s([^>]*)>([\s\S]*)<\/svg>\s*$/);
  if (!root) return { error: 'not a single <svg> element' };
  const viewBox = root[1].match(/\bviewBox="([^"]*)"/);
  if (viewBox?.[1] !== '0 0 24 24') return { error: 'viewBox is not 0 0 24 24' };
  const body = root[2];
  const paths = [];
  const rest = body.replace(/<path\s([^>]*?)\s*\/?>(?:<\/path>)?/g, (_, attrs) => {
    const extra = attrs.replace(/\bd="[^"]*"/, '').trim();
    if (extra) paths.push({ error: `path has attributes beyond d: ${extra.slice(0, 60)}` });
    const d = attrs.match(/\bd="([^"]*)"/);
    if (!d) paths.push({ error: 'path without d' });
    else if (!PATH_DATA.test(d[1])) paths.push({ error: 'path d is not path data' });
    else paths.push(d[1].trim());
    return '';
  });
  if (rest.trim()) return { error: `holds more than <path> elements: ${rest.trim().slice(0, 60)}` };
  const bad = paths.find((p) => typeof p !== 'string');
  if (bad) return bad;
  if (paths.length === 0) return { error: 'no <path>' };
  return { paths };
}

function moduleSource(name, category, paths) {
  const doc = `/** Remix Icon \`${name}\` (${category}). */`;
  const id = componentName(name);
  if (paths.length === 1) {
    return [
      "import { createSinglePathSVG } from '../TEMPLATE';",
      '',
      doc,
      `export const ${id} = createSinglePathSVG({`,
      `  path: '${paths[0]}',`,
      '});',
      '',
    ].join('\n');
  }
  return [
    "import { createMultiPathSVG } from '../TEMPLATE';",
    '',
    doc,
    `export const ${id} = createMultiPathSVG({`,
    '  paths: [',
    ...paths.map((p) => `    '${p}',`),
    '  ],',
    '});',
    '',
  ].join('\n');
}

/** @type {string[]} */
const problems = [];
/** @type {[string, string][]} */
const toWrite = [];
for (const name of names) {
  if (!NAME.test(name)) {
    problems.push(`${name}: not a Remix kebab name`);
    continue;
  }
  const category = categoryOf.get(name);
  if (!category) {
    problems.push(`${name}: no such icon in remixicon ${pkg.version}`);
    continue;
  }
  const file = join(OUT, `${componentName(name)}.tsx`);
  if (existsSync(file)) {
    console.log(`= ${componentName(name)} (already present)`);
    continue;
  }
  const parsed = readPaths(readFileSync(join(iconsDir, category, `${name}.svg`), 'utf8'));
  if ('error' in parsed) {
    problems.push(`${name}: ${parsed.error}`);
    continue;
  }
  toWrite.push([file, moduleSource(name, category, parsed.paths)]);
}

if (problems.length > 0) {
  console.error(`Nothing written. ${problems.length} icon(s) could not be added:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

for (const [file, source] of toWrite) {
  writeFileSync(file, source);
  console.log(`+ ${file.slice(OUT.length + 1, -4)}`);
}

const components = readdirSync(OUT)
  .filter((f) => /^Ri[A-Za-z0-9]+\.tsx$/.test(f))
  .map((f) => f.slice(0, -4))
  .sort();
writeFileSync(
  join(OUT, 'index.ts'),
  [
    '// GENERATED by add-remix-icons — Remix Icon (Remix Icon License 1.0), one file per icon.',
    ...components.map((c) => `export { ${c} } from './${c}';`),
    '',
  ].join('\n'),
);
console.log(
  `index.ts: ${components.length} glyphs (${toWrite.length} added, remixicon ${pkg.version})`,
);
