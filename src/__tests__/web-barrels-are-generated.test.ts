/**
 * @jest-environment node
 */

/**
 * NO web barrel is written by hand.
 *
 * Export conditions do not apply to RELATIVE specifiers. A web barrel naming
 * `./color-scope` resolves to the NATIVE file in every bundler that is not
 * Metro, whatever `package.json#exports` says — and Metro-web resolves the
 * `.web` sibling by platform extension, so the browser agrees with the broken
 * build and nothing reports it. That is the failure this file exists for.
 *
 * `web-fork-reachability.test.ts` catches a bad specifier AFTER someone writes
 * one. Generating every barrel from its native sibling makes it unwritable:
 * the rule ("if `<stem>.web.ts(x)` exists, name it") fires on file existence,
 * so a NEUTRAL module keeps its bare specifier because there is no `.web` file
 * to name. This suite pins that the committed barrels are what the generator
 * produces today — a stale one otherwise surfaces only at `prebuild`.
 *
 * It runs the GENERATOR, not a copy of its rule. A gate that re-implements its
 * subject measures the re-implementation. Jest transforms to CommonJS and
 * cannot import an ES module, so it shells out to
 * `generate-platform-exports.mjs --print-barrels`, which renders every barrel
 * to stdout and writes nothing — the same arrangement `reanimated-deps.test.ts`
 * uses to run its checker.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');
const SRC = join(REPO_ROOT, 'src');

/** Every web barrel as this generator renders it, keyed by its native source. */
const rendered: Record<string, string> = JSON.parse(
  execFileSync('node', ['scripts/generate-platform-exports.mjs', '--print-barrels'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }),
);

const barrels = Object.keys(rendered).sort();

const webPathOf = (nativeRelPath: string) => nativeRelPath.replace(/\.ts$/, '.web.ts');

describe('web barrels are generated, never hand-written', () => {
  it('finds the barrels at all', () => {
    // Vacuity floor: a discovery that silently returns nothing would make every
    // assertion below pass over an empty set.
    expect(barrels.length).toBeGreaterThanOrEqual(30);
    // Positive controls — three shapes the rule has to handle: a plain family,
    // a NESTED barrel, and the root barrel itself.
    expect(barrels).toContain('popover/index.ts');
    expect(barrels).toContain(join('theme', 'color-scope', 'index.ts'));
    expect(barrels).toContain('index.ts');
  });

  it('every committed web barrel equals a fresh render of its native sibling', () => {
    const stale: string[] = [];
    for (const nativeRelPath of barrels) {
      const native = readFileSync(join(SRC, nativeRelPath), 'utf8');
      const onDisk = readFileSync(join(SRC, webPathOf(nativeRelPath)), 'utf8');
      void native;
      if (rendered[nativeRelPath] !== onDisk) stale.push(webPathOf(nativeRelPath));
    }
    expect(stale).toEqual([]);
  });

  it('every web barrel carries the generated marker', () => {
    const unmarked = barrels
      .map(webPathOf)
      .filter((p) => !readFileSync(join(SRC, p), 'utf8').startsWith('// AUTO-GENERATED'));
    expect(unmarked).toEqual([]);
  });

  it('retargets a forked specifier and leaves a neutral one alone', () => {
    // `popover/index.ts` names a forked component and a neutral types module.
    const popover = rendered['popover/index.ts'] ?? '';
    expect(popover).toContain("from './Popover.web'");
    expect(popover).not.toMatch(/from '\.\/Popover'/);
    // A NEUTRAL module keeps its bare specifier — naming `.web` on a module
    // with no fork breaks native. This is the half of the rule that has no
    // symptom on web, so nothing else would report it.
    expect(popover).toContain("from './types'");
    expect(popover).not.toContain('types.web');
  });

  it('resolves a directory specifier and an explicit /index to the same module', () => {
    // `surfaces/index.ts` writes `'../dialog'`; `command/index.ts` writes
    // `'../dialog/index'`. Both must land on `'../dialog/index.web'` — an
    // earlier attempt at this rule turned the second into `'../dialog.web'`,
    // which resolves to nothing and which no other gate here would have caught.
    expect(readFileSync(join(SRC, 'surfaces/index.ts'), 'utf8')).toContain("from '../dialog'");
    expect(readFileSync(join(SRC, 'command/index.ts'), 'utf8')).toContain("from '../dialog/index'");
    expect(rendered['surfaces/index.ts']).toContain("from '../dialog/index.web'");
    expect(rendered['command/index.ts']).toContain("from '../dialog/index.web'");
  });

  it('carries the one line a web barrel says that its native sibling cannot', () => {
    // `dialog` is the single case: `BLOOM_DIALOG_CSS` has no native counterpart.
    // Keeping it as generator DATA is what keeps "no hand-written web barrel" a
    // property of the tree rather than a convention with one exception.
    expect(rendered['dialog/index.ts']).toContain("export { BLOOM_DIALOG_CSS } from './Dialog.web';");
    expect(readFileSync(join(SRC, 'dialog/index.ts'), 'utf8')).not.toContain('BLOOM_DIALOG_CSS');
    // And nothing else smuggles an extra in.
    expect(rendered['popover/index.ts']).not.toContain('BLOOM_DIALOG_CSS');
  });
});
