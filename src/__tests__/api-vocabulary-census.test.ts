/**
 * @jest-environment node
 */

/**
 * The public vocabulary is one set of words.
 *
 * Two things drifted before and were invisible to `tsc`, because each spelling
 * was a legal member of its own union:
 *
 *  - CONTROL SIZES. `sm | md | lg` and `small | medium | large` coexisted, then
 *    sat in one prop (`BadgeSize` accepted both and kept two identical geometry
 *    tables). A control size is `BloomSize`; `small | medium | large` survives
 *    only where it names content or a load, which is an EQUALITY below.
 *  - THE MATERIAL'S NAME. The surface material is blur and tint. A `glass*`
 *    identifier in source says it is something it no longer is.
 */

import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';

const SRC = join(__dirname, '..');

const files = execFileSync('git', ['ls-files', '--', 'src'], {
  cwd: join(SRC, '..'),
  encoding: 'utf8',
})
  .split('\n')
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .filter((f) => !/(__tests__|\.stories\.|^src\/icons\/)/.test(f));

const LEGACY = new Set(['small', 'medium', 'large']);

/** Type aliases and `size` props whose union holds a legacy word. */
function legacySizeUnions(file: string): string[] {
  const text = readFileSync(join(SRC, '..', file), 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const holdsLegacy = (node: ts.Node): boolean => {
    let hit = false;
    const visit = (n: ts.Node): void => {
      if (ts.isLiteralTypeNode(n) && ts.isStringLiteral(n.literal) && LEGACY.has(n.literal.text)) {
        hit = true;
      }
      ts.forEachChild(n, visit);
    };
    visit(node);
    return hit;
  };
  const visit = (node: ts.Node): void => {
    if (ts.isTypeAliasDeclaration(node) && /Size$/.test(node.name.text) && holdsLegacy(node.type)) {
      found.push(`${relative('src', file)}: type ${node.name.text}`);
    }
    if (
      ts.isPropertySignature(node) &&
      node.type &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'size' &&
      holdsLegacy(node.type)
    ) {
      found.push(`${relative('src', file)}: size prop`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

/**
 * Content and load densities, not control sizes. `BloomScope` never reaches
 * them; renaming them to `sm | md | lg` would claim it does.
 */
const CONTENT_DENSITY = [
  'lyrics/types.ts: type LyricsSize',
  'listing-card/parts.tsx: type ListingPartSize',
  'listing-details/types.ts: type ListingHeaderSize',
  'listing-details/types.ts: type ListingSectionSize',
  'media-card/types.ts: type MediaCardSize',
  'shipment-request/types.ts: type ShipmentLoadSize',
  'stay-filters/PropertyTypeTiles.tsx: type TileSize',
];

describe('control sizes are one vocabulary', () => {
  it('only content and load densities still spell small / medium / large', () => {
    const found = files.flatMap(legacySizeUnions).sort();
    expect(found).toEqual([...CONTENT_DENSITY].sort());
  });

  it('is not vacuous: it sees the legacy words when they are there', () => {
    const probe = ts.createSourceFile(
      'probe.ts',
      "export type ProbeSize = 'small' | 'md';",
      ts.ScriptTarget.Latest,
      true,
    );
    let seen = false;
    ts.forEachChild(probe, (n) => {
      if (ts.isTypeAliasDeclaration(n)) seen = /Size$/.test(n.name.text);
    });
    expect(seen).toBe(true);
    expect(files.length).toBeGreaterThan(1000);
  });
});

describe('the material has no glass in its names', () => {
  // Attribution to the upstream tab bar, and the word in unrelated senses.
  const ALLOWED = /expo-glass-tabs|MagnifyingGlass|sunglass|glasses/i;

  it('no source line outside stories and tests says glass', () => {
    const offenders: string[] = [];
    for (const file of files) {
      readFileSync(join(SRC, '..', file), 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/glass/i.test(line) && !ALLOWED.test(line)) offenders.push(`${file}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
