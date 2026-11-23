/**
 * An app's NativeWind stylesheet, compiled as its build compiles it: the app's
 * CSS entry through Tailwind 4 (`@tailwindcss/node`), for the candidates given.
 *
 * The app's own copy is not installed (its source is read from a scratch copy),
 * so its package imports resolve to this Bloom checkout's: `@oxy.so/bloom/*`
 * to Bloom's source and every other package (`tailwindcss`, `nativewind`…) to
 * Bloom's `node_modules`.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { compile } from '@tailwindcss/node';

const BLOOM = resolve(__dirname, '../../..');
const requireFromBloom = createRequire(join(BLOOM, 'package.json'));

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

function packageFile(id: string, roots: PackageRoots): string | undefined {
  if (id.startsWith('@oxy.so/bloom/')) {
    const sub = `./${id.slice('@oxy.so/bloom/'.length)}`;
    const exports = JSON.parse(readFileSync(join(BLOOM, 'package.json'), 'utf8')).exports as Record<
      string,
      unknown
    >;
    const target = exports[sub];
    if (typeof target === 'string') return join(BLOOM, target);
    return undefined;
  }
  const [scope, name, ...rest] = id.split('/');
  const pkgName = scope?.startsWith('@') ? `${scope}/${name}` : (scope as string);
  const subpath = scope?.startsWith('@') ? rest : [name, ...rest].filter(Boolean);
  let root: string;
  try {
    root = roots[pkgName] ?? dirname(requireFromBloom.resolve(`${pkgName}/package.json`));
  } catch {
    return undefined;
  }
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

async function resolveJs(id: string, base: string): Promise<string | undefined> {
  if (id.startsWith('.') || isAbsolute(id)) return resolve(base, id);
  try {
    return requireFromBloom.resolve(id);
  } catch {
    return undefined;
  }
}

export interface Stylesheet {
  /** The CSS Tailwind writes for these classes, as the app's build writes it. */
  build(classes: readonly string[]): string;
}

/** Compiles `css` (an app's entry, read from `from`) as Tailwind does in the app's build. */
export async function tailwind(
  css: string,
  from: string,
  roots: PackageRoots = {},
): Promise<Stylesheet> {
  // `@source` globs scan the app's files; the candidates are given, so they are not read.
  const entry = css.replace(/^@source\s[^;]*;/gm, '');
  const compiler = await compile(entry, {
    base: dirname(from),
    from,
    onDependency: () => {},
    customCssResolver: async (id) =>
      id.startsWith('.') || isAbsolute(id) ? undefined : packageFile(id, roots),
    customJsResolver: resolveJs,
  });
  return { build: (classes) => compiler.build([...classes]) };
}
