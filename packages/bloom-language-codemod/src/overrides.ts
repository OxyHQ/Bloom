/**
 * Which classes an app's stylesheet draws differently from Bloom's.
 *
 * The className table was built against Bloom's stylesheet (Tailwind, NativeWind's
 * theme and Bloom's tokens). An app's own `@theme` or `:root` can redefine a
 * value under the same class (`--radius-lg: var(--radius)`), so a class lands on
 * the table's token only when the app's CSS for it is the same as Bloom's:
 * every declaration its rules write, under the same at-rules, with each
 * `var()` resolved through the root custom properties of that stylesheet.
 */
import postcss, { type AtRule, type Container, type Rule } from 'postcss';

import { BLOOM_BASELINE_CSS, type PackageRoots, tailwind } from './tailwind';

const ROOT = /^(:root|:host|html)(\s*,\s*(:root|:host|html))*$/;

/** The CSS class selector of a Tailwind candidate. */
export function classSelector(candidate: string): string {
  return `.${candidate.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)}`;
}

function atRules(node: Rule): string {
  const out: string[] = [];
  for (
    let at: Container | undefined = node.parent as Container;
    at && at.type !== 'root';
    at = at.parent as Container
  ) {
    if (at.type === 'atrule') {
      const rule = at as AtRule;
      if (rule.name !== 'layer') out.unshift(`@${rule.name} ${rule.params}`);
    }
  }
  return out.join(' ');
}

function inLayer(node: Rule): boolean {
  for (
    let at: Container | undefined = node.parent as Container;
    at && at.type !== 'root';
    at = at.parent as Container
  )
    if (at.type === 'atrule' && (at as AtRule).name === 'layer') return true;
  return false;
}

/** Each candidate's declarations, its variables resolved, from one built stylesheet. */
export function signatures(css: string, candidates: readonly string[]): Map<string, string> {
  const root = postcss.parse(css);
  const layered: Record<string, string> = {};
  const unlayered: Record<string, string> = {};
  root.walkRules((rule) => {
    if (!ROOT.test(rule.selector.trim()) || atRules(rule)) return;
    const into = inLayer(rule) ? layered : unlayered;
    rule.each((child) => {
      if (child.type === 'decl' && child.prop.startsWith('--')) into[child.prop] = child.value;
    });
  });
  const vars = { ...layered, ...unlayered };
  const resolve = (value: string, depth = 0): string =>
    depth > 16
      ? value
      : value.replace(
          /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g,
          (all, name: string, fallback?: string) => {
            const found = vars[name];
            if (found !== undefined) return resolve(found, depth + 1);
            return fallback !== undefined ? resolve(fallback, depth + 1) : all;
          },
        );

  const selectors = new Map(candidates.map((c) => [c, classSelector(c)]));
  const out = new Map<string, string[]>();
  root.walkRules((rule) => {
    for (const [candidate, selector] of selectors) {
      const at = rule.selector.indexOf(selector);
      if (at < 0) continue;
      const next = rule.selector[at + selector.length];
      if (next !== undefined && /[\w-\\]/.test(next)) continue;
      const lines = out.get(candidate) ?? [];
      const where = `${atRules(rule)} ${rule.selector.split(selector).join('&')}`;
      rule.each((child) => {
        if (child.type === 'decl')
          lines.push(
            `${where} { ${child.prop}: ${resolve(child.value)}${child.important ? ' !important' : ''} }`,
          );
      });
      out.set(candidate, lines);
    }
  });
  return new Map([...out].map(([candidate, lines]) => [candidate, lines.join('\n')]));
}

/** The candidates an app's stylesheet (`css`, read from `from`) draws differently from Bloom's. */
export async function overriddenClasses(
  css: string,
  from: string,
  candidates: readonly string[],
  roots: PackageRoots = {},
): Promise<Set<string>> {
  const app = signatures((await tailwind(css, from, roots)).build(candidates), candidates);
  const bloom = signatures(
    (await tailwind(BLOOM_BASELINE_CSS, from)).build(candidates),
    candidates,
  );
  const out = new Set<string>();
  for (const candidate of candidates)
    if (app.get(candidate) !== bloom.get(candidate)) out.add(candidate);
  return out;
}
