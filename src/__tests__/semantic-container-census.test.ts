import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

/**
 * Every native view that carries a grouping role keeps its children
 * (`collapsable={false}`): a navigation list and its rows, a menu and its
 * items, a tab bar, a radio or segmented group, a button group.
 *
 * React Native's renderer flattens a view that forms no stacking context and
 * mounts its children in the nearest ancestor that forms one. A role and a
 * label do not form one (`ViewShadowNode::initialize`: only `accessible`,
 * `collapsable={false}`, opacity, transforms, clipping, events and the like
 * do). The view itself may survive as a leaf, so an assistive technology
 * reading the mounted tree (OxyOS's, Android's TalkBack) found an empty
 * "Settings sections" navigation beside loose rows, and an empty toolbar group
 * beside loose Back and Forward buttons.
 *
 * The census reads every native-reachable `.tsx` (web forks are the DOM's)
 * for JSX whose `role` / `accessibilityRole` is a grouping role, or an
 * expression that may be one (a role forwarded from a prop). Each such element
 * either keeps its children itself (`collapsable={false}`, or `accessible`,
 * which forms a stacking context) or is classified below: a host that is never
 * flattened, or a component that forwards the role to a view this census
 * checks. The classification is an EQUALITY: a new unclassified component
 * fails, and so does a stale entry.
 */

const sourceRoot = resolve(__dirname, '..');

/** Roles whose node holds other nodes: the ones an assistive technology groups by. */
const GROUPING_ROLES = new Set([
  'alertdialog',
  'article',
  'banner',
  'complementary',
  'contentinfo',
  'dialog',
  'feed',
  'form',
  'grid',
  'group',
  'list',
  'listbox',
  'main',
  'menu',
  'menubar',
  'navigation',
  'radiogroup',
  'region',
  'row',
  'rowgroup',
  'search',
  'summary',
  'table',
  'tablist',
  'tabpanel',
  'toolbar',
  'tree',
  'treegrid',
  'viewgroup',
]);

/** Components that carry a grouping role without being a flattenable view, and why. */
const CLASSIFIED: Record<string, string> = {
  // Hosts that are never flattened.
  Pressable: 'accessible by default: forms a stacking context',
  StyledPressable: 'a Pressable',
  HoldPressable: 'a Pressable',
  ScrollArea: 'a ScrollView host, which is never flattened',
  ScreenScrollView: 'a ScrollView host, which is never flattened',
  RNText: 'a Text host: its role is a leaf role or the web’s',
  TextFieldInput: 'a TextInput host, which is never flattened',
  div: 'the DOM (a web branch)',
  PopupSurface: 'the platform’s popup: a surface of its own, its view the tree’s root',
  // Components that forward the role to a view this census checks.
  ChipRow: 'forwards `role` to its row View (collapsable)',
  BlurIsland: 'forwards `role` to its island View (collapsable)',
  MapAttributionShell: 'forwards `role` to a View or a BlurIsland (collapsable)',
  FloatingPanel: 'forwards `role` to its AnimatedPanel (collapsable)',
  PopupPanel: 'forwards `role` to the PopupSurface or its AnimatedPanel',
  RadioGroupHost: 'renders a StyledView with collapsable={false} natively',
  Item: 'forwards `role` to its Pressable',
  // Not an accessibility role.
  AgentChatMessage: "`role` is the message's author (user, assistant)",
};

function nativeSources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== '__tests__') nativeSources(path, out);
    } else if (/\.tsx$/.test(name) && !/\.web\.tsx$|\.stories\.tsx$/.test(name)) {
      out.push(path);
    }
  }
  return out;
}

interface Found {
  where: string;
  tag: string;
  role: string;
  keeps: boolean;
}

function roleKind(value: ts.Expression): 'grouping' | 'leaf' | 'maybe' {
  if (ts.isStringLiteral(value)) return GROUPING_ROLES.has(value.text) ? 'grouping' : 'leaf';
  const literals: string[] = [];
  const collect = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      literals.push(node.text);
    ts.forEachChild(node, collect);
  };
  collect(value);
  if (literals.some((text) => GROUPING_ROLES.has(text))) return 'grouping';
  // A choice between leaf roles (`pressable ? 'button' : undefined`) is a leaf;
  // anything else (a role forwarded from a prop or a constant) may group.
  const isLeaf = (node: ts.Expression): boolean =>
    ts.isStringLiteral(node) ||
    (ts.isIdentifier(node) && node.text === 'undefined') ||
    (ts.isParenthesizedExpression(node) && isLeaf(node.expression)) ||
    (ts.isConditionalExpression(node) && isLeaf(node.whenTrue) && isLeaf(node.whenFalse));
  return isLeaf(value) ? 'leaf' : 'maybe';
}

function census(): Found[] {
  const found: Found[] = [];
  for (const file of nativeSources(sourceRoot)) {
    const ast = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const attributes = new Map<string, ts.JsxAttribute>();
        for (const attribute of node.attributes.properties)
          if (ts.isJsxAttribute(attribute)) attributes.set(attribute.name.getText(), attribute);
        const role = attributes.get('role') ?? attributes.get('accessibilityRole');
        const initializer = role?.initializer;
        const value =
          initializer && ts.isJsxExpression(initializer) ? initializer.expression : initializer;
        if (value) {
          const kind = roleKind(value);
          if (kind !== 'leaf') {
            const accessible = attributes.get('accessible');
            const keeps =
              attributes.has('collapsable') ||
              (accessible !== undefined && accessible.initializer?.getText() !== '{false}');
            const { line } = ast.getLineAndCharacterOfPosition(node.getStart());
            found.push({
              where: `${relative(sourceRoot, file)}:${line + 1}`,
              tag: node.tagName.getText(),
              role: value.getText(),
              keeps,
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  return found;
}

describe('semantic containers keep their children', () => {
  const found = census();

  it('finds the containers it is about (the census is falsifiable)', () => {
    const where = found.map((entry) => entry.where);
    expect(where).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^button-group\/ButtonGroupBase\.tsx:/),
        expect.stringMatching(/^settings-modal\/SettingsModalBase\.tsx:/),
        expect.stringMatching(/^sidebar\/Sidebar\.tsx:/),
        expect.stringMatching(/^segmented-control\/SegmentedControl\.tsx:/),
      ]),
    );
    expect(found.length).toBeGreaterThan(150);
  });

  it('every grouping view keeps its children, or its component is classified', () => {
    const loose = found
      .filter((entry) => !entry.keeps && !(entry.tag in CLASSIFIED))
      .map((entry) => `${entry.where} <${entry.tag} role=${entry.role}>`);
    expect(loose).toEqual([]);
  });

  it('the classification is exactly the components found (EQUALITY)', () => {
    const tags = new Set(found.filter((entry) => !entry.keeps).map((entry) => entry.tag));
    expect(Object.keys(CLASSIFIED).filter((tag) => !tags.has(tag))).toEqual([]);
  });
});
