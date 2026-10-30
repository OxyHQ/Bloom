/**
 * The BUILT package, loaded the way a consumer loads it: Node's own ESM and
 * CommonJS loaders through `exports`, and TypeScript under `node16` from both
 * module kinds. A test of the source would pass with an empty `lib/`.
 */
import { describe, expect, it } from 'bun:test';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as source from '../../../src/theme/color-engine';

const PACKAGE = join(import.meta.dir, '..');

/** A 4×4 photo: mostly a warm orange, some deep blue, a little grey. */
const PIXELS = [
  ...Array<number>(10).fill(0xffe76f51),
  ...Array<number>(4).fill(0xff1d3557),
  ...Array<number>(2).fill(0xff8d99ae),
];

function node(args: string[]): string {
  const run = Bun.spawnSync(['node', ...args], { cwd: PACKAGE, stderr: 'pipe' });
  if (run.exitCode !== 0) throw new Error(run.stderr.toString());
  return run.stdout.toString().trim();
}

const PROBE = `JSON.stringify({
  keys: Object.keys(m).sort(),
  seeds: m.seedsFromImagePixels(${JSON.stringify(PIXELS)}),
  primary: m.generateRoleColors({ seed: '#e76f51' }).primary,
})`;

const expected = {
  keys: Object.keys(source).sort(),
  seeds: source.seedsFromImagePixels(PIXELS),
  primary: source.generateRoleColors({ seed: '#e76f51' }).primary,
};

describe('@oxy.so/color as built', () => {
  it("loads under Node's ESM loader with the source barrel's surface and results", () => {
    const out = node([
      '--input-type=module',
      '-e',
      `import * as m from '@oxy.so/color'; console.log(${PROBE})`,
    ]);
    expect(JSON.parse(out)).toEqual(expected);
  });

  it("loads under Node's CommonJS loader the same", () => {
    const out = node(['-e', `const m = require('@oxy.so/color'); console.log(${PROBE})`]);
    expect(JSON.parse(out)).toEqual(expected);
  });

  it('typechecks for a node16 consumer, ESM and CommonJS', () => {
    const consumer = mkdtempSync(join(tmpdir(), 'oxy-color-consumer-'));
    mkdirSync(join(consumer, 'node_modules', '@oxy.so'), { recursive: true });
    symlinkSync(PACKAGE, join(consumer, 'node_modules', '@oxy.so', 'color'));
    const use = `import { generateRoleColors, hexFromArgb, seedsFromImagePixels, type RoleColors } from '@oxy.so/color';
const seed: number | undefined = seedsFromImagePixels([0xffe76f51])[0];
const roles: Readonly<RoleColors> = generateRoleColors({ seed: hexFromArgb(seed ?? 0), isDark: true });
export const primary: string = roles.primary;
`;
    writeFileSync(join(consumer, 'esm.mts'), use);
    writeFileSync(join(consumer, 'cjs.cts'), use);
    const tsc = Bun.spawnSync(
      [
        'node',
        require.resolve('typescript/bin/tsc'),
        '--noEmit',
        '--strict',
        '--module',
        'node16',
        '--moduleResolution',
        'node16',
        'esm.mts',
        'cjs.cts',
      ],
      { cwd: consumer, stdout: 'pipe' },
    );
    expect(tsc.stdout.toString()).toBe('');
    expect(tsc.exitCode).toBe(0);
  });
});
