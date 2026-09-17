#!/usr/bin/env node
/**
 * Codemod: Bloom's retired icon set → Remix Icon.
 *
 *   node scripts/migrate-icons-to-remix.mjs <root> [--dry-run] [--diff] [--mapping <file>]
 *
 * Rewrites every reference to an old Bloom icon export (`Check_Stroke2_Corner0_Rounded`,
 * `VerifiedCheck`, …) to the Remix component named in `src/icons/remix-mapping.json`
 * (`RiCheckLine`, …), in `.ts/.tsx/.js/.jsx/.mdx/.md` files under <root>.
 *
 * Shapes handled:
 *   - named imports/re-exports from an icons module — `@oxyhq/bloom/icons`, the legacy
 *     `@oxy.so/bloom/icons`, a relative `…/icons` barrel — keep their specifier (the
 *     barrel re-exports `./remix`), with `Old as Alias` → `RiNew as Alias` and bare
 *     `Old` → `RiNew` everywhere in the file;
 *   - named imports from a single old icon file (`../icons/Check`) are re-pointed at
 *     the Remix file (`../icons/remix/RiCheckLine`), one declaration per component;
 *   - namespace members — `Icons.Old` where `Icons` is `import * as X from <icons>`,
 *     `import { Icons [as X] } from '@oxyhq/bloom'`, or the literal `Icons` (docs) —
 *     become `X.RiNew`.
 * Props are unchanged: Remix components take the same `size` rung / `width` /
 * `height` / `fill` / `style`.
 *
 * Anything it cannot rewrite safely is REPORTED, never guessed: a remaining suffixed
 * old name (`_Stroke…` / `_Filled…`) after rewriting, and the Logo `Full` wordmark
 * (its `markFill` / `textFill` props have no Remix equivalent).
 *
 * Files inside the directory holding the mapping (Bloom's own `src/icons`) are
 * skipped — the old icon files themselves are deleted, not migrated — and so is any
 * file that mentions `remix-mapping.json`, which documents the migration itself.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const root = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--mapping');
if (!root) {
  console.error('usage: migrate-icons-to-remix.mjs <root> [--dry-run] [--diff] [--mapping <file>]');
  process.exit(2);
}
const DRY = flag('--dry-run');
const DIFF = flag('--diff');
const mappingPath = path.resolve(option('--mapping') ?? path.join(here, '../src/icons/remix-mapping.json'));
/** @type {Record<string, string>} */
const MAP = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const ICONS_DIR = path.dirname(mappingPath);
const OLD_NAMES = Object.keys(MAP);

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mdx', '.md']);
const SKIP_DIRS = new Set(['node_modules', 'lib', 'dist', 'build', 'coverage']);

/** Old icon names whose bare identifier is generic enough to collide with app code. */
const SUFFIXED = /_(?:Stroke|Stoke|Filled)/;
/** Exports with no prop-compatible Remix equivalent — always flagged for review. */
const MANUAL = new Set(['Full']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (path.resolve(full) === ICONS_DIR) continue;
      walk(full, out);
    } else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

/** `@oxyhq/bloom/icons`, `@oxy.so/bloom/icons`, `…/icons`, `…/icons/Check` → kind. */
function classifySpecifier(spec) {
  if (/^@(?:oxyhq|oxy\.so)\/bloom\/icons$/.test(spec)) return { kind: 'barrel' };
  if (/^@(?:oxyhq|oxy\.so)\/bloom$/.test(spec)) return { kind: 'root' };
  if (/^\.{1,2}\//.test(spec) || spec === '.') {
    if (/(?:^|\/)icons\/?$/.test(spec)) return { kind: 'barrel' };
    const m = spec.match(/^(.*(?:^|\/)icons)\/([A-Za-z0-9]+)$/);
    if (m && m[2] !== 'remix' && m[2] !== 'shared' && m[2] !== 'TEMPLATE') return { kind: 'file', base: m[1] };
  }
  return null;
}

/** Parse `A, B as C, type D` into bindings. */
function parseBindings(body) {
  return body
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      const m = raw.match(/^(type\s+)?([A-Za-z0-9_$]+)(?:\s+as\s+([A-Za-z0-9_$]+))?$/);
      return m ? { raw, type: !!m[1], name: m[2], alias: m[3] } : { raw, unparsed: true };
    });
}

const formatBinding = (b) => (b.unparsed ? b.raw : `${b.type ? 'type ' : ''}${b.name}${b.alias && b.alias !== b.name ? ` as ${b.alias}` : ''}`);

