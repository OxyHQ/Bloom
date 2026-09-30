import { execFileSync } from 'node:child_process';
import { bloomThemeCss } from '../design-tokens/theme-css';

// Exercise the native compiler in its own process: Jest's RN transform is not
// a CSS compiler, and a className-prop assertion cannot see a 14px rem shrink.
it('compiles the authored spacing, radii and widths to the same pixels on native', () => {
  const output = execFileSync(
    process.execPath,
    [
      '-e',
      `
    const { compile: tailwind } = require('@tailwindcss/node');
    const { compile: native } = require('react-native-css/compiler');
    const theme = require('node:fs').readFileSync(0, 'utf8');
    (async () => {
      const compiler = await tailwind([
        '@import "tailwindcss/theme.css" layer(theme);',
        '@import "tailwindcss/utilities.css" layer(utilities);',
        '@theme {' + theme + '}',
      ].join('\\n'), { base: process.cwd(), onDependency() {} });
      const css = compiler.build(['gap-2.5', 'p-3', 'rounded-3xl', 'max-w-md']);
      process.stdout.write(JSON.stringify(native(css).stylesheet().s));
    })().catch(error => { console.error(error); process.exit(1); });
  `,
    ],
    { cwd: process.cwd(), input: bloomThemeCss(), encoding: 'utf8' },
  );
  const rules = new Map(JSON.parse(output) as [string, { d: unknown[] }[]][]);
  expect(rules.get('gap-2.5')?.[0]?.d).toContainEqual({ gap: 10 });
  expect(rules.get('p-3')?.[0]?.d).toContainEqual({ padding: 12 });
  expect(rules.get('rounded-3xl')?.[0]?.d).toContainEqual({ borderRadius: 24 });
  expect(rules.get('max-w-md')?.[0]?.d).toContainEqual({ maxWidth: 448 });
});
