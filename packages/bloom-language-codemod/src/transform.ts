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
  type Form,
  KEPT,
  type PropRule,
  REMOVED,
  ruleFor,
  TEXT_STYLES,
} from './components';
import { type HostKind, type Reason, type Resolved, resolveClassName } from './resolve';
import { styleUtilities } from './style';
import { type Arg, LANGUAGE_PACKAGE, type Mod, type Table } from './table';

// biome-ignore lint/suspicious/noExplicitAny: recast's AST nodes are untyped here.
type AnyNode = any;

const n = recast.types.namedTypes;

const spec = JSON.parse(readFileSync(join(LANGUAGE_PACKAGE, 'spec/language.json'), 'utf8')) as {
  scales: { iconSize: Record<string, number> };
  typeRamp: Record<string, unknown>;
  colors: Record<string, [themeKey: string, css: string] | string>;
  enums: { role: readonly string[] };
};
/** The roles the universal `.role()` takes, each React Native's `accessibilityRole` of its name. */
const ROLES = new Set(spec.enums.role);
/** A Bloom theme colour (`theme.colors.textSecondary`) as the role painted from it (`muted`). */
const ROLE_OF_THEME_COLOR = new Map<string, string>();
for (const [role, entry] of Object.entries(spec.colors))
  if (Array.isArray(entry) && !ROLE_OF_THEME_COLOR.has(entry[0]))
    ROLE_OF_THEME_COLOR.set(entry[0], role);
const ICON_SIZES = Object.entries(spec.scales.iconSize);
const RAMP = new Set(Object.keys(spec.typeRamp).filter((k) => !k.startsWith('$')));

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
    | 'string'
    | 'number'
    | 'boolean'
    | 'element'
    | 'condition'
    | 'key';
  /** For a key: its attribute, which a fixture's root leaves out (a key is no part of what draws). */
  readonly attribute?: AnyNode;
}

