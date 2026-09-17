// @ts-check
/**
 * Generate the vendored country data behind `@oxyhq/bloom/phone-input`:
 *
 *   src/phone-input/countries.ts   `{ iso2, name, dial }[]`, sorted by name
 *   src/phone-input/flags.ts       every listed country's 3x2 flag as shape data
 *   src/phone-input/LICENSES.md    the two upstream MIT licences
 *
 * Sources (both MIT, pinned below): `country-flag-icons` (the 3x2 SVGs) and
 * `countries-list` (names and dial codes). Neither is a dependency of Bloom:
 * this script packs them into a temp directory, reads them, and writes plain
 * TypeScript, so no app installs them and the root barrel links nothing new.
 *
 * The country filter: a real ISO country
 * that ships a flag AND a dial code, `dial` = its first phone code, sorted by
 * `name.localeCompare`.
 *
 * Flags are stored as shape tuples rendered by one `CountryFlag` component with
 * react-native-svg (native + web), not as SVG strings: no XML parse at render
 * time, and `<g>` presentation attributes are pushed down onto the shapes so
 * the renderer needs no groups.
 *
 * Usage:
 *   node scripts/generate-country-flags.mjs
 *   node scripts/generate-country-flags.mjs <country-flag-icons dir> <countries-list dir>
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'src', 'phone-input');

const FLAGS_PKG = 'country-flag-icons@1.6.20';
const COUNTRIES_PKG = 'countries-list@3.4.1';

/** The viewBox 198 of the flags share; only the others store their own. */
const DEFAULT_VIEWBOX = '0 0 513 342';

function packed(spec) {
  const dir = mkdtempSync(join(tmpdir(), 'bloom-flags-'));
  const file = execFileSync('npm', ['pack', spec, '--silent'], { cwd: dir, encoding: 'utf8' })
    .trim()
    .split('\n')
    .pop();
  execFileSync('tar', ['xzf', String(file)], { cwd: dir });
  return join(dir, 'package');
}

const [flagsArg, countriesArg] = process.argv.slice(2);
const flagsDir = flagsArg ?? packed(FLAGS_PKG);
const countriesDir = countriesArg ?? packed(COUNTRIES_PKG);

const flagsVersion = JSON.parse(readFileSync(join(flagsDir, 'package.json'), 'utf8')).version;
const countriesVersion = JSON.parse(readFileSync(join(countriesDir, 'package.json'), 'utf8')).version;

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

const require = createRequire(import.meta.url);
/** @type {{ getCountryDataList: () => { iso2: string, name: string, phone: number[] }[] }} */
const countriesList = require(join(countriesDir, 'cjs', 'index.js'));

const flagFiles = new Set(
  readdirSync(join(flagsDir, '3x2'))
    .filter((name) => /^[A-Z]{2}\.svg$/.test(name))
    .map((name) => name.slice(0, 2)),
);

const countries = countriesList
  .getCountryDataList()
  .filter((c) => flagFiles.has(c.iso2) && c.phone.length > 0)
  .map((c) => ({ iso2: c.iso2, name: c.name, dial: String(c.phone[0]) }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

/** SVG presentation attributes a `<g>` hands down, and their react-native-svg names. */
const INHERITED = {
  fill: 'fill',
  stroke: 'stroke',
  'stroke-width': 'strokeWidth',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-linejoin': 'strokeLinejoin',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  // Only IR sets this, on a group of NON-overlapping rects, so pushing it down
  // onto each rect paints the same pixels as a group opacity.
  opacity: 'opacity',
};
const NUMERIC = new Set(['strokeWidth', 'strokeMiterlimit', 'opacity']);
/** Attributes that carry nothing a renderer needs. */
const IGNORED = new Set(['xmlns', 'class']);

function attributes(source) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const match of source.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) out[match[1]] = match[2];
  return out;
}

/**
 * One shape: `[kind, fill, geometry, paint?]`.
 *   kind 0 path     geometry = `d`
 *   kind 1 circle   geometry = [cx, cy, r]
 *   kind 2 ellipse  geometry = [cx, cy, rx, ry]
 */
