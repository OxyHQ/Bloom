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
 * Either barrel, at any depth: `../icons` and `../icons/remix`.
 *
 * BOTH spellings matter and only one of them is obvious. `./icons/index.ts` is a
 * thin re-export of `./icons/remix/index.ts`, so importing the inner one costs
 * exactly the same 461 modules — and it is the spelling 61 of Bloom's own
 * components were using, which is how this survived a first pass that only looked
 * for `../icons`. A per-glyph import (`../icons/remix/RiCloseLine`) must stay
 * unflagged, so the pattern has to end at the barrel rather than match a prefix.
 */
const BARREL_IMPORT = /from\s*['"](?:\.{1,2}\/)+icons(?:\/remix)?['"]/;

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
    expect(BARREL_IMPORT.test("import { RiCloseLine } from '../icons/remix/RiCloseLine';")).toBe(
      false,
    );
  });
});
