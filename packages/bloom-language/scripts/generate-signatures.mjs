#!/usr/bin/env node
/**
 * Writes each node constructor's positional parameters into
 * `spec/language.json` (`signatures`), read from the constructors' own
 * declarations in `src/` (an exported function, or an exported const typed
 * as a function), so the spec says what each constructor takes and the
 * compiler checks a node's arguments from it (`generate.mjs` writes them
 * into `spec.generated.rs`).
 *
 * A parameter is written as the kind of value it takes:
 *
 * - `...children`: any number of children (`...children: Child[]`);
 * - `...text`: any number of text runs (`Text(...runs)`);
 * - `view`: one child; `label`: a string or a child;
 * - `string`, `number`, `boolean`: that primitive;
 * - `binding`: a two-way binding (`$draft.text`);
 * - `icon`: an icon component;
 * - `value`: anything else, which TypeScript checks on the emitted code.
 *
 * An optional parameter (`?`, or a default) ends in `?`.
 *
 * It also writes the modifiers whose value TS takes as `undefined` (`noneModifiers`): a
 * method of `Node` whose first parameter is optional or typed `… | undefined`. The compiler
 * lets a `.bloom` token argument be `none` there (`.tint(c ? .success : none)`), which leaves
 * the modifier unapplied, as TS's `undefined` does.
 *
 * `--check` writes nothing and fails when the committed signatures differ.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(packageRoot, '../../package.json'));
const ts = require('typescript');
const specPath = join(packageRoot, 'spec/language.json');
const check = process.argv.includes('--check');

const text = readFileSync(specPath, 'utf8');
const spec = JSON.parse(text);
const constructors = Object.entries(spec.nodes)
  .filter(([kind]) => kind !== '$comment')
  .flatMap(([, node]) => node.constructors);
const wanted = new Set(constructors);

/** The package's sources, but tests, stories, generated tables and platform files. */
function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return ['__tests__', 'stories', 'generated'].includes(entry.name) ? [] : sources(path);
    }
    return /\.tsx?$/.test(entry.name) &&
      !entry.name.endsWith('.d.ts') &&
      !/\.(web|native|ios|android)\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

/** A parameter's kind, from its declared type. */
function kindOf(parameter, file) {
  const type = (parameter.type?.getText(file) ?? '').replace(/\s+/g, ' ').trim();
  if (parameter.dotDotDotToken) return type === 'TextRun[]' ? '...text' : '...children';
  if (type === 'Child') return 'view';
  if (type === 'string | Child' || type === 'Child | string') return 'label';
  if (type === 'string' || type === 'number' || type === 'boolean') return type;
  if (/^Binding</.test(type)) return 'binding';
  if (type === 'IconComponent') return 'icon';
  return 'value';
}

const signatures = new Map();
for (const path of sources(join(packageRoot, 'src')).sort()) {
  const file = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const exported = (node) => node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  const record = (name, parameters) => {
    if (!wanted.has(name) || signatures.has(name)) return;
    signatures.set(
      name,
      parameters.map((p) => {
        const kind = kindOf(p, file);
        const optional = !kind.startsWith('...') && (p.questionToken || p.initializer);
        return optional ? `${kind}?` : kind;
      }),
    );
  };
  for (const statement of file.statements) {
    if (!exported(statement)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      record(statement.name.text, statement.parameters);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        // `export const Meter = meter(…) as (value: number) => MeterView`
        let type = declaration.type;
        if (!type && declaration.initializer && ts.isAsExpression(declaration.initializer)) {
          type = declaration.initializer.type;
        }
        if (type && ts.isFunctionTypeNode(type)) record(declaration.name.text, type.parameters);
      }
    }
  }
}

/** `Node`'s methods whose first parameter takes `undefined`; one overload that does not, refuses. */
const takesNone = new Map();
{
  const path = join(packageRoot, 'src/node.ts');
  const file = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  const node = file.statements.find((s) => ts.isClassDeclaration(s) && s.name?.text === 'Node');
  for (const member of node?.members ?? []) {
    if (!ts.isMethodDeclaration(member) || !ts.isIdentifier(member.name)) continue;
    if (member.modifiers?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) continue;
    const [first] = member.parameters;
    if (!first) continue;
    const type = first.type?.getText(file) ?? '';
    const none =
      Boolean(first.questionToken || first.initializer) || /(^|\|)\s*undefined\s*(\||$)/.test(type);
    const name = member.name.text;
    takesNone.set(name, (takesNone.get(name) ?? true) && none);
  }
}
/**
 * The fields of a modifier's object that TS types as a React element (`ReactNode`,
 * `ReactElement`, `JSX.Element`): `header`'s `DialogHeaderConfig.right`. A Bloom view given
 * there crosses as an element (`toElement`), as one given to a TS prop does; a field typed as
 * Bloom's own `Child` or `ViewNode` does not. Read from the interfaces the package (and Bloom's
 * `src/`) declares, by name.
 */
