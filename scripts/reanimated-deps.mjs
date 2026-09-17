#!/usr/bin/env node
/**
 * Give every Reanimated worklet hook an explicit dependency array.
 *
 * WHY: without the worklets Babel plugin — Storybook's Vite build, and any web
 * consumer that doesn't run it — Reanimated 4 has no `__closure` to read, so:
 *   - `useAnimatedStyle` / `useAnimatedProps` THROW in dev ("was used without a
 *     dependency array or Babel plugin");
 *   - every hook (`useDerivedValue`, `useAnimatedReaction`,
 *     `useAnimatedScrollHandler` included) re-runs ONLY when something in its
 *     dependency array changes — a shared value missing from it never updates the
 *     style on web.
 * So the array must name EVERYTHING the worklet captures from the enclosing
 * component/hook, which is what this computes: every identifier the worklet reads
 * that is declared inside the enclosing function (params, locals, destructured
 * bindings) but outside the worklet itself. Module-scope bindings and imports are
 * stable and left out.
 *
 *   node scripts/reanimated-deps.mjs --check [paths…]   report calls missing deps (exit 1)
 *   node scripts/reanimated-deps.mjs --write [paths…]   add/extend the arrays in place
 *
 * Paths default to `src`. Existing arrays are kept and EXTENDED with anything
 * missing, never reordered or pruned. Gate: `src/__tests__/reanimated-deps.test.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

/** Hook name → index of its dependency-array argument. */
export const HOOK_DEPS_INDEX = {
  useAnimatedStyle: 1,
  useAnimatedProps: 1,
  useDerivedValue: 1,
  useAnimatedReaction: 2,
  useAnimatedScrollHandler: 1,
};

function walkFiles(entry, out = []) {
  const stat = fs.statSync(entry);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(entry)) {
      if (name === 'node_modules' || name === '__tests__' || name.startsWith('.')) continue;
      walkFiles(path.join(entry, name), out);
    }
  } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.d.ts')) {
    out.push(entry);
  }
  return out;
}

const isFunctionLike = (node) =>
  ts.isArrowFunction(node) ||
  ts.isFunctionExpression(node) ||
  ts.isFunctionDeclaration(node) ||
  ts.isMethodDeclaration(node);

/** Names bound by a binding name (identifier or destructuring pattern). */
function bindingNames(name, out) {
  if (ts.isIdentifier(name)) out.add(name.text);
  else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const el of name.elements) if (!ts.isOmittedExpression(el)) bindingNames(el.name, out);
  }
  return out;
}

/** Every name declared anywhere inside `root` (params, variables, functions, catch clauses). */
function declaredInside(root) {
  const names = new Set();
  const visit = (node) => {
    if (ts.isParameter(node) || ts.isVariableDeclaration(node) || ts.isBindingElement(node)) {
      bindingNames(node.name, names);
    } else if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) {
      names.add(node.name.text);
    } else if (ts.isCatchClause(node) && node.variableDeclaration) {
      bindingNames(node.variableDeclaration.name, names);
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return names;
}

/** Is this identifier a value READ (not a property name, key, label, type or JSX attribute name)? */
function isValueReference(id) {
  const p = id.parent;
  if (!p) return false;
  if (ts.isPropertyAccessExpression(p) && p.name === id) return false;
  if (ts.isPropertyAssignment(p) && p.name === id) return false;
  if (ts.isMethodDeclaration(p) && p.name === id) return false;
  if (ts.isBindingElement(p) && (p.propertyName === id || p.name === id)) return false;
  if (ts.isVariableDeclaration(p) && p.name === id) return false;
  if (ts.isParameter(p) && p.name === id) return false;
  if ((ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p)) && p.name === id) return false;
  if (ts.isJsxAttribute(p) && p.name === id) return false;
  if (ts.isLabeledStatement(p) || ts.isBreakStatement(p) || ts.isContinueStatement(p)) return false;
  if (ts.isTypeReferenceNode(p) || ts.isQualifiedName(p) || ts.isTypeQueryNode(p)) return false;
  if (ts.isPropertySignature(p) || ts.isEnumMember(p)) return false;
  return true;
}

