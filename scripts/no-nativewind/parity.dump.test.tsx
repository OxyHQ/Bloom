/**
 * Writes every case's committed Android host tree, light and dark, to
 * `PARITY_OUT/<family>.json`. Run it on the baseline and on this branch, then
 * `node scripts/no-nativewind/compare.mjs <baseline-dir> <branch-dir>`.
 * `PARITY_FAMILIES=a,b` limits the families.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import TestRenderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import { BloomThemeProvider } from '@bloom/theme';
import type { Cases } from './support/cases';

interface HostTree {
  type: string;
  props: Record<string, unknown>;
  children: (HostTree | string)[];
}

const REACT_ID = /_r_[0-9a-z]+_|(?<=[-_:«#])r[0-9a-z]+(?=[-_:»)]|$)/g;
let ids = new Map<string, string>();

function value(input: unknown): unknown {
  if (typeof input === 'function') return '[function]';
  if (typeof input === 'string')
    return input.replace(REACT_ID, (id) => {
      if (!ids.has(id)) ids.set(id, `id${ids.size}`);
      return ids.get(id) as string;
    });
  if (Array.isArray(input)) return input.map(value);
  if (input !== null && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      const entry = (input as Record<string, unknown>)[key];
      if (entry !== undefined) out[key] = value(entry);
    }
    return out;
  }
  return input;
}

function normalize(node: ReactTestRendererJSON | string): HostTree | string {
  if (typeof node === 'string') return node;
  const props: Record<string, unknown> = {};
  for (const key of Object.keys(node.props).sort()) {
    if (key === 'ref') continue;
    const prop = node.props[key];
    if (prop === undefined) continue;
    // Every style prop (`style`, `contentContainerStyle`, …) flattened: an array and
    // the object it merges to are the same paint.
    props[key] = /^style$|Style$/.test(key) ? value(StyleSheet.flatten(prop) ?? {}) : value(prop);
  }
  for (const key of Object.keys(props))
    if (/^style$|Style$/.test(key) && Object.keys(props[key] as object).length === 0)
      delete props[key];
  return { type: node.type, props, children: (node.children ?? []).map(normalize) };
}

function tree(element: ReactElement, mode: 'light' | 'dark'): unknown {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <BloomThemeProvider fonts={false} mode={mode}>
        {element}
      </BloomThemeProvider>,
    );
  });
  const json = renderer.toJSON();
  ids = new Map();
  act(() => renderer.unmount());
  return (json === null ? [] : Array.isArray(json) ? json : [json]).map(normalize);
}

const OUT = process.env.PARITY_OUT as string;
const ONLY = process.env.PARITY_FAMILIES?.split(',');
const CASES_DIR = join(__dirname, 'cases');
const families = readdirSync(CASES_DIR)
  .filter((file) => file.endsWith('.cases.tsx'))
  .map((file) => file.replace('.cases.tsx', ''))
  .filter((family) => !ONLY || ONLY.includes(family));

beforeAll(() => {
  mkdirSync(OUT, { recursive: true });
  const error = console.error;
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    error(...args);
  });
});

it.each(families)('%s', (family) => {
  const cases: Cases = require(join(CASES_DIR, `${family}.cases.tsx`)).CASES;
  const out: Record<string, unknown> = {};
  for (const [name, render] of Object.entries(cases)) {
    for (const mode of ['light', 'dark'] as const) {
      try {
        out[`${name} [${mode}]`] = tree(render(), mode);
      } catch (error) {
        out[`${name} [${mode}]`] = {
          error: String((error as Error).stack ?? error).slice(0, 1500),
        };
      }
    }
  }
  writeFileSync(join(OUT, `${family}.json`), JSON.stringify(out, null, 1));
});
