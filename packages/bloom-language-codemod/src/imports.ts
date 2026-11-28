/**
 * `bloom-language-codemod imports <dir> [--write]`: moves an app's TS imports of the language
 * to the entries that export each name now (2.0.0 split each family of nodes into an entry of
 * its own: `Row` is `@oxy.so/bloom-language/containers`'s, `TextField` `/inputs`'s).
 *
 * `package.json#exports` is the source of truth: each entry's source file is read for what it
 * exports (values and types, through `export *`), and a name imported from an entry that does
 * not export it is imported from the one that does. A name no entry exports stays where it is,
 * and so does every name already in its entry, so a second run changes nothing.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { type ParserOptions, parse } from '@babel/parser';

import { LANGUAGE_MODULE } from './entries';
import { LANGUAGE_PACKAGE } from './table';

const PARSE: ParserOptions = { sourceType: 'module', plugins: ['typescript', 'jsx'] };

type Program = ReturnType<typeof parse>['program'];
type ImportDeclaration = Extract<Program['body'][number], { type: 'ImportDeclaration' }>;

/** What a TS module exports, by name: `export { a, type B }`, declarations, `export *`. */
function exportsOf(file: string, seen: Set<string> = new Set()): Set<string> {
  const names = new Set<string>();
  if (seen.has(file)) return names;
  seen.add(file);
  const program = parse(readFileSync(file, 'utf8'), { ...PARSE, plugins: ['typescript'] }).program;
  for (const node of program.body) {
    if (node.type === 'ExportNamedDeclaration') {
      for (const spec of node.specifiers) {
        if (spec.type === 'ExportSpecifier')
          names.add(spec.exported.type === 'Identifier' ? spec.exported.name : spec.exported.value);
      }
      const decl = node.declaration;
      if (decl === null || decl === undefined) continue;
      if (decl.type === 'VariableDeclaration') {
        for (const d of decl.declarations) if (d.id.type === 'Identifier') names.add(d.id.name);
      } else if ('id' in decl && decl.id && decl.id.type === 'Identifier') {
        names.add(decl.id.name);
      }
    } else if (node.type === 'ExportAllDeclaration') {
      const target = moduleFile(dirname(file), node.source.value);
      if (target) for (const name of exportsOf(target, seen)) names.add(name);
    }
  }
  return names;
}

/** A relative module's source file (`./x` is `./x.ts`, `./x.tsx` or `./x/index.ts`). */
function moduleFile(dir: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const base = resolve(dir, specifier.replace(/\.js$/, ''));
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ])
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return undefined;
}

export interface ExportMap {
  /** Each entry (`@oxy.so/bloom-language/containers`) → the names it exports. */
  byModule: ReadonlyMap<string, ReadonlySet<string>>;
  /** Each name → the entry that exports it (the first, the root before the families). */
  moduleOf: ReadonlyMap<string, string>;
}

/** The language's entries, read from its `package.json#exports` and their source files. */
export function exportMap(packageDir: string = LANGUAGE_PACKAGE): ExportMap {
  const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')) as {
    exports: Record<string, string | Record<string, unknown>>;
  };
  const byModule = new Map<string, Set<string>>();
  const moduleOf = new Map<string, string>();
  for (const [entry, target] of Object.entries(manifest.exports)) {
    if (entry === './package.json' || typeof target === 'string') continue;
    const native = target['react-native'] as { default?: string } | undefined;
    if (!native?.default) continue;
    const file = join(packageDir, native.default);
    if (!existsSync(file)) continue;
    const module = entry === '.' ? LANGUAGE_MODULE : `${LANGUAGE_MODULE}/${entry.slice(2)}`;
    const names = exportsOf(file);
    byModule.set(module, names);
    for (const name of names) if (!moduleOf.has(name)) moduleOf.set(name, module);
  }
  return { byModule, moduleOf };
}

const isLanguage = (source: string) =>
  source === LANGUAGE_MODULE ||
  (source.startsWith(`${LANGUAGE_MODULE}/`) && !source.endsWith('/package.json'));

export interface ImportsResult {
  code: string;
  changed: boolean;
  /** The names moved, each with where it now comes from. */
  moved: { name: string; from: string; to: string }[];
}

/** `source` with each of the language's imports from the entry that exports it. */
export function rewriteImports(source: string, map: ExportMap): ImportsResult {
  let program: Program;
  try {
    program = parse(source, PARSE).program;
  } catch {
    return { code: source, changed: false, moved: [] };
  }
  const edits: { start: number; end: number; text: string }[] = [];
  const moved: ImportsResult['moved'] = [];
  for (const node of program.body) {
    if (node.type !== 'ImportDeclaration' || !isLanguage(node.source.value)) continue;
    const edit = rewriteOne(source, node, map, moved);
    if (edit) edits.push(edit);
  }
  if (edits.length === 0) return { code: source, changed: false, moved };
  let code = source;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
  return { code, changed: true, moved };
}

function rewriteOne(
  source: string,
  node: ImportDeclaration,
  map: ExportMap,
  moved: ImportsResult['moved'],
): { start: number; end: number; text: string } | undefined {
  const from = node.source.value;
  const here = map.byModule.get(from);
  const groups = new Map<string, string[]>();
  const others: string[] = [];
  let changes = false;
  for (const spec of node.specifiers) {
    if (spec.type !== 'ImportSpecifier') {
      others.push(source.slice(spec.start ?? 0, spec.end ?? 0));
      continue;
    }
    const name = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
    const target = here?.has(name) ? from : (map.moduleOf.get(name) ?? from);
    if (target !== from) {
      changes = true;
      moved.push({ name, from, to: target });
    }
    const text = source.slice(spec.start ?? 0, spec.end ?? 0);
    groups.set(target, [...(groups.get(target) ?? []), text]);
  }
  if (!changes) return undefined;
  const quote = source[node.source.start ?? 0] === '"' ? '"' : "'";
  const keyword = node.importKind === 'type' ? 'import type' : 'import';
  const semi = source
    .slice(node.start ?? 0, node.end ?? 0)
    .trimEnd()
    .endsWith(';')
    ? ';'
    : '';
  const lines: string[] = [];
  // The declaration's own entry first (with a default or namespace import it kept), then the
  // others in the order their names came.
  const ordered = [from, ...[...groups.keys()].filter((m) => m !== from)];
  for (const module of ordered) {
    const names = groups.get(module) ?? [];
    if (module === from && others.length > 0) {
      const named = names.length > 0 ? `, { ${names.join(', ')} }` : '';
      lines.push(`${keyword} ${others.join(', ')}${named} from ${quote}${module}${quote}${semi}`);
    } else if (names.length > 0) {
      lines.push(`${keyword} { ${names.join(', ')} } from ${quote}${module}${quote}${semi}`);
    }
  }
  return { start: node.start ?? 0, end: node.end ?? 0, text: lines.join('\n') };
}
