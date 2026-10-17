import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * Every raster image Bloom draws goes through `image/BloomImage.tsx`.
 *
 * On a device that is expo-image, which decodes GIF and animated WebP itself.
 * An Android app may only switch off React Native's own GIF/WebP decoders
 * (`expo-build-properties` `android.gifEnabled`/`webpEnabled: false`, ~870 KB
 * installed) when nothing it renders — Bloom included — draws one through
 * react-native's `Image`. One family reaching for `Image` again would quietly
 * break that promise for every app that took it: the image still renders on
 * web and in jest, and a GIF degrades to its first frame only on the device.
 *
 * So a value import of `Image` / `ImageBackground` from `react-native` is
 * allowed ONLY in the files below — an EQUALITY, so a new importer fails and a
 * file that stops importing it has to be removed from the list. Stories and
 * tests are not shipped and are not scanned.
 */
const ALLOWED: Record<string, string> = {
  'image/BloomImage.tsx':
    'the renderer itself: react-native `Image` is its web renderer and its fallback when expo-image cannot load',
};

const SRC = join(__dirname, '..');
const BANNED = new Set(['Image', 'ImageBackground']);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === '__fixtures__' || /\.(stories|test)\.tsx?$/.test(entry))
      continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function importsNativeImage(file: string): boolean {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== 'react-native') continue;
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly) continue;
    const bindings = clause.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      if (element.isTypeOnly) continue;
      if (BANNED.has((element.propertyName ?? element.name).text)) return true;
    }
  }
  return false;
}

describe('one raster renderer', () => {
  const files = sourceFiles(SRC);

  it('scans the whole shipped source tree', () => {
    // Vacuity floor: a broken walk would otherwise report "no importers".
    expect(files.length).toBeGreaterThan(500);
  });

  it("imports react-native's Image only where the allow-list says", () => {
    const importers = files
      .filter(importsNativeImage)
      .map((file) => file.slice(SRC.length + 1))
      .filter((file) => !file.endsWith('.stories.tsx'))
      .sort();
    expect(importers).toEqual(Object.keys(ALLOWED).sort());
  });
});