function migrate(file, source) {
  let text = source;
  let replacements = 0;
  const renames = new Map(); // bare old identifier → Ri name, for in-file usages
  const namespaces = new Set(['Icons']);
  const problems = [];

  // 1. Named import / re-export declarations.
  const DECL = /\b(import|export)(\s+type)?\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\4(;?)/g;
  text = text.replace(DECL, (whole, keyword, typeKw = '', body, quote, spec, semi) => {
    const cls = classifySpecifier(spec);
    if (!cls) return whole;
    const bindings = parseBindings(body);
    if (cls.kind === 'root') {
      for (const b of bindings) if (!b.unparsed && b.name === 'Icons') namespaces.add(b.alias ?? 'Icons');
      return whole;
    }
    let touched = false;
    const next = bindings.map((b) => {
      if (b.unparsed || !(b.name in MAP)) return b;
      touched = true;
      replacements++;
      if (MANUAL.has(b.name)) problems.push(`${b.name}: no prop-compatible Remix equivalent (mapped to ${MAP[b.name]}) — review usage`);
      if (!b.alias) renames.set(b.name, MAP[b.name]);
      return { ...b, name: MAP[b.name], alias: b.alias };
    });
    if (!touched) return whole;
    // Drop exact duplicate bindings produced by two old names sharing one Remix icon.
    const seen = new Set();
    const unique = next.filter((b) => {
      const key = formatBinding(b);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const multiline = body.includes('\n');
    if (cls.kind === 'barrel') {
      const inner = multiline
        ? `\n${unique.map((b) => `  ${formatBinding(b)},`).join('\n')}\n`
        : ` ${unique.map(formatBinding).join(', ')} `;
      return `${keyword}${typeKw} {${inner}} from ${quote}${spec}${quote}${semi}`;
    }
    // Single old icon file: one declaration per Remix component file.
    const byFile = new Map();
    for (const b of unique) {
      if (b.unparsed || !b.name.startsWith('Ri')) {
        problems.push(`unmapped binding "${b.raw}" imported from ${spec} — the old file is being deleted`);
        continue;
      }
      if (!byFile.has(b.name)) byFile.set(b.name, []);
      byFile.get(b.name).push(b);
    }
    return [...byFile]
      .map(([ri, bs]) => `${keyword}${typeKw} { ${bs.map(formatBinding).join(', ')} } from ${quote}${cls.base}/remix/${ri}${quote}${semi}`)
      .join('\n');
  });

  // 2. Namespace imports: `import * as X from <icons>`.
  for (const m of text.matchAll(/import\s+\*\s+as\s+([A-Za-z0-9_$]+)\s+from\s*['"]([^'"]+)['"]/g)) {
    const cls = classifySpecifier(m[2]);
    if (cls && cls.kind !== 'file') namespaces.add(m[1]);
  }
  for (const ns of namespaces) {
    const re = new RegExp(`\\b${ns.replace(/\$/g, '\\$')}\\.([A-Za-z0-9_]+)\\b`, 'g');
    text = text.replace(re, (whole, member) => {
      if (!(member in MAP)) return whole;
      replacements++;
      if (MANUAL.has(member)) problems.push(`${ns}.${member}: no prop-compatible Remix equivalent — review usage`);
      return `${ns}.${MAP[member]}`;
    });
  }

  // 3. Bare in-file usages of names imported without an alias.
  for (const [oldName, ri] of renames) {
    const re = new RegExp(`(?<![.\\w$])${oldName}\\b`, 'g');
    text = text.replace(re, () => {
      replacements++;
      return ri;
    });
  }

  // 3b. Docs: a suffixed old name in Markdown prose or inline code can only mean the icon.
  if (/\.mdx?$/.test(file)) {
    for (const name of OLD_NAMES) {
      if (!SUFFIXED.test(name)) continue;
      text = text.replace(new RegExp(`\\b${name}\\b`, 'g'), () => {
        replacements++;
        return MAP[name];
      });
    }
  }

  // 4. Report what is left: suffixed old names nothing above could resolve.
  const leftovers = new Map();
  for (const name of OLD_NAMES) {
    if (!SUFFIXED.test(name)) continue;
    const count = (text.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length;
    if (count) leftovers.set(name, count);
  }
  for (const [name, count] of leftovers) problems.push(`${name} ×${count} left unrewritten (not an import binding or namespace member)`);

  return { text, replacements, problems };
}

function lineDiff(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  const out = [];
  const removed = a.filter((l) => !b.includes(l));
  const added = b.filter((l) => !a.includes(l));
  for (const l of removed) out.push(`- ${l}`);
  for (const l of added) out.push(`+ ${l}`);
  return out.join('\n');
}

const files = walk(path.resolve(root));
let changedFiles = 0;
let total = 0;
const problemFiles = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (!OLD_NAMES.some((n) => source.includes(n))) continue;
  // A file that names the mapping is ABOUT the migration (docs/icons.mdx, this
  // script's own tests) — its old names are deliberate, not usages.
  if (source.includes('remix-mapping.json')) continue;
  const { text, replacements, problems } = migrate(file, source);
  const rel = path.relative(process.cwd(), file);
  if (problems.length) problemFiles.push([rel, problems]);
  if (text === source) continue;
  changedFiles++;
  total += replacements;
  console.log(`${DRY ? '[dry-run] ' : ''}${rel}: ${replacements} replacement(s)`);
  if (DIFF) console.log(lineDiff(source, text).replace(/^/gm, '    '));
  if (!DRY) fs.writeFileSync(file, text);
}
console.log(`\n${DRY ? 'Would change' : 'Changed'} ${changedFiles} file(s), ${total} replacement(s), scanned ${files.length} file(s).`);
if (problemFiles.length) {
  console.log(`\nNeeds manual review (${problemFiles.length} file(s)):`);
  for (const [rel, problems] of problemFiles) for (const p of problems) console.log(`  ${rel}: ${p}`);
  process.exitCode = DRY ? 0 : 1;
}
