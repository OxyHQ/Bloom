import { execFileSync } from 'node:child_process';
import { bloomThemeBlock } from '../design-tokens/theme-css';

// Exercise the native compiler in its own process: Jest's RN transform is not
// a CSS compiler, and a className-prop assertion cannot see a 14px rem shrink.
it('compiles the authored spacing, line heights, radii and widths to the same pixels on native', () => {
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
        theme,
      ].join('\\n'), { base: process.cwd(), onDependency() {} });
      const css = compiler.build(['gap-2.5', 'p-3', 'leading-5', 'rounded-3xl', 'max-w-md']);
      // Apps compile with inlineVariables: false, so colours stay themeable at runtime.
      const runtime = native(css, { inlineVariables: false }).stylesheet().s;
      process.stdout.write(JSON.stringify([native(css).stylesheet().s, runtime]));
    })().catch(error => { console.error(error); process.exit(1); });
  `,
    ],
    { cwd: process.cwd(), input: bloomThemeBlock(), encoding: 'utf8' },
  );
  type Rules = [string, { d: unknown[] }[]][];
  const [inlined, runtime] = JSON.parse(output) as [Rules, Rules];
  const rules = new Map(inlined);
  expect(rules.get('gap-2.5')?.[0]?.d).toContainEqual({ gap: 10 });
  expect(rules.get('p-3')?.[0]?.d).toContainEqual({ padding: 12 });
  expect(rules.get('rounded-3xl')?.[0]?.d).toContainEqual({ borderRadius: 24 });
  expect(rules.get('max-w-md')?.[0]?.d).toContainEqual({ maxWidth: 448 });
  // A var()-based line-height is multiplied by the font size at runtime.
  expect(new Map(runtime).get('leading-5')?.[0]?.d).toContainEqual({ lineHeight: 20 });
});
