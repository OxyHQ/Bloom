import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * `vector-static` is ~310 KB of offline portrait paths that only the agent creator draws (its shape
 * arc and eye picker). Imported statically from the avatar renderer, it was in the first paint of
 * every app that shows an avatar. One module may reach it, and only through `import()`.
 */
const SRC = join(__dirname, '..', '..');

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sources(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.stories\./.test(entry.name) ? [path] : [];
  });
}

it('is reached only through the one lazy loader', () => {
  const importers = sources(SRC)
    .filter((file) =>
      /['"](\.\.?\/)+(agent-avatar\/)?vector-static['"]/.test(readFileSync(file, 'utf8')),
    )
    .map((file) => relative(SRC, file));
  expect(importers).toEqual(['agent-avatar/use-static-portraits.ts']);
  const loader = readFileSync(join(SRC, 'agent-avatar/use-static-portraits.ts'), 'utf8');
  expect(loader).toMatch(/import\('\.\/vector-static'\)/);
  expect(loader).not.toMatch(/from '\.\/vector-static'/);
});
