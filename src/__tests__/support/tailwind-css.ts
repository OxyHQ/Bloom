import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..', '..');

/**
 * The CSS real Tailwind v4 emits for `candidates` over Bloom's own
 * `design-tokens/theme.css`, the input an app's stylesheet compiles.
 *
 * Compiled in its OWN Node process: `@tailwindcss/node` registers module
 * loader hooks as it loads (`module.registerHooks`), and Jest refuses that
 * inside a test sandbox, where the hooks would attach to the loader running
 * Jest itself for every later file in the worker.
 */
export function buildTailwindCss(candidates: readonly string[]): string {
  const theme = readFileSync(join(REPO_ROOT, 'src', 'design-tokens', 'theme.css'), 'utf8');
  return execFileSync(
    process.execPath,
    [
      '-e',
      `
    const { compile } = require('@tailwindcss/node');
    const theme = require('node:fs').readFileSync(0, 'utf8');
    (async () => {
      const compiler = await compile([
        '@import "tailwindcss/theme.css" layer(theme);',
        '@import "tailwindcss/utilities.css" layer(utilities);',
        theme,
      ].join('\\n'), { base: process.cwd(), onDependency() {} });
      process.stdout.write(compiler.build(${JSON.stringify(candidates)}));
    })().catch((error) => { console.error(error); process.exit(1); });
  `,
    ],
    { cwd: REPO_ROOT, input: theme, encoding: 'utf8' },
  );
}
