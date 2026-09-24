/**
 * @jest-environment node
 */

/**
 * No new PHYSICAL edge in the page frame's families.
 *
 * `AppShell`, `Sidebar`, `BottomBar` and the tab bar under it mirror for
 * right-to-left layouts by two means (`docs/app-shell.mdx`, "Right-to-left"):
 * logical insets, and `useIsRtl()` for the signs a logical key cannot express. A
 * single `paddingLeft: 12` or `left: 0` added later breaks that silently — the
 * build is green, left-to-right is pixel-identical, and only an Arabic or Hebrew
 * user sees a rail hugging the wrong edge. This scans the source for exactly that.
 *
 * Rules, per object literal (TypeScript AST, so comments and strings are not
 * mistaken for style):
 *
 *   1. `left`/`right`, `paddingLeft`/`paddingRight`, `marginLeft`/`marginRight`
 *      appear as a PAIR with the SAME value expression, or not at all. A
 *      symmetric pair is direction-neutral; anything else is an edge.
 *   2. `borderLeft*`, `borderRight*` and the four physical corner radii never
 *      appear.
 *   3. React Native's `paddingStart`/`paddingEnd`/`marginStart`/`marginEnd` never
 *      appear either — use the CSS spelling (`paddingInlineStart`, …). Inside a
 *      reanimated mapper the RN spelling is DROPPED on web: reanimated hands the
 *      mapper's result to react-native-web's `createReactDOMStyle`, which does not
 *      rewrite it, and `style.paddingStart` is not a CSS property. The CSS
 *      spelling works in both paths and on native (Fabric parses it).
 *
 * And per file:
 *
 *   4. A file that writes a `translateX`/`scaleX`/`skewX`, a `transformOrigin`,
 *      or a floating `side=` reads `useIsRtl` — those are signs, and nothing
 *      mirrors a sign for you.
 *   5. `className` strings carry no one-sided utility (`ml-`, `pl-`, `border-l`,
 *      `rounded-r-`, `text-left`, an unpaired `left-`/`right-`).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const SRC = join(__dirname, '..');
const ROOTS = ['app-shell', 'sidebar', 'bottom-bar', 'tab-bar'] as const;

const PAIRS: Array<[string, string]> = [
  ['left', 'right'],
  ['paddingLeft', 'paddingRight'],
  ['marginLeft', 'marginRight'],
];
const BANNED = /^(border(Left|Right)\w*|border(Top|Bottom)(Left|Right)Radius|paddingStart|paddingEnd|marginStart|marginEnd)$/;
const SIGNS = /\b(translateX|scaleX|skewX|transformOrigin)\b|\bside=/;
const ONE_SIDED_CLASS = /(^|\s)(-?m[lr]-|p[lr]-|border-[lr](\s|-|$)|rounded-[lr]-|rounded-(tl|tr|bl|br)-|text-(left|right)(\s|$))/;

function files(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== '__tests__') out.push(...files(path));
    } else if (/\.tsx?$/.test(entry) && !/\.stories\.tsx$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

function nameOf(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return null;
}

/** Every offense in one source text. Exported shape kept tiny so the self-test can feed it strings. */
function scan(file: string, text: string): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const where = (node: ts.Node) => `${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`;
  const offenses: string[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isObjectLiteralExpression(node)) {
      const values = new Map<string, string>();
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property)) {
          const name = nameOf(property.name);
          if (name) values.set(name, property.initializer.getText(source).replace(/\s+/g, ' '));
        } else if (ts.isShorthandPropertyAssignment(property)) {
          values.set(property.name.text, property.name.text);
        }
      }
      for (const [a, b] of PAIRS) {
        const va = values.get(a);
        const vb = values.get(b);
        if ((va === undefined) !== (vb === undefined)) offenses.push(`${where(node)} ${va !== undefined ? a : b} without ${va !== undefined ? b : a}`);
        else if (va !== undefined && va !== vb) offenses.push(`${where(node)} ${a}: ${va} differs from ${b}: ${vb}`);
      }
      for (const name of values.keys()) if (BANNED.test(name)) offenses.push(`${where(node)} ${name}`);
    }
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'className' && node.initializer) {
      const literal = node.initializer.getText(source);
      if (ONE_SIDED_CLASS.test(literal.replace(/^["'`{]+|["'`}]+$/g, ''))) offenses.push(`${where(node)} className ${literal}`);
      const left = /(^|[\s"'`])left-/.test(literal);
      const right = /(^|[\s"'`])right-/.test(literal);
      if (left !== right) offenses.push(`${where(node)} className ${literal} (unpaired ${left ? 'left-' : 'right-'})`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  if (SIGNS.test(code) && !/\buseIsRtl\b/.test(code)) offenses.push(`${file} writes a sign (${code.match(SIGNS)![0]}) without reading useIsRtl`);
  return offenses;
}

describe('page-frame families carry no physical edge', () => {
  const all = ROOTS.flatMap(root => files(join(SRC, root)));

  it('walks the families it names', () => {
    // A walk that silently finds nothing would pass everything.
    expect(all.length).toBeGreaterThanOrEqual(40);
    for (const root of ROOTS) expect(all.some(file => file.includes(`${root}/`))).toBe(true);
  });

  it('finds no offense', () => {
    const offenses = all.flatMap(file => scan(relative(SRC, file), readFileSync(file, 'utf8')));
    expect(offenses).toEqual([]);
  });

  // The rules are only worth something if each one can fail.
  it.each([
    ['an unpaired physical inset', `const s = { position: 'absolute', left: 0 };`],
    ['an asymmetric pair', `const s = { paddingLeft: 8, paddingRight: 10 };`],
    ['a one-sided margin inside a mapper', `useAnimatedStyle(() => ({ marginLeft: 10 * p.value }), [p]);`],
    ['a physical border', `const s = { borderRightWidth: 1 };`],
    ['the RN logical spelling a web mapper drops', `useAnimatedStyle(() => ({ paddingStart: 8 }), []);`],
    ['a sign with no direction', `useAnimatedStyle(() => ({ transform: [{ translateX: 4 }] }), []);`],
    ['a physical floating side with no direction', `const x = <PopoverContent side="right" />;`],
    ['a one-sided utility class', `const x = <View className="absolute pl-4" />;`],
    ['an unpaired positioning class', `const x = <View className="absolute left-0 top-0" />;`],
  ])('catches %s', (_label, text) => {
    expect(scan('probe.tsx', text).length).toBeGreaterThan(0);
  });

  it.each([
    ['a symmetric pair', `const s = { paddingLeft: 8, paddingRight: 8, left: 0, right: 0 };`],
    ['logical insets', `useAnimatedStyle(() => ({ paddingInlineStart: 8, insetInlineEnd: 4 }), []);`],
    ['a sign read from the direction', `const dir = useIsRtl() ? -1 : 1; const s = { transform: [{ translateX: dir * 4 }] };`],
    ['a paired positioning class', `const x = <View className="absolute bottom-0 left-0 right-0" />;`],
  ])('passes %s', (_label, text) => {
    expect(scan('probe.tsx', text)).toEqual([]);
  });
});
