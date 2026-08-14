import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

/**
 * Every `*.web.{ts,tsx}` fork must be REACHABLE by a bundler that is not Metro.
 *
 * Metro resolves a platform extension by filename, so on Metro-web a fork is
 * picked up whether or not anything names it. Every other web bundler (Vite,
 * webpack, an SSR pass) resolves `package.json#exports`, and export conditions
 * do NOT apply to relative specifiers — so a fork is reachable off-Metro only
 * if some file NAMES it (`from './X.web'`) starting from a `browser` entry.
 *
 * A fork nobody names is therefore silently absent for most of the fleet, with
 * no error anywhere: the native file loads and simply does less. Measured
 * before this gate existed: `prompt-input/Textarea.web.tsx` (the only file that
 * attaches a DOM paste listener, i.e. all of `onImagePaste`) and both
 * `theme/{color,seed}-scope/index.web.tsx` (which write the scoped CSS custom
 * properties Tailwind utilities read) were unreachable from any `browser`
 * condition. `./prompt-input` and `./theme` had no `browser` condition at all.
 *
 * The one legitimate exception is the THREE-FILE form — a `.web` beside a
 * `.native` — where Metro picks a platform file and everyone else gets the
 * neutral default. `theme/native-root-vars.*` is the reference: its default is
 * a no-op precisely because a web bundler must not reach the native-only
 * import. That shape needs no namer, and the presence of the `.native` sibling
 * is what distinguishes it from an orphan.
 */

const SRC = join(__dirname, '..');
const PKG_PATH = join(__dirname, '..', '..', 'package.json');
const exportsMap = (
  JSON.parse(readFileSync(PKG_PATH, 'utf8')) as {
    exports: Record<string, Record<string, unknown> | string>;
  }
).exports;

/** Directories under `src/` that are not shipped code. */
const SKIP_DIRS = new Set(['__tests__', 'node_modules']);

function listWebForks(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      listWebForks(full, out);
    } else if (/\.web\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function resolveLocal(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    join(base, 'index.tsx'),
    join(base, 'index.ts'),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every relative specifier a file names, via `from '…'`, `require('…')` or `import('…')`. */
function localSpecifiers(text: string): string[] {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const out: string[] = [];
  const re = /from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const match of stripped.matchAll(re)) {
    const spec = match[1] ?? match[2] ?? match[3];
    if (spec?.startsWith('.')) out.push(spec);
  }
  return out;
}

/**
 * The `src/` entry file behind each `browser` export condition. The manifest
 * names the BUILT path (`./lib/module/x/index.web.js`); map it back to source
 * so the walk runs over the files a reader edits.
 */
function browserEntrySources(): string[] {
  const entries: string[] = [];
  for (const value of Object.values(exportsMap)) {
    if (typeof value === 'string') continue;
    const browser = value.browser as { import?: unknown } | undefined;
    const built = browser?.import;
    if (typeof built !== 'string') continue;
    const stem = built.replace(/^\.\/lib\/module\//, '').replace(/\.js$/, '');
    for (const ext of ['.ts', '.tsx']) {
      const candidate = join(SRC, `${stem}${ext}`);
      if (existsSync(candidate)) {
        entries.push(candidate);
        break;
      }
    }
  }
  return entries;
}

/** Walk from the browser entries, following every local specifier, and collect the `.web` files met. */
function reachableWebForks(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const webForks = new Set<string>();
  const queue = [...entries];
  for (const entry of entries) webForks.add(entry);
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const spec of localSpecifiers(text)) {
      const resolved = resolveLocal(file, spec);
      if (!resolved) continue;
      if (/\.web\.tsx?$/.test(resolved)) webForks.add(resolved);
      queue.push(resolved);
    }
  }
  return webForks;
}

/** `X.web.ts` has a `X.native.ts(x)` sibling — the Metro-selected three-file form. */
function hasNativeSibling(webFile: string): boolean {
  const stem = webFile.replace(/\.web\.tsx?$/, '');
  return existsSync(`${stem}.native.ts`) || existsSync(`${stem}.native.tsx`);
}

const allWebForks = listWebForks(SRC);
const entries = browserEntrySources();
const reachable = reachableWebForks(entries);

describe('web forks are reachable off Metro', () => {
  it('finds web forks and browser entries at all', () => {
    // Vacuity floors: "no orphans" and "the scan read nothing" are otherwise
    // the same result.
    expect(allWebForks.length).toBeGreaterThanOrEqual(30);
    expect(entries.length).toBeGreaterThanOrEqual(15);
    expect(reachable.size).toBeGreaterThanOrEqual(30);
  });

  it('names every web fork from a browser export condition, or pairs it with a .native sibling', () => {
    const orphans = allWebForks
      .filter((file) => !reachable.has(file) && !hasNativeSibling(file))
      .map((file) => relative(SRC, file))
      .sort();
    expect(orphans).toEqual([]);
  });

  it('resolves every browser entry back to a real source file', () => {
    const declared = Object.values(exportsMap).filter(
      (value) => typeof value !== 'string' && (value as Record<string, unknown>).browser !== undefined,
    ).length;
    expect(entries.length).toBe(declared);
  });

  it('gives every family that carries a web fork a browser condition on its own subpath', () => {
    // Reachability through the ROOT web barrel is not enough: a consumer
    // importing `@oxyhq/bloom/prompt-input` resolves that subpath's own
    // conditions, so a family whose only route to its fork is `src/index.web.ts`
    // serves the native build to every direct subpath import.
    const offenders: string[] = [];
    let checked = 0;
    for (const file of allWebForks) {
      if (hasNativeSibling(file)) continue; // three-file form: neutral default covers it
      const rel = relative(SRC, file);
      const family = rel.includes('/') ? rel.slice(0, rel.indexOf('/')) : null;
      const subpath = family === null ? '.' : `./${family}`;
      checked += 1;
      const entry = exportsMap[subpath];
      if (typeof entry !== 'object' || entry === null) {
        offenders.push(`${rel}: no "${subpath}" subpath in package.json#exports`);
        continue;
      }
      if ((entry as Record<string, unknown>).browser === undefined) {
        offenders.push(`${rel}: "${subpath}" has no browser condition`);
      }
    }
    expect(offenders).toEqual([]);
    expect(checked).toBeGreaterThanOrEqual(30);
  });
});
