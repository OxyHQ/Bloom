/**
 * The codemod: one source file's JSX regions rewritten as language chains.
 *
 * A region is a JSX element the codemod converts whole, with everything
 * inside it: React Native's `View` and `Pressable` (a stack), Bloom's `Text`
 * (`@oxy.so/bloom/typography`) and Bloom's icons. A child it cannot convert
 * stays JSX inside the chain (`Embed`), and its own children are regions of
 * their own. An element that cannot convert stays as it is and is reported
 * with every reason. A region is placed back in its JSX with `toElement()`.
 *
 * Nothing is guessed: each utility lands through the className table
 * (`resolve.ts`), each prop through the short list below, and anything else
 * is a reason.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as recast from 'recast';
import * as babelTs from 'recast/parsers/babel-ts';

import {
  type ComponentRule,
  DIALOG_PLACEMENT,
  type Form,
  KEPT,
  PLACEMENT_TIERS,
  type PropRule,
  REMOVED,
  ruleFor,
  SCREEN,
  SPACE,
  TEXT_STYLES,
} from './components';
import {
  type HostKind,
  heldVariantChanges,
  type Reason,
  type Resolved,
  resolveClassName,
} from './resolve';
import { ABSOLUTE_FILL, type StyleRead, styleUtilities, textDeclaration } from './style';
import { type Arg, LANGUAGE_PACKAGE, type Mod, type Table } from './table';

// biome-ignore lint/suspicious/noExplicitAny: recast's AST nodes are untyped here.
type AnyNode = any;

const n = recast.types.namedTypes;

const spec = JSON.parse(readFileSync(join(LANGUAGE_PACKAGE, 'spec/language.json'), 'utf8')) as {
  scales: {
    iconSize: Record<string, number>;
    opacity: Record<string, number>;
    hitSlop: Record<string, number>;
  };
  typeRamp: Record<string, unknown>;
  colors: Record<string, [themeKey: string, css: string] | string>;
  enums: {
    role: readonly string[];
    appColorName: readonly string[];
    liveRegion: readonly string[];
  };
  contentView: { modifiers: readonly string[] };
  nodes: Record<
    string,
    { constructors?: readonly string[]; modifiers?: readonly string[]; universal?: false } | string
  >;
  universal: readonly string[];
};
/** The roles the universal `.role()` takes, each React Native's `accessibilityRole` of its name. */
const ROLES = new Set(spec.enums.role);
/** What a scroll view's content view takes: the layout of one view. */
const CONTENT_VIEW = new Set(spec.contentView.modifiers);
/** The modifiers each constructor's node takes: its own, and the universal ones unless it opts out. */
const NODE_MODIFIERS = new Map<string, ReadonlySet<string>>();
for (const node of Object.values(spec.nodes)) {
  if (typeof node === 'string') continue;
  const taken = new Set([
    ...(node.modifiers ?? []),
    ...(node.universal === false ? [] : spec.universal),
  ]);
  for (const constructor of node.constructors ?? []) NODE_MODIFIERS.set(constructor, taken);
}
/** React Native's `accessibilityLiveRegion` values, each the language's `.liveRegion()` of its name. */
const LIVE_REGIONS = new Set(spec.enums.liveRegion);
/** An opacity (`0.7`) as the opacity token of its value (`'70'`): a `TouchableOpacity`'s `activeOpacity`. */
const OPACITY_TOKEN = new Map(
  Object.entries(spec.scales.opacity)
    .filter(([name]) => name !== '$comment')
    .map(([name, value]) => [value, name]),
);
/** A hit slop in points (`8`) as the hit slop token of its value (`'md'`); a name of Bloom's (`tokens.hitSlop.md`) as itself. */
const HIT_SLOP = Object.fromEntries(
  Object.entries(spec.scales.hitSlop).filter(([name]) => name !== '$comment'),
) as Record<string, number>;
const HIT_SLOP_TOKEN = new Map(Object.entries(HIT_SLOP).map(([name, value]) => [value, name]));

/** One side's slop: a static number, or Bloom's `tokens.hitSlop.<name>`, as its token. */
function hitSlopToken(value: AnyNode): string | undefined {
  const number = staticNumber(value);
  if (number !== undefined) return HIT_SLOP_TOKEN.get(number);
  const expression = n.JSXExpressionContainer.check(value) ? value.expression : value;
  if (
    n.MemberExpression.check(expression) &&
    !expression.computed &&
    n.Identifier.check(expression.property) &&
    n.MemberExpression.check(expression.object) &&
    n.Identifier.check(expression.object.property) &&
    expression.object.property.name === 'hitSlop' &&
    expression.property.name in HIT_SLOP
  )
    return expression.property.name;
  return undefined;
}

/**
 * React Native's `hitSlop` as `.hitSlop()` calls: one slop is one call; an
 * object of static sides is a call per pair of equal opposite sides (or per
 * side), only the sides it names. Undefined when any side is no token.
 */
function hitSlopCalls(value: AnyNode): Arg[][] | undefined {
  const one = hitSlopToken(value);
  if (one !== undefined) return [[one]];
  const object = n.JSXExpressionContainer.check(value) ? value.expression : value;
  if (!n.ObjectExpression.check(object)) return undefined;
  const sides: Record<string, string> = {};
  for (const property of object.properties) {
    if (
      !(n.ObjectProperty.check(property) || n.Property.check(property)) ||
      property.computed ||
      !n.Identifier.check(property.key) ||
      !['top', 'bottom', 'left', 'right'].includes(property.key.name)
    )
      return undefined;
    const token = hitSlopToken(property.value);
    if (token === undefined) return undefined;
    sides[property.key.name] = token;
  }
  const { top, bottom, left, right } = sides;
  if (top !== undefined && top === bottom && bottom === left && left === right) return [[top]];
  const calls: Arg[][] = [];
  const pair = (
    edge: string,
    a: string | undefined,
    b: string | undefined,
    sideA: string,
    sideB: string,
  ) => {
    if (a !== undefined && a === b) calls.push([edge, a]);
    else {
      if (a !== undefined) calls.push([sideA, a]);
      if (b !== undefined) calls.push([sideB, b]);
    }
  };
  pair('vertical', top, bottom, 'top', 'bottom');
  pair('horizontal', left, right, 'left', 'right');
  return calls;
}

/** A Bloom theme colour (`theme.colors.textSecondary`) as the role painted from it (`muted`). */
const ROLE_OF_THEME_COLOR = new Map<string, string>();
for (const [role, entry] of Object.entries(spec.colors))
  if (Array.isArray(entry) && !ROLE_OF_THEME_COLOR.has(entry[0]))
    ROLE_OF_THEME_COLOR.set(entry[0], role);
const ICON_SIZES = Object.entries(spec.scales.iconSize);
/** A glyph size in points (`28`) as the icon size token of its value (`'xl'`), a named rung over a numeric one. */
const ICON_SIZE_TOKEN = new Map<number, string>();
for (const [name, size] of ICON_SIZES)
  if (typeof size === 'number' && (!/^\d/.test(name) || !ICON_SIZE_TOKEN.has(size)))
    ICON_SIZE_TOKEN.set(size, name);
const RAMP = new Set(Object.keys(spec.typeRamp).filter((k) => !k.startsWith('$')));

/** A content container's padding key as the edge of its content margin. */
const CONTENT_EDGE: Readonly<Record<string, string>> = {
  padding: 'all',
  paddingHorizontal: 'horizontal',
  paddingVertical: 'vertical',
  paddingTop: 'top',
  paddingBottom: 'bottom',
  paddingStart: 'leading',
  paddingEnd: 'trailing',
  paddingLeft: 'left',
  paddingRight: 'right',
};

/** Where an element's component comes from: a module and the name it exports. */
export interface Source {
  readonly module: string;
  readonly imported: string;
}

type Kind =
  | 'view'
  | 'pressable'
  | 'bloomText'
  | 'icon'
  | 'button'
  | 'component'
  | 'kept'
  | 'rnText'
  | 'rnImage';

/** A value carried over from the source as it is (a handler, a text run, an embedded element). */
interface Carried {
  readonly node: AnyNode;
  readonly hole:
    | 'text'
    | 'handler'
    /** A function React Native calls with no arguments, called with none (`() => onRefresh()`). */
    | 'action'
    | 'string'
    | 'number'
    | 'boolean'
    | 'element'
    | 'condition'
    | 'key'
    | 'items'
    /** A list's named row function, called with the argument Bloom hands it (`renderPost(info)`). */
    | 'renderer'
    /** An `accessibilityState` or `accessibilityValue` object. */
    | 'state';
  /** For a key: its attribute, which a fixture's root leaves out (a key is no part of what draws). */
  readonly attribute?: AnyNode;
}

type Ir =
  | {
      type: 'stack';
      resolved: Resolved;
      choice: Choice | null;
      props: PropMod[];
      key: Carried | null;
      children: Ir[];
    }
  | {
      type: 'text';
      /** React Native's own Text: `RawText`. */
      raw: boolean;
      resolved: Resolved;
      choice: Choice | null;
      props: PropMod[];
      key: Carried | null;
      runs: TextRun[];
    }
  | {
      type: 'icon';
      component: string;
      mods: Mod[];
      key: Carried | null;
      /** An app colour it is filled with, `.foreground()` of the file's `defineTokens` table. */
      color?: AppColor;
    }
  | {
      type: 'component';
      node: string;
      /** The Bloom component (`module#export`) it is drawn only inside. */
      within: string | undefined;
      /** The constructor's arguments, its children last. */
      args: Value[];
      props: PropMod[];
      key: Carried | null;
      /** A part of a compound node: the language keys it itself, so its key is not printed. */
      part?: boolean;
    }
  | {
      type: 'button';
      leading: string | null;
      trailing: string | null;
      runs: TextRun[];
      props: PropMod[];
      key: Carried | null;
    }
  | { type: 'embed'; content: Carried }
  /** A route's Screen: its body's root, with the screen modifiers that are its chrome. */
  | { type: 'screen'; content: Ir; props: PropMod[] }
  /** A JSX comment among children, carried into the chain as the same block comment. */
  | { type: 'comment'; text: string }
  | { type: 'cond'; test: Carried; then: Ir | null; otherwise: Ir | null }
  /** `items.map((item) => …)`: its array carried, its function's parameters as written, the view it returns. */
  | { type: 'map'; items: Carried; params: readonly AnyNode[]; body: Ir };

/**
 * A className that is one of two by a condition. When both branches write the
 * same modifiers, `mods` is what the other branch writes, modifier for
 * modifier the chain's, each value that differs written `test ? value :
 * other`. Else the chain is what both write, and `only` what each branch
 * alone adds, `.when(test, …)` and `.when(!test, …)`.
 */
type Choice =
  | { readonly test: Carried; readonly mods: readonly Mod[] }
  | {
      readonly test: Carried;
      readonly only: { readonly whenTrue: readonly Mod[]; readonly whenFalse: readonly Mod[] };
    };

type TextRun = { type: 'string'; value: string } | { type: 'expr'; value: Carried } | Ir;

/**
 * An app colour (`defineTokens({ color })`): a static colour in the file, by its
 * token name (a module constant's own name, else the colour's: `appColorName`), and
 * the constant it is read from.
 */
interface AppColor {
  readonly name: string;
  readonly value: string;
  readonly constant?: string;
  /** Where the icon's fill reads the constant. */
  readonly read?: AnyNode;
}

/** React Native's `pointerEvents` as the language's hit testing (`auto` is the default, left as JSX). */
const HIT_TESTING: Record<string, boolean | string> = {
  none: false,
  'box-none': 'children',
  'box-only': 'self',
};

/**
 * What `defineTokens` takes as a colour (the language's `isAppColorValue`): a
 * hex of 3, 4, 6 or 8 digits, an `rgb()` or `rgba()` of numbers, or a CSS
 * colour name both platforms paint (the spec's `appColorName`).
 */
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB =
  /^rgb\(\s*\d{1,3}\s*(?:,\s*\d{1,3}\s*){2}\)$|^rgba\(\s*\d{1,3}\s*(?:,\s*\d{1,3}\s*){2},\s*(?:0|1|0?\.\d+)\s*\)$/;
const COLOR_NAMES = new Set(spec.enums.appColorName);
const isAppColorValue = (value: string) =>
  HEX.test(value) || RGB.test(value) || COLOR_NAMES.has(value);
/** A colour written out as its token's name: `hex` and its digits, a colour name itself, an rgb()'s numbers joined. */
const appColorName = (value: string) =>
  HEX.test(value)
    ? `hex${value.slice(1)}`
    : COLOR_NAMES.has(value)
      ? value
      : value.replace(/[^\w]+/g, '_').replace(/_$/, '');
/** Bloom's colour scope: inside it, a theme read outside it is another scheme's colour. */
const COLOR_SCOPE = '@oxy.so/bloom/theme#BloomColorScope';
/** The parameter of a list's row that hands a named row function its argument. */
const ROW_INFO = 'info';

/**
 * A value a modifier or a constructor takes: a literal, a carried value, a
 * view, a binding of two carried values, or `undefined` (an optional argument
 * before one that is given).
 */
type Value = Arg | Carried | Tagged;
type Tagged =
  | { readonly $: 'view'; readonly view: Ir }
  | { readonly $: 'binding'; readonly binding: readonly [Value, Value] }
  | { readonly $: 'icon'; readonly name: string }
  | { readonly $: 'options'; readonly entries: readonly (readonly [string, Value])[] }
  /** A list's row: its one parameter, as written, and the view it returns. */
  | { readonly $: 'row'; readonly param: string; readonly view: Ir }
  /** A view's build function: its parameter and the modifiers it chains (`(v) => v.padding('lg')`). */
  | { readonly $: 'build'; readonly mods: readonly Mod[] }
  /** A list's row as a named function, embedded as it is called: `(info) => Embed(renderPost(info))`. */
  | { readonly $: 'renderer'; readonly fn: Carried }
  | { readonly $: 'absent' }
  | { readonly $: 'null' }
  /** A component by its name, as the file imports it (an app's provider around a screen). */
  | { readonly $: 'component'; readonly name: string }
  /** One of two values by a condition, as the app chose (`invalid ? 'error' : undefined`). */
  | {
      readonly $: 'choose';
      readonly test: Carried;
      readonly then: Value;
      readonly otherwise: Value;
    };

const isCarried = (value: Value): value is Carried =>
  typeof value === 'object' && 'hole' in value && 'node' in value;

/** A value of the codemod's own (a style object literal never has a `$` key). */
const isTagged = (value: Value): value is Tagged =>
  typeof value === 'object' && '$' in value && !isCarried(value);

const isAbsent = (value: Value) => isTagged(value) && value.$ === 'absent';

/** Whether an expression holds JSX anywhere (an element is no string, number or flag). */
function hasJsx(expression: AnyNode): boolean {
  let found = false;
  recast.visit(expression, {
    visitJSXElement() {
      found = true;
      return false;
    },
    visitJSXFragment() {
      found = true;
      return false;
    },
  });
  return found;
}

interface PropMod {
  readonly name: string;
  readonly args: Value[];
}

export interface Unconverted {
  readonly line: number;
  readonly element: string;
  readonly reasons: readonly Reason[];
}

export interface Fixture {
  readonly name: string;
  /** The region as written, every carried value a hole. */
  readonly before: string;
  /** The chain the codemod wrote, with the same holes. */
  readonly after: string;
  /** Local names the two sides use, and where each comes from. */
  readonly bindings: Readonly<Record<string, Source>>;
  readonly language: readonly string[];
  readonly classes: readonly string[];
  /** Bloom components (`module#export`) both sides are drawn inside, as the region's nodes are only drawn in them. */
  readonly within: readonly string[];
  /** The before side reads Bloom's theme (`parityTheme`, its `useTheme()`): a fill the chain names by role. */
  readonly themed: boolean;
  /** The before side pads by the device's insets: both sides are drawn under the corpus's (`PARITY_INSETS`). */
  readonly insets: boolean;
  /** The after side is a route's body root, drawn by the language's `ScreenHost` as `screen()` draws it. */
  readonly screen: boolean;
  /** The app colours the chain paints with: the table's local name and each token's colour. */
  readonly appColors: {
    readonly table: string;
    readonly color: Readonly<Record<string, string>>;
  } | null;
}

export interface FileResult {
  readonly code: string;
  readonly changed: boolean;
  /** Elements the codemod considered: View, Pressable, Bloom Text, Bloom icons. */
  readonly candidates: number;
  readonly converted: number;
  readonly regions: number;
  readonly unconverted: readonly Unconverted[];
  readonly fixtures: readonly Fixture[];
  /** Every class written on a considered element. */
  readonly classes: readonly string[];
  /** Bloom components left as JSX (`module#export`), with how often: the next nodes to map. */
  readonly bloomComponents: Readonly<Record<string, number>>;
}

export interface TransformOptions {
  readonly table: Table;
  readonly overridden?: ReadonlySet<string>;
  /** Write a fixture per region, for the parity proof. */
  readonly fixtures?: boolean;
  readonly name?: string;
}

const LANGUAGE_MODULE = '@oxy.so/bloom-language';
/** Bloom's dropdown menu and its parts. */
const DROPDOWN = '@oxy.so/bloom/dropdown-menu';
const SCREEN_KEY = '@oxy.so/bloom/screen#Screen';

/**
 * Bloom's `PressableScale`: a Pressable that eases to a smaller scale under a
 * press, its className on the node that scales. The language's parity pairs it
 * with a pressable stack's `.pressScale()` (parity/pieces.cases.tsx).
 */
function isPressableScale(source: Source): boolean {
  return source.module === '@oxy.so/bloom/pressable-scale' && source.imported === 'PressableScale';
}

/** The import that names an element, by kind. */
function kindOf(source: Source | undefined): Kind | undefined {
  if (!source) return undefined;
  if (source.module === 'react-native') {
    if (source.imported === 'View') return 'view';
    if (source.imported === 'Pressable') return 'pressable';
    // A TouchableOpacity is a pressable whose press fades it: `.pressFade()`.
    if (source.imported === 'TouchableOpacity') return 'pressable';
    if (source.imported === 'Text') return 'rnText';
    if (source.imported === 'Image') return 'rnImage';
    return undefined;
  }
  if (
    source.module === '@oxy.so/bloom/typography' &&
    (source.imported === 'Text' || TEXT_STYLES[source.imported])
  )
    return 'bloomText';
  if (source.module === '@oxy.so/bloom/button' && source.imported === 'Button') return 'button';
  if (isPressableScale(source)) return 'pressable';
  if (ruleFor(source.module, source.imported)) return 'component';
  if (KEPT[`${source.module}#${source.imported}`] || REMOVED[`${source.module}#${source.imported}`])
    return 'kept';
  if (
    (source.module === '@oxy.so/bloom/icons' || source.module.startsWith('@oxy.so/bloom/icons/')) &&
    /^(Ri|Si)[A-Z0-9]\w*$|Icon$/.test(source.imported) &&
    source.module !== '@oxy.so/bloom/icons/shared'
  )
    return 'icon';
  return undefined;
}

/** React's JSX text rule: lines trimmed and joined, an empty result is no child. */
export function cleanJsxText(value: string): string {
  const lines = value.split(/\r\n|\n|\r/);
  let lastNonEmpty = 0;
  lines.forEach((line, i) => {
    if (/[^ \t]/.test(line)) lastNonEmpty = i;
  });
  let out = '';
  lines.forEach((line, i) => {
    let trimmed = line.replace(/\t/g, ' ');
    if (i !== 0) trimmed = trimmed.replace(/^[ ]+/, '');
    if (i !== lines.length - 1) trimmed = trimmed.replace(/[ ]+$/, '');
    if (trimmed) {
      if (i !== lastNonEmpty) trimmed += ' ';
      out += trimmed;
    }
  });
  return out;
}