type Ir =
  | {
      type: 'stack';
      resolved: Resolved;
      props: PropMod[];
      key: Carried | null;
      children: Ir[];
    }
  | {
      type: 'text';
      /** React Native's own Text: `RawText`. */
      raw: boolean;
      resolved: Resolved;
      props: PropMod[];
      key: Carried | null;
      runs: TextRun[];
    }
  | { type: 'icon'; component: string; mods: Mod[]; key: Carried | null }
  | {
      type: 'component';
      node: string;
      /** The Bloom component (`module#export`) it is drawn only inside. */
      within: string | undefined;
      /** The constructor's arguments, its children last. */
      args: Value[];
      props: PropMod[];
      key: Carried | null;
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
  /** A JSX comment among children, carried into the chain as the same block comment. */
  | { type: 'comment'; text: string }
  | { type: 'cond'; test: Carried; then: Ir | null; otherwise: Ir | null };

type TextRun = { type: 'string'; value: string } | { type: 'expr'; value: Carried } | Ir;

/**
 * A value a modifier or a constructor takes: a literal, a carried value, a
 * view, a binding of two carried values, or `undefined` (an optional argument
 * before one that is given).
 */
type Value = Arg | Carried | Tagged;
type Tagged =
  | { readonly $: 'view'; readonly view: Ir }
  | { readonly $: 'binding'; readonly binding: readonly [Carried, Carried] }
  | { readonly $: 'icon'; readonly name: string }
  | { readonly $: 'options'; readonly entries: readonly (readonly [string, Value])[] }
  | { readonly $: 'absent' }
  | { readonly $: 'null' };

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

/** The import that names an element, by kind. */
function kindOf(source: Source | undefined): Kind | undefined {
  if (!source) return undefined;
  if (source.module === 'react-native') {
    if (source.imported === 'View') return 'view';
    if (source.imported === 'Pressable') return 'pressable';
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

  /** A `style` whose objects are the parity's before side, where `styles.x` is not in scope. */
  const styleLiterals = new Map<AnyNode, string>();

  /** A static style (an object literal, a module StyleSheet's style, or a list of them) as utilities. */
  function staticStyle(
    expression: AnyNode,
  ): { ok: true; classes: string[] } | { ok: false; subject: string; why: string } {
    const parts = n.ArrayExpression.check(expression) ? expression.elements : [expression];
    const classes: string[] = [];
    const literals: string[] = [];
    let referenced = false;
    for (const part of parts) {
      let object = part;
      if (
        n.MemberExpression.check(part) &&
        !part.computed &&
        n.Identifier.check(part.object) &&
        n.Identifier.check(part.property)
      ) {
        object = moduleStyleReads.has(part)
          ? styleSheets.get(part.object.name)?.get(part.property.name)
          : undefined;
        referenced = true;
      }
      const style = object ? styleUtilities(object) : undefined;
      if (!style) return { ok: false, subject: 'style', why: 'a style the codemod cannot read' };
      if (!style.ok) return style;
      classes.push(...style.classes);
      literals.push(style.literal);
    }
    if (referenced)
      styleLiterals.set(
        expression,
        literals.length === 1 && parts.length === 1
          ? (literals[0] as string)
          : `[${literals.join(', ')}]`,
      );
    return { ok: true, classes };
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
            : {
                subject: local,
                code: `kept:${source.imported}`,
                why: KEPT[`${source.module}#${source.imported}`] as string,
              },
        ],
      };
    }
    if (kind === 'component') {
      const source = sources.get(local) as Source;
      const rule = ruleFor(source.module, source.imported) as ComponentRule;
      return rule.shell ? convertShell(node, rule, rule.shell) : convertComponent(node, rule);
    }
    const reasons: Reason[] = [];
    const fail = (subject: string, code: string, why: string) =>
      reasons.push({ subject, code, why });
    const props: PropMod[] = [];
    let key: Carried | null = null;
    let className = '';
    let numberOfLines: Arg | Carried | undefined;
    let variant: string | undefined;
    let size: AnyNode;
    /** The utilities a static `style` writes, read with the className. */
    const styleClasses: string[] = [];
    /** An icon's `width`, `height` and `fill`. */
    const iconProps = new Map<string, AnyNode>();
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
        if (text === undefined)
          fail('className', 'dynamic-className', 'a className built at runtime');
        else className = text;
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
        const style = staticStyle(expression);
        if (style.ok) styleClasses.push(...style.classes);
        else fail(style.subject, 'style', style.why);
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

    for (const token of className.split(/\s+/).filter(Boolean)) classes.add(token);
    if (styleClasses.length) className = [className, ...styleClasses].filter(Boolean).join(' ');

    if (kind === 'icon') {
      if (className) fail('className', 'icon-className', 'a className on an icon');
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
      if (fill !== undefined) {
        // A theme colour is the role painted from it, in every theme.
        const role = themeRoles.get(attributeExpression(fill));
        if (role) mods.push({ name: 'foreground', args: [role] });
        else fail('fill', 'icon-fill', 'a fill that is no colour of the Bloom theme');
      } else {
        // A bare Bloom icon paints primary; Icon(X) paints the ink around it.
        mods.push(...options.table.bareIcon);
      }
      if (reasons.length) return { reasons };
      return { ir: { type: 'icon', component: local, mods, key } };
    }

    const isText = kind === 'bloomText' || kind === 'rnText';
    // Bloom's typography components (`Muted`, `H2`) are its Text in a text style.
    const textStyle = textStyleOf(local);
    if (textStyle && className)
      fail(
        'className',
        'text-style-className',
        'a className on a typography component drops its own style',
      );
    const host: HostKind = isText ? 'text' : (kind as HostKind);
    const resolution = resolveClassName(className, host, options.table, {
      overridden: options.overridden,
    });
    if (!resolution.ok) reasons.push(...resolution.reasons);

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
        if (resolved.mods.some((m) => m.name === 'font' || m.name === 'weight'))
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
    return { ir: { type: 'stack', resolved: resolution.value, props, key, children } };
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
        const entries: [string, Value][] = [];
        for (const [name, entry] of Object.entries(param.options)) {
          consumed.add(name);
          if (!given.has(name)) continue;
          const [key, form] = typeof entry === 'string' ? [name, entry] : entry;
          const value = valuesOf(form, given.get(name));
          // A bare flag is `true` in an object.
          if (value?.length === 0 && (form === 'flag' || form === 'mark'))
            entries.push([key, true]);
          else if (value?.length !== 1) unmapped(name);
          else entries.push([key, value[0] as Value]);
        }
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
        const leading = glyph(param.label.leading);
        const text = textOf(node.children);
        const trailing = glyph(param.label.trailing);
        if (leading) args.push(leading);
        if (text !== undefined)
          args.push({
            $: 'view',
            view: {
              type: 'text',
              raw: false,
              resolved: { axis: 'column', mods: [], variants: [] },
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
        const text = textOf(node.children);
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
    // A prop that is another's modifier's next argument is read with it.
    for (const prop of Object.values(rule.props ?? {}))
      if (prop.with && given.has(prop.with[0])) consumed.add(prop.with[0]);
    for (const [name, value] of given) {
      if (consumed.has(name)) continue;
      const prop: PropRule | undefined = rule.props?.[name];
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
      props.push({ name: prop.modifier, args: values });
    }
    // A next argument given without its modifier's prop.
    for (const [name, prop] of Object.entries(rule.props ?? {}))
      if (prop.with && given.has(prop.with[0]) && !given.has(name)) unmapped(prop.with[0]);

    if (rule.children) {
      for (const child of node.children) {
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
    // An optional argument left out at the end (children included) is no argument.
    while (args.length > 0 && isAbsent(args[args.length - 1] as Value)) args.pop();
    if (reasons.length) return { reasons };
    return {
      ir: {
        type: 'component',
        node: rule.node,
        within: rule.within,
        args,
        props,
        key,
      },
    };
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
      return form === 'flag' || form === 'mark' ? [] : form === 'boolean' ? [true] : undefined;
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
    }
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

  /** Bloom's `Button`, as the language's Button parity cases draw it (`packages/bloom-language/parity/button.cases.tsx`). */
  function convertButton(node: AnyNode): { ir: Ir } | { reasons: Reason[] } {
    const reasons: Reason[] = [];
    const fail = (subject: string, code: string, why: string) =>
      reasons.push({ subject, code, why });
    const props: PropMod[] = [];
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
      else fail(name, `button:${name}`, `Button's \`${name}\` (or its form here) has no mapping`);
    }
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
      case 'cond':
        return `${carry(ir.test)} ? ${ir.then ? print(ir.then, carry) : 'null'} : ${ir.otherwise ? print(ir.otherwise, carry) : 'null'}`;
      case 'icon':
        return `${lang('Icon')}(${ir.component})${ir.mods.map(printMod).join('')}${ir.key && !root ? `.id(${carry(ir.key)})` : ''}`;
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
        return `${lang(ir.node)}(${args})${tail}${ir.key && !root ? `.id(${carry(ir.key)})` : ''}`;
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
        return `${lang(ir.raw ? 'RawText' : 'Text')}(${runs.join(', ')})${chainTail(ir.resolved, ir.props, root ? null : ir.key, carry)}`;
      }
      case 'stack': {
        const ctor = lang(ir.resolved.axis === 'row' ? 'HStack' : 'VStack');
        const children = printViews(ir.children, carry);
        return `${ctor}(${children.join(', ')})${chainTail(ir.resolved, ir.props, root ? null : ir.key, carry)}`;
      }
    }
  }

  function chainTail(
    resolved: Resolved,
    props: PropMod[],
    key: Carried | null,
    carry: (c: Carried) => string,
  ): string {
    let out = resolved.mods.map(printMod).join('');
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
    if (isCarried(value)) return carry(value);
    if (isTagged(value)) {
      switch (value.$) {
        case 'view':
          return print(value.view, carry);
        case 'binding':
          return `[${carry(value.binding[0])}, ${carry(value.binding[1])}]`;
        case 'icon':
          return value.name;
        case 'options':
          return `{ ${value.entries.map(([key, v]) => `${key}: ${printValue(v, carry)}`).join(', ')} }`;
        case 'absent':
          return 'undefined';
        case 'null':
          return 'null';
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
      if (value.$ === 'view') carriedOf(value.view, out);
      else if (value.$ === 'binding') out.push(...value.binding);
      else if (value.$ === 'options') for (const [, v] of value.entries) carriedOfValue(v, out);
    }
  }

  /** The views a value holds. */
  function viewsOfValue(value: Value): Ir[] {
    if (!isTagged(value)) return [];
    if (value.$ === 'view') return [value.view];
    if (value.$ === 'options') return value.entries.flatMap(([, v]) => viewsOfValue(v));
    return [];
  }

  /** The views directly inside a view: its children, spans, branches and the views its values hold. */
  function childrenOf(ir: Ir): Ir[] {
    const props = 'props' in ir ? ir.props.flatMap((prop) => prop.args.flatMap(viewsOfValue)) : [];
    switch (ir.type) {
      case 'cond':
        return [ir.then, ir.otherwise].filter((branch): branch is Ir => branch !== null);
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
      case 'cond':
        out.push(ir.test);
        if (ir.then) carriedOf(ir.then, out);
        if (ir.otherwise) carriedOf(ir.otherwise, out);
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
        for (const prop of ir.props) for (const a of prop.args) carriedOfValue(a, out);
        if (ir.key) out.push(ir.key);
        break;
      case 'stack':
        for (const child of ir.children) carriedOf(child, out);
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
    condition: () => 'true',
    handler: () => '() => {}',
    element: (i: number) => `<Hole n="${i}" />`,
  } as const;

  function fixture(node: AnyNode, ir: Ir, rootKey: Carried | null): void {
    const carried = carriedOf(ir).filter((c) => c !== rootKey);
    const index = new Map(carried.map((c, i) => [c, i]));
    const removed = rootKey?.attribute;
    const after = `toElement(${print(ir, (c) => HOLE[c.hole](index.get(c) ?? 0), true)})`;
    // The source of the region, each carried value replaced by its hole.
    let before = '';
    let at = node.start as number;
    const spans: { start: number; end: number; text: string }[] = carried.map((c) => ({
      start: c.node.start,
      end: c.node.end,
      text: HOLE[c.hole](index.get(c) ?? 0),
    }));
    if (removed) spans.push({ start: removed.start, end: removed.end, text: '' });
    // A StyleSheet's style is its object literal on the before side.
    for (const [read, literal] of styleLiterals)
      if (read.start >= node.start && read.end <= node.end)
        spans.push({ start: read.start, end: read.end, text: literal });
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
    spans.sort((a, b) => a.start - b.start);
    for (const span of spans) {
      if (span.start < at) continue;
      before += source.slice(at, span.start) + span.text;
      at = span.end;
    }
    before += source.slice(at, node.end);
    const bindings: Record<string, Source> = {};
    for (const local of new Set(
      [...before.matchAll(/<\/?([A-Z][\w]*)/g)].map((m) => m[1] as string),
    ))
      if (sources.has(local)) bindings[local] = sources.get(local) as Source;
    for (const match of after.matchAll(/\b([A-Z][\w]*)\b/g)) {
      const local = match[1] as string;
      if (sources.has(local)) bindings[local] = sources.get(local) as Source;
    }
    const regionClasses = new Set<string>();
    for (const m of before.matchAll(/className=["'`{]+([^"'`}]*)/g))
      for (const token of (m[1] as string).split(/\s+/).filter(Boolean)) regionClasses.add(token);
    fixtures.push({
      name: `${options.name ?? 'file'}:${node.loc?.start.line ?? 0}`,
      before,
      after,
      bindings,
      language: [...usedLanguage.entries()].map(([name, local]) =>
        name === local ? name : `${name}: ${local}`,
      ),
      classes: [...regionClasses],
      within: withinOf(ir),
      themed,
    });
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
      if (options.fixtures) fixture(node, ir, rootKey);
      // Regions inside the values it carries (an embedded element's children).
      for (const c of carriedOf(ir)) {
        if (c.hole === 'element') {
          // An element can sit at the root of what is carried; visit inside it.
          const holder = { type: 'ExpressionStatement', expression: c.node };
          recast.visit(holder, visitor);
          c.node.__carried = holder.expression;
        }
      }
      const carry = (c: Carried) => recast.print(c.node.__carried ?? c.node).code;
      const chain = print(ir, carry, true);
      const code = `${lang('toElement')}(${chain}${rootKey ? `, ${carry(rootKey)}` : ''})`;
      // Parsed by recast, so the comments the chain carries are printed where they are.
      const expression = recast.parse(`${code};`, { parser: babelTs }).program.body[0].expression;
      const parent = path.parent?.node;
      const inJsx =
        parent &&
        (n.JSXElement.check(parent) || n.JSXFragment.check(parent) || n.JSXAttribute.check(parent));
      path.replace(
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
  recast.visit(ast, visitor);

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
    const specifiers = [...usedLanguage.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([name, local]) => (name === local ? name : `${name} as ${local}`));
    const declaration = recast.parse(
      `import { ${specifiers.join(', ')} } from '${LANGUAGE_MODULE}';\n`,
      {
        parser: babelTs,
      },
    ).program.body[0];
    const lastImport = body.reduce(
      (last: number, s: AnyNode, i: number) => (n.ImportDeclaration.check(s) ? i : last),
      -1,
    );
    body.splice(lastImport + 1, 0, declaration);
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
