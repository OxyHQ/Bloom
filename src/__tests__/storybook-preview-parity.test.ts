// A source gate on the Storybook harness itself: `.storybook/preview.tsx` must
// mount the same Bloom stack a consuming app mounts, with no subsystem switched
// off.
//
// The defect this closes shipped in the very first Storybook commit and lived
// there unnoticed: the decorator mounted
// `<BloomThemeProvider ... fonts={false}>`. With `fonts={false}` the web
// `FontLoader` is a pass-through — `applyFontFaces()` never runs, so no
// `@font-face` rule and none of the `--bloom-font-*` custom properties are
// injected, and the font bytes are never even REQUESTED (measured: zero 4xx,
// `document.adoptedStyleSheets` carrying only `.bloom-btn`, `document.fonts`
// holding nothing of Bloom's). Every story still rendered, plausibly, in the
// browser's serif fallback while `fontFamily` kept reading back as the declared
// stack — so the one gate that could show a typography regression showed the
// fallback instead, for every story, and nothing in the repo could fail.
//
// That is the class: the HARNESS can disable a whole subsystem, and the failure
// is a plausible render rather than an error. A story cannot catch it (the
// harness is what renders the story), and neither can `tsc`: `fonts` is a real
// optional prop, and `.storybook/` is outside this package's tsconfig `include`
// anyway. A source scan is the only place it can fail.
//
// This gate PARSES rather than greps. The forbidden shape is a JSX attribute,
// which may be written across lines (`fonts={\n  false\n}`), and a line-based
// pattern reads a reformatted file as clean. The parse also gives the positive
// control this assertion needs: "no `fonts` attribute" is equally what a reader
// that saw NO attributes at all would report, so every absence claim below sits
// beside the list of attributes actually recovered from the same element.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const REPO = join(__dirname, '..', '..');
const PREVIEW = join(REPO, '.storybook', 'preview.tsx');
const PROVIDER = join(REPO, 'src', 'theme', 'BloomThemeProvider.tsx');

/**
 * A file this size cannot be the decorator plus the preview config. The floor
 * exists so a truncated, emptied or half-written preview fails HERE rather than
 * passing every "does not contain X" assertion below.
 */
const MIN_PREVIEW_BYTES = 1500;

/**
 * Every provider a consuming app mounts, which the harness therefore has to
 * mount too — a story rendered outside one of these is not testing what ships.
 *
 * `SafeAreaProvider` is on the list because it has already gone missing once:
 * `useSafeAreaInsets` THROWS outside it, so `BottomSheet` and every surface that
 * renders through one (`Dialog`, `Menu`, `Select`, `ContextMenu`, `Popover`) hit
 * the story error boundary and the web gate silently covered none of them.
 * `PortalOutlet` is on it because a portal with no outlet renders nothing at
 * all, which reads as "the menu doesn't open".
 *
 * Each entry carries the module it comes from, because this list is a
 * hand-maintained map of NAMES and that is exactly the shape that erodes into a
 * gate which cannot fail. It has already happened once here: the consolidation
 * replaced `BloomDialogProvider` with `surfaces`' `SurfaceProvider`, and until
 * the staleness test below existed the only signal was this gate reporting the
 * harness broken when the harness was correct and the LIST was wrong. A renamed
 * or deleted provider must fail as "re-point this gate", never as "the harness
 * stopped mounting it" and never silently.
 */
const REQUIRED_PROVIDERS: { name: string; from: string }[] = [
  { name: 'SafeAreaProvider', from: 'react-native-safe-area-context' },
  { name: 'BloomThemeProvider', from: '../theme' },
  { name: 'PortalProvider', from: '../portal' },
  { name: 'PortalOutlet', from: '../portal' },
  { name: 'SurfaceProvider', from: '../surfaces' },
];

/**
 * Props on `BloomThemeProvider` whose whole job is to turn a subsystem OFF.
 * Passing one from the harness is banned in EITHER direction — `fonts={true}`
 * is equivalent to the default today, but writing the prop at all makes the
 * shape look ordinary and puts the flip one character away. The harness takes
 * the default, so the harness exercises what a consumer gets.
 *
 * The stale-name test below asserts each entry is still a real prop of
 * `BloomThemeProviderProps`: a renamed prop would otherwise leave this scan
 * hunting a name nobody writes, which is a gate that cannot fail.
 */
const SUBSYSTEM_TOGGLES: { prop: string; why: string }[] = [
  {
    prop: 'fonts',
    why: 'false makes FontLoader a pass-through: no @font-face rules, no --bloom-font-* vars, no font bytes requested — every story renders in the browser fallback while fontFamily still reads as the Bloom stack',
  },
];

const previewExists = existsSync(PREVIEW);
const previewSource = previewExists ? readFileSync(PREVIEW, 'utf8') : '';

function parse(file: string, source: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

interface JsxUsage {
  /** Tag as written, e.g. `BloomThemeProvider` or `Portal.Outlet`. */
  name: string;
  /** Named attributes, in source order. Spreads are counted separately. */
  attributes: string[];
  /** `{...props}` hides what is being passed, so the scan reports it rather than reading past it. */
  spreads: number;
  line: number;
}

/** Every JSX element opened in a file, with the attributes written on it. */
function jsxUsages(source: ts.SourceFile): JsxUsage[] {
  const found: JsxUsage[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attributes: string[] = [];
      let spreads = 0;

      for (const attribute of node.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attribute)) {
          spreads += 1;
          continue;
        }
        attributes.push(attribute.name.getText(source));
      }

      found.push({
        name: node.tagName.getText(source),
        attributes,
        spreads,
        line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      });
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return found;
}