/**
 * A condition read without a call: names, properties, literals and their
 * comparisons, negations and logic, so reading it again reads the same.
 */
function isPlainRead(node: AnyNode): boolean {
  if (n.Identifier.check(node) || n.Literal.check(node) || n.StringLiteral.check(node)) return true;
  if (n.NumericLiteral.check(node) || n.BooleanLiteral.check(node) || n.NullLiteral.check(node))
    return true;
  if (n.MemberExpression.check(node) || n.OptionalMemberExpression.check(node))
    return isPlainRead(node.object) && (!node.computed || isPlainRead(node.property));
  if (n.UnaryExpression.check(node)) return node.operator === '!' && isPlainRead(node.argument);
  if (n.BinaryExpression.check(node) || n.LogicalExpression.check(node))
    return isPlainRead(node.left) && isPlainRead(node.right);
  return false;
}

/** A condition that is a boolean by its form, so `c && x` never renders a value of `c`. */
function isBooleanForm(node: AnyNode): boolean {
  if (n.BooleanLiteral.check(node)) return true;
  if (n.UnaryExpression.check(node) && node.operator === '!') return true;
  if (
    n.BinaryExpression.check(node) &&
    ['===', '!==', '==', '!=', '<', '>', '<=', '>=', 'in', 'instanceof'].includes(node.operator)
  )
    return true;
  if (n.LogicalExpression.check(node) && node.operator !== '??')
    return isBooleanForm(node.left) && isBooleanForm(node.right);
  if (
    n.CallExpression.check(node) &&
    n.Identifier.check(node.callee) &&
    node.callee.name === 'Boolean'
  )
    return true;
  return false;
}

function jsxName(node: AnyNode): string | undefined {
  const name = node.openingElement.name;
  return n.JSXIdentifier.check(name) ? name.name : undefined;
}

function staticString(value: AnyNode): string | undefined {
  if (!value) return undefined;
  if (n.StringLiteral.check(value) || n.Literal.check(value))
    return typeof value.value === 'string' ? value.value : undefined;
  if (n.JSXExpressionContainer.check(value)) return staticString(value.expression);
  if (n.TemplateLiteral.check(value) && value.expressions.length === 0)
    return value.quasis.map((q: AnyNode) => q.value.cooked).join('');
  return undefined;
}

function staticNumber(value: AnyNode): number | undefined {
  if (n.JSXExpressionContainer.check(value)) return staticNumber(value.expression);
  if (n.NumericLiteral.check(value)) return value.value;
  if (n.Literal.check(value) && typeof value.value === 'number') return value.value;
  return undefined;
}

/** The expression of an attribute value, or a string literal's node. */
function attributeExpression(value: AnyNode): AnyNode {
  if (n.JSXExpressionContainer.check(value)) return value.expression;
  return value;
}

/** Code without its block comments: a name in a comment is no binding. */
const uncommented = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '');

const quote = (text: string) =>
  `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;

function printArg(arg: Arg): string {
  if (typeof arg === 'string') return quote(arg);
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
  const entries = Object.entries(arg).map(
    ([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k)}: ${quote(v)}`,
  );
  return `{ ${entries.join(', ')} }`;
}

const printMod = (mod: Mod) => `.${mod.name}(${mod.args.map(printArg).join(', ')})`;

