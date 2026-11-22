#!/usr/bin/env node
/**
 * Diff two parity dumps (`parity.dump.test.tsx`): every case's host tree must
 * be identical. Prints each difference by path; exits 1 on any.
 *   node scripts/no-nativewind/compare.mjs <baseline-dir> <branch-dir> [family...]
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [base, next, ...only] = process.argv.slice(2);
let failures = 0;
/**
 * React Native's own defaults, which a class spelled out (`flex` is
 * `display: flex`) and a style leaves implicit: the same paint either way.
 */
const DEFAULTS = { display: 'flex' };
const withoutDefaults = (node) => {
  if (Array.isArray(node)) return node.map(withoutDefaults);
  if (node === null || typeof node !== 'object') return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'style' && value && typeof value === 'object') {
      out.style = Object.fromEntries(Object.entries(value).filter(([k, v]) => DEFAULTS[k] !== v));
      if (Object.keys(out.style).length === 0) delete out.style;
    } else out[key] = withoutDefaults(value);
  }
  return out;
};
const diff = (a, b, path, out) => {
  if (out.length > 40) return;
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || a === null || b === null) {
    if (a !== b) out.push(`${path}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
    return;
  }
  if (typeof a !== 'object') {
    if (a !== b) out.push(`${path}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
    return;
  }
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const label = Array.isArray(a) ? `[${key}]` : `.${key}`;
    const hint = a?.[key]?.type ? `<${a[key].type}>` : '';
    diff(a[key], b[key], `${path}${label}${hint}`, out);
  }
};
for (const file of readdirSync(next).filter((f) => f.endsWith('.json'))) {
  const family = file.replace('.json', '');
  if (only.length && !only.includes(family)) continue;
  if (!existsSync(join(base, file))) {
    console.log(`${family}: no baseline`);
    failures++;
    continue;
  }
  const a = JSON.parse(readFileSync(join(base, file), 'utf8'));
  const b = JSON.parse(readFileSync(join(next, file), 'utf8'));
  let bad = 0;
  for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const out = [];
    diff(withoutDefaults(a[name]), withoutDefaults(b[name]), '', out);
    if (out.length) {
      bad++;
      console.log(`✗ ${family} › ${name}\n  ${out.join('\n  ')}`);
    }
  }
  console.log(
    `${bad ? '✗' : '✓'} ${family}: ${Object.keys(b).length - bad}/${Object.keys(b).length} identical`,
  );
  failures += bad;
}
process.exit(failures ? 1 : 0);
