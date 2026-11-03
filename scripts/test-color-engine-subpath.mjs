// @ts-check
/**
 * `@oxy.so/bloom/color-engine` AS BUILT, loaded the way a server loads it: a
 * throwaway package whose `node_modules/@oxy.so/bloom` is this repository, so
 * the real `exports` map picks the files. Bun (Dropsea's backend runs
 * `bun src/server.ts`), Node's ESM and CommonJS loaders, and TypeScript under
 * `node16` from both module kinds. A test of the source would pass with an
 * empty `lib/`; run `bun run build` first (CI's build job does).
 *
 * Each runtime also lists every module it loaded for the import, and the list
 * must hold nothing outside `theme/color-engine/`: the subpath exists so a
 * process that never renders gets the engine without React or React Native.
 * The positive control loads React in the same probe first; the listing must
 * see it, or the probe is blind and its pass means nothing.
 *
 * The expected values come from the SOURCE barrel under Bun, so the built
 * subpath must have the same surface and give the same colours.
 *
 *   node --test scripts/test-color-engine-subpath.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPECIFIER = '@oxy.so/bloom/color-engine';
const ENGINE_DIR = /\/theme\/color-engine\/[^/]+\.js$/;

/** A 4×4 photo: mostly a warm orange, some deep blue, a little grey. */
const PIXELS = [
  ...Array(10).fill(0xffe76f51),
  ...Array(4).fill(0xff1d3557),
  ...Array(2).fill(0xff8d99ae),
];
/** The same photo as sharp's `.raw().toBuffer()` hands it over: RGB bytes. */
const RGB_BYTES = PIXELS.flatMap((argb) => [(argb >> 16) & 255, (argb >> 8) & 255, argb & 255]);

/** What every probe prints for module `m`: its surface and its answers. */
const RESULT = `({
  keys: Object.keys(m).sort(),
  seeds: m.seedsFromImagePixels(${JSON.stringify(PIXELS)}),
  rgbSeeds: m.seedsFromRgbBytes(new Uint8Array(${JSON.stringify(RGB_BYTES)})),
  hex: m.hexFromArgb(m.argbFromRgb(231, 111, 81)),
  primary: m.generateRoleColors({ seed: '#e76f51', isDark: true }).primary,
})`;

/** @type {string} */
let scratch;

/** Run a command in the scratch consumer; its stdout's last line is JSON. */
function run(/** @type {string} */ command, /** @type {string[]} */ args) {
  const stdout = execFileSync(command, args, { cwd: scratch, encoding: 'utf8' });
  return JSON.parse(stdout.trim().split('\n').at(-1) ?? 'null');
}

/** The modules a probe loaded that are not the engine's own files. */
function foreign(/** @type {string[]} */ loaded) {
  return loaded.filter((file) => !ENGINE_DIR.test(file));
}

before(() => {
  scratch = mkdtempSync(join(tmpdir(), 'bloom-color-engine-'));
  mkdirSync(join(scratch, 'node_modules', '@oxy.so'), { recursive: true });
  symlinkSync(REPO_ROOT, join(scratch, 'node_modules', '@oxy.so', 'bloom'), 'dir');
  writeFileSync(
    join(scratch, 'package.json'),
    JSON.stringify({ name: 'bloom-color-engine-probe', version: '0.0.0', private: true }),
  );
});

after(() => rmSync(scratch, { recursive: true, force: true }));

describe('@oxy.so/bloom/color-engine as built', () => {
  /** @type {Record<string, unknown>} */
  let expected;

  before(() => {
    const source = JSON.stringify(join(REPO_ROOT, 'src/theme/color-engine/index.ts'));
    expected = run('bun', [
      '-e',
      `const m = await import(${source}); console.log(JSON.stringify(${RESULT}))`,
    ]);
    assert.ok(Array.isArray(expected.keys) && expected.keys.length > 5, 'source barrel read');
  });

  /**
   * One probe per runtime: import the subpath (after `prelude`), print its
   * answers and every module the runtime loaded.
   * `load` is how that runtime's probe pulls in another module.
   * @type {[string, string, (prelude: string) => string[], (path: string) => string][]}
   */
  const runtimes = [
    [
      'Bun',
      'bun',
      (prelude) => [
        '-e',
        `${prelude}
         const m = await import('${SPECIFIER}');
         console.log(JSON.stringify({ result: ${RESULT}, loaded: Object.keys(require.cache) }));`,
      ],
      (path) => `await import(${path});`,
    ],
    [
      "Node's ESM loader",
      process.execPath,
      (prelude) => [
        '--input-type=module',
        '-e',
        `import { registerHooks } from 'node:module';
         const loaded = [];
         registerHooks({ load(url, context, next) { loaded.push(url); return next(url, context); } });
         ${prelude}
         const m = await import('${SPECIFIER}');
         console.log(JSON.stringify({ result: ${RESULT}, loaded }));`,
      ],
      (path) => `await import(${path});`,
    ],
    [
      "Node's CommonJS loader",
      process.execPath,
      (prelude) => [
        '-e',
        `${prelude}
         const m = require('${SPECIFIER}');
         console.log(JSON.stringify({ result: ${RESULT}, loaded: Object.keys(require.cache) }));`,
      ],
      (path) => `require(${path});`,
    ],
  ];

  // React as Bloom's own tree resolves it: what a stray import would load.
  const react = JSON.stringify(createRequire(join(REPO_ROOT, 'package.json')).resolve('react'));

  for (const [name, command, probe, load] of runtimes) {
    it(`loads under ${name} with the source barrel’s surface and colours, and nothing else`, () => {
      const out = run(command, probe(''));
      assert.deepEqual(out.result, expected);
      assert.ok(out.loaded.length > 5, `${name} lists the modules it loaded`);
      assert.deepEqual(foreign(out.loaded), []);
    });

    it(`positive control: the ${name} listing sees React when something imports it`, () => {
      const out = run(command, probe(load(react)));
      assert.ok(
        foreign(out.loaded).some((file) => /\/node_modules\/react\//.test(file)),
        'the probe cannot see a package import, so its clean result proves nothing',
      );
    });
  }

  it('typechecks for a node16 consumer, ESM and CommonJS', () => {
    const use = `import { argbFromRgb, generateRoleColors, hexFromArgb, seedsFromImagePixels, seedsFromRgbBytes, type RoleColors } from '${SPECIFIER}';
const seed: number | undefined = seedsFromImagePixels([argbFromRgb(231, 111, 81)])[0];
const fromBytes: number[] = seedsFromRgbBytes(new Uint8Array([231, 111, 81]));
const roles: Readonly<RoleColors> = generateRoleColors({ seed: hexFromArgb(seed ?? fromBytes[0] ?? 0), isDark: true });
export const primary: string = roles.primary;
`;
    writeFileSync(join(scratch, 'esm.mts'), use);
    writeFileSync(join(scratch, 'cjs.cts'), use);
    const tsc = createRequire(join(REPO_ROOT, 'package.json')).resolve('typescript/bin/tsc');
    // A type error exits non-zero, which throws with tsc's report attached.
    execFileSync(
      process.execPath,
      [
        tsc,
        '--noEmit',
        '--strict',
        '--module',
        'node16',
        '--moduleResolution',
        'node16',
        'esm.mts',
        'cjs.cts',
      ],
      { cwd: scratch, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  });
});
