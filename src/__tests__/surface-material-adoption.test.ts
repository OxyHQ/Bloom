import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? entry.name === '__tests__' ? [] : sources(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}
it('keeps backing compositing in the material resolver, not consumer copies', () => {
  // Button's palette composites semantic tokens before selecting interaction colours;
  // it does not publish surface depth. Painting renderers only apply idempotent tint.
  const allowed = new Set(['surface/shared.ts', 'surface/resolve-surface-material.ts', 'button/shared.ts']);
  const offenders = sources(root).filter(file => !allowed.has(path.relative(root, file))).filter(file => /\bresolveSurfaceFill\s*\(/.test(fs.readFileSync(file, 'utf8')));
  expect(offenders.map(file => path.relative(root, file))).toEqual([]);
});
