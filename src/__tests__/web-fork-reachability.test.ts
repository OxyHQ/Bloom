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
 *
 * THE SECOND PROPERTY IS THE MIRROR OF THE FIRST, AND THE FIRST CANNOT SEE IT.
 * Reachability asks whether anybody NAMES a fork. It is satisfied the moment
 * one file does — so a fork can be perfectly reachable while a DIFFERENT web
 * file reaches the same family through its neutral barrel and gets native.
 * Measured: `avatar-group/AvatarGroup.web.tsx` imported `'../portal'` while
 * `Dialog.web.tsx` and `BottomSheet.web.tsx` beside it wrote
 * `'../portal/index.web'`. `portal/index.web.ts` was reachable the whole time,
 * so this gate was green, and the hover card still rendered into nothing off
 * Metro: the native `Portal` needs a `PortalOutlet`, and a web app never mounts
 * one because both are no-ops in the web fork.
 *
 * It survived because Storybook's Vite config adds `.web.tsx` to
 * `resolve.extensions` (`.storybook/main.ts`), so the browser — the instrument
 * this package trusts most — resolved it correctly and showed a working card.
 *
 * WHY THE RULE IS SCOPED TO `.web` FILES. A NEUTRAL module has no choice:
 * `admonition/Admonition.tsx` must write `'../button'`, because naming
 * `'../button/index.web'` would break native. bob preserves that — measured
 * across 1471 built specifiers, it leaves a specifier BARE exactly when the
 * target has platform variants (115 of them) and appends `.js` when it does not
 * (1273), with zero counterexamples in either direction — so the platform
 * choice reaches the consumer's bundler intact. A WEB-ONLY file has the choice,
 * and taking it removes one bundler-config dependency from the package.
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

/**
 * Resolve a relative specifier to the NEUTRAL stem it names (no extension), so
 * `'../portal'` and `'../portal/index'` both land on `…/portal/index`.
 */
function resolveStem(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec);
  for (const ext of ['.ts', '.tsx']) if (existsSync(`${base}${ext}`)) return base;
  for (const ext of ['.ts', '.tsx']) {
    if (existsSync(join(base, `index${ext}`))) return join(base, 'index');
  }
  return null;
}

const hasWebVariant = (stem: string): boolean =>
  existsSync(`${stem}.web.ts`) || existsSync(`${stem}.web.tsx`);

/** A specifier that names a `.web` file itself has already made the choice. */
const namesWebFile = (spec: string): boolean => /(^|\/)[^/]*\.web$/.test(spec);

/**
 * The rule, as a function of (file, specifier) alone, so it can be pointed at a
 * synthetic pair as a positive control. Returns the offending target's stem, or
 * null when the specifier is fine.
 */
function reachesNativeFromWeb(fromFile: string, spec: string): string | null {
  if (namesWebFile(spec)) return null;
  const stem = resolveStem(fromFile, spec);
  if (stem === null) return null; // asset imports (`.woff2`) and the like
  return hasWebVariant(stem) ? stem : null;
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

  it('gives every subpath whose OWN entry file is forked a browser condition', () => {
    // The rule above maps a fork to its FAMILY, which is the right grain for
    // `prompt-input/Textarea.web.tsx`. It is the wrong grain for a subpath that
    // publishes a file from inside a family: `./preset-vars` resolves
    // `src/theme/preset-vars.ts`, so forking that file would be answered by
    // `./theme`'s browser condition while `./preset-vars` — the specifier a
    // consumer writes — kept serving the native default. Same property, stated
    // where the resolution actually happens.
    const offenders: string[] = [];
    let forked = 0;
    for (const [subpath, entry] of Object.entries(exportsMap)) {
      if (typeof entry !== 'object' || entry === null) continue;
      const rn = (entry as Record<string, unknown>)['react-native'];
      const source =
        typeof rn === 'object' && rn !== null ? (rn as { default?: unknown }).default : rn;
      if (typeof source !== 'string' || !source.startsWith('./src/')) continue;
      const base = join(SRC, source.replace('./src/', '').replace(/\.tsx?$/, ''));
      if (!existsSync(`${base}.web.ts`) && !existsSync(`${base}.web.tsx`)) continue;
      forked += 1;
      if ((entry as Record<string, unknown>).browser === undefined) {
        offenders.push(`${subpath}: entry ${source} has a .web fork but no browser condition`);
      }
    }
    expect(offenders).toEqual([]);
    // Vacuity floor: "no subpath is missing a browser condition" is also what a
    // loop that matched no forked entry file reports.
    expect(forked).toBeGreaterThanOrEqual(20);
  });
});

describe('web-only files name the .web sibling, never the neutral barrel', () => {
  /** Every (web file, relative specifier) pair in the package. */
  const pairs = allWebForks.flatMap((file) =>
    localSpecifiers(readFileSync(file, 'utf8')).map((spec) => ({ file, spec })),
  );

  const offenders = pairs
    .map(({ file, spec }) => ({ file, spec, target: reachesNativeFromWeb(file, spec) }))
    .filter((hit) => hit.target !== null)
    .map((hit) => `${relative(SRC, hit.file)}: '${hit.spec}' -> ${relative(SRC, hit.target as string)}`)
    .sort();

  it('reads web files, their imports, and the forked targets they could hit', () => {
    // Three floors, because "no offender" is also what an empty walk, an
    // import regex that matched nothing, and a `hasWebVariant` that never
    // returns true all report.
    expect(allWebForks.length).toBeGreaterThanOrEqual(30);
    expect(pairs.length).toBeGreaterThanOrEqual(100);
    const forkedStems = new Set(
      allWebForks.map((file) => file.replace(/\.web\.tsx?$/, '')),
    );
    expect([...forkedStems].filter(hasWebVariant).length).toBeGreaterThanOrEqual(30);
  });

  it('sees the COMPLIANT shape, so an empty offender list means compliance', () => {
    // The positive control in the same currency as the measurement: files that
    // already name a `.web` sibling. If this reached zero, every specifier
    // would be taking the `namesWebFile` early return for the wrong reason and
    // the gate would pass on a tree where nothing was named at all.
    const compliant = pairs.filter(({ spec }) => namesWebFile(spec));
    expect(compliant.length).toBeGreaterThanOrEqual(15);
  });

  it('flags a specifier that reaches a forked family by its neutral name', () => {
    // The detector, pointed at a synthetic pair. `avatar-group/AvatarGroup.web.tsx`
    // importing `'../portal'` is the real case this gate was written for, and it
    // is spelled out here so the rule keeps being checked after that file is
    // fixed — a gate whose only evidence is the absence of its own subject
    // cannot be told from one that stopped working.
    const subject = join(SRC, 'avatar-group', 'AvatarGroup.web.tsx');
    expect(reachesNativeFromWeb(subject, '../portal')).toBe(join(SRC, 'portal', 'index'));
    // And the negative control: the same file, the same shape, a family that is
    // NOT forked. `overlay/` has no `.web` file, so `'../overlay'` is correct.
    expect(reachesNativeFromWeb(subject, '../overlay')).toBeNull();
    expect(reachesNativeFromWeb(subject, '../portal/index.web')).toBeNull();
  });

  it('has no web file reaching a forked family through its neutral name', () => {
    expect(offenders).toEqual([]);
  });
});
