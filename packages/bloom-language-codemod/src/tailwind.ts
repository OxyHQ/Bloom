/**
 * An app's NativeWind stylesheet, compiled as its build compiles it: the app's
 * CSS entry through Tailwind 4 (`@tailwindcss/node`), for the candidates given.
 *
 * A package the entry imports (`tailwindcss`, `nativewind/theme`,
 * `@oxy.so/bloom/design-tokens/theme.css`) is read from the first of: a root
 * given by hand (`--package`), the `node_modules` above the entry (the app's
 * own install), then the `node_modules` above this package (an app read from
 * a copy with nothing installed takes this install's).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { compile } from '@tailwindcss/node';

/** Bloom's own entry: Tailwind, NativeWind's theme and Bloom's tokens, what the className table was built against. */
export const BLOOM_BASELINE_CSS = [
  '@import "tailwindcss/theme.css" layer(theme);',
  '@import "tailwindcss/preflight.css" layer(base);',
  '@import "tailwindcss/utilities.css";',
  '@import "nativewind/theme";',
  '@import "@oxy.so/bloom/design-tokens/theme.css";',
].join('\n');

/** Package roots given by hand (a package the app installs that Bloom does not, read from its own repository). */
export type PackageRoots = Readonly<Record<string, string>>;

/** The directory of package `name` in the first `node_modules` above any of `from`, in order. */
export function packageRoot(name: string, from: readonly string[]): string | undefined {
  for (const start of from)
    for (let dir = resolve(start); ; dir = dirname(dir)) {
      const root = join(dir, 'node_modules', name);
      if (existsSync(join(root, 'package.json'))) return root;
      if (dirname(dir) === dir) break;
    }
  return undefined;
}

function packageFile(id: string, roots: PackageRoots, from: readonly string[]): string | undefined {
  const [scope, name, ...rest] = id.split('/');
  const pkgName = scope?.startsWith('@') ? `${scope}/${name}` : (scope as string);
  const subpath = scope?.startsWith('@') ? rest : [name, ...rest].filter(Boolean);
  const root = roots[pkgName] ?? packageRoot(pkgName, from);
  if (root === undefined) return undefined;
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const key = subpath.length ? `./${subpath.join('/')}` : '.';
  const entry = pkg.exports?.[key];
  const style =
    typeof entry === 'string' ? entry : (entry?.style ?? entry?.default ?? entry?.import);
  if (typeof style === 'string') return join(root, style);
  if (!subpath.length && typeof pkg.style === 'string') return join(root, pkg.style);
  const direct = subpath.length ? join(root, ...(subpath as string[])) : join(root, 'index.css');
  for (const file of [direct, `${direct}.css`])
    if (existsSync(file) && statSync(file).isFile()) return file;
  return undefined;
}

function resolveJs(id: string, base: string, from: readonly string[]): string | undefined {
  if (id.startsWith('.') || isAbsolute(id)) return resolve(base, id);
  for (const dir of from)
    try {
      return createRequire(join(dir, 'noop.js')).resolve(id);
    } catch {}
  return undefined;
}

export interface Stylesheet {
  /** The CSS Tailwind writes for these classes, as the app's build writes it. */
  build(classes: readonly string[]): string;
}

/**
 * Compiles `css` (an app's entry, read from `from`) as Tailwind does in the
 * app's build; its packages are read from `roots`, then above `from`, then
 * above `packages` (default: this package).
 */
export async function tailwind(
  css: string,
  from: string,
  roots: PackageRoots = {},
  packages: string = __dirname,
): Promise<Stylesheet> {
  const search = [dirname(from), packages];
  // `@source` globs scan the app's files; the candidates are given, so they are not read.
  const entry = css.replace(/^@source\s[^;]*;/gm, '');
  const compiler = await compile(entry, {
    base: dirname(from),
    from,
    onDependency: () => {},
    customCssResolver: async (id) =>
      id.startsWith('.') || isAbsolute(id) ? undefined : packageFile(id, roots, search),
    customJsResolver: async (id, base) => resolveJs(id, base, search),
  });
  return { build: (classes) => compiler.build([...classes]) };
}

/**
 * The class candidates in a package's built JavaScript, as an app's `@source`
 * glob over it (`node_modules/@oxy.so/bloom/lib/**\/*.{js,jsx}`) hands them to
 * Tailwind: every word of each file, split at whitespace, quotes and template
 * holes. Tailwind writes CSS only for the words that are utilities, so a word
 * that is not one adds nothing.
 */
export function packageCandidates(dir: string): string[] {
  const words = new Set<string>();
  const walk = (at: string) => {
    for (const name of readdirSync(at)) {
      const path = join(at, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.jsx?$/.test(name))
        for (const word of readFileSync(path, 'utf8').split(/[\s"'`]+|\$\{|\}/))
          if (word) words.add(word);
    }
  };
  walk(dir);
  return [...words].sort();
}