function convert(iso2) {
  const svg = readFileSync(join(flagsDir, '3x2', `${iso2}.svg`), 'utf8');
  let viewBox = DEFAULT_VIEWBOX;
  /** @type {Record<string, string>[]} */
  const stack = [{}];
  /** @type {unknown[]} */
  const shapes = [];
  for (const match of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
    const [, closing, tag, rawAttrs, selfClosing] = match;
    if (closing) {
      if (tag === 'g') stack.pop();
      continue;
    }
    const attrs = attributes(rawAttrs);
    const inherited = { ...stack[stack.length - 1] };
    for (const [name, value] of Object.entries(attrs)) {
      if (name in INHERITED) inherited[INHERITED[name]] = value;
    }
    for (const name of Object.keys(attrs)) {
      if (
        !(name in INHERITED) &&
        !IGNORED.has(name) &&
        !['viewBox', 'd', 'cx', 'cy', 'r', 'rx', 'ry'].includes(name)
      ) {
        throw new Error(`${iso2}: unhandled attribute "${name}" on <${tag}>`);
      }
    }
    if (tag === 'svg') {
      viewBox = attrs.viewBox ?? DEFAULT_VIEWBOX;
      continue;
    }
    if (tag === 'g') {
      if (!selfClosing) stack.push(inherited);
      continue;
    }
    const { fill = '#000', ...rest } = inherited;
    /** @type {Record<string, string | number>} */
    const paint = {};
    for (const [name, value] of Object.entries(rest)) {
      paint[name] = NUMERIC.has(name) ? Number(value) : value;
    }
    const num = (name) => Number(attrs[name]);
    let shape;
    if (tag === 'path') shape = [0, fill, attrs.d];
    else if (tag === 'circle') shape = [1, fill, [num('cx'), num('cy'), num('r')]];
    else if (tag === 'ellipse') shape = [2, fill, [num('cx'), num('cy'), num('rx'), num('ry')]];
    else throw new Error(`${iso2}: unhandled element <${tag}>`);
    if (Object.keys(paint).length > 0) shape.push(paint);
    shapes.push(shape);
  }
  if (stack.length !== 1) throw new Error(`${iso2}: unbalanced <g>`);
  return [viewBox === DEFAULT_VIEWBOX ? 0 : viewBox, shapes];
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const HEADER = (what) =>
  `// GENERATED by scripts/generate-country-flags.mjs — do not edit by hand.\n` +
  `// ${what}\n` +
  `// Licences: ./LICENSES.md\n`;

const countriesTs =
  HEADER(`countries-list@${countriesVersion} (MIT) filtered to country-flag-icons@${flagsVersion}.`) +
  `\nimport type { Country } from './types';\n\n` +
  `/**\n` +
  ` * Every ISO 3166-1 country that has both a flag and a dial code, sorted by\n` +
  ` * name. \`dial\` is the country's first calling code, without the \`+\`.\n` +
  ` */\n` +
  `export const COUNTRIES: readonly Country[] = [\n` +
  countries
    .map((c) => `  { iso2: ${JSON.stringify(c.iso2)}, name: ${JSON.stringify(c.name)}, dial: ${JSON.stringify(c.dial)} },`)
    .join('\n') +
  `\n];\n`;

const flagsTs =
  HEADER(`country-flag-icons@${flagsVersion} (MIT), 3x2 set.`) +
  `\nimport type { FlagArt } from './flag-art';\n\n` +
  `/** Shape data for each listed country's 3x2 flag, keyed by ISO 3166-1 alpha-2. */\n` +
  `export const COUNTRY_FLAGS: Readonly<Record<string, FlagArt>> = {\n` +
  countries.map((c) => `  ${c.iso2}: ${JSON.stringify(convert(c.iso2))},`).join('\n') +
  `\n};\n`;

const licenses =
  `# Third-party licences — \`src/phone-input\`\n\n` +
  `\`countries.ts\` and \`flags.ts\` are generated by \`scripts/generate-country-flags.mjs\` from the two\n` +
  `packages below. Neither package is a dependency of \`@oxyhq/bloom\`; their data is vendored under\n` +
  `their MIT licences, reproduced here.\n\n` +
  `## country-flag-icons ${flagsVersion}\n\nhttps://gitlab.com/catamphetamine/country-flag-icons\n\n\`\`\`\n` +
  readFileSync(join(flagsDir, 'LICENSE'), 'utf8').trim() +
  `\n\`\`\`\n\n## countries-list ${countriesVersion}\n\nhttps://github.com/annexare/Countries\n\n\`\`\`\n` +
  readFileSync(join(countriesDir, 'LICENSE'), 'utf8').trim() +
  `\n\`\`\`\n`;

writeFileSync(join(OUT, 'countries.ts'), countriesTs);
writeFileSync(join(OUT, 'flags.ts'), flagsTs);
writeFileSync(join(OUT, 'LICENSES.md'), licenses);

console.log(
  `countries: ${countries.length}, countries.ts ${Buffer.byteLength(countriesTs)} B, flags.ts ${Buffer.byteLength(flagsTs)} B`,
);
