import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import * as ts from 'typescript';

import { WEB_POSITION_FIXED, WEB_POSITION_STICKY, WEB_SURFACE_STICKY_TOP } from '../styles/web-view-style';

/**
 * `position: fixed` is web-only CSS that React Native's `ViewStyle` does not
 * model, so every web fork used to assert it inline. Thirteen sites spelled it
 * `position: 'fixed' as 'absolute'` — not a widening but an outright FALSE
 * assertion to the compiler (the value is not `'absolute'`), which would survive
 * a rename and reads as if the style were absolute. One more used
 * `as ViewStyle['position']`.
 *
 * They now all import `WEB_POSITION_FIXED`, whose single documented cast lives in
 * `styles/web-view-style.ts`. This guard stops the inline spellings coming back.
 *
 * `WEB_POSITION_STICKY` is the same gap for `'sticky'` (a surface that pins
 * itself within its own scroll container, e.g. `rail/Rail.tsx`, rather than to
 * the viewport). Each documented crossing below is named and typed explicitly;
 * an extra cast or a cast to the wrong RN property fails the census.
 */

const SRC = join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const files = sourceFiles(SRC);

describe('web position: fixed', () => {
  it('resolves to the CSS value at runtime', () => {
    expect(WEB_POSITION_FIXED).toBe('fixed');
    expect(WEB_POSITION_STICKY).toBe('sticky');
    expect(WEB_SURFACE_STICKY_TOP).toBe('var(--bloom-panel-sticky-top, 0px)');
  });

  it('finds source files to scan (guards against a broken walk)', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it.each([
    ["position: 'fixed' as 'absolute'", /position:\s*'fixed'\s+as\s+'absolute'/],
    ["position: 'fixed' as ViewStyle['position']", /position:\s*'fixed'\s+as\s+ViewStyle/],
    ['a bare position: fixed literal', /position:\s*'fixed'\s*,/],
  ])('has no %s left in src', (_label, pattern) => {
    const offenders = files.filter((file) => {
      const source = readFileSync(file, 'utf8')
        // Comments may still discuss the retired spelling.
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      return pattern.test(source);
    });
    expect(offenders.map((f) => f.replace(`${SRC}/`, ''))).toEqual([]);
  });

  it('keeps only the documented casts inside styles/web-view-style.ts', () => {
    const source = ts.createSourceFile('web-view-style.ts',
      readFileSync(join(SRC, 'styles/web-view-style.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
    const crossings: { owner: string; type: string }[] = [];
    function visit(node: ts.Node) {
      if (ts.isAsExpression(node)) {
        let owner: ts.Node | undefined = node.parent;
        while (owner && !ts.isVariableDeclaration(owner) && !ts.isFunctionDeclaration(owner)) owner = owner.parent;
        crossings.push({
          owner: owner && (ts.isVariableDeclaration(owner) || ts.isFunctionDeclaration(owner))
            ? owner.name?.getText(source) ?? '<anonymous>' : '<unknown>',
          type: node.type.getText(source),
        });
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    const runtimeExports = source.statements.flatMap(statement => {
      const exported = ts.canHaveModifiers(statement)
        && ts.getModifiers(statement)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
      if (!exported || ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) return [];
      if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.map(declaration => declaration.name.getText(source));
      if (ts.isFunctionDeclaration(statement)) return [statement.name?.getText(source) ?? '<anonymous>'];
      return [statement.getText(source)];
    });
    expect(runtimeExports).toEqual([
      'WEB_POSITION_FIXED', 'WEB_POSITION_STICKY', 'WEB_SURFACE_STICKY_TOP',
      'WEB_VIEWPORT_HEIGHT', 'webViewportHeightMinus', 'WEB_OVERFLOW_CLIP',
    ]);
    expect(crossings).toEqual([
      { owner: 'WEB_POSITION_FIXED', type: "ViewStyle['position']" },
      { owner: 'WEB_POSITION_STICKY', type: "ViewStyle['position']" },
      { owner: 'WEB_SURFACE_STICKY_TOP', type: "ViewStyle['top']" },
      { owner: 'WEB_VIEWPORT_HEIGHT', type: "ViewStyle['height']" },
      { owner: 'webViewportHeightMinus', type: "ViewStyle['height']" },
      { owner: 'WEB_OVERFLOW_CLIP', type: "ViewStyle['overflow']" },
    ]);
  });

  it('is imported by every fork that positions something fixed', () => {
    const importers = files.filter((file) =>
      readFileSync(file, 'utf8').includes('WEB_POSITION_FIXED'),
    );
    // The 9 consumers plus the module that defines it.
    //
    // This floor went from 11 to 10 when the four anchored families and the
    // select dropdown stopped positioning themselves and started rendering
    // `floating/FloatingPanel`. That is a CONSOLIDATION, not an erosion — one
    // importer now does the positioning that four used to — which is why the
    // decrement comes with the assertion below rather than on its own. A floor
    // that only ever ratchets down is a gate switching itself off.
    expect(importers.length).toBeGreaterThanOrEqual(10);
    expect(importers.map((f) => f.replace(`${SRC}/`, ''))).toContain(
      'floating/FloatingPanel.tsx',
    );
  });
});
