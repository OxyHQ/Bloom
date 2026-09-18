/**
 * @jest-environment node
 */

/**
 * `BloomIconComponent` has ONE home, and the per-family names for it stay
 * deprecated aliases of it.
 *
 * `ComponentType<{ width?: number; height?: number; fill?: string }>` is the
 * type of "an icon you hand a Bloom component". Twenty-six families had each
 * written it out under their own name before it was given one home in
 * `src/icons/icon-component.ts` — and writing it out again is not a compile
 * error anywhere, because the literal IS the type. Nothing goes red; the
 * library just quietly has twenty-seven spellings of one idea again.
 *
 * That is not hypothetical. The refactor that consolidated the twenty-six
 * shipped with a commit message and a `docs/icons.mdx` paragraph both naming
 * `PlayerGlyph` as one of the aliases it had converted — while
 * `media-player/PlayerIconButton.tsx` still declared the literal, as did
 * `BadgeIcon`, `CallGlyph` and eight inline uses. Three public types and a
 * documented claim disagreed with the source for a release, because a prose
 * list is not an instrument. This file is.
 *
 * Two properties, and neither implies the other:
 *
 *   1. NOBODY RE-DECLARES THE SHAPE. Exactly one declaration of a component
 *      type over those three optional props exists in `src/`, and it is
 *      `icon-component.ts`. This is an EQUALITY, not a floor: there is no
 *      allow-list to append a new family to, because appending is how the
 *      first twenty-six happened.
 *
 *   2. EVERY ALIAS OF IT IS DEPRECATED. A family that exports its own name for
 *      the canonical type is keeping an old spelling alive for consumers, which
 *      is why `@deprecated` sits on all of them. A NEW one without that marker
 *      is a twenty-seventh name being minted, not a consumer being spared a
 *      breaking change — so it fails here, while the existing ones keep
 *      working exactly as they do today.
 *
 * Scanning the SOURCE rather than the types is deliberate: `tsc` cannot tell a
 * declaration from an alias of it, since the two are the same type. That
 * identity is the whole reason this class of duplication is invisible.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const SRC = join(__dirname, '..');

/** The one file allowed to declare the shape. */
const CANONICAL = 'icons/icon-component.ts';

/** The canonical type's name, as every alias must spell it. */
const CANONICAL_NAME = 'BloomIconComponent';

/**
 * The props, exactly. All three optional — which is what makes the type the
 * WIDEST icon a component can be handed, so a match here really is this type
 * and not a stricter one that happens to mention `fill`.
 */
const SHAPE: Record<string, ts.SyntaxKind> = {
  width: ts.SyntaxKind.NumberKeyword,
  height: ts.SyntaxKind.NumberKeyword,
  fill: ts.SyntaxKind.StringKeyword,
};

/**
 * The component-type constructors a caller could reach for. `ComponentType` is
 * the one in use; the others are listed so a rename of the same idea does not
 * slip past — they all describe "a component taking these props".
 */
const COMPONENT_TYPES = new Set([
  'ComponentType',
  'ElementType',
  'FC',
  'FunctionComponent',
  'ComponentClass',
]);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'lib') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry) && !entry.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

/** `ComponentType` / `React.ComponentType` → the bare name. */
function typeName(node: ts.TypeReferenceNode): string {
  const { typeName: name } = node;
  return ts.isQualifiedName(name) ? name.right.text : name.text;
}

/** Is this literal exactly the three optional props, in any order? */
function isIconShape(literal: ts.TypeLiteralNode): boolean {
  const seen = new Set<string>();
  for (const member of literal.members) {
    if (!ts.isPropertySignature(member) || !member.questionToken) return false;
    if (!member.name || !ts.isIdentifier(member.name)) return false;
    const expected = SHAPE[member.name.text];
    if (expected === undefined || member.type?.kind !== expected) return false;
    seen.add(member.name.text);
  }
  return seen.size === Object.keys(SHAPE).length;
}

interface Declaration {
  file: string;
  line: number;
  text: string;
}

interface Alias {
  file: string;
  line: number;
  name: string;
  deprecated: boolean;
}

const declarations: Declaration[] = [];
const aliases: Alias[] = [];

for (const file of sourceFiles(SRC)) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(SRC, file).split(/[\\/]/).join('/');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const at = (node: ts.Node) => ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;

  const walk = (node: ts.Node): void => {
    if (ts.isTypeReferenceNode(node) && COMPONENT_TYPES.has(typeName(node))) {
      const [argument] = node.typeArguments ?? [];
      if (
        node.typeArguments?.length === 1 &&
        argument &&
        ts.isTypeLiteralNode(argument) &&
        isIconShape(argument)
      ) {
        declarations.push({
          file: rel,
          line: at(node),
          text: node.getText(ast).replace(/\s+/g, ' '),
        });
      }
    }

    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isTypeReferenceNode(node.type) &&
      typeName(node.type) === CANONICAL_NAME &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      // The JSDoc the alias carries. Bloom's convention keeps the family's own
      // one-liner and puts the deprecation in a second block beside it, so read
      // the whole leading comment range rather than the last block alone.
      const leading = text.slice(node.getFullStart(), node.getStart(ast));
      aliases.push({
        file: rel,
        line: at(node),
        name: node.name.text,
        deprecated: leading.includes('@deprecated'),
      });
    }

    ts.forEachChild(node, walk);
  };

  walk(ast);
}

describe('BloomIconComponent has one home', () => {
  it('is declared once, in icons/icon-component.ts', () => {
    const elsewhere = declarations.filter((d) => d.file !== CANONICAL);
    expect(
      elsewhere.map((d) => `${d.file}:${d.line}  ${d.text}`),
    ).toEqual([]);
  });

  it('is declared at all — the scan matches the canonical declaration', () => {
    // Without this the first assertion passes on a scanner that matches
    // nothing, which is the failure mode of every source census.
    expect(declarations.map((d) => d.file)).toEqual([CANONICAL]);
  });

  it('is aliased by exactly the families that had their own name for it', () => {
    // An EQUALITY, not a floor. Dropping a name here is a breaking change for
    // whoever imports it; ADDING one is a new spelling of a type that already
    // has a name, and the twenty-six existed because nobody had to look. Both
    // directions should make somebody edit this list on purpose.
    expect([...aliases].map((a) => a.name).sort()).toEqual([
      'AiChatShellIcon',
      'AnnouncementIconComponent',
      'BadgeIcon',
      'ButtonIconComponent',
      'CallGlyph',
      'CategoryBarIcon',
      'ChartIconComponent',
      'CreatorStudioIcon',
      'DataTableIconComponent',
      'HousingIcon',
      'ImportantAlertsCardIcon',
      'InsightIcon',
      'ListingEditorIcon',
      'ListingFactIcon',
      'ListingIcon',
      'NotificationCenterIcon',
      'NotificationIconComponent',
      'OfferingBadgeIcon',
      'PatientInfoCardIcon',
      'PlayerGlyph',
      'SavedSearchIcon',
      'SidebarIcon',
      'StatCardsIcon',
      'TabsIconComponent',
      'TrackIconComponent',
    ]);
  });

  it('has no alias that is not deprecated', () => {
    const live = aliases.filter((a) => !a.deprecated);
    expect(live.map((a) => `${a.file}:${a.line}  ${a.name}`)).toEqual([]);
  });
});