/** Declared member names of an interface, or `[]` if it is not in the file. */
function interfaceMembers(file: string, name: string): string[] {
  const source = parse(file, readFileSync(file, 'utf8'));

  for (const statement of source.statements) {
    if (!ts.isInterfaceDeclaration(statement) || statement.name.text !== name) continue;
    return statement.members
      .map((member) => member.name?.getText(source))
      .filter((member): member is string => member !== undefined);
  }

  return [];
}

describe('Storybook preview mounts the shipping Bloom stack', () => {
  const usages = previewExists ? jsxUsages(parse(PREVIEW, previewSource)) : [];
  const themeProviders = usages.filter((usage) => usage.name === 'BloomThemeProvider');

  // Vacuity floor. Everything else in this file is an ABSENCE claim, and an
  // absence is exactly what a missing file, an emptied file or a parse that
  // recovered nothing also reports. Positive markers first, in the same currency
  // as the measurement: the same parse, the same element, the same attribute
  // reader.
  it('reads a real preview file and recovers its JSX', () => {
    expect(previewExists).toBe(true);
    expect(previewSource.length).toBeGreaterThanOrEqual(MIN_PREVIEW_BYTES);
    expect(previewSource).toContain('BloomThemeProvider');
    expect(previewSource).toContain('SafeAreaProvider');

    // Exactly one theme provider: two would mean the assertions below could pass
    // against the wrong one.
    expect(themeProviders.map((usage) => usage.name)).toEqual(['BloomThemeProvider']);

    // The attribute reader is alive on the element the next test measures —
    // without this, "no `fonts` attribute" and "attributes were never parsed"
    // are the same result.
    const [themeProvider] = themeProviders;
    expect(themeProvider?.attributes).toEqual(expect.arrayContaining(['mode', 'colorPreset']));
  });

  // Runs BEFORE the mounting check, deliberately: if a name on the list is no
  // longer exported, the mounting check below is scanning for something nobody
  // can write, and its failure would be read as a broken harness. The module is
  // REQUIRED rather than grepped — `PortalProvider` and `PortalOutlet` reach the
  // barrel through `export * from './portal'`, so a source scan of `index.ts`
  // reports them absent while both are live exports.
  it('names providers that are still real exports', () => {
    const stale: string[] = [];
    const resolved: string[] = [];

    for (const { name, from } of REQUIRED_PROVIDERS) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module: Record<string, unknown> = require(from);
      const value = module[name];

      if (value === undefined) {
        stale.push(
          `'${name}' is no longer exported by '${from}' — this gate is scanning the preview for a ` +
            'name nobody can write; re-point it at the provider that replaced it',
        );
        continue;
      }
      resolved.push(name);
    }

    // Both halves together: nothing stale, AND every name was actually looked
    // up. A module that failed to load would otherwise leave `stale` empty for
    // the same reason a healthy one does.
    expect({ stale, resolved: resolved.length }).toEqual({
      stale: [],
      resolved: REQUIRED_PROVIDERS.length,
    });
  });

  it('mounts every provider a consuming app mounts', () => {
    const mounted = new Set(usages.map((usage) => usage.name));
    const missing = REQUIRED_PROVIDERS.map(({ name }) => name).filter(
      (provider) => !mounted.has(provider),
    );

    expect(missing).toEqual([]);
  });

  it('never disables a Bloom subsystem on <BloomThemeProvider>', () => {
    const offenders: string[] = [];

    for (const usage of themeProviders) {
      for (const { prop, why } of SUBSYSTEM_TOGGLES) {
        if (!usage.attributes.includes(prop)) continue;
        offenders.push(
          `.storybook/preview.tsx:${usage.line}  <BloomThemeProvider ${prop}={…}> — leave it at ` +
            `its default so the harness renders what a consumer gets: ${why}`,
        );
      }
    }

    // Both halves in one assertion: the offender list, and the proof that the
    // element it was computed from was actually found.
    expect({ offenders, scanned: themeProviders.length }).toEqual({ offenders: [], scanned: 1 });
  });

  it('passes no spread props to <BloomThemeProvider>', () => {
    // A spread is not itself a bug — it is a blind spot. This scan reads names
    // off the JSX, so `{...opts}` would let a `fonts: false` through with every
    // assertion above still green. If one is ever needed, the check has to move
    // to whatever object is being spread.
    const spreading = themeProviders
      .filter((usage) => usage.spreads > 0)
      .map(
        (usage) =>
          `.storybook/preview.tsx:${usage.line}  <BloomThemeProvider {...}> — this gate cannot ` +
          'see through a spread; pass the props explicitly',
      );

    expect(spreading).toEqual([]);
  });

  it('names toggles the provider actually declares', () => {
    const declared = interfaceMembers(PROVIDER, 'BloomThemeProviderProps');

    // Floor for this scan too: an interface that failed to parse yields an empty
    // member list, which would make the check below pass by finding nothing.
    expect(declared.length).toBeGreaterThan(10);
    expect(declared).toEqual(expect.arrayContaining(['mode', 'colorPreset', 'children']));

    const stale = SUBSYSTEM_TOGGLES.filter(({ prop }) => !declared.includes(prop)).map(
      ({ prop }) =>
        `'${prop}' is no longer a prop of BloomThemeProviderProps — this gate is scanning for a ` +
        'name nobody can write; re-point it at the prop that replaced it',
    );

    expect(stale).toEqual([]);
  });
});