/** Transforms one file's source. */
export function transformSource(source: string, options: TransformOptions): FileResult {
  const ast = recast.parse(source, { parser: babelTs });
  const sources = new Map<string, Source>();
  const declared = new Set<string>();
  recast.visit(ast, {
    visitImportDeclaration(path) {
      const module = String(path.node.source.value);
      for (const specifier of path.node.specifiers ?? []) {
        const local = specifier.local?.name as string;
        declared.add(local);
        if (n.ImportSpecifier.check(specifier))
          sources.set(local, { module, imported: specifier.imported.name as string });
        else if (
          n.ImportDefaultSpecifier.check(specifier) &&
          module.startsWith('@oxy.so/bloom/icons/')
        )
          sources.set(local, { module, imported: module.slice('@oxy.so/bloom/icons/'.length) });
      }
      return false;
    },
    visitIdentifier(path) {
      declared.add(path.node.name);
      this.traverse(path);
    },
  });

  /** A language name, aliased when the file already uses it. */
  const usedLanguage = new Map<string, string>();
  const lang = (name: string) => {
    let local = usedLanguage.get(name);
    if (!local) {
      local = declared.has(name) ? `L${name}` : name;
      usedLanguage.set(name, local);
    }
    return local;
  };

  /** Module-level `const styles = StyleSheet.create({...})`, by name: each style's object literal. */
  const styleSheets = new Map<string, Map<string, AnyNode>>();
  const styleSheetLocal = [...sources].find(
    ([, s]) => s.module === 'react-native' && s.imported === 'StyleSheet',
  )?.[0];
  for (const statement of ast.program.body as AnyNode[]) {
    const declaration = n.ExportNamedDeclaration.check(statement)
      ? statement.declaration
      : statement;
    if (!n.VariableDeclaration.check(declaration) || declaration.kind !== 'const') continue;
    for (const declarator of declaration.declarations as AnyNode[]) {
      const init = declarator.init;
      if (
        !styleSheetLocal ||
        !n.Identifier.check(declarator.id) ||
        !n.CallExpression.check(init) ||
        !n.MemberExpression.check(init.callee) ||
        !n.Identifier.check(init.callee.object) ||
        init.callee.object.name !== styleSheetLocal ||
        !n.Identifier.check(init.callee.property) ||
        init.callee.property.name !== 'create' ||
        !n.ObjectExpression.check(init.arguments[0])
      )
        continue;
      const sheet = new Map<string, AnyNode>();
      for (const property of init.arguments[0].properties)
        if (
          (n.ObjectProperty.check(property) || n.Property.check(property)) &&
          n.Identifier.check(property.key)
        )
          sheet.set(property.key.name, property.value);
      styleSheets.set(declarator.id.name, sheet);
    }
  }
  /**
   * Each `theme.colors.key` (`theme` from Bloom's `useTheme()`) and `colors.key`
   * (`const { colors } = useTheme()`) in the file, as the role painted from that
   * theme colour, resolved through the scope it is read in.
   */
  const themeRoles = new Map<AnyNode, string>();
  const useThemeLocals = new Set(
    [...sources]
      .filter(([, s]) => s.module === '@oxy.so/bloom/theme' && s.imported === 'useTheme')
      .map(([local]) => local),
  );
  /**
   * The scope that declares `name` where `path` reads it. ast-types cannot scan
   * every pattern Babel parses (an array pattern's hole, `const [, b] = …`):
   * a scope it cannot scan is no known binding.
   */
  const scopeOf = (path: AnyNode, name: string): AnyNode => {
    try {
      return path.scope?.lookup(name);
    } catch {
      return undefined;
    }
  };
  /** What `name` is bound to where `path` reads it: Bloom's theme, its colours, or neither. */
  const boundTo = (path: AnyNode, name: string): 'theme' | 'colors' | undefined => {
    const bindings = scopeOf(path, name)?.getBindings()[name];
    if (bindings?.length !== 1) return undefined;
    // `const theme = useTheme()`, or `const { colors } = useTheme()` (the property's value is the binding).
    let at = bindings[0];
    while (at && !n.VariableDeclarator.check(at.node)) at = at.parent;
    const init = at?.node.init;
    if (
      !init ||
      !n.CallExpression.check(init) ||
      !n.Identifier.check(init.callee) ||
      !useThemeLocals.has(init.callee.name) ||
      at.parent?.node.kind !== 'const'
    )
      return undefined;
    if (n.Identifier.check(at.node.id) && at.node.id.name === name) return 'theme';
    if (
      n.ObjectPattern.check(at.node.id) &&
      at.node.id.properties.some(
        (p: AnyNode) =>
          (n.ObjectProperty.check(p) || n.Property.check(p)) &&
          !p.computed &&
          n.Identifier.check(p.key) &&
          p.key.name === 'colors' &&
          n.Identifier.check(p.value) &&
          p.value.name === name,
      )
    )
      return 'colors';
    return undefined;
  };
  /** Each `styles.x` read where `styles` is the module's StyleSheet (not a name that shadows it). */
  const moduleStyleReads = new Set<AnyNode>();
  if (useThemeLocals.size > 0 || styleSheets.size > 0)
    recast.visit(ast, {
      visitMemberExpression(path) {
        const { object, property, computed } = path.node;
        if (
          n.Identifier.check(object) &&
          styleSheets.has(object.name) &&
          scopeOf(path, object.name)?.isGlobal
        )
          moduleStyleReads.add(path.node);
        if (!computed && n.Identifier.check(property)) {
          const role = ROLE_OF_THEME_COLOR.get(property.name);
          const colorsOf =
            n.MemberExpression.check(object) &&
            !object.computed &&
            n.Identifier.check(object.property) &&
            object.property.name === 'colors' &&
            n.Identifier.check(object.object) &&
            boundTo(path, object.object.name) === 'theme';
          const colors = n.Identifier.check(object) && boundTo(path, object.name) === 'colors';
          if (role && (colorsOf || colors)) themeRoles.set(path.node, role);
        }
        this.traverse(path);
      },
    });

  /** A className chosen at runtime, by its expression: both branches' classes, which the parity's stylesheet holds. */
  const choiceClasses = new Map<AnyNode, string>();

  /**
   * Each `insets.top` (`bottom`, `left`, `right`) where `insets` is a `const`
   * holding `useSafeAreaInsets()` (react-native-safe-area-context): the device's
   * inset on that side, which `.safeAreaPadding(side)` pads by.
   */
  const insetReads = new Map<AnyNode, 'top' | 'bottom' | 'left' | 'right'>();
  recast.visit(ast, {
    visitMemberExpression(path) {
      const { object, property } = path.node;
      const side =
        !path.node.computed && n.Identifier.check(property) ? (property.name as string) : '';
      if (n.Identifier.check(object) && ['top', 'bottom', 'left', 'right'].includes(side)) {
        const bindings = scopeOf(path, object.name)?.getBindings()[object.name];
        let at = bindings?.length === 1 ? bindings[0] : undefined;
        while (at && !n.VariableDeclarator.check(at.node)) at = at.parent;
        const init = at?.node.init;
        const callee = n.CallExpression.check(init) ? init.callee : undefined;
        const source = n.Identifier.check(callee) ? sources.get(callee.name) : undefined;
        if (
          at?.parent?.node.kind === 'const' &&
          n.Identifier.check(at.node.id) &&
          init.arguments.length === 0 &&
          source?.module === 'react-native-safe-area-context' &&
          source.imported === 'useSafeAreaInsets'
        )
          insetReads.set(path.node, side as 'top' | 'bottom' | 'left' | 'right');
      }
      this.traverse(path);
    },
  });
  /**
   * A padding by the device's inset, as `.safeAreaPadding(side)`: `paddingTop:
   * insets.top`, or `insets.top + 24` with a padding of the space token beyond it
   * on the same view (a top or bottom one: the language adds them).
   */
  const insetPadding = (key: string, value: AnyNode): Mod[] | undefined => {
    const side = {
      paddingTop: 'top',
      paddingBottom: 'bottom',
      paddingLeft: 'left',
      paddingRight: 'right',
    }[key];
    if (!side) return undefined;
    const sum = n.BinaryExpression.check(value) && value.operator === '+' ? value : undefined;
    const inset = sum ? sum.left : value;
    if (insetReads.get(inset) !== side) return undefined;
    if (!sum) return [{ name: 'safeAreaPadding', args: [side] }];
    const beyond = n.NumericLiteral.check(sum.right) ? SPACE[String(sum.right.value)] : undefined;
    if (beyond === undefined || (side !== 'top' && side !== 'bottom')) return undefined;
    return [
      { name: 'safeAreaPadding', args: [side] },
      { name: 'padding', args: [side, beyond] },
    ];
  };
  /** Each `{name}` in a JSX attribute where `name` is a `const`: its initialiser (a Button's ink held in a variable). */
  const constInits = new Map<AnyNode, AnyNode>();
  recast.visit(ast, {
    visitJSXAttribute(path) {
      const expression = n.JSXExpressionContainer.check(path.node.value)
        ? path.node.value.expression
        : undefined;
      if (n.Identifier.check(expression)) {
        const bindings = scopeOf(path, expression.name)?.getBindings()[expression.name];
        let at = bindings?.length === 1 ? bindings[0] : undefined;
        while (at && !n.VariableDeclarator.check(at.node)) at = at.parent;
        if (at?.parent?.node.kind === 'const' && n.Identifier.check(at.node.id) && at.node.init)
          constInits.set(expression, at.node.init);
      }
      this.traverse(path);
    },
  });
  /**
   * A colour as the role it is painted from: a theme colour read from
   * `useTheme()`, a choice of them by a plain condition (`undefined` for none),
   * or a `const` holding one.
   */
  /** The `const` reads `roleOf` followed: the before side writes their initialiser in their place. */
  const roleConstReads = new Set<AnyNode>();
  const roleOf = (expression: AnyNode): Value | undefined => {
    const role = themeRoles.get(expression);
    if (role) return role;
    if (n.Identifier.check(expression) && expression.name === 'undefined') return { $: 'absent' };
    if (n.Identifier.check(expression) && constInits.has(expression)) {
      const held = roleOf(constInits.get(expression));
      if (held !== undefined) roleConstReads.add(expression);
      return held;
    }
    if (
      n.ConditionalExpression.check(expression) &&
      (isPlainRead(expression.test) || isBooleanForm(expression.test))
    ) {
      const then = roleOf(expression.consequent);
      const otherwise = roleOf(expression.alternate);
      if (then !== undefined && otherwise !== undefined)
        return { $: 'choose', test: { node: expression.test, hole: 'condition' }, then, otherwise };
    }
    return undefined;
  };
  /** A language view placed as an element: `toElement(view)`, as a file partly in the language writes it. */
  const isToElement = (expression: AnyNode) => {
    const callee = n.CallExpression.check(expression) ? expression.callee : undefined;
    const source = n.Identifier.check(callee) ? sources.get(callee.name) : undefined;
    return source?.module === LANGUAGE_MODULE && source.imported === 'toElement';
  };
  /**
   * Each `{name}` in JSX where `name` is a `const` holding an element
   * (`const header = <PageHeader … />`, or `toElement(Header(…))`).
   */
  const elementReads = new Set<AnyNode>();
  recast.visit(ast, {
    visitJSXExpressionContainer(path) {
      const { expression } = path.node;
      const bindings = n.Identifier.check(expression)
        ? scopeOf(path, expression.name)?.getBindings()[expression.name]
        : undefined;
      let at = bindings?.length === 1 ? bindings[0] : undefined;
      while (at && !n.VariableDeclarator.check(at.node)) at = at.parent;
      if (
        at?.parent?.node.kind === 'const' &&
        n.Identifier.check(at.node.id) &&
        (n.JSXElement.check(at.node.init) ||
          n.JSXFragment.check(at.node.init) ||
          isToElement(at.node.init))
      )
        elementReads.add(expression);
      this.traverse(path);
    },
  });
  /**
   * Module-level `const NAME = 'text'` (no type annotation, so a colour's type is
   * the literal `defineTokens` takes), by name: a colour the codemod reads in the file.
   */
  const colorConstants = new Map<string, { value: string; statement: AnyNode }>();
  for (const statement of ast.program.body as AnyNode[]) {
    const declaration = n.ExportNamedDeclaration.check(statement)
      ? statement.declaration
      : statement;
    if (!n.VariableDeclaration.check(declaration) || declaration.kind !== 'const') continue;
    for (const declarator of declaration.declarations as AnyNode[]) {
      const value = staticString(declarator.init);
      if (
        n.Identifier.check(declarator.id) &&
        !declarator.id.typeAnnotation &&
        n.StringLiteral.check(declarator.init) &&
        value !== undefined
      )
        colorConstants.set(declarator.id.name, { value, statement });
    }
  }
  /** Each name that reads a string constant of the module's (not a name that shadows it). */
  const colorConstantReads = new Set<AnyNode>();
  if (colorConstants.size > 0)
    recast.visit(ast, {
      visitIdentifier(path) {
        if (colorConstants.has(path.node.name) && scopeOf(path, path.node.name)?.isGlobal)
          colorConstantReads.add(path.node);
        this.traverse(path);
      },
    });
  /** The local name of the file's app colour table, free in the file. */
  let appColorTable = 'appColors';
  for (let i = 2; declared.has(appColorTable); i++) appColorTable = `appColors${i}`;
  /** The app colours the converted regions paint with, by token name: the file's table. */
  const appColors = new Map<string, AppColor>();

  /** A `style` whose objects are the parity's before side, where `styles.x` is not in scope. */
  const styleLiterals = new Map<AnyNode, string>();

  /**
   * Module-level `const NAME = { … }` (a style held in a constant, `satisfies`
   * or `as` a type left out), by name: read as a StyleSheet's style is.
   */
  const styleConstants = new Map<string, AnyNode>();
  for (const statement of ast.program.body as AnyNode[]) {
    const declaration = n.ExportNamedDeclaration.check(statement)
      ? statement.declaration
      : statement;
    if (!n.VariableDeclaration.check(declaration) || declaration.kind !== 'const') continue;
    for (const declarator of declaration.declarations as AnyNode[]) {
      let init = declarator.init;
      while (init && (init.type === 'TSSatisfiesExpression' || init.type === 'TSAsExpression'))
        init = init.expression;
      if (n.Identifier.check(declarator.id) && n.ObjectExpression.check(init))
        styleConstants.set(declarator.id.name, init);
    }
  }
  /** Each name that reads a module style constant (not a name that shadows it): the constant's object. */
  const styleConstantReads = new Map<AnyNode, AnyNode>();
  if (styleConstants.size > 0)
    recast.visit(ast, {
      visitIdentifier(path) {
        const parent = path.parent?.node;
        const declares = n.VariableDeclarator.check(parent) && parent.id === path.node;
        if (
          !declares &&
          styleConstants.has(path.node.name) &&
          scopeOf(path, path.node.name)?.isGlobal
        )
          styleConstantReads.set(path.node, styleConstants.get(path.node.name));
        this.traverse(path);
      },
    });
  /** React Native's `StyleSheet.absoluteFill`, read from the module's `StyleSheet`. */
  const isAbsoluteFill = (node: AnyNode) =>
    !!styleSheetLocal &&
    n.MemberExpression.check(node) &&
    !node.computed &&
    n.Identifier.check(node.object) &&
    node.object.name === styleSheetLocal &&
    n.Identifier.check(node.property) &&
    node.property.name === 'absoluteFill';

  /** A static style (an object literal, a module StyleSheet's style, or a list of them) as utilities. */
  function staticStyle(
    expression: AnyNode,
    read: StyleRead,
  ):
    | { ok: true; classes: string[]; mods: { subject: string; mod: Mod }[] }
    | { ok: false; subject: string; why: string } {
    const parts: AnyNode[] = n.ArrayExpression.check(expression)
      ? expression.elements
      : [expression];
    const classes: string[] = [];
    const mods: { subject: string; mod: Mod }[] = [];
    // A StyleSheet's style is its literal on the before side; an inline object stays as written.
    const literals = new Map<AnyNode, string>();
    for (const part of parts) {
      // React Native's own fill, pinned to every edge: its declarations, written out on the before side.
      if (isAbsoluteFill(part)) {
        classes.push(...ABSOLUTE_FILL.classes);
        literals.set(part, `{ ${ABSOLUTE_FILL.literal} }`);
        continue;
      }
      let object = part;
      // A module constant holding a style is its object, written out on the before side.
      if (styleConstantReads.has(part)) {
        const style = styleUtilities(styleConstantReads.get(part), read, isAbsoluteFill);
        if (!style.ok) return style;
        classes.push(...style.classes);
        mods.push(...style.mods);
        literals.set(part, style.literal);
        continue;
      }
      const referenced =
        n.MemberExpression.check(part) &&
        !part.computed &&
        n.Identifier.check(part.object) &&
        n.Identifier.check(part.property);
      if (referenced) {
        const { object: sheet, property } = part as AnyNode;
        object = moduleStyleReads.has(part)
          ? styleSheets.get(sheet.name)?.get(property.name)
          : undefined;
      }
      const style = object ? styleUtilities(object, read, isAbsoluteFill) : undefined;
      if (!style) return { ok: false, subject: 'style', why: 'a style the codemod cannot read' };
      if (!style.ok) return style;
      classes.push(...style.classes);
      mods.push(...style.mods);
      if (referenced) literals.set(part, style.literal);
    }
    for (const [part, literal] of literals) styleLiterals.set(part, literal);
    return { ok: true, classes, mods };
  }

  /**
   * A Bloom component's static `style` as its node's box, for a component
   * that draws its `style` on its outer view, where the language draws a
   * node's box: each declaration through the className table as a View's
   * (`padding: 16` is `.padding('lg')`, `gap: 12` `.spacing('md')`,
   * `flexDirection: 'row'` `.axis('horizontal')`), every modifier one the node
   * takes. A colour, a variant or a value no token writes is a reason.
   */
  function componentStyle(
    expression: AnyNode,
    node: string,
  ): { mods: PropMod[] } | { reasons: Reason[] } {
    const reason = (subject: string, why: string) => ({
      reasons: [{ subject, code: `${node}:style`, why }],
    });
    const style = staticStyle(expression, () => undefined);
    if (!style.ok) return reason(style.subject, style.why);
    const resolution = resolveClassName(style.classes.join(' '), 'view', options.table, {
      overridden: options.overridden,
    });
    if (!resolution.ok) return { reasons: [...resolution.reasons] };
    if (resolution.value.variants.length) return reason('style', 'a style with a variant');
    const mods: Mod[] = [
      ...(resolution.value.axis === 'row' ? [{ name: 'axis', args: ['horizontal'] }] : []),
      ...resolution.value.mods,
      ...style.mods.map(({ mod }) => mod),
    ];
    const taken = NODE_MODIFIERS.get(node);
    const outside = mods.find((mod) => !taken?.has(mod.name));
    if (outside)
      return reason('style', `a style that is \`.${outside.name}()\`, which ${node} does not take`);
    return { mods: mods.map((mod) => ({ name: mod.name, args: [...mod.args] as Value[] })) };
  }

  /** Each element's nearest enclosing element in the file. */
  const enclosing = new Map<AnyNode, AnyNode>();
  recast.visit(ast, {
    visitJSXElement(path) {
      let at = path.parent;
      while (at && !n.JSXElement.check(at.node)) at = at.parent;
      if (at) enclosing.set(path.node, at.node);
      this.traverse(path);
    },
  });

  /** The first element around `node` (in the file) drawn by one of `components` (`module#export`). */
  function insideOf(node: AnyNode, components: readonly string[]): string | undefined {
    for (let at = enclosing.get(node); at; at = enclosing.get(at)) {
      const local = jsxName(at);
      const source = local ? sources.get(local) : undefined;
      if (source && components.includes(`${source.module}#${source.imported}`)) return local;
    }
    return undefined;
  }

  /**
   * Each screen: a module-level function component whose every return is a
   * Bloom Screen becomes `screen(function …)`, each Screen its body's root.
   * `screen()` wraps the whole component, so its branches (a loading, an
   * error, the content) each return their content and chrome. A component is
   * a function declaration (exported or not) or a `const` holding an arrow or
   * a function expression, named with a capital, not async, with no return
   * type; a `const` or a declaration whose name is read becomes
   * `const Name = screen(function Name …)`, so its name is never read before
   * the module has defined it.
   */
  const screenRoutes = new Map<AnyNode, AnyNode>();
  /** Where each screen's function is declared: the statement that holds it, and its name. */
  const screenDeclarations = new Map<AnyNode, { statement: AnyNode; name: string }>();
  /** The Screens of a component whose name is read before it is declared. */
  const earlyScreens = new Map<AnyNode, Reason>();
  const isScreenElement = (node: AnyNode) => {
    const local = n.JSXElement.check(node) ? jsxName(node) : undefined;
    const source = local ? sources.get(local) : undefined;
    return source?.module === '@oxy.so/bloom/screen' && source.imported === 'Screen';
  };
  /**
   * A route's return around its Screen, peeled to the Screen: each element
   * around it with the Screen (or the next one in) as its only child is a
   * screen modifier the language draws around the Screen, innermost first,
   * as the chain's order wraps them. `<BloomColorScope mode asChild>` is
   * `.colorScope(mode)`, a `<KeyboardAvoidingView>` filling (`flex: 1`) with
   * React Native's behavior (`Platform.OS === 'ios' ? 'padding' : 'height'`)
   * `.keyboardAvoiding()`, and a `…Provider` with no props (Bloom's
   * `HeaderDockProvider`, an app's own) `.provider(Name)`. Anything else around it is the reason it stays JSX.
   */
  type Peeled =
    | { readonly screen: AnyNode; readonly mods: readonly PropMod[] }
    | { readonly screen: AnyNode; readonly reason: Reason };
  const peeled = new Map<AnyNode, Peeled | undefined>();
  function peelScreen(node: AnyNode): Peeled | undefined {
    if (peeled.has(node)) return peeled.get(node);
    let result: Peeled | undefined;
    if (isScreenElement(node)) result = { screen: node, mods: [] };
    else if (n.JSXElement.check(node)) {
      const children = (node.children as AnyNode[]).filter(
        (child) => !(n.JSXText.check(child) && !child.value.trim()),
      );
      const inner = children.length === 1 ? peelScreen(children[0]) : undefined;
      if (inner && 'mods' in inner) {
        const wrapper = screenWrapper(node);
        result =
          'mod' in wrapper
            ? { screen: inner.screen, mods: [...inner.mods, wrapper.mod] }
            : { screen: inner.screen, reason: wrapper.reason };
      } else result = inner;
    }
    peeled.set(node, result);
    return result;
  }
  /** The one element a wrapper around a route's Screen holds. */
  const peelChild = (node: AnyNode): AnyNode =>
    (node.children as AnyNode[]).find((child) => n.JSXElement.check(child));
  /** One element around a route's Screen as its screen modifier, or why it is none. */
  function screenWrapper(node: AnyNode): { mod: PropMod } | { reason: Reason } {
    const local = jsxName(node) ?? 'an element';
    const source = sources.get(local);
    const reason = (why: string) => ({
      reason: {
        subject: 'Screen',
        code: 'screen:wrapped',
        why: `inside \`${local}\`: ${why}`,
      },
    });
    const attributes = (node.openingElement.attributes as AnyNode[]).filter((a) =>
      n.JSXAttribute.check(a),
    );
    if (attributes.length !== node.openingElement.attributes.length)
      return reason('spread props: the codemod cannot see what they set');
    const named = new Map<string, AnyNode>(
      attributes.map((a) => [a.name.name as string, a.value] as const),
    );
    const only = (...names: string[]) => [...named.keys()].every((name) => names.includes(name));
    if (source?.module === '@oxy.so/bloom/theme' && source.imported === 'BloomColorScope') {
      const asChild = named.get('asChild');
      const mode = named.get('mode');
      if (!only('asChild', 'mode') || !named.has('asChild') || !named.has('mode'))
        return reason(
          'a colour scope is `.colorScope(mode)` when it takes only `mode` and `asChild` (a preset, a seed or its own view are its own)',
        );
      const bare =
        asChild === null ||
        (n.JSXExpressionContainer.check(asChild) &&
          n.BooleanLiteral.check(asChild.expression) &&
          asChild.expression.value === true);
      if (!bare) return reason('a colour scope that is no `asChild` draws a view of its own');
      const scheme = staticString(mode);
      if (scheme !== undefined && scheme !== 'light' && scheme !== 'dark')
        return reason(`a scheme \`${scheme}\` that is neither light nor dark`);
      return {
        mod: {
          name: 'colorScope',
          args: [scheme ?? { node: attributeExpression(mode), hole: 'string' }],
        },
      };
    }
    if (source?.module === 'react-native' && source.imported === 'KeyboardAvoidingView') {
      if (!only('style', 'behavior'))
        return reason('a keyboard avoiding view with props `.keyboardAvoiding()` does not draw');
      const style = named.get('style');
      const fill = style ? staticStyle(attributeExpression(style), () => undefined) : undefined;
      const filled =
        fill?.ok && fill.classes.length === 0 && fill.mods.length === 1
          ? fill.mods[0]?.mod
          : undefined;
      if (filled?.name !== 'grow' && filled?.name !== 'flex')
        return reason(
          'a style other than a fill `.keyboardAvoiding()` draws (React Native’s `flex: 1`, or a flex token)',
        );
      const behavior = attributeExpression(named.get('behavior'));
      if (!isKeyboardBehavior(behavior))
        return reason(
          "a behavior other than React Native’s (`Platform.OS === 'ios' ? 'padding' : 'height'`)",
        );
      keyboardBehaviors.add(behavior);
      return {
        mod: { name: 'keyboardAvoiding', args: filled.name === 'flex' ? [...filled.args] : [] },
      };
    }
    if (source && /Provider$/.test(local) && !source.module.startsWith('react-native')) {
      if (named.size > 0) return reason('a provider with props: `.provider()` draws one with none');
      return { mod: { name: 'provider', args: [{ $: 'component', name: local }] } };
    }
    return reason(
      '`screen()` wraps the whole component, so what is around the Screen would draw inside it (a colour scope, a keyboard avoiding view and an app’s provider are screen modifiers)',
    );
  }
  /** `Platform.OS === 'ios' ? 'padding' : 'height'`, React Native's behavior, as a route writes it. */
  const isKeyboardBehavior = (expression: AnyNode) => {
    if (!n.ConditionalExpression.check(expression)) return false;
    const { test, consequent, alternate }: AnyNode = expression;
    const platform =
      n.BinaryExpression.check(test) && test.operator === '===' ? test.left : undefined;
    return (
      n.MemberExpression.check(platform) &&
      n.Identifier.check(platform.object) &&
      sources.get(platform.object.name)?.module === 'react-native' &&
      sources.get(platform.object.name)?.imported === 'Platform' &&
      n.Identifier.check(platform.property) &&
      platform.property.name === 'OS' &&
      staticString(test.right) === 'ios' &&
      staticString(consequent) === 'padding' &&
      staticString(alternate) === 'height'
    );
  };
  /** The behaviors a converted keyboard avoiding view wrote: the parity's before side writes React Native's own `Platform`. */
  const keyboardBehaviors = new Set<AnyNode>();
  /** Each route's Screen: the return around it, and the screen modifiers what is around it draws. */
  const screenOuter = new Map<AnyNode, { outer: AnyNode; mods: readonly PropMod[] }>();
  /** Where each module-level name is read outside a function, before its own statement. */
  const readsBefore = (name: string, statement: AnyNode) => {
    let early = false;
    recast.visit(ast, {
      visitFunction: () => false,
      visitIdentifier(path) {
        if (path.node.name === name && ((path.node as AnyNode).start as number) < statement.start)
          early = true;
        this.traverse(path);
      },
    });
    return early;
  };
  for (const statement of ast.program.body as AnyNode[]) {
    const declaration: AnyNode =
      n.ExportDefaultDeclaration.check(statement) || n.ExportNamedDeclaration.check(statement)
        ? statement.declaration
        : statement;
    let fn: AnyNode | undefined;
    let name: string | undefined;
    if (n.FunctionDeclaration.check(declaration)) {
      fn = declaration;
      name = declaration.id?.name as string | undefined;
    } else if (
      n.VariableDeclaration.check(declaration) &&
      declaration.kind === 'const' &&
      declaration.declarations.length === 1
    ) {
      const declarator: AnyNode = declaration.declarations[0];
      if (
        n.Identifier.check(declarator.id) &&
        !declarator.id.typeAnnotation &&
        (n.ArrowFunctionExpression.check(declarator.init) ||
          (n.FunctionExpression.check(declarator.init) && !declarator.init.id))
      ) {
        fn = declarator.init;
        name = declarator.id.name;
      }
    }
    if (!fn || !name || !/^[A-Z]/.test(name) || fn.async || fn.generator || fn.returnType) continue;
    const returned: AnyNode[] = [];
    if (!n.BlockStatement.check(fn.body)) returned.push(fn.body);
    else
      recast.visit(fn.body, {
        visitFunction: () => false,
        visitReturnStatement(path) {
          returned.push(path.node.argument);
          return false;
        },
      });
    const screens = returned.map(peelScreen);
    if (!returned.length || !screens.every((p) => p !== undefined)) continue;
    // A Screen inside an element that is no screen modifier stays JSX, with what keeps it.
    const kept = screens.find((p): p is Peeled & { reason: Reason } => 'reason' in (p as Peeled));
    if (kept) {
      for (const p of screens as Peeled[])
        earlyScreens.set(p.screen, 'reason' in p ? p.reason : kept.reason);
      continue;
    }
    if (readsBefore(name, statement)) {
      for (const { screen: node } of screens as Peeled[])
        earlyScreens.set(node, {
          subject: 'Screen',
          code: 'screen:read-early',
          why: `\`${name}\` is read before its declaration, where \`const ${name} = screen(…)\` is not yet defined`,
        });
      continue;
    }
    returned.forEach((outer, i) => {
      const { screen, mods } = screens[i] as Peeled & { mods: readonly PropMod[] };
      screenRoutes.set(screen, fn);
      if (outer !== screen) screenOuter.set(screen, { outer, mods });
    });
    screenDeclarations.set(fn, { statement, name });
  }

  /**
   * Why a Screen that is no screen's return stays JSX: what is around it, or
   * the component's other returns. `screen()` wraps the whole component, so a
   * view beside the Screen or around it would draw inside it.
   */
  const screenPlaces = new Map<AnyNode, Reason>(earlyScreens);
  recast.visit(ast, {
    visitJSXElement(path) {
      const node = path.node;
      if (isScreenElement(node) && !screenRoutes.has(node) && !earlyScreens.has(node)) {
        // Past what its screen modifiers draw (a colour scope, a keyboard avoiding view, a provider).
        let at = path;
        while (
          n.JSXElement.check(at.parent?.node) &&
          peelScreen(at.parent.node)?.screen === node &&
          'mods' in (peelScreen(at.parent.node) as Peeled)
        )
          at = at.parent;
        const outer = at.node;
        const parent = at.parent?.node;
        const name = (element: AnyNode) => `\`${jsxName(element) ?? 'an element'}\``;
        const beside = n.JSXFragment.check(parent)
          ? (parent.children as AnyNode[]).filter(
              (child) => child !== outer && n.JSXElement.check(child),
            )
          : [];
        const wrapper = n.JSXElement.check(parent) ? screenWrapper(parent) : undefined;
        screenPlaces.set(
          node,
          wrapper && 'reason' in wrapper
            ? wrapper.reason
            : beside.length
              ? {
                  subject: 'Screen',
                  code: 'screen:beside',
                  why: `beside ${beside.map(name).join(', ')}: \`screen()\` wraps the whole component, so a view beside the Screen would draw inside it (one that draws nothing, a head element, moves into the Screen by hand)`,
                }
              : {
                  subject: 'Screen',
                  code: 'screen:returns',
                  why: 'a return of its component that is no Screen (`null`, another view, a choice): `screen()` would draw a Screen around it',
                },
        );
      }
      this.traverse(path);
    },
  });

  /**
   * An icon's fill as the chain paints it: a Bloom theme colour read from
   * `useTheme()` is its role, and a static colour (a literal, or a module
   * constant) an app colour, the same colour in both schemes. Anything else is a reason.
   */
  function iconFill(
    node: AnyNode,
    fill: AnyNode,
  ): { role: string } | { color: AppColor } | { reason: Reason } {
    const reason = (code: string, why: string) => ({ reason: { subject: 'fill', code, why } });
    const expression = attributeExpression(fill);
    const role = themeRoles.get(expression);
    if (role) {
      const scope = insideOf(node, [COLOR_SCOPE]);
      return scope
        ? reason(
            'icon-fill:color-scope',
            `a theme colour read outside the ${scope} the icon is drawn in, where the role paints the scope's scheme`,
          )
        : { role };
    }
    const constant =
      n.Identifier.check(expression) && colorConstantReads.has(expression)
        ? (expression.name as string)
        : undefined;
    const value = constant ? colorConstants.get(constant)?.value : staticString(fill);
    if (value !== undefined) {
      if (!isAppColorValue(value))
        return reason(
          'icon-fill:not-a-colour',
          'a colour the platforms do not paint alike (`currentColor`, an `hsl()`, a name only one knows): an app colour is a hex, an `rgb()` or `rgba()` of numbers, or a CSS colour name',
        );
      const name = constant ?? appColorName(value);
      if (!constant && colorConstants.has(name))
        return reason('icon-fill', `a colour whose token name the file declares (\`${name}\`)`);
      return { color: constant ? { name, value, constant, read: expression } : { name, value } };
    }
    // `x.colors.key` or `colors.key` with no role, or not bound to `useTheme()` where it is read.
    const object = n.MemberExpression.check(expression) ? expression.object : undefined;
    const themed =
      object &&
      !expression.computed &&
      n.Identifier.check(expression.property) &&
      ((n.Identifier.check(object) && object.name === 'colors') ||
        (n.MemberExpression.check(object) &&
          !object.computed &&
          n.Identifier.check(object.property) &&
          object.property.name === 'colors'));
    if (themed && !ROLE_OF_THEME_COLOR.has(expression.property.name))
      return reason(
        'icon-fill:no-role',
        `a theme colour no language role paints (\`${expression.property.name}\`)`,
      );
    if (themed)
      return reason(
        'icon-fill:theme-handed-in',
        'a theme colour read from a theme handed in (a prop, a parameter), not from `useTheme()` here: the scheme it was read in may not be the one the icon is drawn in',
      );
    return reason('icon-fill', 'a fill set at runtime, or read from outside the file');
  }

  const results = new Map<AnyNode, { ir: Ir } | { reasons: Reason[] }>();
  const classes = new Set<string>();
  let candidates = 0;
  const counted = new Set<AnyNode>();
  const unconverted: Unconverted[] = [];
  const convertedNodes = new Set<AnyNode>();
  const convertedLocals = new Set<string>();

  /** The text style a Bloom typography component draws its Text in. */
  function textStyleOf(local: string): string | undefined {
    const source = sources.get(local);
    return source?.module === '@oxy.so/bloom/typography' ? TEXT_STYLES[source.imported] : undefined;
  }

  function elementOf(node: AnyNode): { kind: Kind; local: string } | undefined {
    const local = jsxName(node);
    if (!local) return undefined;
    const kind = kindOf(sources.get(local));
    return kind ? { kind, local } : undefined;
  }

  /** Converts one element, children included; a child that cannot convert is embedded. */
  function convert(node: AnyNode): { ir: Ir } | { reasons: Reason[] } {
    const cached = results.get(node);
    if (cached) return cached;
    const element = elementOf(node);
    let result: { ir: Ir } | { reasons: Reason[] };
    if (!element)
      result = {
        reasons: [{ subject: jsxName(node) ?? 'element', code: 'not-a-candidate', why: '' }],
      };
    else {
      if (!counted.has(node)) {
        counted.add(node);
        candidates++;
      }
      result = convertCandidate(node, element.kind, element.local);
    }
    results.set(node, result);
    return result;
  }

  function convertCandidate(
    node: AnyNode,
    kind: Kind,
    local: string,
  ): { ir: Ir } | { reasons: Reason[] } {
    if (kind === 'rnImage')
      return {
        reasons: [
          {
            subject: 'Image',
            code: 'react-native-image',
            why: 'React Native’s Image: the language’s Image is Bloom’s BloomImage (expo-image on a device)',
          },
        ],
      };
    if (kind === 'button') return convertButton(node);
    if (kind === 'kept' && screenRoutes.has(node)) return convertScreen(node);
    if (kind === 'kept' && sources.get(local)?.module === DROPDOWN)
      return convertDropdownMenu(node);
    if (kind === 'kept') {
      const source = sources.get(local) as Source;
      const removed = REMOVED[`${source.module}#${source.imported}`];
      return {
        reasons: [
          removed
            ? {
                subject: local,
                code: `removed:${source.imported}`,
                why: `removed in Bloom 22: use ${removed}`,
              }
            : (screenPlaces.get(node) ?? {
                subject: local,
                code: `kept:${source.imported}`,
                why: KEPT[`${source.module}#${source.imported}`] as string,
              }),
        ],
      };
    }
    if (kind === 'component') {
      const source = sources.get(local) as Source;
      const rule = ruleFor(source.module, source.imported) as ComponentRule;
      // A part converts with its compound element (`convertParts`), never alone.
      if (rule.partOf)
        return {
          reasons: [
            {
              subject: local,
              code: `${rule.node}:part`,
              why: `a part of \`${rule.partOf.split('#')[1]}\`, converted only with it, which stays JSX here`,
            },
          ],
        };
      return rule.shell ? convertShell(node, rule, rule.shell) : convertComponent(node, rule);
    }
    const reasons: Reason[] = [];
    const fail = (subject: string, code: string, why: string) =>
      reasons.push({ subject, code, why });
    const props: PropMod[] = [];
    let key: Carried | null = null;
    let className = '';
    /** A className chosen at runtime: its condition and the other branch's classes. */
    let other: { test: Carried; className: string } | undefined;
    let numberOfLines: Arg | Carried | undefined;
    let variant: string | undefined;
    let size: AnyNode;
    /** The utilities a static `style` writes, read with the className. */
    const styleClasses: string[] = [];
    const styleMods: { subject: string; mod: Mod }[] = [];
    /** An icon's `width`, `height` and `fill`. */
    const iconProps = new Map<string, AnyNode>();
    /** A TouchableOpacity: its press fades it (`.pressFade()`), at its `activeOpacity` token. */
    const fades =
      kind === 'pressable' &&
      (sources.get(local) as Source | undefined)?.imported === 'TouchableOpacity';
    let fade: string | undefined;
    for (const attribute of node.openingElement.attributes) {
      if (!n.JSXAttribute.check(attribute) || !n.JSXIdentifier.check(attribute.name)) {
        fail('{...spread}', 'spread', 'spread props: the codemod cannot see what they set');
        continue;
      }
      const name = attribute.name.name as string;
      const value = attribute.value;
      if (value === null || value === undefined) {
        if (kind === 'pressable' && name === 'disabled') props.push({ name: 'disabled', args: [] });
        else fail(name, `prop:${name}`, 'a boolean prop the codemod does not map');
        continue;
      }
      const expression = attributeExpression(value);
      if (name === 'key') {
        key = { node: expression, hole: 'key', attribute };
        continue;
      }
      if (name === 'className') {
        const text = staticString(value);
        const choice = text === undefined ? classNameChoice(expression) : undefined;
        if (text !== undefined) className = text;
        else if (choice) {
          className = choice.whenTrue;
          other = { test: { node: choice.test, hole: 'condition' }, className: choice.whenFalse };
          choiceClasses.set(expression, `${choice.whenTrue} ${choice.whenFalse}`);
        } else
          fail(
            'className',
            'dynamic-className',
            'a className built at runtime other than one of two static strings by a plain condition',
          );
        continue;
      }
      if (name === 'testID') {
        props.push({
          name: 'testID',
          args: [staticString(value) ?? { node: expression, hole: 'string' }],
        });
        continue;
      }
      if (name === 'accessibilityLabel' && kind !== 'icon') {
        props.push({
          name: 'label',
          args: [staticString(value) ?? { node: expression, hole: 'string' }],
        });
        continue;
      }
      if (kind !== 'icon' && name === 'accessibilityHint') {
        props.push({
          name: 'hint',
          args: [staticString(value) ?? { node: expression, hole: 'string' }],
        });
        continue;
      }
      if (kind === 'pressable' && (name === 'onPress' || name === 'onLongPress')) {
        props.push({ name, args: [{ node: expression, hole: 'handler' }] });
        continue;
      }
      if (kind === 'pressable' && name === 'disabled') {
        props.push({ name: 'disabled', args: [{ node: expression, hole: 'boolean' }] });
        continue;
      }
      if (fades && name === 'activeOpacity') {
        const token = OPACITY_TOKEN.get(staticNumber(value) as number);
        if (token === undefined)
          fail(
            name,
            'prop:activeOpacity',
            'an activeOpacity that is no opacity token, or set at runtime',
          );
        else fade = token;
        continue;
      }
      if (kind !== 'icon' && name === 'accessibilityLiveRegion') {
        const region = staticString(value);
        if (region !== undefined && LIVE_REGIONS.has(region))
          props.push({ name: 'liveRegion', args: [region] });
        else fail(name, 'prop:accessibilityLiveRegion', 'a live region set at runtime');
        continue;
      }
      if (kind !== 'icon' && name === 'accessibilityState') {
        props.push({ name: 'accessibilityState', args: [{ node: expression, hole: 'state' }] });
        continue;
      }
      if (kind !== 'icon' && name === 'accessibilityValue') {
        props.push({ name: 'accessibilityValue', args: [{ node: expression, hole: 'state' }] });
        continue;
      }
      // The escape hatches, on the view's outermost box as React Native's own.
      if (kind !== 'icon' && (name === 'ref' || name === 'onLayout')) {
        props.push({ name, args: [{ node: expression, hole: 'handler' }] });
        continue;
      }
      if (kind !== 'icon' && name === 'hitSlop') {
        const calls = hitSlopCalls(value);
        if (calls === undefined)
          fail(
            name,
            'prop:hitSlop',
            'a hit slop whose sides are no hit slop tokens, or set at runtime',
          );
        else for (const args of calls) props.push({ name: 'hitSlop', args });
        continue;
      }
      if ((kind === 'bloomText' || kind === 'rnText') && name === 'numberOfLines') {
        numberOfLines = staticNumber(value) ?? { node: expression, hole: 'number' };
        continue;
      }
      if (kind === 'bloomText' && name === 'variant') {
        const text = staticString(value);
        if (text === undefined || !RAMP.has(text))
          fail('variant', 'variant', 'a variant that is no type-ramp step, or set at runtime');
        else variant = text;
        continue;
      }
      if (name === 'style' && kind !== 'icon') {
        // A theme colour read from `useTheme()` here is its role, as an icon's fill is.
        const read: StyleRead = (key, read) => {
          const inset = insetPadding(key, read);
          if (inset) return inset;
          if (kind === 'bloomText' || kind === 'rnText') {
            const text = textDeclaration(key, read);
            if (text) return text;
          }
          const role = themeRoles.get(read);
          if (!role || insideOf(node, [COLOR_SCOPE])) return undefined;
          if (key === 'backgroundColor') return { name: 'background', args: [role] };
          if (key === 'color' && (kind === 'bloomText' || kind === 'rnText'))
            return { name: 'foreground', args: [role] };
          return undefined;
        };
        const style = staticStyle(expression, read);
        if (style.ok) {
          styleClasses.push(...style.classes);
          styleMods.push(...style.mods);
        } else fail(style.subject, 'style', style.why);
        continue;
      }
      // What takes touches: `none` nothing (SwiftUI's `allowsHitTesting(false)`), `box-none` what is inside only, `box-only` the view only.
      if (name === 'pointerEvents' && (kind === 'view' || kind === 'pressable')) {
        const hitTesting = HIT_TESTING[staticString(value) ?? ''];
        if (hitTesting !== undefined) props.push({ name: 'allowsHitTesting', args: [hitTesting] });
        else fail(name, 'prop:pointerEvents', 'a pointerEvents set at runtime');
        continue;
      }
      if (name === 'accessibilityRole' && kind !== 'icon') {
        const role = staticString(value);
        if (role !== undefined && ROLES.has(role)) props.push({ name: 'role', args: [role] });
        else fail(name, 'role', 'a role the language does not take, or set at runtime');
        continue;
      }
      if (kind === 'icon' && name === 'size') {
        size = value;
        continue;
      }
      if (kind === 'icon' && (name === 'width' || name === 'height' || name === 'fill')) {
        iconProps.set(name, value);
        continue;
      }
      fail(name, `prop:${name}`, `the prop \`${name}\` has no mapping`);
    }

    for (const token of `${className} ${other?.className ?? ''}`.split(/\s+/).filter(Boolean))
      classes.add(token);
    if (styleClasses.length) {
      className = [className, ...styleClasses].filter(Boolean).join(' ');
      if (other) other.className = [other.className, ...styleClasses].filter(Boolean).join(' ');
    }

    if (kind === 'icon') {
      if (className || other) fail('className', 'icon-className', 'a className on an icon');
      const mods: Mod[] = [];
      // A width and a height of one number are the glyph's side, as `size` is.
      const width = iconProps.get('width');
      const height = iconProps.get('height');
      if (width !== undefined || height !== undefined) {
        const side = staticNumber(width);
        if (size !== undefined || side === undefined || staticNumber(height) !== side)
          fail('width', 'icon-size', 'a width and a height that are not one static side');
        else size = width;
      }
      if (size !== undefined) {
        // A rung by name, or a number of points that is a rung's (Bloom draws a number as its side).
        const named = staticString(size);
        const number = staticNumber(size);
        const rung = ICON_SIZES.find(([k, v]) => k === named || v === number);
        if (!rung)
          fail('size', 'icon-size', 'an icon size that is no icon rung, or set at runtime');
        else mods.push({ name: 'size', args: [rung[0]] });
      }
      if (node.children.some((c: AnyNode) => !(n.JSXText.check(c) && cleanJsxText(c.value) === '')))
        fail('children', 'icon-children', 'an icon with children');
      const fill = iconProps.get('fill');
      let color: AppColor | undefined;
      if (fill !== undefined) {
        const ink = iconFill(node, fill);
        if ('role' in ink) mods.push({ name: 'foreground', args: [ink.role] });
        else if ('color' in ink) color = ink.color;
        else reasons.push(ink.reason);
      } else {
        // A bare Bloom icon paints primary; Icon(X) paints the ink around it.
        mods.push(...options.table.bareIcon);
      }
      if (reasons.length) return { reasons };
      return { ir: { type: 'icon', component: local, mods, key, ...(color && { color }) } };
    }

    const isText = kind === 'bloomText' || kind === 'rnText';
    // Bloom's typography components (`Muted`, `H2`) are its Text in a text style.
    const textStyle = textStyleOf(local);
    if (textStyle && (className || other))
      fail(
        'className',
        'text-style-className',
        'a className on a typography component drops its own style',
      );
    const host: HostKind = isText ? 'text' : (kind as HostKind);
    const resolveOptions = {
      overridden: options.overridden,
      styleMods,
      styleClasses: new Set(styleClasses),
    };
    let resolution = resolveClassName(className, host, options.table, resolveOptions);
    if (!resolution.ok) reasons.push(...resolution.reasons);
    // The other branch resolves alike: the same modifiers, only their values differing, or a variant of each.
    let choice: Choice | null = null;
    if (other) {
      const otherwise = resolveClassName(other.className, host, options.table, resolveOptions);
      if (!otherwise.ok) reasons.push(...otherwise.reasons);
      else if (resolution.ok) {
        const mods = sameShape(resolution.value, otherwise.value);
        const only = mods ? undefined : branchesOnly(resolution.value, otherwise.value);
        if (mods) choice = { test: other.test, mods };
        else if (only) {
          choice = { test: other.test, only };
          resolution = { ok: true, value: { ...resolution.value, mods: only.both } };
        } else
          fail(
            'className',
            'dynamic-className',
            'a className whose two branches differ in their layout axis or variants, or add a modifier a variant cannot change',
          );
      }
    }

    if (isText) {
      const runs: TextRun[] = [];
      for (const child of node.children) {
        if (n.JSXText.check(child)) {
          const text = cleanJsxText(child.value);
          if (text) runs.push({ type: 'string', value: text });
        } else if (n.JSXExpressionContainer.check(child)) {
          if (n.JSXEmptyExpression.check(child.expression))
            fail('{/* */}', 'comment', 'a JSX comment (kept only in JSX)');
          else if (n.StringLiteral.check(child.expression))
            runs.push({ type: 'string', value: child.expression.value });
          else runs.push({ type: 'expr', value: { node: child.expression, hole: 'text' } });
        } else if (n.JSXElement.check(child)) {
          const inner = convert(child);
          const innerKind = elementOf(child)?.kind;
          // A span is the same Text as its parent: Bloom's in Bloom's, React Native's in React Native's.
          const span = jsxName(child);
          if ('ir' in inner && innerKind === kind && !(span && textStyleOf(span)))
            runs.push(inner.ir);
          else
            fail(
              jsxName(child) ?? 'element',
              'text-child',
              'an element inside a Text that is no convertible Text',
            );
        } else fail('child', 'text-child', 'a child inside a Text the codemod does not map');
      }
      if (!resolution.ok || reasons.length) return { reasons };
      const resolved = resolution.value;
      const fontMods: Mod[] = textStyle ? [{ name: 'textStyle', args: [textStyle] }] : [];
      if (variant) {
        if (
          [...resolved.mods, ...choiceMods(choice)].some(
            (m) => m.name === 'font' || m.name === 'weight',
          )
        )
          return {
            reasons: [
              { subject: 'variant', code: 'conflict', why: 'a variant and a className font' },
            ],
          };
        const [family, weight] = [
          variant.replace(/-(regular|medium|semibold|bold)$/, ''),
          variant.split('-').pop() as string,
        ];
        fontMods.push({ name: 'font', args: [family] });
        if (weight !== 'regular') fontMods.push({ name: 'weight', args: [weight] });
      }
      if (numberOfLines !== undefined) props.push({ name: 'lines', args: [numberOfLines] });
      return {
        ir: {
          type: 'text',
          raw: kind === 'rnText',
          resolved: { ...resolved, mods: [...resolved.mods, ...fontMods] },
          choice:
            choice && 'mods' in choice
              ? { ...choice, mods: [...choice.mods, ...fontMods] }
              : choice,
          props,
          key,
          runs,
        },
      };
    }

    // A stack: View or Pressable. A Pressable with no press is still a focusable pressable; a stack with none is a View.
    if (
      kind === 'pressable' &&
      !props.some((p) => p.name === 'onPress' || p.name === 'onLongPress')
    )
      fail(
        'Pressable',
        'pressable-without-press',
        'a Pressable with no onPress or onLongPress stays a focusable pressable',
      );
    const children: Ir[] = [];
    for (const child of node.children) {
      if (n.JSXText.check(child)) {
        if (cleanJsxText(child.value)) fail('text', 'raw-text', 'text directly inside a View');
      } else if (n.JSXExpressionContainer.check(child)) {
        if (n.JSXEmptyExpression.check(child.expression)) {
          const comment = commentOf(child);
          if (comment) children.push(comment);
          else fail('{/* */}', 'comment', 'a line comment in JSX (only a block comment moves)');
          continue;
        }
        children.push(expressionChild(child.expression));
      } else if (n.JSXElement.check(child)) {
        const inner = convert(child);
        children.push(
          'ir' in inner ? inner.ir : { type: 'embed', content: { node: child, hole: 'element' } },
        );
      } else if (n.JSXFragment.check(child)) {
        children.push({ type: 'embed', content: { node: child, hole: 'element' } });
      } else fail('child', 'child', 'a child the codemod does not map');
    }
    if (!resolution.ok || reasons.length) return { reasons };
    if (isPressableScale(sources.get(local) as Source))
      props.push({ name: 'pressScale', args: [] });
    if (fades) props.push({ name: 'pressFade', args: fade === undefined ? [] : [fade] });
    return { ir: { type: 'stack', resolved: resolution.value, choice, props, key, children } };
  }

  /**
   * A route's Screen by `SCREEN`: its one child is the body's root, and several
   * (a fragment's, a comment or a condition among them) a `Group` of them, which
   * draws no view of its own; its props are the root's screen modifiers, with no
   * header `.header(false)`.
   */
  function convertScreen(node: AnyNode): { ir: Ir } | { reasons: Reason[] } {
    const inner = convertComponent(node, SCREEN);
    if (!('ir' in inner) || inner.ir.type !== 'component') return inner;
    const { args } = inner.ir;
    const only = args.length === 1 ? (args[0] as Value) : undefined;
    const view = only && isTagged(only) && only.$ === 'view' ? only.view : undefined;
    if (!args.some((arg) => isTagged(arg) && arg.$ === 'view' && arg.view.type !== 'comment'))
      return {
        reasons: [
          {
            subject: 'children',
            code: 'screen:children',
            why: 'a screen with no content: the body’s root is a view',
          },
        ],
      };
    const root: Ir =
      view && view.type !== 'cond' && view.type !== 'comment'
        ? view
        : { type: 'component', node: 'Group', within: undefined, args, props: [], key: null };
    const props = inner.ir.props;
    if (!props.some((prop) => prop.name === 'header'))
      props.unshift({ name: 'header', args: [false] });
    props.push(...(screenOuter.get(node)?.mods ?? []));
    return { ir: { type: 'screen', content: root, props } };
  }

  /**
   * A className that is one of two static strings by one condition:
   * `test ? 'a' : 'b'` (a branch of `''`, `undefined` or `null` writes no
   * class), or a template literal holding one such choice of strings. The
   * condition is a plain read (no call), since the chain reads it once per
   * value it chooses.
   */
  function classNameChoice(
    expression: AnyNode,
  ): { test: AnyNode; whenTrue: string; whenFalse: string } | undefined {
    const template = n.TemplateLiteral.check(expression) && expression.expressions.length === 1;
    const choice = template ? expression.expressions[0] : expression;
    if (!n.ConditionalExpression.check(choice) || !isPlainRead(choice.test)) return undefined;
    // Outside a template an absent branch is no className; inside one it would be the word.
    const branch = (node: AnyNode) =>
      !template &&
      (n.NullLiteral.check(node) || (n.Identifier.check(node) && node.name === 'undefined'))
        ? ''
        : staticString(node);
    const [whenTrue, whenFalse] = [branch(choice.consequent), branch(choice.alternate)];
    if (whenTrue === undefined || whenFalse === undefined) return undefined;
    if (!template) return { test: choice.test, whenTrue, whenFalse };
    const [head, tail] = expression.quasis.map((q: AnyNode) => q.value.cooked as string);
    return {
      test: choice.test,
      whenTrue: head + whenTrue + tail,
      whenFalse: head + whenFalse + tail,
    };
  }

  /** The modifiers a choice writes besides the chain's. */
  function choiceMods(choice: Choice | null): readonly Mod[] {
    if (!choice) return [];
    return 'mods' in choice ? choice.mods : [...choice.only.whenTrue, ...choice.only.whenFalse];
  }

  /**
   * Each branch's own modifiers over those both write, when the branches lay
   * out on one axis with the same variants, and what each adds alone is what
   * a variant under the app's condition changes. Both branches resolved with
   * no two classes setting one thing, so a modifier one branch adds sets
   * nothing the other modifiers set: the variant adds it, overriding nothing.
   */
  function branchesOnly(
    chain: Resolved,
    other: Resolved,
  ): { both: Mod[]; whenTrue: Mod[]; whenFalse: Mod[] } | undefined {
    if (
      chain.axis !== other.axis ||
      JSON.stringify(chain.variants) !== JSON.stringify(other.variants)
    )
      return undefined;
    const rest = other.mods.map((mod) => JSON.stringify(mod));
    const both: Mod[] = [];
    const whenTrue: Mod[] = [];
    for (const mod of chain.mods) {
      const at = rest.indexOf(JSON.stringify(mod));
      if (at < 0) whenTrue.push(mod);
      else {
        both.push(mod);
        rest[at] = '';
      }
    }
    const whenFalse = other.mods.filter((_, i) => rest[i] !== '');
    return [...whenTrue, ...whenFalse].every(heldVariantChanges)
      ? { both, whenTrue, whenFalse }
      : undefined;
  }

  /**
   * The other branch's modifiers when they are the chain's, one for one, with
   * arguments of the same kinds (the same axis and variants too); else undefined.
   */
  function sameShape(chain: Resolved, other: Resolved): readonly Mod[] | undefined {
    const same =
      chain.axis === other.axis &&
      JSON.stringify(chain.variants) === JSON.stringify(other.variants) &&
      chain.mods.length === other.mods.length &&
      chain.mods.every((mod, i) => {
        const at = other.mods[i] as Mod;
        return (
          mod.name === at.name &&
          mod.args.length === at.args.length &&
          mod.args.every((arg, j) => typeof arg === typeof at.args[j] && typeof arg !== 'object')
        );
      });
    return same ? other.mods : undefined;
  }

  /**
   * A shell around one input, as the input's node: the input by its own rule
   * (its shell is this one, so its context is), the glyphs beside it as the
   * node's `icon` and `trailingIcon`, and the shell's props joined to the input's.
   */
  function convertShell(
    node: AnyNode,
    rule: ComponentRule,
    shell: NonNullable<ComponentRule['shell']>,
  ): { ir: Ir } | { reasons: Reason[] } {
    const fail = (subject: string, why: string): { reasons: Reason[] } => ({
      reasons: [{ subject, code: `${rule.node}:${subject}`, why }],
    });
    const named = (child: AnyNode) => {
      const local = n.JSXElement.check(child) ? jsxName(child) : undefined;
      const source = local ? sources.get(local) : undefined;
      return source ? `${source.module}#${source.imported}` : undefined;
    };
    const children = node.children.filter(
      (c: AnyNode) => !(n.JSXText.check(c) && cleanJsxText(c.value) === ''),
    );
    const at = children.findIndex((child: AnyNode) => named(child) === shell.input);
    const input = children[at];
    const [inputSource] = shell.input.split('#') as [string];
    const inputRule = ruleFor(inputSource, shell.input.slice(inputSource.length + 1));
    if (!input || !inputRule || at > 1 || children.length > at + 2)
      return fail('children', 'a shell holds its input, a glyph before it and one after');
    // The shell's own props and its key.
    const own: PropMod[] = [];
    let key: Carried | null = null;
    for (const attribute of node.openingElement.attributes) {
      if (!n.JSXAttribute.check(attribute) || !n.JSXIdentifier.check(attribute.name))
        return fail('{...spread}', 'spread props: the codemod cannot see what they set');
      const name = attribute.name.name as string;
      if (name === 'key' && attribute.value) {
        key = { node: attributeExpression(attribute.value), hole: 'key', attribute };
        continue;
      }
      const prop = rule.props?.[name];
      const values = prop ? valuesOf(prop.form, attribute.value ?? null, prop.map) : undefined;
      if (!prop || !values)
        return fail(name, `the shell's \`${name}\` (or its form here) has no mapping`);
      own.push({ name: prop.modifier, args: values });
    }
    // Its glyphs: a TextFieldIcon before the input is the node's icon, one after its trailing icon.
    for (const [index, child] of children.entries()) {
      if (index === at) continue;
      if (named(child) !== shell.icon) return fail('children', 'a shell child that is no glyph');
      const position = index < at ? 'leading' : 'trailing';
      let icon: Value | undefined;
      for (const attribute of child.openingElement.attributes) {
        const plain = n.JSXAttribute.check(attribute) && n.JSXIdentifier.check(attribute.name);
        const name = plain ? (attribute.name.name as string) : '{...spread}';
        const value = plain ? attribute.value : null;
        if (name === 'icon') icon = valuesOf('icon', value)?.[0];
        else if (name !== 'position' || staticString(value) !== position)
          return fail(name, `a glyph's \`${name}\` (or its form here) has no mapping`);
      }
      if (!icon) return fail('icon', 'a glyph that is no Bloom icon');
      own.push({ name: position === 'leading' ? 'icon' : 'trailingIcon', args: [icon] });
    }
    // The input by its own rule: its shell is this one, so the shell's context is its own.
    const inner = convertComponent(input, inputRule, false);
    if (!('ir' in inner) || inner.ir.type !== 'component') return inner;
    const props = inner.ir.props;
    const twice = own.find((prop) => props.some((p) => p.name === prop.name));
    if (twice) return fail(twice.name, 'set on the shell and on its input');
    if (inner.ir.key) return fail('key', 'a key on the input inside a shell');
    // The input converts with its shell, as one node.
    if (!counted.has(input)) {
      counted.add(input);
      candidates++;
    }
    const ir: Ir = { ...inner.ir, props: [...props, ...own], key };
    results.set(input, { ir });
    return { ir };
  }

  /** A Bloom component the language draws as a node of its own, by its rule (`components.ts`). */
  function convertComponent(
    node: AnyNode,
    rule: ComponentRule,
    /** Whether the rule's `outside` applies: not to an input converted with its own shell. */
    checkOutside = true,
  ): { ir: Ir } | { reasons: Reason[] } {
    const reasons: Reason[] = [];
    const unmapped = (name: string) =>
      reasons.push({
        subject: name,
        code: `${rule.node}:${name}`,
        why: `${rule.node}'s \`${name}\` (or its form here) has no mapping`,
      });
    const around = rule.outside && checkOutside ? insideOf(node, rule.outside) : undefined;
    if (around)
      reasons.push({
        subject: around,
        code: `${rule.node}:inside-${around}`,
        why: `inside a ${around}, whose context the Bloom component reads and the language's node does not`,
      });
    let key: Carried | null = null;
    /** Each prop's attribute value (`null` when it is bare). */
    const given = new Map<string, AnyNode>();
    for (const attribute of node.openingElement.attributes) {
      if (!n.JSXAttribute.check(attribute) || !n.JSXIdentifier.check(attribute.name)) {
        reasons.push({
          subject: '{...spread}',
          code: 'spread',
          why: 'spread props: the codemod cannot see what they set',
        });
        continue;
      }
      const name = attribute.name.name as string;
      if (name === 'key' && attribute.value)
        key = { node: attributeExpression(attribute.value), hole: 'key', attribute };
      else given.set(name, attribute.value ?? null);
    }

    const args: Value[] = [];
    const consumed = new Set<string>();
    let textChildren = false;
    /** The props of an object given as one value, each under its own name or the key beside its form. */
    const optionsOf = (
      options: Readonly<Record<string, Form | readonly [key: string, form: Form]>>,
    ): [string, Value][] => {
      const entries: [string, Value][] = [];
      for (const [name, entry] of Object.entries(options)) {
        consumed.add(name);
        if (!given.has(name)) continue;
        const [key, form] = typeof entry === 'string' ? [name, entry] : entry;
        const value = valuesOf(form, given.get(name));
        // A bare flag is `true` in an object.
        if (value?.length === 0 && (form === 'flag' || form === 'mark')) entries.push([key, true]);
        else if (value?.length !== 1) unmapped(name);
        else entries.push([key, value[0] as Value]);
      }
      return entries;
    };
    for (const param of rule.params ?? []) {
      if ('binding' in param) {
        const [valueProp, setters] = param.binding;
        const setProps = typeof setters === 'string' ? [setters] : setters;
        consumed.add(valueProp);
        for (const name of setProps) consumed.add(name);
        const value = given.get(valueProp);
        // One setter: two would be Bloom's choice between them, which the binding does not carry.
        const named = setProps.filter((name) => given.has(name));
        const set = named.length === 1 ? given.get(named[0] as string) : undefined;
        if (!value || !set) unmapped(valueProp);
        else
          args.push({
            $: 'binding',
            binding: [
              { node: attributeExpression(value), hole: param.hole },
              { node: attributeExpression(set), hole: 'handler' },
            ],
          });
      } else if ('options' in param) {
        const entries = optionsOf(param.options);
        args.push(entries.length ? { $: 'options', entries } : { $: 'absent' });
      } else if ('label' in param) {
        // Its glyphs and its label, as the node reads them from its content.
        textChildren = true;
        const glyph = (prop: string | undefined): Value | null => {
          if (!prop || !given.has(prop)) return null;
          consumed.add(prop);
          const value = valuesOf('icon', given.get(prop));
          if (value?.length !== 1) {
            unmapped(prop);
            return null;
          }
          const { name } = value[0] as { name: string };
          return { $: 'view', view: { type: 'icon', component: name, mods: [], key: null } };
        };
        /** A view in the glyph's slot: one of the element props naming it, and no glyph beside it. */
        const slotView = (props: readonly string[] = [], icon: Value | null): Value | null => {
          const named = props.filter((prop) => given.has(prop));
          for (const prop of named) consumed.add(prop);
          if (named.length === 0) return icon;
          const value =
            named.length === 1 && !icon
              ? valuesOf('view', given.get(named[0] as string))
              : undefined;
          if (value?.length !== 1) {
            unmapped(named[0] as string);
            return icon;
          }
          return value[0] as Value;
        };
        const leading = slotView(param.label.leadingViews, glyph(param.label.leading));
        const text = textOf(node.children);
        const trailing = slotView(param.label.trailingViews, glyph(param.label.trailing));
        if (leading) args.push(leading);
        if (text !== undefined)
          args.push({
            $: 'view',
            view: {
              type: 'text',
              raw: false,
              resolved: { axis: 'column', mods: [], variants: [] },
              choice: null,
              props: [],
              key: null,
              runs: [
                typeof text === 'string'
                  ? { type: 'string', value: text }
                  : { type: 'expr', value: text as Carried },
              ],
            },
          });
        else if (
          node.children.some((c: AnyNode) => !(n.JSXText.check(c) && cleanJsxText(c.value) === ''))
        )
          unmapped('children');
        if (trailing) args.push(trailing);
      } else if ('text' in param) {
        textChildren = true;
        const children =
          param.text === true ? node.children : innerChildren(node.children, param.text);
        const text = children && textOf(children);
        if (text === undefined) unmapped('children');
        else args.push(text);
      } else {
        consumed.add(param.prop);
        if (!given.has(param.prop)) {
          if (param.optional) args.push({ $: 'absent' });
          else unmapped(param.prop);
          continue;
        }
        const value = valuesOf(param.form, given.get(param.prop));
        if (value?.length !== 1) unmapped(param.prop);
        else args.push(value[0] as Value);
      }
    }
    const props: PropMod[] = [];
    if (rule.gather) {
      const entries = optionsOf(rule.gather.props);
      if (entries.length)
        props.push({ name: rule.gather.modifier, args: [{ $: 'options', entries }] });
    }
    /** A binding that ends the chain (`.presented()`), written after every other modifier. */
    let last: PropMod | undefined;
    // A prop that is another's modifier's next argument (or its close handler) is read with it.
    for (const prop of Object.values(rule.props ?? {})) {
      if (prop.with && given.has(prop.with[0])) consumed.add(prop.with[0]);
      if (prop.closedBy && given.has(prop.closedBy)) consumed.add(prop.closedBy);
      for (const option of Object.keys(prop.options ?? {}))
        if (given.has(option)) consumed.add(option);
    }
    /** Its `style`, the node's box: chained after its own modifiers. */
    const styled: PropMod[] = [];
    for (const [name, value] of given) {
      if (consumed.has(name)) continue;
      const differs = rule.differs?.[name];
      if (differs) {
        reasons.push({ subject: name, code: `${rule.node}:${name}`, why: differs });
        continue;
      }
      const prop: PropRule | undefined = rule.props?.[name];
      if (prop?.form === 'className') {
        const text = value ? staticString(value) : undefined;
        const view = text === undefined ? undefined : contentViewOf(text);
        if (!view) unmapped(name);
        else if ('reasons' in view) reasons.push(...view.reasons);
        else props.push({ name: prop.modifier, args: [view] });
        continue;
      }
      if (prop?.form === 'style') {
        const box = value ? componentStyle(attributeExpression(value), rule.node) : undefined;
        if (!box) unmapped(name);
        else if ('reasons' in box) reasons.push(...box.reasons);
        else styled.push(...box.mods);
        continue;
      }
      if (prop?.form === 'contentStyle') {
        const margins = value ? contentStyleOf(attributeExpression(value)) : undefined;
        if (margins) props.push(...margins);
        else unmapped(name);
        continue;
      }
      if (prop?.marks) {
        // A static string naming the bare modifier, or none.
        const text = staticString(value);
        const mark = text === undefined ? undefined : prop.marks[text];
        if (mark === undefined) unmapped(name);
        else if (mark) props.push({ name: prop.modifier, args: [] });
        continue;
      }
      const values = prop ? valuesOf(prop.form, value, prop.map) : undefined;
      if (!prop || !values) {
        unmapped(name);
        continue;
      }
      if (prop.with && given.has(prop.with[0])) {
        const next = valuesOf(prop.with[1], given.get(prop.with[0]));
        if (next?.length !== 1) unmapped(prop.with[0]);
        else values.push(next[0] as Value);
      }
      if (prop.closedBy) {
        // The value and the close handler, one binding: setting it false calls the handler.
        const close = given.has(prop.closedBy)
          ? actionOf(attributeExpression(given.get(prop.closedBy)))
          : undefined;
        if (values.length !== 1 || !close) unmapped(name);
        else
          last = {
            name: prop.modifier,
            args: [{ $: 'binding', binding: [values[0] as Value, close] }],
          };
        continue;
      }
      if (prop.options) {
        // Its options object, each prop given by its key.
        const entries: [string, Value][] = [];
        for (const [option, [key, form, map]] of Object.entries(prop.options)) {
          if (!given.has(option)) continue;
          const value = valuesOf(form, given.get(option), map);
          if (value?.length !== 1) unmapped(option);
          else entries.push([key, value[0] as Value]);
        }
        if (entries.length) values.push({ $: 'options', entries });
      }
      if (prop.key) {
        // One object for the modifier: each prop its key.
        const entry: [string, Value] = [prop.key, values[0] as Value];
        const joined = props.find((mod) => mod.name === prop.modifier);
        const object = joined?.args[0];
        if (values.length !== 1) unmapped(name);
        else if (object && isTagged(object) && object.$ === 'options')
          joined.args[0] = { $: 'options', entries: [...object.entries, entry] };
        else props.push({ name: prop.modifier, args: [{ $: 'options', entries: [entry] }] });
        continue;
      }
      props.push({ name: prop.modifier, args: [...values, ...(prop.args ?? [])] });
    }
    if (last) props.push(last);
    // A next argument (or a close handler) given without its modifier's prop.
    for (const [name, prop] of Object.entries(rule.props ?? {})) {
      if (prop.with && given.has(prop.with[0]) && !given.has(name)) unmapped(prop.with[0]);
      if (prop.closedBy && given.has(prop.closedBy) && !given.has(name)) unmapped(prop.closedBy);
      for (const option of Object.keys(prop.options ?? {}))
        if (given.has(option) && !given.has(name)) unmapped(option);
    }

    /** Its parts, each converted with it. */
    const parts = new Map<AnyNode, Ir>();
    if (rule.parts) {
      const converted = convertParts(node.children, rule.parts, parts);
      if ('reasons' in converted) reasons.push(...converted.reasons);
      else args.push(...converted.views.map((view): Value => ({ $: 'view', view })));
    } else if (rule.children) {
      // A fragment's children are the element's own, where the fragment is.
      const children = rule.fragments
        ? node.children.flatMap((child: AnyNode) =>
            n.JSXFragment.check(child) ? child.children : [child],
          )
        : node.children;
      for (const child of children) {
        const view = childView(child);
        if (view === null) continue;
        if (view === undefined) unmapped('children');
        else args.push({ $: 'view', view });
      }
    } else if (
      !textChildren &&
      node.children.some((c: AnyNode) => !(n.JSXText.check(c) && cleanJsxText(c.value) === ''))
    )
      unmapped('children');
    for (const name of rule.always ?? []) props.push({ name, args: [] });
    props.push(...styled);
    // An optional argument left out at the end (children included) is no argument.
    while (args.length > 0 && isAbsent(args[args.length - 1] as Value)) args.pop();
    if (reasons.length) return { reasons };
    for (const [element, ir] of parts) results.set(element, { ir });
    return {
      ir: {
        type: 'component',
        node: rule.node,
        within:
          rule.within ??
          Object.entries(rule.props ?? {}).find(
            ([name, prop]) => prop.within && given.has(name),
          )?.[1].within,
        args,
        props,
        key,
      },
    };
  }

  /**
   * The children of a compound element as its parts (`module#export`), each
   * by its own rule: an element, a comment, or a `.map()` whose function
   * returns one (its array carried). Each part converted is added to `converted`.
   */
  function convertParts(
    children: AnyNode[],
    parts: readonly string[],
    converted: Map<AnyNode, Ir>,
  ): { views: Ir[] } | { reasons: Reason[] } {
    const reasons: Reason[] = [];
    const views: Ir[] = [];
    const names = parts.map((part) => `\`${part.split('#')[1]}\``).join(', ');
    const part = (element: AnyNode): Ir | undefined => {
      const local = n.JSXElement.check(element) ? jsxName(element) : undefined;
      const source = local ? sources.get(local) : undefined;
      const rule =
        source && parts.includes(`${source.module}#${source.imported}`)
          ? ruleFor(source.module, source.imported)
          : undefined;
      if (!rule) {
        reasons.push({
          subject: local ?? 'children',
          code: 'not-a-part',
          why: `a child that is none of its parts (${names})`,
        });
        return undefined;
      }
      if (!counted.has(element)) {
        counted.add(element);
        candidates++;
      }
      const result = convertComponent(element, rule);
      if (!('ir' in result) || result.ir.type !== 'component') {
        if ('reasons' in result) reasons.push(...result.reasons);
        return undefined;
      }
      const ir: Ir = { ...result.ir, part: true };
      converted.set(element, ir);
      return ir;
    };
    for (const child of children) {
      if (n.JSXText.check(child) && !cleanJsxText(child.value)) continue;
      const expression = n.JSXExpressionContainer.check(child) ? child.expression : undefined;
      if (expression && n.JSXEmptyExpression.check(expression)) {
        const comment = commentOf(child);
        if (comment) views.push(comment);
        else
          reasons.push({
            subject: '{/* */}',
            code: 'comment',
            why: 'a line comment in JSX (only a block comment moves)',
          });
        continue;
      }
      const map = expression ? mapOf(expression) : undefined;
      const body = part(map ? map.body : expression ? undefined : child);
      if (!body) continue;
      views.push(
        map
          ? { type: 'map', items: { node: map.items, hole: 'items' }, params: map.params, body }
          : body,
      );
    }
    return reasons.length ? { reasons } : { views };
  }

  /** `items.map((item) => <Element />)`: its array, its function's parameters and the element it returns. */
  function mapOf(
    expression: AnyNode,
  ): { items: AnyNode; params: AnyNode[]; body: AnyNode } | undefined {
    if (!n.CallExpression.check(expression) || expression.arguments.length !== 1) return undefined;
    const { callee } = expression;
    const fn = expression.arguments[0];
    if (
      !n.MemberExpression.check(callee) ||
      callee.computed ||
      !n.Identifier.check(callee.property) ||
      callee.property.name !== 'map' ||
      !n.ArrowFunctionExpression.check(fn) ||
      !n.JSXElement.check(fn.body)
    )
      return undefined;
    return { items: callee.object, params: fn.params, body: fn.body };
  }

  /** The children of an element's one child, when it is `component` (`module#export`) with no props. */
  function innerChildren(children: AnyNode[], component: string): AnyNode[] | undefined {
    const given = children.filter(
      (c: AnyNode) => !(n.JSXText.check(c) && cleanJsxText(c.value) === ''),
    );
    const only: AnyNode = given.length === 1 && n.JSXElement.check(given[0]) ? given[0] : null;
    const source = only ? sources.get(jsxName(only) ?? '') : undefined;
    return source &&
      `${source.module}#${source.imported}` === component &&
      only.openingElement.attributes.length === 0
      ? only.children
      : undefined;
  }

  /**
   * A prop's value in a rule's form, as the modifier's arguments (none for a
   * bare flag), or undefined when the value is in a form the rule does not take.
   */
  function valuesOf(
    form: Form,
    value: AnyNode,
    map?: Readonly<Record<string, string>>,
  ): Value[] | undefined {
    if (value === null)
      // A bare prop is `true`.
      return form === 'flag' || form === 'mark'
        ? []
        : form === 'boolean'
          ? [true]
          : form === 'literal' && map?.true !== undefined
            ? [map.true]
            : undefined;
    const expression = attributeExpression(value);
    if (n.JSXEmptyExpression.check(expression)) return undefined;
    switch (form) {
      case 'string': {
        const text = staticString(value);
        if (text !== undefined) return [text];
        return hasJsx(expression) ? undefined : [{ node: expression, hole: 'string' }];
      }
      case 'token': {
        // A token is a static string, or a static number of points (`spacing={12}`).
        const number = staticNumber(value);
        const text = staticString(value) ?? (number === undefined ? undefined : String(number));
        if (text === undefined) return undefined;
        const token = map ? map[text] : text;
        return token === undefined ? undefined : [token];
      }
      case 'flag':
      case 'boolean':
        if (n.BooleanLiteral.check(expression)) return [expression.value];
        return hasJsx(expression) ? undefined : [{ node: expression, hole: 'boolean' }];
      case 'mark':
        return n.BooleanLiteral.check(expression) && expression.value ? [] : undefined;
      case 'empty':
        return n.ObjectExpression.check(expression) && expression.properties.length === 0
          ? []
          : undefined;
      case 'number': {
        const number = staticNumber(value);
        if (number !== undefined) return [number];
        return hasJsx(expression) || n.StringLiteral.check(expression)
          ? undefined
          : [{ node: expression, hole: 'number' }];
      }
      case 'handler':
        // `null` is a handler's own value (a header's `onBack={null}` shows no back button).
        if (n.NullLiteral.check(expression)) return [{ $: 'null' }];
        return n.ArrowFunctionExpression.check(expression) ||
          n.FunctionExpression.check(expression) ||
          n.Identifier.check(expression) ||
          n.MemberExpression.check(expression) ||
          n.CallExpression.check(expression)
          ? [{ node: expression, hole: 'handler' }]
          : undefined;
      case 'content':
        return n.JSXElement.check(expression) || n.JSXFragment.check(expression)
          ? valuesOf('view', value, map)
          : valuesOf('string', value, map);
      case 'view': {
        if (n.StringLiteral.check(expression) || n.TemplateLiteral.check(expression))
          return undefined;
        const view = n.JSXElement.check(expression) ? elementView(expression) : null;
        if (view) return [{ $: 'view', view }];
        if (n.JSXFragment.check(expression))
          return [
            { $: 'view', view: { type: 'embed', content: { node: expression, hole: 'element' } } },
          ];
        return [{ $: 'view', view: expressionChild(expression) }];
      }
      case 'icon':
        return n.Identifier.check(expression) && kindOf(sources.get(expression.name)) === 'icon'
          ? [{ $: 'icon', name: expression.name }]
          : undefined;
      case 'literal': {
        const token = n.BooleanLiteral.check(expression)
          ? map?.[String(expression.value)]
          : undefined;
        return token === undefined ? undefined : [token];
      }
      case 'refresh':
        return refreshOf(expression);
      case 'items':
        // Data carried as it is, the elements inside it (a row's trailing button) included.
        return n.JSXElement.check(expression) ||
          n.JSXFragment.check(expression) ||
          n.StringLiteral.check(expression)
          ? undefined
          : [{ node: expression, hole: 'items' }];
      case 'element':
        if (n.JSXElement.check(expression)) return [{ $: 'view', view: elementView(expression) }];
        // A fragment, a language view's element, or a `const` holding an element, is drawn as it is.
        return n.JSXFragment.check(expression) ||
          isToElement(expression) ||
          elementReads.has(expression)
          ? [{ $: 'view', view: { type: 'embed', content: { node: expression, hole: 'element' } } }]
          : undefined;
      case 'row': {
        const row = rowOf(expression);
        return row === undefined ? undefined : [row];
      }
      case 'placement':
        return placementOf(value);
    }
  }

  /**
   * Bloom's responsive placement as `.presentAt(base, tiers)`: a static token,
   * or an object literal of static tokens with its `base` and any of the
   * breakpoints, each tier written as Bloom reads it over the base.
   */
  function placementOf(value: AnyNode): Value[] | undefined {
    const text = staticString(value);
    if (text !== undefined) {
      const token = DIALOG_PLACEMENT[text];
      return token === undefined ? undefined : [token];
    }
    const object = attributeExpression(value);
    if (!n.ObjectExpression.check(object)) return undefined;
    let base: string | undefined;
    const tiers: [string, Value][] = [];
    for (const property of object.properties) {
      if (
        !(n.ObjectProperty.check(property) || n.Property.check(property)) ||
        property.computed ||
        !n.Identifier.check(property.key)
      )
        return undefined;
      const token = DIALOG_PLACEMENT[staticString(property.value) ?? ''];
      const key = property.key.name as string;
      if (token === undefined) return undefined;
      if (key === 'base') base = token;
      else if (PLACEMENT_TIERS.includes(key)) tiers.push([key, token]);
      else return undefined;
    }
    // An object is drawn as an object (`{ base, ...tiers }`), its tiers none or more.
    return base === undefined ? undefined : [base, { $: 'options', entries: tiers }];
  }

  /**
   * A handler Bloom calls with no arguments, as a function of none: an arrow of
   * no parameters as it is (it ignores what it is called with), a name or a
   * member called with none (`() => onClose()`). Anything else may read an argument.
   */
  function actionOf(expression: AnyNode): Carried | undefined {
    if (n.ArrowFunctionExpression.check(expression) && expression.params.length === 0)
      return { node: expression, hole: 'handler' };
    if (n.Identifier.check(expression) || n.MemberExpression.check(expression))
      return { node: expression, hole: 'action' };
    return undefined;
  }

  /**
   * A static content container style (an object literal or a module
   * StyleSheet's style) of paddings and a gap, each a space token, as the
   * scroll view's content margins and spacing: the language's content
   * container style holds the same keys.
   */
  function contentStyleOf(expression: AnyNode): PropMod[] | undefined {
    const object = moduleStyleReads.has(expression)
      ? styleSheets.get(expression.object.name)?.get(expression.property.name)
      : expression;
    if (!n.ObjectExpression.check(object)) return undefined;
    const mods: PropMod[] = [];
    for (const property of object.properties) {
      if (
        !(n.ObjectProperty.check(property) || n.Property.check(property)) ||
        property.computed ||
        !n.Identifier.check(property.key)
      )
        return undefined;
      const token = SPACE[String(staticNumber(property.value))];
      const key = property.key.name as string;
      const edge = key === 'gap' ? undefined : CONTENT_EDGE[key];
      if (token === undefined || (key !== 'gap' && !edge)) return undefined;
      mods.push(
        key === 'gap'
          ? { name: 'spacing', args: [token] }
          : { name: 'contentMargins', args: edge === 'all' ? [token] : [edge as string, token] },
      );
    }
    if (object !== expression) styleLiterals.set(expression, recast.print(object).code);
    return mods;
  }

  /**
   * A scroll view's content class as its content view's build function: each
   * class through the className table, as a View's, and every modifier one the
   * content view takes (the spec's `contentView.modifiers`: the layout of one view).
   */
  function contentViewOf(
    className: string,
  ): { readonly $: 'build'; readonly mods: Mod[] } | { reasons: Reason[] } {
    const resolution = resolveClassName(className, 'view', options.table, {
      overridden: options.overridden,
    });
    if (!resolution.ok) return { reasons: [...resolution.reasons] };
    for (const token of className.split(/\s+/).filter(Boolean)) classes.add(token);
    const { axis, mods, variants } = resolution.value;
    const all: Mod[] =
      axis === 'row' ? [{ name: 'axis', args: ['horizontal'] }, ...mods] : [...mods];
    const subject = 'contentContainerClassName';
    if (variants.length)
      return {
        reasons: [
          {
            subject,
            code: 'contentView:variant',
            why: 'a content class with a variant (`md:`, `dark:`): the content view takes the layout of one view, without variants',
          },
        ],
      };
    const outside = all.find((mod) => !CONTENT_VIEW.has(mod.name));
    if (outside)
      return {
        reasons: [
          {
            subject,
            code: `contentView:${outside.name}`,
            why: `the content view takes the layout of one view (the spec's \`contentView.modifiers\`), not \`.${outside.name}()\``,
          },
        ],
      };
    return { $: 'build', mods: all };
  }

  /**
   * React Native's `RefreshControl` as a pull to refresh: its `refreshing` and
   * the binding a pull writes `true` to, which calls `onRefresh` with no
   * arguments as React Native does; its `tintColor` and `colors` as the tint
   * when both are one theme colour, since the tint paints both; each alone, or
   * two colours, the tint of its platform (`{ ios: 'primary' }`).
   */
  function refreshOf(expression: AnyNode): Value[] | undefined {
    const local = n.JSXElement.check(expression) ? jsxName(expression) : undefined;
    const source = local ? sources.get(local) : undefined;
    if (source?.module !== 'react-native' || source.imported !== 'RefreshControl') return undefined;
    if (expression.children.length) return undefined;
    const given = new Map<string, AnyNode>();
    for (const attribute of expression.openingElement.attributes) {
      if (!n.JSXAttribute.check(attribute) || !n.JSXIdentifier.check(attribute.name))
        return undefined;
      if (!attribute.value) return undefined;
      given.set(attribute.name.name, attributeExpression(attribute.value));
    }
    const { refreshing, onRefresh, tintColor, colors, ...rest } = Object.fromEntries(given);
    if (Object.keys(rest).length || !refreshing || !onRefresh || hasJsx(refreshing))
      return undefined;
    // The refreshing value and the action a pull runs, as written: `{ refreshing, onRefresh }`.
    if (hasJsx(onRefresh)) return undefined;
    const binding: Value = {
      $: 'options',
      entries: [
        ['refreshing', { node: refreshing, hole: 'boolean' }],
        ['onRefresh', { node: onRefresh, hole: 'handler' }],
      ],
    };
    // iOS's `tintColor` and Android's `colors` (one theme colour), each the tint of its platform.
    const ios = tintColor ? themeRoles.get(tintColor) : undefined;
    const [only, ...others] = n.ArrayExpression.check(colors) ? colors.elements : [];
    const android = colors && only && !others.length ? themeRoles.get(only) : undefined;
    if ((tintColor && !ios) || (colors && !android)) return undefined;
    // Its import goes with the element when nothing else draws one.
    convertedLocals.add(local as string);
    if (!ios && !android) return [binding];
    if (ios === android) return [binding, ios as string];
    const entries: [string, Value][] = [];
    if (ios) entries.push(['ios', ios]);
    if (android) entries.push(['android', android]);
    return [binding, { $: 'options', entries }];
  }

  /**
   * FlashList's `renderItem` as the node's row, which Bloom hands the same
   * `{ item, index }`: an arrow of one parameter returning an expression (its
   * parameter as written; an element as the row's view, anything else
   * embedded as it is), or a named function, carried as it is
   * (`VirtualList(posts, renderPost)`: the language draws its element as it
   * is, and the list's `renderItem` keeps its identity).
   */
  function rowOf(expression: AnyNode): Value | undefined {
    // A named renderItem is the row itself, as JSX handed it: its identity kept, so FlashList's memoised rows stay.
    if (n.Identifier.check(expression) || n.MemberExpression.check(expression))
      return { $: 'renderer', fn: { node: expression, hole: 'renderer' } };
    if (
      !n.ArrowFunctionExpression.check(expression) ||
      expression.params.length !== 1 ||
      n.BlockStatement.check(expression.body)
    )
      return undefined;
    const [param] = expression.params;
    if (!n.Identifier.check(param) && !n.ObjectPattern.check(param)) return undefined;
    const { body } = expression;
    // An element is converted where it can be; any other expression (`renderRow(item)`) is embedded as it is.
    const view: Ir = n.JSXElement.check(body)
      ? elementView(body)
      : { type: 'embed', content: { node: body, hole: 'element' } };
    return { $: 'row', param: recast.print(param).code, view };
  }

  /** An element as a view: converted when it can be, else embedded. */
  function elementView(element: AnyNode): Ir {
    const inner = convert(element);
    return 'ir' in inner
      ? inner.ir
      : { type: 'embed', content: { node: element, hole: 'element' } };
  }

  /** A JSX comment's block comments as a code comment; undefined for a line comment. */
  function commentOf(container: AnyNode): Ir | undefined {
    const text = source.slice(container.start + 1, container.end - 1).trim();
    // Block comments only: a line comment would swallow the arguments after it.
    return text.startsWith('/*') && text.endsWith('*/') && !text.includes('//')
      ? { type: 'comment', text }
      : undefined;
  }

  /**
   * A list of views as arguments: a comment sits before the view after it
   * (after the last one when it ends the list), never an argument of its own.
   */
  function printViews(views: readonly Ir[], carry: (c: Carried) => string): string[] {
    const out: string[] = [];
    let pending: string[] = [];
    for (const view of views) {
      if (view.type === 'comment') pending.push(view.text);
      else {
        out.push([...pending, print(view, carry)].join(' '));
        pending = [];
      }
    }
    if (pending.length && out.length) out[out.length - 1] += ` ${pending.join(' ')}`;
    else if (pending.length) out.push(pending.join(' '));
    return out;
  }

  /** A child of a view-holding element as a view; null when it is no child, undefined when it is text. */
  function childView(child: AnyNode): Ir | null | undefined {
    if (n.JSXText.check(child)) return cleanJsxText(child.value) ? undefined : null;
    if (n.JSXExpressionContainer.check(child)) {
      if (n.JSXEmptyExpression.check(child.expression)) return commentOf(child);
      if (n.StringLiteral.check(child.expression) || n.TemplateLiteral.check(child.expression))
        return undefined;
      return expressionChild(child.expression);
    }
    if (n.JSXElement.check(child)) return elementView(child);
    if (n.JSXFragment.check(child))
      return { type: 'embed', content: { node: child, hole: 'element' } };
    return undefined;
  }

  /** An element's children as one string: one static text, or one expression (a hole). */
  function textOf(children: AnyNode[]): Value | undefined {
    const runs = children.filter(
      (c: AnyNode) => !(n.JSXText.check(c) && cleanJsxText(c.value) === ''),
    );
    if (runs.length !== 1) return undefined;
    const run = runs[0];
    if (n.JSXText.check(run)) return cleanJsxText(run.value);
    if (!n.JSXExpressionContainer.check(run) || n.JSXEmptyExpression.check(run.expression))
      return undefined;
    const text = staticString(run);
    if (text !== undefined) return text;
    return hasJsx(run.expression) ? undefined : { node: run.expression, hole: 'string' };
  }

  /**
   * Bloom's `DropdownMenu` tree as `Menu(trigger, ...rows).menuStyle('dropdown')`,
   * which draws Bloom's DropdownMenu on every platform (parity/context-menu.cases.tsx):
   * a `DropdownMenuTrigger asChild` around one view the codemod converts, and a
   * `DropdownMenuContent` of `DropdownMenuItem`s and `DropdownMenuSeparator`s
   * (`Divider()`), with the trigger's label (`.label()`). The menu holds its
   * own open state, so a menu the app opens itself (`open`) stays JSX. An
   * item's `leading` is a language glyph, `toElement(Icon(icon).size(s).foreground(f))`:
   * the row's `.icon()`, `.iconSize()` and `.iconForeground()`.
   */
  function convertDropdownMenu(node: AnyNode): { ir: Ir } | { reasons: Reason[] } {
    const reasons: Reason[] = [];
    const fail = (subject: string, code: string, why: string) => {
      reasons.push({ subject, code: `DropdownMenu:${code}`, why });
      return { reasons };
    };
    const part = (element: AnyNode) => {
      const local = n.JSXElement.check(element) ? jsxName(element) : undefined;
      const source = local ? sources.get(local) : undefined;
      return source?.module === DROPDOWN ? source.imported : undefined;
    };
    const elements = (parent: AnyNode): AnyNode[] | undefined => {
      const out: AnyNode[] = [];
      for (const child of parent.children as AnyNode[]) {
        if (n.JSXText.check(child) && cleanJsxText(child.value) === '') continue;
        if (!n.JSXElement.check(child)) return undefined;
        out.push(child);
      }
      return out;
    };
    const attributes = (element: AnyNode) => {
      const out = new Map<string, AnyNode>();
      for (const attribute of element.openingElement.attributes as AnyNode[]) {
        if (!n.JSXAttribute.check(attribute) || !n.JSXIdentifier.check(attribute.name))
          return undefined;
        out.set(attribute.name.name, attribute.value);
      }
      return out;
    };
    if (attributes(node)?.size !== 0)
      return fail(
        'props',
        'props',
        'a menu the app opens itself (`open`, `onOpenChange`): the language’s menu holds its own open state',
      );
    const [trigger, content, ...rest] = elements(node) ?? [];
    if (
      part(trigger) !== 'DropdownMenuTrigger' ||
      part(content) !== 'DropdownMenuContent' ||
      rest.length
    )
      return fail('children', 'children', 'children that are no trigger and content');
    const triggerProps = attributes(trigger);
    const contentProps = attributes(content);
    const label = triggerProps?.get('label');
    if (
      !triggerProps?.has('asChild') ||
      [...triggerProps.keys()].some((key) => key !== 'asChild' && key !== 'label')
    )
      return fail(
        'trigger',
        'trigger',
        'a trigger that is not `asChild`, or with props besides its label',
      );
    const labelText = (value: AnyNode | undefined) =>
      value === undefined ? undefined : source.slice(value.start, value.end);
    if (
      !contentProps ||
      labelText(contentProps.get('label')) !== labelText(label) ||
      [...contentProps.keys()].some((key) => key !== 'label' && key !== 'testID')
    )
      return fail(
        'content',
        'content',
        'a content whose label is not its trigger’s, or with other props',
      );
    const [view, ...others] = elements(trigger) ?? [];
    const triggerView = view ? convert(view) : undefined;
    if (!triggerView || others.length || !('ir' in triggerView))
      return fail('trigger', 'trigger', 'a trigger that is no one view the codemod converts');
    const rows: Value[] = [];
    for (const row of elements(content) ?? [undefined]) {
      if (
        part(row) === 'DropdownMenuSeparator' &&
        attributes(row)?.size === 0 &&
        !elements(row)?.length
      ) {
        rows.push({
          $: 'view',
          view: {
            type: 'component',
            node: 'Divider',
            within: undefined,
            args: [],
            props: [],
            key: null,
          },
        });
        continue;
      }
      const props = row && part(row) === 'DropdownMenuItem' ? attributes(row) : undefined;
      const texts = (row?.children as AnyNode[] | undefined)?.filter(
        (child) => !(n.JSXText.check(child) && cleanJsxText(child.value) === ''),
      );
      const text = texts?.length === 1 ? texts[0] : undefined;
      const title: Value | undefined = n.JSXText.check(text)
        ? cleanJsxText(text.value)
        : n.JSXExpressionContainer.check(text) && !n.JSXEmptyExpression.check(text.expression)
          ? (staticString(text) ?? { node: text.expression, hole: 'string' })
          : undefined;
      if (!props || title === undefined)
        return fail('row', 'row', 'a row that is no item with one text, or a separator');
      const mods: PropMod[] = [];
      for (const [name, value] of props) {
        const expression = value ? attributeExpression(value) : undefined;
        if (name === 'onPress' && expression)
          mods.push({ name, args: [{ node: expression, hole: 'handler' }] });
        else if (name === 'variant' && staticString(value) === 'destructive')
          mods.push({ name: 'destructive', args: [] });
        else if (name === 'variant' && staticString(value) === 'default') continue;
        else if ((name === 'disabled' || name === 'keepOpen') && value === null)
          mods.push({ name, args: [] });
        else if (name === 'testID' && staticString(value) !== undefined)
          mods.push({ name, args: [staticString(value) as string] });
        else if (name === 'leading' && expression) {
          const glyph = menuGlyph(expression);
          if (!glyph)
            return fail(
              name,
              'leading',
              'a leading view that is no `toElement(Icon(icon).size(s).foreground(f))`',
            );
          mods.unshift(...glyph);
        } else
          return fail(
            name,
            `item:${name}`,
            `an item's \`${name}\` (or its form here) has no mapping`,
          );
      }
      rows.push({
        $: 'view',
        view: {
          type: 'component',
          node: 'Item',
          within: undefined,
          args: [title],
          props: mods,
          key: null,
        },
      });
    }
    const props: PropMod[] = [];
    if (label) {
      const expression = attributeExpression(label);
      props.push({
        name: 'label',
        args: [staticString(label) ?? { node: expression, hole: 'string' }],
      });
    }
    const testID = contentProps.get('testID');
    if (testID) {
      const text = staticString(testID);
      if (text === undefined) return fail('testID', 'testID', 'a testID set at runtime');
      props.push({ name: 'testID', args: [text] });
    }
    props.push({ name: 'menuStyle', args: ['dropdown'] });
    for (const element of [trigger, content, ...(elements(content) ?? [])])
      results.set(element, {
        ir: { type: 'component', node: 'Menu', within: undefined, args: [], props: [], key: null },
      });
    return {
      ir: {
        type: 'component',
        node: 'Menu',
        within: undefined,
        args: [{ $: 'view', view: triggerView.ir }, ...rows],
        props,
        key: null,
      },
    };
  }

  /** A row's glyph as the language writes it, `toElement(Icon(icon).size(s).foreground(f))`, as the row's modifiers. */
  function menuGlyph(expression: AnyNode): PropMod[] | undefined {
    if (!isToElement(expression) || expression.arguments.length !== 1) return undefined;
    const chain: [string, AnyNode][] = [];
    let at: AnyNode = expression.arguments[0];
    while (n.CallExpression.check(at) && n.MemberExpression.check(at.callee)) {
      if (at.arguments.length !== 1 || !n.Identifier.check(at.callee.property)) return undefined;
      chain.unshift([at.callee.property.name, at.arguments[0]]);
      at = at.callee.object;
    }
    const callee = n.CallExpression.check(at) ? at.callee : undefined;
    const base = n.Identifier.check(callee) ? sources.get(callee.name) : undefined;
    const icon = at?.arguments?.[0];
    if (
      base?.module !== LANGUAGE_MODULE ||
      base.imported !== 'Icon' ||
      at.arguments.length !== 1 ||
      !n.Identifier.check(icon) ||
      kindOf(sources.get(icon.name)) !== 'icon'
    )
      return undefined;
    const size = chain.find(([name]) => name === 'size')?.[1];
    const ink = chain.find(([name]) => name === 'foreground')?.[1];
    // Both named: the menu's own glyph (`md`, quiet) is drawn otherwise.
    if (chain.length !== 2 || staticString(size) === undefined || staticString(ink) === undefined)
      return undefined;
    return [
      { name: 'icon', args: [{ $: 'icon', name: icon.name }] },
      { name: 'iconSize', args: [staticString(size) as string] },
      { name: 'iconForeground', args: [staticString(ink) as string] },
    ];
  }

  /** Bloom's `Button`, as the language's Button parity cases draw it (`packages/bloom-language/parity/button.cases.tsx`). */
  function convertButton(node: AnyNode): { ir: Ir } | { reasons: Reason[] } {
    const reasons: Reason[] = [];
    const fail = (subject: string, code: string, why: string) =>
      reasons.push({ subject, code, why });
    const props: PropMod[] = [];
    /** Its `style`, the button's box: chained after its own modifiers. */
    const styled: PropMod[] = [];
    let key: Carried | null = null;
    let leading: string | null = null;
    let trailing: string | null = null;
    const flags = new Set<string>();
    const ENUM: Record<string, string> = {
      appearance: 'style',
      tone: 'tint',
      size: 'size',
      density: 'density',
      linkTone: 'linkTone',
    };
    const BOOLEAN: Record<string, string> = {
      disabled: 'disabled',
      loading: 'loading',
      pressed: 'pressed',
      inverted: 'inverted',
    };
    const icon = (value: AnyNode): string | undefined => {
      const expression = attributeExpression(value);
      return n.Identifier.check(expression) && kindOf(sources.get(expression.name)) === 'icon'
        ? expression.name
        : undefined;
    };
    for (const attribute of node.openingElement.attributes) {
      if (!n.JSXAttribute.check(attribute) || !n.JSXIdentifier.check(attribute.name)) {
        fail('{...spread}', 'spread', 'spread props: the codemod cannot see what they set');
        continue;
      }
      const name = attribute.name.name as string;
      const value = attribute.value;
      const expression = value ? attributeExpression(value) : null;
      if (name === 'key' && expression) key = { node: expression, hole: 'key', attribute };
      else if (ENUM[name] && staticString(value) !== undefined)
        props.push({ name: ENUM[name] as string, args: [staticString(value) as string] });
      else if (BOOLEAN[name] && (value === null || value === undefined))
        props.push({ name: BOOLEAN[name] as string, args: [] });
      else if (BOOLEAN[name] && expression)
        props.push({
          name: BOOLEAN[name] as string,
          args: [{ node: expression, hole: 'boolean' }],
        });
      else if (
        ['iconOnly', 'wide', 'grow'].includes(name) &&
        (value === null || value === undefined)
      )
        flags.add(name);
      // An appearance or tone set at runtime is the modifier's own expression.
      else if (ENUM[name] && expression && !hasJsx(expression))
        props.push({ name: ENUM[name] as string, args: [{ node: expression, hole: 'string' }] });
      else if (name === 'stopPropagation' && (value === null || value === undefined))
        props.push({ name: 'stopPropagation', args: [] });
      else if (name === 'iconSize' && ICON_SIZE_TOKEN.has(staticNumber(value) as number))
        props.push({
          name: 'iconSize',
          args: [ICON_SIZE_TOKEN.get(staticNumber(value) as number) as string],
        });
      // No spinner while loading.
      else if (name === 'loadingIndicator' && n.NullLiteral.check(expression))
        props.push({ name: 'loadingIndicator', args: [{ node: expression, hole: 'handler' }] });
      // A menu trigger's open state: Bloom's aria-expanded is the language's accessibility state.
      else if (name === 'aria-expanded' && expression && !hasJsx(expression))
        props.push({
          name: 'accessibilityState',
          args: [
            {
              node: recast.types.builders.objectExpression([
                recast.types.builders.objectProperty(
                  recast.types.builders.identifier('expanded'),
                  expression,
                ),
              ]),
              hole: 'state',
            },
          ],
        });
      // Its inks, each a theme colour read as its role.
      else if ((name === 'color' || name === 'hoverColor') && expression && roleOf(expression))
        props.push({
          name: name === 'color' ? 'foreground' : 'hoverForeground',
          args: [roleOf(expression) as Value],
        });
      else if (name === 'leadingIcon' && icon(value)) leading = icon(value) as string;
      else if (name === 'trailingIcon' && icon(value)) trailing = icon(value) as string;
      else if (name === 'accessibilityLabel' && value)
        props.push({
          name: 'label',
          args: [staticString(value) ?? { node: expression, hole: 'string' }],
        });
      else if ((name === 'onPress' || name === 'onLongPress') && expression)
        props.push({ name, args: [{ node: expression, hole: 'handler' }] });
      else if (name === 'testID' && value)
        props.push({
          name: 'testID',
          args: [staticString(value) ?? { node: expression, hole: 'string' }],
        });
      else if (name === 'style' && expression) {
        const box = componentStyle(expression, 'Button');
        if ('reasons' in box) reasons.push(...box.reasons);
        else styled.push(...box.mods);
      } else fail(name, `button:${name}`, `Button's \`${name}\` (or its form here) has no mapping`);
    }
    props.push(...styled);
    const shape = flags.has('iconOnly')
      ? flags.has('wide')
        ? 'pill'
        : 'circle'
      : flags.has('grow')
        ? 'fit'
        : null;
    if (flags.has('wide') && !flags.has('iconOnly'))
      fail('wide', 'button:wide', 'wide without iconOnly');
    if (flags.has('grow') && flags.has('iconOnly'))
      fail('grow', 'button:grow', 'grow with iconOnly');
    if (shape) props.unshift({ name: 'shape', args: [shape] });
    const runs: TextRun[] = [];
    for (const child of node.children) {
      if (n.JSXText.check(child)) {
        const text = cleanJsxText(child.value);
        if (text) runs.push({ type: 'string', value: text });
      } else if (
        n.JSXExpressionContainer.check(child) &&
        !n.JSXEmptyExpression.check(child.expression)
      ) {
        if (n.StringLiteral.check(child.expression))
          runs.push({ type: 'string', value: child.expression.value });
        else runs.push({ type: 'expr', value: { node: child.expression, hole: 'text' } });
      } else fail('child', 'button-child', 'a Button child that is no text');
    }
    if (reasons.length) return { reasons };
    return { ir: { type: 'button', leading, trailing, runs, props, key } };
  }

  /** A `{…}` child of a stack: a converted branch where its form is safe, else embedded. */
  function expressionChild(expression: AnyNode): Ir {
    const branch = (node: AnyNode): Ir | null | undefined => {
      if (n.NullLiteral.check(node)) return null;
      if (n.JSXElement.check(node)) {
        const inner = convert(node);
        return 'ir' in inner ? inner.ir : undefined;
      }
      return undefined;
    };
    if (n.ConditionalExpression.check(expression)) {
      const then = branch(expression.consequent);
      const otherwise = branch(expression.alternate);
      if (then !== undefined && otherwise !== undefined && (then || otherwise))
        return {
          type: 'cond',
          test: { node: expression.test, hole: 'condition' },
          then,
          otherwise,
        };
    }
    if (
      n.LogicalExpression.check(expression) &&
      expression.operator === '&&' &&
      isBooleanForm(expression.left)
    ) {
      const then = branch(expression.right);
      if (then)
        return {
          type: 'cond',
          test: { node: expression.left, hole: 'condition' },
          then,
          otherwise: null,
        };
    }
    return { type: 'embed', content: { node: expression, hole: 'element' } };
  }

  // ── printing ─────────────────────────────────────────────────────────

  /** Prints the chain; with `holes`, each carried value is its hole. */
  function print(ir: Ir, carry: (c: Carried) => string, root = false): string {
    switch (ir.type) {
      case 'embed':
        return `${lang('Embed')}(${carry(ir.content)})`;
      case 'comment':
        return ir.text;
      case 'screen':
        return `${print(ir.content, carry)}${ir.props.map((p) => printProp(p, carry)).join('')}`;
      case 'cond':
        return `${carry(ir.test)} ? ${ir.then ? print(ir.then, carry) : 'null'} : ${ir.otherwise ? print(ir.otherwise, carry) : 'null'}`;
      case 'map':
        return `${carry(ir.items)}.map((${ir.params.map((param) => recast.print(param).code).join(', ')}) => ${print(ir.body, carry)})`;
      case 'icon':
        return `${lang('Icon')}(${ir.component})${ir.mods.map(printMod).join('')}${ir.color ? `.foreground(${appColorTable}.color.${ir.color.name})` : ''}${ir.key && !root ? `.id(${carry(ir.key)})` : ''}`;
      case 'component': {
        // Its children (the trailing views) with their comments; the arguments before them as values.
        const first = ir.args.findIndex((a) => isTagged(a) && a.$ === 'view');
        const leading = first === -1 ? ir.args : ir.args.slice(0, first);
        const views = first === -1 ? [] : ir.args.slice(first);
        const args = [
          ...leading.map((a) => printValue(a, carry)),
          ...(views.every((a) => isTagged(a) && a.$ === 'view')
            ? printViews(
                views.map((a) => (a as { view: Ir }).view),
                carry,
              )
            : views.map((a) => printValue(a, carry))),
        ].join(', ');
        const tail = ir.props.map((p) => printProp(p, carry)).join('');
        return `${lang(ir.node)}(${args})${tail}${ir.key && !root && !ir.part ? `.id(${carry(ir.key)})` : ''}`;
      }
      case 'button': {
        const parts: string[] = [];
        if (ir.leading) parts.push(`${lang('Icon')}(${ir.leading})`);
        if (ir.runs.length)
          parts.push(
            `${lang('Text')}(${ir.runs.map((run) => ('type' in run && run.type === 'string' ? quote(run.value) : carry((run as { value: Carried }).value))).join(', ')})`,
          );
        if (ir.trailing) parts.push(`${lang('Icon')}(${ir.trailing})`);
        const tail = ir.props.map((p) => printProp(p, carry)).join('');
        return `${lang('Button')}(${parts.join(', ')})${tail}${ir.key && !root ? `.id(${carry(ir.key)})` : ''}`;
      }
      case 'text': {
        const runs = ir.runs.map((run) =>
          'type' in run && run.type === 'string'
            ? quote(run.value)
            : 'type' in run && run.type === 'expr'
              ? carry(run.value)
              : print(run as Ir, carry),
        );
        return `${lang(ir.raw ? 'RawText' : 'Text')}(${runs.join(', ')})${chainTail(ir.resolved, ir.choice, ir.props, root ? null : ir.key, carry)}`;
      }
      case 'stack': {
        const ctor = lang(ir.resolved.axis === 'row' ? 'HStack' : 'VStack');
        const children = printViews(ir.children, carry);
        return `${ctor}(${children.join(', ')})${chainTail(ir.resolved, ir.choice, ir.props, root ? null : ir.key, carry)}`;
      }
    }
  }

  function chainTail(
    resolved: Resolved,
    choice: Choice | null,
    props: PropMod[],
    key: Carried | null,
    carry: (c: Carried) => string,
  ): string {
    // A value the other branch writes differently is chosen by its condition.
    let out = resolved.mods
      .map((mod, i) => {
        const other = choice && 'mods' in choice ? choice.mods[i] : undefined;
        if (!choice || !other) return printMod(mod);
        const args = mod.args.map((arg, j) => {
          const alternative = other.args[j] as Arg;
          return arg === alternative
            ? printArg(arg)
            : `${carry(choice.test)} ? ${printArg(arg)} : ${printArg(alternative)}`;
        });
        return `.${mod.name}(${args.join(', ')})`;
      })
      .join('');
    // What one branch alone adds is a variant of its condition, before the live variants, which override it.
    if (choice && 'only' in choice) {
      const test = carry(choice.test);
      const plain =
        n.Identifier.check(choice.test.node) || n.MemberExpression.check(choice.test.node);
      const holds = isBooleanForm(choice.test.node) ? test : `Boolean(${test})`;
      const fails = plain ? `!${test}` : `!(${test})`;
      for (const [condition, mods] of [
        [holds, choice.only.whenTrue],
        [fails, choice.only.whenFalse],
      ] as const)
        if (mods.length) out += `.when(${condition}, (v) => v${mods.map(printMod).join('')})`;
    }
    for (const variant of resolved.variants) {
      let inner = `v${variant.mods.map(printMod).join('')}`;
      for (const condition of [...variant.conditions].reverse().slice(0, -1))
        inner = `v.when(${quote(condition)}, (v) => ${inner})`;
      out += `.when(${quote(variant.conditions[0] as string)}, (v) => ${inner})`;
    }
    for (const prop of props) out += printProp(prop, carry);
    if (key) out += `.id(${carry(key)})`;
    return out;
  }

  function printValue(value: Value, carry: (c: Carried) => string): string {
    if (isCarried(value)) return value.hole === 'action' ? `() => ${carry(value)}()` : carry(value);
    if (isTagged(value)) {
      switch (value.$) {
        case 'view':
          return print(value.view, carry);
        case 'binding':
          return `[${printValue(value.binding[0], carry)}, ${printValue(value.binding[1], carry)}]`;
        case 'icon':
          return value.name;
        case 'options':
          return value.entries.length
            ? `{ ${value.entries.map(([key, v]) => `${key}: ${printValue(v, carry)}`).join(', ')} }`
            : '{}';
        case 'row':
          return `(${value.param}) => ${print(value.view, carry)}`;
        case 'build':
          return `(v) => v${value.mods.map(printMod).join('')}`;
        case 'renderer':
          return carry(value.fn);
        case 'absent':
          return 'undefined';
        case 'component':
          return value.name;
        case 'null':
          return 'null';
        case 'choose':
          return `${carry(value.test)} ? ${printValue(value.then, carry)} : ${printValue(value.otherwise, carry)}`;
      }
    }
    return printArg(value as Arg);
  }

  const printProp = (prop: PropMod, carry: (c: Carried) => string) =>
    `.${prop.name}(${prop.args.map((a) => printValue(a, carry)).join(', ')})`;

  /** The carried values inside a value, in order. */
  function carriedOfValue(value: Value, out: Carried[]): void {
    if (isCarried(value)) out.push(value);
    else if (isTagged(value)) {
      if (value.$ === 'view' || value.$ === 'row') carriedOf(value.view, out);
      else if (value.$ === 'binding') for (const v of value.binding) carriedOfValue(v, out);
      else if (value.$ === 'renderer') out.push(value.fn);
      else if (value.$ === 'options') for (const [, v] of value.entries) carriedOfValue(v, out);
      else if (value.$ === 'choose') {
        out.push(value.test);
        carriedOfValue(value.then, out);
        carriedOfValue(value.otherwise, out);
      }
    }
  }

  /** The views a value holds. */
  function viewsOfValue(value: Value): Ir[] {
    if (!isTagged(value)) return [];
    if (value.$ === 'view' || value.$ === 'row') return [value.view];
    if (value.$ === 'options') return value.entries.flatMap(([, v]) => viewsOfValue(v));
    return [];
  }

  /** The views directly inside a view: its children, spans, branches and the views its values hold. */
  function childrenOf(ir: Ir): Ir[] {
    const props = 'props' in ir ? ir.props.flatMap((prop) => prop.args.flatMap(viewsOfValue)) : [];
    switch (ir.type) {
      case 'cond':
        return [ir.then, ir.otherwise].filter((branch): branch is Ir => branch !== null);
      case 'map':
        return [ir.body];
      case 'component':
        return [...ir.args.flatMap(viewsOfValue), ...props];
      case 'text':
        return [
          ...ir.runs.filter(
            (run): run is Ir => !('type' in run && (run.type === 'string' || run.type === 'expr')),
          ),
          ...props,
        ];
      case 'stack':
        return [...ir.children, ...props];
      case 'screen':
        return [ir.content, ...props];
      default:
        return props;
    }
  }

  /** Every carried value of a tree, in order. */
  function carriedOf(ir: Ir, out: Carried[] = []): Carried[] {
    switch (ir.type) {
      case 'embed':
        out.push(ir.content);
        break;
      case 'screen':
        carriedOf(ir.content, out);
        for (const prop of ir.props) for (const a of prop.args) carriedOfValue(a, out);
        break;
      case 'cond':
        out.push(ir.test);
        if (ir.then) carriedOf(ir.then, out);
        if (ir.otherwise) carriedOf(ir.otherwise, out);
        break;
      case 'map':
        out.push(ir.items);
        carriedOf(ir.body, out);
        break;
      case 'icon':
        if (ir.key) out.push(ir.key);
        break;
      case 'component':
        for (const a of ir.args) carriedOfValue(a, out);
        for (const prop of ir.props) for (const a of prop.args) carriedOfValue(a, out);
        if (ir.key) out.push(ir.key);
        break;
      case 'button':
        for (const run of ir.runs) if ('type' in run && run.type === 'expr') out.push(run.value);
        for (const prop of ir.props) for (const a of prop.args) carriedOfValue(a, out);
        if (ir.key) out.push(ir.key);
        break;
      case 'text':
        for (const run of ir.runs)
          if ('type' in run && run.type === 'expr') out.push(run.value);
          else if (!('type' in run && run.type === 'string')) carriedOf(run as Ir, out);
        if (ir.choice) out.push(ir.choice.test);
        for (const prop of ir.props) for (const a of prop.args) carriedOfValue(a, out);
        if (ir.key) out.push(ir.key);
        break;
      case 'stack':
        for (const child of ir.children) carriedOf(child, out);
        if (ir.choice) out.push(ir.choice.test);
        for (const prop of ir.props) for (const a of prop.args) carriedOfValue(a, out);
        if (ir.key) out.push(ir.key);
        break;
    }
    return out;
  }

  // ── fixtures ─────────────────────────────────────────────────────────

  const fixtures: Fixture[] = [];
  const HOLE = {
    text: (i: number) => `'⟨${i}⟩'`,
    string: (i: number) => `'⟨${i}⟩'`,
    key: (i: number) => `'k${i}'`,
    number: () => '2',
    boolean: () => 'true',
    state: () => '{ selected: true, busy: false }',
    handler: () => '() => {}',
    action: () => '(() => {})',
    element: (i: number) => `<Hole n="${i}" />`,
    // The corpus's sample items (`corpus.ts`), the same array on both sides.
    items: () => 'ITEMS',
    // A row function drawing each item's index, so the argument it is handed is proven.
    renderer: (i: number) => `((${ROW_INFO}) => <Hole n={'${i}-' + ${ROW_INFO}.index} />)`,
  } as const;

  /**
   * The region's fixture; a region with a condition has a second with every
   * condition false, so each branch it chooses between is drawn.
   */
  function fixture(node: AnyNode, ir: Ir, rootKey: Carried | null, conditions = true): void {
    const carried = carriedOf(ir).filter((c) => c !== rootKey);
    if (conditions && carried.some((c) => c.hole === 'condition'))
      fixture(node, ir, rootKey, false);
    const index = new Map(carried.map((c, i) => [c, i]));
    const hole = (c: Carried) =>
      c.hole === 'condition' ? String(conditions) : HOLE[c.hole](index.get(c) ?? 0);
    const removed = rootKey?.attribute;
    const after =
      ir.type === 'screen' ? print(ir, hole, true) : `toElement(${print(ir, hole, true)})`;
    // The source of the region, each carried value replaced by its hole.
    let before = '';
    let at = node.start as number;
    const spans: { start: number; end: number; text: string }[] = carried.map((c) => ({
      start: c.node.start,
      end: c.node.end,
      text: hole(c),
    }));
    if (removed) spans.push({ start: removed.start, end: removed.end, text: '' });
    // An element's type arguments (`<SegmentedControl<Cadence>`) draw nothing, and name the app's types.
    recast.visit(node, {
      visitJSXOpeningElement(path) {
        const opening: AnyNode = path.node;
        const types = opening.typeParameters ?? opening.typeArguments;
        if (types) spans.push({ start: types.start, end: types.end, text: '' });
        this.traverse(path);
      },
    });
    // A StyleSheet's style is its object literal on the before side.
    for (const [read, literal] of styleLiterals)
      if (read.start >= node.start && read.end <= node.end)
        spans.push({ start: read.start, end: read.end, text: literal });
    // React Native's keyboard behavior reads its `Platform`, the corpus's own on the before side.
    for (const behavior of keyboardBehaviors)
      if (behavior.start >= node.start && behavior.end <= node.end)
        spans.push({
          start: behavior.test.left.object.start,
          end: behavior.test.left.object.end,
          text: 'RN.Platform',
        });
    // An inset the chain pads by is the corpus's on the before side, both sides drawn under it.
    let insets = false;
    for (const [read, side] of insetReads)
      if (read.start >= node.start && read.end <= node.end) {
        insets = true;
        spans.push({ start: read.start, end: read.end, text: `PARITY_INSETS.${side}` });
      }
    // A theme colour the chain names by its role is read from the theme the before side is drawn in.
    let themed = false;
    for (const [read] of themeRoles)
      if (read.start >= node.start && read.end <= node.end) {
        themed = true;
        spans.push({
          start: read.start,
          end: read.end,
          text: `parityTheme.colors.${read.property.name}`,
        });
      }
    // A `const` holding the ink is its initialiser on the before side, its conditions the holes and its colours the theme's.
    for (const read of roleConstReads) {
      if (read.start < node.start || read.end > node.end) continue;
      const init = constInits.get(read);
      const inner: { start: number; end: number; text: string }[] = [];
      // A condition both inks read is one span.
      for (const c of carried)
        if (
          c.node.start >= init.start &&
          c.node.end <= init.end &&
          !inner.some((span) => span.start === c.node.start)
        )
          inner.push({ start: c.node.start, end: c.node.end, text: hole(c) });
      for (const [themeRead] of themeRoles)
        if (themeRead.start >= init.start && themeRead.end <= init.end) {
          themed = true;
          inner.push({
            start: themeRead.start,
            end: themeRead.end,
            text: `parityTheme.colors.${themeRead.property.name}`,
          });
        }
      inner.sort((a, b) => a.start - b.start);
      let text = '';
      let from = init.start as number;
      for (const span of inner) {
        text += source.slice(from, span.start) + span.text;
        from = span.end;
      }
      text += source.slice(from, init.end);
      spans.push({ start: read.start, end: read.end, text: `(${text})` });
    }
    // A constant the chain names as an app colour is its colour on the before side, drawn without the module.
    const colors = colorsOf(ir);
    for (const color of colors)
      if (color.read)
        spans.push({ start: color.read.start, end: color.read.end, text: quote(color.value) });
    spans.sort((a, b) => a.start - b.start);
    for (const span of spans) {
      if (span.start < at) continue;
      before += source.slice(at, span.start) + span.text;
      at = span.end;
    }
    before += source.slice(at, node.end);
    const bindings: Record<string, Source> = {};
    for (const local of new Set(
      [...uncommented(before).matchAll(/<\/?([A-Z][\w]*)/g)].map((m) => m[1] as string),
    ))
      if (sources.has(local)) bindings[local] = sources.get(local) as Source;
    // A Bloom or React Native value the before side reads (`tokens.hitSlop.md`).
    for (const match of uncommented(before).matchAll(/(?<![.\w])([a-z]\w*)\./g)) {
      const local = match[1] as string;
      const module = sources.get(local)?.module ?? '';
      if (module.startsWith('@oxy.so/bloom/') || module === 'react-native')
        bindings[local] = sources.get(local) as Source;
    }
    // A language view the before side already writes (a menu row's `toElement(Icon(…))`).
    for (const match of uncommented(before).matchAll(/\b([A-Z][\w]*)\(/g)) {
      const local = match[1] as string;
      if (sources.get(local)?.module === LANGUAGE_MODULE)
        bindings[local] = sources.get(local) as Source;
    }
    for (const match of uncommented(after).matchAll(/\b([A-Z][\w]*)\b/g)) {
      const local = match[1] as string;
      if (sources.has(local)) bindings[local] = sources.get(local) as Source;
    }
    const regionClasses = new Set<string>();
    // A className, and a content class (`contentContainerClassName`).
    for (const m of before.matchAll(/(?:className|ClassName)=["'`{]+([^"'`}]*)/g))
      for (const token of (m[1] as string).split(/\s+/).filter(Boolean)) regionClasses.add(token);
    for (const [read, both] of choiceClasses)
      if (read.start >= node.start && read.end <= node.end)
        for (const token of both.split(/\s+/).filter(Boolean)) regionClasses.add(token);
    fixtures.push({
      name: `${options.name ?? 'file'}:${node.loc?.start.line ?? 0}${conditions ? '' : ' (false)'}`,
      before,
      after,
      bindings,
      language: [...usedLanguage.entries()].map(([name, local]) =>
        name === local ? name : `${name}: ${local}`,
      ),
      classes: [...regionClasses],
      // A route's Screen is the Screen its nodes are drawn in.
      within: withinOf(ir).filter((key) => ir.type !== 'screen' || key !== SCREEN_KEY),
      themed,
      insets,
      screen: ir.type === 'screen',
      appColors: colors.length
        ? {
            table: appColorTable,
            color: Object.fromEntries(colors.map((c) => [c.name, c.value])),
          }
        : null,
    });
  }

  /** The app colours a region's icons paint with. */
  function colorsOf(ir: Ir): AppColor[] {
    const found: AppColor[] = [];
    const visit = (at: Ir) => {
      if (at.type === 'icon' && at.color) found.push(at.color);
      for (const child of childrenOf(at)) visit(child);
    };
    visit(ir);
    return found;
  }

  /** The Bloom components the region's nodes are drawn only inside. */
  function withinOf(ir: Ir): string[] {
    const found = new Set<string>();
    const visit = (at: Ir) => {
      if (at.type === 'component' && at.within) found.add(at.within);
      for (const child of childrenOf(at)) visit(child);
    };
    visit(ir);
    return [...found];
  }

  // ── the walk ─────────────────────────────────────────────────────────

  let regions = 0;
  const markConverted = (node: AnyNode) => {
    recast.visit(node, {
      visitJSXElement(path) {
        const result = results.get(path.node);
        if (result && 'ir' in result) {
          convertedNodes.add(path.node);
          const local = jsxName(path.node);
          if (local) convertedLocals.add(local);
          this.traverse(path);
        } else return false;
      },
    });
  };

  const visitor = {
    visitJSXElement(this: AnyNode, path: AnyNode): false | undefined {
      const node = path.node;
      const result = convert(node);
      if (!('ir' in result)) {
        if (elementOf(node))
          unconverted.push({
            line: node.loc?.start.line ?? 0,
            element: jsxName(node) ?? '',
            reasons: result.reasons,
          });
        this.traverse(path);
        return undefined;
      }
      regions++;
      markConverted(node);
      const ir = result.ir;
      const rootKey = 'key' in ir ? ir.key : null;
      // The file's table holds every app colour a region paints with.
      for (const color of colorsOf(ir)) {
        appColors.set(color.name, color);
        lang('defineTokens');
      }
      // A route's Screen inside what its screen modifiers draw is the return around it, whole.
      const outer = ir.type === 'screen' ? screenOuter.get(node)?.outer : undefined;
      if (options.fixtures) fixture(outer ?? node, ir, rootKey);
      // What wrapped the Screen is its modifiers now: its imports go where nothing else reads them.
      if (outer)
        for (let at = outer; at !== node; at = peelChild(at)) {
          convertedLocals.add(jsxName(at) as string);
          for (const behavior of keyboardBehaviors)
            if (behavior.start >= at.start && behavior.end <= at.end)
              convertedLocals.add(behavior.test.left.object.name);
        }
      // Regions inside the values it carries (an embedded element's children, an array's elements).
      for (const c of carriedOf(ir)) {
        if (c.hole === 'element' || c.hole === 'items') {
          // An element can sit at the root of what is carried; visit inside it.
          const holder = { type: 'ExpressionStatement', expression: c.node };
          recast.visit(holder, visitor);
          c.node.__carried = holder.expression;
        }
      }
      const carry = (c: Carried) => recast.print(c.node.__carried ?? c.node).code;
      const chain = print(ir, carry, true);
      // A route's Screen is its body's root, the chain itself.
      if (ir.type === 'screen') routes.add(screenRoutes.get(node));
      const code =
        ir.type === 'screen'
          ? chain
          : `${lang('toElement')}(${chain}${rootKey ? `, ${carry(rootKey)}` : ''})`;
      // Parsed by recast, so the comments the chain carries are printed where they are.
      const expression = recast.parse(`${code};`, { parser: babelTs }).program.body[0].expression;
      let at = path;
      while (outer && at.node !== outer) at = at.parent;
      const parent = at.parent?.node;
      const inJsx =
        parent &&
        (n.JSXElement.check(parent) || n.JSXFragment.check(parent) || n.JSXAttribute.check(parent));
      at.replace(
        inJsx ? recast.types.builders.jsxExpressionContainer(expression as AnyNode) : expression,
      );
      return false;
    },
  };
  // Bloom components the codemod does not map, counted before the walk rewrites anything.
  const bloomComponents: Record<string, number> = {};
  recast.visit(ast, {
    visitJSXOpeningElement(path) {
      const local = n.JSXIdentifier.check(path.node.name)
        ? (path.node.name.name as string)
        : undefined;
      const source = local ? sources.get(local) : undefined;
      if (source?.module.startsWith('@oxy.so/bloom') && !kindOf(source)) {
        const key = `${source.module}#${source.imported}`;
        bloomComponents[key] = (bloomComponents[key] ?? 0) + 1;
      }
      this.traverse(path);
    },
  });
  // A route converts whole: a Screen it returns that stays JSX keeps the others JSX.
  for (const fn of new Set(screenRoutes.values())) {
    const screens = [...screenRoutes].filter(([, of]) => of === fn).map(([node]) => node);
    if (screens.every((node) => 'ir' in convert(node))) continue;
    for (const node of screens)
      if ('ir' in convert(node))
        results.set(node, {
          reasons: [
            {
              subject: 'Screen',
              code: 'screen:route',
              why: 'another return of the route stays JSX, and a route converts whole',
            },
          ],
        });
  }
  /** The routes whose Screens converted: each becomes `screen(function …)`. */
  const routes = new Set<AnyNode>();
  recast.visit(ast, visitor);
  for (const fn of routes) {
    const { statement, name } = screenDeclarations.get(fn) as { statement: AnyNode; name: string };
    const b = recast.types.builders;
    const id = b.identifier(name);
    // An arrow's expression body is the one return of its function.
    const block = n.BlockStatement.check(fn.body)
      ? fn.body
      : b.blockStatement([b.returnStatement(fn.body)]);
    const body = b.functionExpression(id, fn.params, block);
    body.typeParameters = fn.typeParameters;
    const call = b.callExpression(b.identifier(lang('screen')), [body]);
    const program = ast.program.body as AnyNode[];
    const at = program.indexOf(statement);
    let named = 0;
    recast.visit(ast, {
      visitIdentifier(path) {
        if (path.node.name === name) named++;
        this.traverse(path);
      },
    });
    if (n.ExportDefaultDeclaration.check(statement) && named === 1) {
      // A default export read nowhere else is the call itself.
      statement.declaration = call;
      continue;
    }
    const constant = b.variableDeclaration('const', [b.variableDeclarator(id, call)]);
    if (!n.ExportNamedDeclaration.check(statement)) constant.comments = statement.comments;
    if (n.ExportDefaultDeclaration.check(statement))
      program.splice(at, 1, constant, b.exportDefaultDeclaration(b.identifier(name)));
    else if (n.ExportNamedDeclaration.check(statement)) statement.declaration = constant;
    else program.splice(at, 1, constant);
  }

  const converted = [...counted].filter((node) => convertedNodes.has(node)).length;

  if (regions > 0) {
    // Imports: the language's names in, and the converted components' out when nothing else uses them.
    const remaining = new Map<string, number>();
    recast.visit(ast, {
      visitJSXIdentifier(path) {
        remaining.set(path.node.name, (remaining.get(path.node.name) ?? 0) + 1);
        this.traverse(path);
      },
      visitIdentifier(path) {
        const parent = path.parent?.node;
        if (!n.ImportSpecifier.check(parent) && !n.ImportDefaultSpecifier.check(parent))
          remaining.set(path.node.name, (remaining.get(path.node.name) ?? 0) + 1);
        this.traverse(path);
      },
    });
    const body = ast.program.body as AnyNode[];
    for (const statement of [...body]) {
      if (!n.ImportDeclaration.check(statement)) continue;
      const before = statement.specifiers?.length ?? 0;
      statement.specifiers = (statement.specifiers ?? []).filter((s: AnyNode) => {
        const local = s.local?.name;
        return !(convertedLocals.has(local) && !remaining.get(local));
      });
      if (before > 0 && statement.specifiers.length === 0) body.splice(body.indexOf(statement), 1);
    }
    // `screen` is the router's; every other name the language's own.
    const imports = (module: string, names: [string, string][]) => {
      if (!names.length) return [];
      const specifiers = names
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([name, local]) => (name === local ? name : `${name} as ${local}`));
      return recast.parse(`import { ${specifiers.join(', ')} } from '${module}';\n`, {
        parser: babelTs,
      }).program.body;
    };
    const names = [...usedLanguage.entries()];
    const declarations = [
      ...imports(
        LANGUAGE_MODULE,
        names.filter(([name]) => name !== 'screen'),
      ),
      ...imports(
        `${LANGUAGE_MODULE}/router`,
        names.filter(([name]) => name === 'screen'),
      ),
    ];
    const lastImport = body.reduce(
      (last: number, s: AnyNode, i: number) => (n.ImportDeclaration.check(s) ? i : last),
      -1,
    );
    body.splice(lastImport + 1, 0, ...declarations);
    if (appColors.size > 0) {
      // The app colour table, after the imports and the constants it reads.
      const entries = [...appColors.values()].map((c) =>
        c.constant ? c.constant : `${c.name}: ${quote(c.value)}`,
      );
      const table = recast.parse(
        `const ${appColorTable} = ${lang('defineTokens')}({ color: { ${entries.join(', ')} } });\n`,
        { parser: babelTs },
      ).program.body[0];
      const after = Math.max(
        lastImport + 1,
        ...[...appColors.values()].map((c) =>
          c.constant ? body.indexOf(colorConstants.get(c.constant)?.statement) : -1,
        ),
      );
      body.splice(after + 1, 0, table);
    }
  }

  return {
    code: regions > 0 ? recast.print(ast).code : source,
    changed: regions > 0,
    candidates,
    converted,
    regions,
    unconverted,
    fixtures,
    classes: [...classes],
    bloomComponents,
  };
}