const interfaces = new Map();
for (const path of [
  ...sources(join(packageRoot, 'src')),
  ...sources(join(packageRoot, '../../src')),
]) {
  const file = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  for (const statement of file.statements) {
    if (!ts.isInterfaceDeclaration(statement)) continue;
    const fields = interfaces.get(statement.name.text) ?? new Set();
    for (const member of statement.members) {
      if (!ts.isPropertySignature(member) || !member.type || !ts.isIdentifier(member.name))
        continue;
      const type = member.type.getText(file);
      if (
        /\b(ReactNode|ReactElement|JSX\.Element)\b/.test(type) &&
        !/=>|\b(Child|ViewNode)\b/.test(type)
      ) {
        fields.add(member.name.text);
      }
    }
    interfaces.set(statement.name.text, fields);
  }
}
const elementFields = new Map();
{
  const path = join(packageRoot, 'src/node.ts');
  const file = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  const node = file.statements.find((s) => ts.isClassDeclaration(s) && s.name?.text === 'Node');
  for (const member of node?.members ?? []) {
    if (!ts.isMethodDeclaration(member) || !ts.isIdentifier(member.name)) continue;
    const [first] = member.parameters;
    if (!first?.type) continue;
    const names = first.type.getText(file).match(/\b[A-Z]\w*/g) ?? [];
    const fields = new Set(elementFields.get(member.name.text) ?? []);
    for (const name of names) {
      for (const field of interfaces.get(name) ?? []) fields.add(field);
    }
    if (fields.size > 0) elementFields.set(member.name.text, [...fields].sort());
  }
}

const noneModifiers = [...takesNone]
  .filter(([, none]) => none)
  .map(([name]) => name)
  .sort();

const missing = constructors.filter((name) => !signatures.has(name));
if (missing.length > 0) {
  console.error(`no declaration found for: ${missing.join(', ')}`);
  process.exit(1);
}

const lines = constructors
  .filter((name, index) => constructors.indexOf(name) === index)
  .map(
    (name) =>
      `    ${JSON.stringify(name)}: [${signatures
        .get(name)
        .map((k) => JSON.stringify(k))
        .join(', ')}]`,
  );
const block = `"signatures": {\n    "$comment": "GENERATED by scripts/generate-signatures.mjs from the constructors' declarations: each constructor's positional parameters (...children, ...text, view, label, string, number, boolean, binding, icon, value; ? when optional). Do not edit.",\n${lines.join(',\n')}\n  }`;

const existing = /"signatures": \{[\s\S]*?\n {2}\}/;
const withSignatures = existing.test(text)
  ? text.replace(existing, block)
  : text.replace(/\n\}\n?$/, `,\n  ${block}\n}\n`);
const noneBlock = `"noneModifiers": [\n${noneModifiers.map((name) => `    ${JSON.stringify(name)}`).join(',\n')}\n  ]`;
const existingNone = /"noneModifiers": \[[\s\S]*?\n {2}\]/;
const next = existingNone.test(withSignatures)
  ? withSignatures.replace(existingNone, noneBlock)
  : withSignatures.replace(/\n\}\n?$/, `,\n  ${noneBlock}\n}\n`);

const elementLines = [...elementFields]
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(
    ([name, fields]) =>
      `    ${JSON.stringify(name)}: [${fields.map((f) => JSON.stringify(f)).join(', ')}]`,
  );
const elementBlock = `"elementFields": {\n    "$comment": "GENERATED by scripts/generate-signatures.mjs: each modifier's object fields TS types as a React element (ReactNode), where a Bloom view crosses as toElement(view). Do not edit.",\n${elementLines.join(',\n')}\n  }`;
const existingElement = /"elementFields": \{[\s\S]*?\n {2}\}/;
const withElements = existingElement.test(next)
  ? next.replace(existingElement, elementBlock)
  : next.replace(/\n\}\n?$/, `,\n  ${elementBlock}\n}\n`);

if (check) {
  if (withElements !== text) {
    console.error(
      'stale: spec/language.json signatures (run: bun run generate in packages/bloom-language)',
    );
    process.exit(1);
  }
  console.log('constructor signatures are current');
} else {
  writeFileSync(specPath, withElements);
  console.log(`wrote ${signatures.size} constructor signatures`);
}
