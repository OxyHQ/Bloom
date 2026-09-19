import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * No SHIPPED module may import the icon barrel.
 *
 * `./icons` is a flat re-export of all 461 Remix modules and Metro does not
 * tree-shake, so one barrel import inside one Bloom component puts the whole set
 * into every app that renders it. `./icons/Ri*` exists so an app ships the glyphs
 * it draws — but an app cannot opt out of what Bloom's own components import, so
 * a barrel import here silently cancels that for everyone downstream.
 *
 * It had already happened. `DialogHeader` named three glyphs through `../icons`
 * and `ZoomableMediaGallery` another three; between them they held 462 glyphs in
 * CrowdSource's reviewer bundle, 119 KiB over its JavaScript budget, AFTER both
 * CrowdSource and `@oxy.so/services` had moved to subpaths. Nothing failed: the
 * import is correct, the types are right, and the only symptom is a number in
 * another repo's CI.
 *
 * Scope is deliberately what `package.json#files` ships. Stories and tests reach
 * for the barrel freely — `Fab.stories.tsx`, `Rail.stories.tsx` and friends all
 * do, correctly, because the negated `stories` and `__tests__` patterns in
 * `files` keep them out of the tarball and out of every consumer's graph.
 *
 * The ROOT barrel's own `export * as Icons from './icons'` in `src/index.ts` is
 * also exempt and must stay: importing `@oxy.so/bloom` wholesale is a consumer's
 * choice to make, and that line is the thing being chosen.
 */

const SRC = join(__dirname, '..');

/**
 * Either barrel, at any depth, through any mechanism that puts it in the graph.
 *
 * THE SPELLING IS THE WHOLE BUG. `./icons/index.ts` is a thin re-export of
 * `./icons/remix/index.ts`, so the inner one costs exactly the same 461 modules
 * while reading as if it were more specific — and it is the spelling 61 of
 * Bloom's own components were using, which is how this survived 3.2.0 and then a
 * first pass that looked only for `../icons`. A pattern that catches the two
 * spellings someone already wrote is not a pattern that catches the next one, so
 * this matches every way a barrel can be named here:
 *
 *   - `from '../icons'` / `from '../icons/remix'` — the two that shipped;
 *   - the same with an explicit `/index`, which resolves identically in `src/`
 *     (TS) and in both builds (bob appends `.js` to relative specifiers);
 *   - `require('../icons')` and `await import('../icons')` — `require()` of a
 *     string literal is idiomatic in this repo for optional peers, so a barrel
 *     arriving that way is not hypothetical;
 *   - `'@oxy.so/bloom/icons'`, the SELF-REFERENCE. It resolves — Node and Metro
 *     both honour a package's own `exports` from inside it — and it is the
 *     spelling every `docs/*.mdx` example uses, so it is the one most likely to
 *     be pasted into a component.
 *
 * A per-glyph import must stay unflagged in every one of those forms, so each
 * pattern ends AT the barrel rather than matching a prefix of it.
 */
const BARREL_IMPORT =
  /\b(?:from|import|require)\s*\(?\s*['"](?:(?:\.{1,2}\/)+|@oxy\.so\/bloom\/)icons(?:\/remix)?(?:\/index)?['"]/;

const EXEMPT = new Set(['index.ts', 'index.web.ts']);

function shippedModules(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === '__fixtures__' || entry.name === '__mocks__')
        continue;
      shippedModules(full, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.(stories|test|spec)\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('no shipped module imports the icon barrel', () => {
  const modules = shippedModules(SRC).filter(
    (file) => !relative(SRC, file).startsWith('icons'),
  );

  it('the scan actually read the source tree', () => {
    // A scan that read nothing reports the same clean pass as a scan that read
    // everything, so pin it to a real number and to a file known to be present.
    expect(modules.length).toBeGreaterThan(200);
    expect(modules.some((f) => relative(SRC, f) === join('dialog', 'DialogHeader.tsx'))).toBe(true);
  });

  it('finds no barrel import outside the exempt root entries', () => {
    const offenders = modules
      .filter((file) => !EXEMPT.has(relative(SRC, file)))
      .filter((file) => BARREL_IMPORT.test(readFileSync(file, 'utf8')))
      .map((file) => relative(SRC, file));

    expect(offenders).toEqual([]);
  });

  it('the matcher recognises a barrel import and ignores a per-glyph one', () => {
    // Without this the assertion above passes just as quietly when the regex is
    // wrong as when the tree is clean.
    expect(BARREL_IMPORT.test("} from '../icons';")).toBe(true);
    expect(BARREL_IMPORT.test("import * as Icons from '../../icons';")).toBe(true);
    // The inner barrel — the spelling that actually shipped, and the one a
    // pattern written only for `../icons` waves through.
    expect(BARREL_IMPORT.test("import { RiWalkLine } from '../icons/remix';")).toBe(true);
    // An explicit `/index` is the same file by another name, and resolves in
    // `src/` and in both builds.
    expect(BARREL_IMPORT.test("import { RiWalkLine } from '../icons/index';")).toBe(true);
    expect(BARREL_IMPORT.test("import { RiWalkLine } from '../icons/remix/index';")).toBe(true);
    // Not every import is an `import`.
    expect(BARREL_IMPORT.test("const Icons = require('../icons');")).toBe(true);
    expect(BARREL_IMPORT.test("const Icons = await import('../icons/remix');")).toBe(true);
    // The self-reference: Bloom naming its own published subpath from inside
    // itself. It resolves, it costs the whole barrel, and it is what every doc
    // example looks like.
    expect(BARREL_IMPORT.test("import { RiWalkLine } from '@oxy.so/bloom/icons';")).toBe(true);
  });

  it('the matcher leaves a per-glyph import alone, in every one of those forms', () => {
    // The negative controls are the half that stops a pattern matching
    // EVERYTHING from passing as a pattern matching correctly — and there has to
    // be one per mechanism, or widening the matcher is how the per-glyph imports
    // this whole change installed start failing their own gate.
    expect(BARREL_IMPORT.test("import { RiCloseLine } from '../icons/remix/RiCloseLine';")).toBe(
      false,
    );
    expect(BARREL_IMPORT.test("const { RiCloseLine } = require('../icons/remix/RiCloseLine');")).toBe(
      false,
    );
    expect(BARREL_IMPORT.test("const m = await import('../icons/remix/RiCloseLine');")).toBe(false);
    expect(BARREL_IMPORT.test("import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine';")).toBe(
      false,
    );
  });
});