/** Identifiers a worklet reads, in first-appearance order. */
function readsIn(root) {
  const seen = [];
  const visit = (node) => {
    if (ts.isTypeNode(node)) return;
    if (ts.isIdentifier(node) && isValueReference(node) && !seen.includes(node.text)) {
      seen.push(node.text);
    }
    if (ts.isShorthandPropertyAssignment(node) && !seen.includes(node.name.text)) {
      seen.push(node.name.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return seen;
}

/** Analyse one file: every hook call and the deps it needs. */
export function analyseSource(fileName, text) {
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const results = [];
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        Object.hasOwn(HOOK_DEPS_INDEX, node.expression.text)) {
      const hook = node.expression.text;
      const depsIndex = HOOK_DEPS_INDEX[hook];
      let enclosing = node.parent;
      while (enclosing && !isFunctionLike(enclosing)) enclosing = enclosing.parent;
      const worklets = node.arguments.slice(0, depsIndex);
      if (enclosing && worklets.length > 0) {
        const scope = declaredInside(enclosing);
        const insideWorklets = new Set();
        for (const w of worklets) for (const n of declaredInside(w)) insideWorklets.add(n);
        const needed = [];
        for (const w of worklets) {
          for (const name of readsIn(w)) {
            if (scope.has(name) && !insideWorklets.has(name) && !needed.includes(name)) needed.push(name);
          }
        }
        const depsArg = node.arguments[depsIndex];
        const existing = depsArg && ts.isArrayLiteralExpression(depsArg)
          ? depsArg.elements.map((e) => e.getText(sf)) : null;
        const opaque = depsArg && !ts.isArrayLiteralExpression(depsArg); // e.g. a variable / null
        // `insets.top` in the array covers a read of `insets` — compare by root identifier.
        const roots = (existing ?? []).map((e) => e.split(/[.?[(\s]/)[0]);
        const missing = opaque ? [] : needed.filter((n) => !roots.includes(n));
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        results.push({ hook, line: line + 1, node, depsArg, existing, missing, hasArray: !!existing, opaque });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { sf, results };
}

/** Rewrite `text` so every hook call has a complete dependency array. */
export function fixSource(fileName, text) {
  const { sf, results } = analyseSource(fileName, text);
  const edits = [];
  for (const r of results) {
    if (r.opaque) continue;
    if (r.hasArray && r.missing.length === 0) continue;
    if (r.hasArray) {
      const arr = r.depsArg;
      const last = arr.elements[arr.elements.length - 1];
      const insertAt = last ? last.getEnd() : arr.getStart(sf) + 1;
      edits.push({ at: insertAt, del: 0, text: (last ? ', ' : '') + r.missing.join(', ') });
    } else {
      const lastWorklet = r.node.arguments[HOOK_DEPS_INDEX[r.hook] - 1];
      edits.push({ at: lastWorklet.getEnd(), del: 0, text: `, [${r.missing.join(', ')}]` });
    }
  }
  edits.sort((a, b) => b.at - a.at);
  let out = text;
  for (const e of edits) out = out.slice(0, e.at) + e.text + out.slice(e.at + e.del);
  return { text: out, changed: edits.length };
}

/** Calls that are missing an array or missing entries in it. */
export function problemsIn(fileName, text) {
  return analyseSource(fileName, text).results
    .filter((r) => !r.opaque && (!r.hasArray || r.missing.length > 0))
    .map((r) => ({ hook: r.hook, line: r.line, missing: r.missing, hasArray: r.hasArray }));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const roots = args.filter((a) => !a.startsWith('--'));
  const files = (roots.length ? roots : ['src']).flatMap((r) => walkFiles(r));
  let total = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (!Object.keys(HOOK_DEPS_INDEX).some((h) => text.includes(h))) continue;
    if (write) {
      const { text: next, changed } = fixSource(file, text);
      if (changed) { fs.writeFileSync(file, next); console.log(`${file}: ${changed} call(s)`); total += changed; }
    } else {
      for (const p of problemsIn(file, text)) {
        console.log(`${file}:${p.line} ${p.hook} ${p.hasArray ? 'missing ' + p.missing.join(', ') : 'has no dependency array'}${!p.hasArray && p.missing.length ? ` (needs [${p.missing.join(', ')}])` : ''}`);
        total++;
      }
    }
  }
  console.log(write ? `fixed ${total} call(s)` : `${total} problem(s)`);
  if (!write && total) process.exitCode = 1;
}
