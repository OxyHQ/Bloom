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
import { parseExpression } from '@babel/parser';
import * as recast from 'recast';
import * as babelTs from 'recast/parsers/babel-ts';

import { type HostKind, type Reason, type Resolved, resolveClassName } from './resolve';
import { type Arg, LANGUAGE_PACKAGE, type Mod, type Table } from './table';

// biome-ignore lint/suspicious/noExplicitAny: recast's AST nodes are untyped here.
type AnyNode = any;

const n = recast.types.namedTypes;

const spec = JSON.parse(readFileSync(join(LANGUAGE_PACKAGE, 'spec/language.json'), 'utf8')) as {
  scales: { iconSize: Record<string, number> };
  typeRamp: Record<string, unknown>;
};
const ICON_SIZES = Object.entries(spec.scales.iconSize);
const RAMP = new Set(Object.keys(spec.typeRamp).filter((k) => !k.startsWith('$')));

/** Where an element's component comes from: a module and the name it exports. */
export interface Source {
  readonly module: string;
  readonly imported: string;
}

type Kind = 'view' | 'pressable' | 'bloomText' | 'icon' | 'button' | 'rnText' | 'rnImage';

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
  | { type: 'text'; resolved: Resolved; props: PropMod[]; key: Carried | null; runs: TextRun[] }
  | { type: 'icon'; component: string; mods: Mod[]; key: Carried | null }
  | {
      type: 'button';
      leading: string | null;
      trailing: string | null;
      runs: TextRun[];
      props: PropMod[];
      key: Carried | null;
    }
  | { type: 'embed'; content: Carried }
  | { type: 'cond'; test: Carried; then: Ir | null; otherwise: Ir | null };

type TextRun = { type: 'string'; value: string } | { type: 'expr'; value: Carried } | Ir;

interface PropMod {
  readonly name: string;
  readonly args: (Arg | Carried)[];
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
  if (source.module === '@oxy.so/bloom/typography' && source.imported === 'Text')
    return 'bloomText';
  if (source.module === '@oxy.so/bloom/button' && source.imported === 'Button') return 'button';
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

  const results = new Map<AnyNode, { ir: Ir } | { reasons: Reason[] }>();
  const classes = new Set<string>();
  let candidates = 0;
  const counted = new Set<AnyNode>();
  const unconverted: Unconverted[] = [];
  const convertedNodes = new Set<AnyNode>();
  const convertedLocals = new Set<string>();

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
    if (kind === 'rnText')
      return {
        reasons: [
          {
            subject: 'Text',
            code: 'react-native-text',
            why: 'React Native’s Text, not Bloom’s: the language’s Text draws Bloom’s family, size and ink where this draws the platform’s',
          },
        ],
      };
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
    const reasons: Reason[] = [];
    const fail = (subject: string, code: string, why: string) =>
      reasons.push({ subject, code, why });
    const props: PropMod[] = [];
    let key: Carried | null = null;
    let className = '';
    let numberOfLines: Arg | Carried | undefined;
    let variant: string | undefined;
    let size: AnyNode;
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
      if (kind === 'bloomText' && name === 'numberOfLines') {
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
      if (kind === 'icon' && name === 'size') {
        size = value;
        continue;
      }
      fail(name, `prop:${name}`, `the prop \`${name}\` has no mapping`);
    }

    for (const token of className.split(/\s+/).filter(Boolean)) classes.add(token);

    if (kind === 'icon') {
      if (className) fail('className', 'icon-className', 'a className on an icon');
      const mods: Mod[] = [];
      if (size !== undefined) {
        // Bloom's icon takes a rung name; a number is no key of its sizes and draws NaN.
        const named = staticString(size);
        const rung = ICON_SIZES.find(([k]) => k === named);
        if (!rung)
          fail(
            'size',
            'icon-size',
            'an icon size that is no rung name (a number draws NaN), or set at runtime',
          );
        else mods.push({ name: 'size', args: [rung[0]] });
      }
      if (node.children.some((c: AnyNode) => !(n.JSXText.check(c) && cleanJsxText(c.value) === '')))
        fail('children', 'icon-children', 'an icon with children');
      // A bare Bloom icon paints primary; Icon(X) paints the ink around it.
      mods.push(...options.table.bareIcon);
      if (reasons.length) return { reasons };
      return { ir: { type: 'icon', component: local, mods, key } };
    }

    const host: HostKind = kind === 'bloomText' ? 'text' : kind;
    const resolution = resolveClassName(className, host, options.table, {
      overridden: options.overridden,
    });
    if (!resolution.ok) reasons.push(...resolution.reasons);

    if (kind === 'bloomText') {
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
          if ('ir' in inner && innerKind === 'bloomText') runs.push(inner.ir);
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
      const fontMods: Mod[] = [];
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
          fail('{/* */}', 'comment', 'a JSX comment (kept only in JSX)');
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
      case 'cond':
        return `${carry(ir.test)} ? ${ir.then ? print(ir.then, carry) : 'null'} : ${ir.otherwise ? print(ir.otherwise, carry) : 'null'}`;
      case 'icon':
        return `${lang('Icon')}(${ir.component})${ir.mods.map(printMod).join('')}${ir.key && !root ? `.id(${carry(ir.key)})` : ''}`;
      case 'button': {
        const parts: string[] = [];
        if (ir.leading) parts.push(`${lang('Icon')}(${ir.leading})`);
        if (ir.runs.length)
          parts.push(
            `${lang('Text')}(${ir.runs.map((run) => ('type' in run && run.type === 'string' ? quote(run.value) : carry((run as { value: Carried }).value))).join(', ')})`,
          );
        if (ir.trailing) parts.push(`${lang('Icon')}(${ir.trailing})`);
        const tail = ir.props
          .map(
            (p) =>
              `.${p.name}(${p.args.map((a) => (isCarried(a) ? carry(a) : printArg(a))).join(', ')})`,
          )
          .join('');
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
        return `${lang('Text')}(${runs.join(', ')})${chainTail(ir.resolved, ir.props, root ? null : ir.key, carry)}`;
      }
      case 'stack': {
        const ctor = lang(ir.resolved.axis === 'row' ? 'HStack' : 'VStack');
        const children = ir.children.map((child) => print(child, carry));
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
    for (const prop of props)
      out += `.${prop.name}(${prop.args.map((a) => (isCarried(a) ? carry(a) : printArg(a))).join(', ')})`;
    if (key) out += `.id(${carry(key)})`;
    return out;
  }

  const isCarried = (a: Arg | Carried): a is Carried =>
    typeof a === 'object' && a !== null && 'hole' in a && 'node' in a;

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
      case 'button':
        for (const run of ir.runs) if ('type' in run && run.type === 'expr') out.push(run.value);
        for (const prop of ir.props) for (const a of prop.args) if (isCarried(a)) out.push(a);
        if (ir.key) out.push(ir.key);
        break;
      case 'text':
        for (const run of ir.runs)
          if ('type' in run && run.type === 'expr') out.push(run.value);
          else if (!('type' in run && run.type === 'string')) carriedOf(run as Ir, out);
        for (const prop of ir.props) for (const a of prop.args) if (isCarried(a)) out.push(a);
        if (ir.key) out.push(ir.key);
        break;
      case 'stack':
        for (const child of ir.children) carriedOf(child, out);
        for (const prop of ir.props) for (const a of prop.args) if (isCarried(a)) out.push(a);
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
    });
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
      const expression = parseExpression(code, { plugins: ['jsx', 'typescript'] });
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
