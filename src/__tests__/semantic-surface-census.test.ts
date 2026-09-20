/** @jest-environment node */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
function sources(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sources(filename);
    return /\.tsx?$/.test(filename) && !/\.(stories|test)\./.test(filename) ? [filename] : [];
  });
}

// This census only tracks direct legacy neutral-ramp consumption. It does not
// detect arbitrary colour literals, aliases, or every possible grey repaint.
// These exceptions are materials/categories, not neutral application surfaces.
const exceptions = new Set([
  'ai-chat/shared.ts', // Image-only ink/scrims over unknown photographs; UI surfaces use roles.
  'button/shared.ts', // Public legacy ramp generator; neutral Button recipes use roles.
  'settings-modal/palette.ts', // Legacy ramp handed only to inverse server tile and artwork.
  'social-button/SocialButton.tsx', // Explicit branded black/white button material.
]);

it('does not recreate neutral UI surfaces from the legacy ramp', () => {
  const consumers = sources(root).filter(filename => {
    const source = fs.readFileSync(filename, 'utf8');
    return /\bneutralRamp\s*\(/.test(source)
      || /resolveButtonRamps\([^\n;]*\)\.neutral\b/.test(source)
      || /\{[^{}]*\bneutral\b[^{}]*\}\s*=\s*(?:useMemo\([^;]*?)?resolveButtonRamps\(/.test(source);
  }).map(filename => path.relative(root, filename).replace(/\\/g, '/'));
  expect(consumers.filter(filename => !exceptions.has(filename))).toEqual([]);
  // An obsolete exception must be reviewed too, rather than silently surviving.
  expect([...exceptions].filter(filename => !consumers.includes(filename))).toEqual([]);
});
