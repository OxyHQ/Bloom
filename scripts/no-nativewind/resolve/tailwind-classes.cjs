// Compile Tailwind v4 CSS for candidates with the stack every Oxy app ships
// (@oxy.so/app-preset/css/base.css minus preflight and @source).
const { createRequire } = require('node:module');
const baseRequire = createRequire(require('node:path').join(process.argv[2], 'package.json'));
const { compile } = baseRequire('@tailwindcss/node');
const fs = require('node:fs');
const path = require('node:path');
const [base, outFile] = process.argv.slice(2);
const candidates = JSON.parse(fs.readFileSync(0, 'utf8'));
const theme = fs.readFileSync(path.join(base, 'src/design-tokens/theme.css'), 'utf8');
(async () => {
  const compiler = await compile(
    [
      '@import "tailwindcss/theme.css" layer(theme);',
      '@import "tailwindcss/utilities.css";',
      '@import "nativewind/theme";',
      theme,
      ':root { --font-sans: var(--bloom-font-sans, Inter, sans-serif); @media ios { --font-sans: Inter; } @media android { --font-sans: Inter; } }',
    ].join('\n'),
    { base, onDependency() {} },
  );
  fs.writeFileSync(outFile, compiler.build(candidates));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
