/**
 * @jest-environment node
 */

/**
 * Every element in the source that carries `aria-describedby` carries
 * `accessibilityHint` beside it — so a control that describes itself on the web
 * and says nothing of it on native FAILS by default.
 *
 * React Native drops `aria-describedby` before it reaches the platform: a
 * field's description and its error were never said with the field on iOS,
 * Android or OxyOS, in every family that wired them, and nothing showed it,
 * because the id list was right and the web read it. The texts it names now
 * reach native as the hint (`hooks/use-described-by-hint.ts`, through
 * `useFieldMembership()`'s `accessibilityHint` for a Field member). This scans
 * the SOURCE for the one way that rots: a new element given the id list and not
 * the hint. `FieldMembership.test.tsx` and `DescribedByHint.test.tsx` are the
 * runtime half, asserting what the hint says.
 *
 * Web forks (`*.web.tsx`) are out of scope: the web reads the list itself.
 * The exemptions are pinned by EQUALITY, each with the reason it needs none, so
 * one that stops being true, or a new one, fails here.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const SRC = join(__dirname, '..');

/** `file:element`, and why the element needs no hint of its own. */
const EXEMPT: Record<string, string> = {
  // The sheet's `aria-*` are web-only (`Platform.OS === 'web' ? … : undefined`);
  // on native the dialog's panel inside it carries the description and the hint.
  'bottom-sheet/BottomSheetBase.tsx:Animated.View': 'web-only semantics',
  'dialog/DialogBottomSheet.tsx:BottomSheet': 'forwarded to the web-only sheet semantics',
  // `TextFieldInput` resolves the hint from the id list it is given; a hint
  // resolved here too would be said twice.
  'card-form/CardFormParts.tsx:TextFieldInput': 'resolved by TextFieldInput',
  // The web branch of the radio host: a DOM `<button>`.
  'radio/RadioHost.tsx:button': 'web DOM element',
  // The field's id props, spread onto both inputs; the hint is set on each.
  'text-field/TextField.tsx:object': 'the hint is set beside the spread',
};

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === '__tests__' || name === '__mocks__') continue;
      out.push(...sourceFiles(path));
    } else if (
      /\.tsx?$/.test(name) &&
      !/\.web\.tsx?$/.test(name) &&
      !/\.stories\.tsx$/.test(name) &&
      !/\.d\.ts$/.test(name)
    ) {
      out.push(path);
    }
  }
  return out;
}

function propertyName(name: ts.PropertyName | ts.JsxAttributeName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  if (ts.isJsxNamespacedName(name)) return undefined;
  return undefined;
}

function isUndefined(expression: ts.Expression | undefined): boolean {
  return expression != null && ts.isIdentifier(expression) && expression.text === 'undefined';
}

/** Every element or props object carrying `aria-describedby` and no hint. */
function missing(): string[] {
  const found: string[] = [];
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes('aria-describedby')) continue;
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const rel = relative(SRC, file);
    const visit = (node: ts.Node) => {
      if (ts.isJsxAttributes(node)) {
        const attributes = node.properties.filter(ts.isJsxAttribute);
        const names = attributes.map((attribute) => propertyName(attribute.name));
        if (names.includes('aria-describedby')) {
          const hint = attributes.find(
            (attribute) => propertyName(attribute.name) === 'accessibilityHint',
          );
          const value =
            hint?.initializer && ts.isJsxExpression(hint.initializer)
              ? hint.initializer.expression
              : undefined;
          if (!hint || isUndefined(value)) {
            const element = node.parent as ts.JsxOpeningLikeElement;
            found.push(`${rel}:${element.tagName.getText(source)}`);
          }
        }
      } else if (ts.isObjectLiteralExpression(node)) {
        const assignments = node.properties.filter(ts.isPropertyAssignment);
        const names = assignments.map((property) => propertyName(property.name));
        if (names.includes('aria-describedby') && !names.includes('accessibilityHint')) {
          found.push(`${rel}:object`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return Array.from(new Set(found)).sort();
}

describe('aria-describedby reaches native as accessibilityHint', () => {
  const found = missing();

  it('every element carrying aria-describedby carries accessibilityHint, or is exempted', () => {
    expect(found.filter((entry) => !(entry in EXEMPT))).toEqual([]);
  });

  it('every exemption is still needed (equality)', () => {
    expect(Object.keys(EXEMPT).sort()).toEqual(found.filter((entry) => entry in EXEMPT));
  });
});
