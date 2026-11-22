// Tailwind v4 over a Bloom checkout's source with the stack every Oxy app ships
// (app-preset `css/base.css`, without preflight). Cached per checkout HEAD.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const tree = process.argv[2];
const head = execFileSync('git', ['-C', tree, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const cache = path.join(require('node:os').tmpdir(), `bloom-baseline-${head}.css`);
if (fs.existsSync(cache)) {
  process.stdout.write(fs.readFileSync(cache, 'utf8'));
  process.exit(0);
}
const req = createRequire(path.join(tree, 'package.json'));
const { compile } = req('@tailwindcss/node');
const { Scanner } = req('@tailwindcss/oxide');
const theme = fs.readFileSync(path.join(tree, 'src/design-tokens/theme.css'), 'utf8');
(async () => {
  const compiler = await compile(
    [
      '@import "tailwindcss/theme.css" layer(theme);',
      '@import "tailwindcss/utilities.css";',
      '@import "nativewind/theme";',
      theme,
      ':root { --font-sans: var(--bloom-font-sans, Inter, sans-serif); @media ios { --font-sans: Inter; } @media android { --font-sans: Inter; } }',
    ].join('\n'),
    { base: tree, onDependency() {} },
  );
  const scanner = new Scanner({
    sources: [{ base: path.join(tree, 'src'), pattern: '**/*', negated: false }],
  });
  const out = compiler.build(scanner.scan());
  fs.writeFileSync(cache, out);
  process.stdout.write(out);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
