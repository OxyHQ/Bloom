/**
 * A static `style` as the Tailwind utilities that write the same declarations,
 * so it lands through the className table like any class (and conflicts with
 * a class that sets the same thing, as two classes would). Only layout values
 * Tailwind writes exactly are taken: a length that is a step of the spacing
 * scale (`gap: 12` is `gap-3`, 0.25rem steps at the preset's 16px rem), `100%`,
 * and the flex keywords. Anything else is a reason.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as recast from 'recast';

import { LANGUAGE_PACKAGE, type Mod } from './table';

const scales = (
  JSON.parse(readFileSync(join(LANGUAGE_PACKAGE, 'spec/language.json'), 'utf8')) as {
    scales: Record<string, Record<string, unknown>>;
  }
).scales;

/** A scale's tokens by value, a named rung over a numeric token of the same value. */
function byValue(scale: Record<string, unknown>): ReadonlyMap<number, string> {
  const out = new Map<number, string>();
  for (const [name, value] of Object.entries(scale)) {
    if (typeof value !== 'number') continue;
    const named = !/^-?\d/.test(name);
    if (named || !out.has(value)) out.set(value, name);
  }
  return out;
}
const CORNER = byValue(scales.corner as Record<string, unknown>);
const Z_INDEX = byValue(scales.zIndex as Record<string, unknown>);
const FONT_SIZE = byValue(scales.fontSize as Record<string, unknown>);
const LEADING_PX = byValue(scales.leadingPx as Record<string, unknown>);

/**
 * A text's own `fontSize` and `lineHeight` written out, as the language's
 * size and line: `fontSize: 15` is `.font('md')` (a named rung over a numeric
 * token of the same points, `fontSize: 14` `.font('14')`), `lineHeight: 20`
 * `.leading('20px')`. A size or a line no token holds stays a reason.
 */
export function textDeclaration(key: string, value: AnyNode): Mod | undefined {
  if (!n.NumericLiteral.check(value)) return undefined;
  const number = value.value as number;
  if (key === 'fontSize') {
    const token = FONT_SIZE.get(number);
    return token === undefined ? undefined : { name: 'font', args: [token] };
  }
  if (key === 'lineHeight') {
    const token = LEADING_PX.get(number);
    return token === undefined ? undefined : { name: 'leading', args: [token] };
  }
  return undefined;
}

// biome-ignore lint/suspicious/noExplicitAny: recast's AST nodes are untyped here.
type AnyNode = any;

const n = recast.types.namedTypes;

/** A style key whose numeric value is a spacing-scale step: its utility prefix. */
const LENGTH: Readonly<Record<string, string>> = {
  gap: 'gap',
  rowGap: 'gap-y',
  columnGap: 'gap-x',
  padding: 'p',
  paddingHorizontal: 'px',
  paddingVertical: 'py',
  paddingTop: 'pt',
  paddingBottom: 'pb',
  paddingLeft: 'pl',
  paddingRight: 'pr',
  paddingStart: 'ps',
  paddingEnd: 'pe',
  margin: 'm',
  marginHorizontal: 'mx',
  marginVertical: 'my',
  marginTop: 'mt',
  marginBottom: 'mb',
  marginLeft: 'ml',
  marginRight: 'mr',
  width: 'w',
  height: 'h',
  minWidth: 'min-w',
  minHeight: 'min-h',
  maxWidth: 'max-w',
  maxHeight: 'max-h',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
};

/** A style key and keyword value as its utility. */
const KEYWORD: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  flexDirection: { row: 'flex-row', column: 'flex-col' },
  flexWrap: { wrap: 'flex-wrap', nowrap: 'flex-nowrap' },
  alignItems: {
    center: 'items-center',
    'flex-start': 'items-start',
    'flex-end': 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  },
  alignSelf: {
    center: 'self-center',
    'flex-start': 'self-start',
    'flex-end': 'self-end',
    stretch: 'self-stretch',
  },
  justifyContent: {
    center: 'justify-center',
    'flex-start': 'justify-start',
    'flex-end': 'justify-end',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly',
  },
  position: { absolute: 'absolute', relative: 'relative' },
  // A view draws what overflows it by default: the className table drops `overflow-visible`.
  overflow: { hidden: 'overflow-hidden', visible: 'overflow-visible' },
  // An auto margin takes the free space on its side (the language's `.margin(edge, 'auto')`).
  marginTop: { auto: 'mt-auto' },
  marginBottom: { auto: 'mb-auto' },
  marginLeft: { auto: 'ml-auto' },
  marginRight: { auto: 'mr-auto' },
  borderStyle: { solid: 'border-solid', dashed: 'border-dashed', dotted: 'border-dotted' },
  // A text's weight, as Tailwind's `font-*` writes it.
  fontWeight: {
    '300': 'font-light',
    '400': 'font-normal',
    '500': 'font-medium',
    '600': 'font-semibold',
    '700': 'font-bold',
    '800': 'font-extrabold',
    bold: 'font-bold',
    normal: 'font-normal',
  },
};

/**
 * A numeric key whose value is a utility of its own. (React Native's `flex: 1`
 * is no utility: Tailwind's `flex-1` is grow 1, shrink 1, basis 0%, which
 * React Native draws differently; measured on the corpus. It is the
 * language's `.grow()`, which writes `flex: 1` itself: `DIRECT`.)
 */
const NUMERIC: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  flexGrow: { 1: 'grow', 0: 'grow-0' },
  flexShrink: { 1: 'shrink', 0: 'shrink-0' },
};

/** A corner's own radius key as the language's corner side. */
const CORNER_SIDE: Readonly<Record<string, string>> = {
  borderTopLeftRadius: 'top-left',
  borderTopRightRadius: 'top-right',
  borderBottomLeftRadius: 'bottom-left',
  borderBottomRightRadius: 'bottom-right',
  borderTopStartRadius: 'top-leading',
  borderTopEndRadius: 'top-trailing',
  borderBottomStartRadius: 'bottom-leading',
  borderBottomEndRadius: 'bottom-trailing',
};

/**
 * A style key and value the language writes itself, as its modifier: React
 * Native's `flex: 1` is `.grow()`; a radius, a stacking level and an aspect
 * ratio are the tokens (or number) of their exact value, a corner's own
 * radius (`borderTopLeftRadius`) its side's. A radius of 999 is `full` (9999):
 * both round any box under 1998pt fully, so they draw alike.
 */
function direct(key: string, value: AnyNode): Mod | undefined {
  const number = n.NumericLiteral.check(value)
    ? (value.value as number)
    : n.UnaryExpression.check(value) &&
        value.operator === '-' &&
        n.NumericLiteral.check(value.argument)
      ? -(value.argument.value as number)
      : undefined;
  if (number === undefined) return undefined;
  if (key === 'flex' && number === 1) return { name: 'grow', args: [] };
  if (key === 'borderRadius' || CORNER_SIDE[key]) {
    const token = number === 999 ? 'full' : CORNER.get(number);
    const side = CORNER_SIDE[key];
    return token === undefined
      ? undefined
      : { name: 'corner', args: side ? [token, side] : [token] };
  }
  if (key === 'zIndex') {
    const token = Z_INDEX.get(number);
    return token === undefined ? undefined : { name: 'zIndex', args: [token] };
  }
  if (key === 'aspectRatio' && number > 0) return { name: 'aspectRatio', args: [number] };
  return undefined;
}

/** A declaration the caller reads as modifiers (a theme colour as its role, an inset's padding), or undefined. */
export type StyleRead = (key: string, value: AnyNode) => Mod | readonly Mod[] | undefined;

export type StyleResult =
  | {
      readonly ok: true;
      readonly classes: readonly string[];
      /** What no utility writes, by its style key (`flex: 1` is `.grow()`). */
      readonly mods: readonly { readonly subject: string; readonly mod: Mod }[];
      readonly literal: string;
      /**
       * Points the chain draws without carrying them (a half-square radius's
       * side, drawn as `'full'`): the parity's before side writes their hole.
       */
      readonly held: readonly AnyNode[];
    }
  | { readonly ok: false; readonly subject: string; readonly why: string };

/** One declaration as its utility, or undefined. */
function utility(key: string, value: AnyNode): string | undefined {
  if (n.NumericLiteral.check(value)) {
    const prefix = LENGTH[key];
    // A whole number of points is a step of Tailwind's spacing scale: 0.25rem, 4 points (`gap-3` is 12).
    if (prefix)
      return Number.isInteger(value.value) && value.value >= 0
        ? `${prefix}-${value.value / 4}`
        : undefined;
    return NUMERIC[key]?.[String(value.value)];
  }
  if (n.StringLiteral.check(value)) {
    if (
      value.value === '100%' &&
      LENGTH[key] &&
      /^(w|h|min-w|min-h|max-w|max-h)$/.test(LENGTH[key])
    )
      return `${LENGTH[key]}-full`;
    return KEYWORD[key]?.[value.value];
  }
  return undefined;
}

const FLEX_KEYS = ['flexGrow', 'flexShrink', 'flexBasis'];
const FLEX = Object.entries(scales.flex as Record<string, unknown>).filter(
  ([name]) => name !== '$comment',
) as [string, [number | null, number | null, string | null]][];

/** A style's literal grow, shrink and basis, all three, as the flex token that writes them, or undefined. */
function flexToken(object: AnyNode): string | undefined {
  const values = new Map<string, unknown>();
  for (const property of object.properties)
    if (
      (n.ObjectProperty.check(property) || n.Property.check(property)) &&
      n.Identifier.check(property.key) &&
      FLEX_KEYS.includes(property.key.name) &&
      (n.NumericLiteral.check(property.value) || n.StringLiteral.check(property.value))
    )
      values.set(property.key.name, property.value.value);
  if (values.size !== 3) return undefined;
  return FLEX.find(
    ([, [grow, shrink, basis]]) =>
      grow === values.get('flexGrow') &&
      shrink === values.get('flexShrink') &&
      basis === values.get('flexBasis'),
  )?.[0];
}

/**
 * React Native's `StyleSheet.absoluteFill`: pinned to every edge of its parent
 * (`absolute inset-0`), and the declarations it holds, written out for the
 * parity's before side.
 */
export const ABSOLUTE_FILL = {
  classes: ['absolute', 'top-0', 'right-0', 'bottom-0', 'left-0'],
  literal: "position: 'absolute', left: 0, right: 0, top: 0, bottom: 0",
} as const;

/** Each physical side a padding or margin key sets, and how specific it is (React Native's precedence). */
const EDGE_KEYS: Readonly<Record<string, { sides: readonly string[]; rank: number }>> = {
  '': { sides: ['Top', 'Bottom', 'Left', 'Right'], rank: 0 },
  Horizontal: { sides: ['Left', 'Right'], rank: 1 },
  Vertical: { sides: ['Top', 'Bottom'], rank: 1 },
  Top: { sides: ['Top'], rank: 2 },
  Bottom: { sides: ['Bottom'], rank: 2 },
  Left: { sides: ['Left'], rank: 2 },
  Right: { sides: ['Right'], rank: 2 },
};

/**
 * A style's paddings and margins as React Native resolves them when keys of
 * one side meet (`marginHorizontal: 8, marginLeft: 4`): a side's own key over
 * its axis's, an axis's over the whole, whatever their order. Where they
 * meet, a key overridden on a side is the sides it still holds, each its own
 * (`marginLeft: 4, marginRight: 8`), so no two utilities set one side; every
 * other key stays as written. A
 * `Start` or `End` key beside them is left to the conflict it is.
 */
function sidesResolved(properties: readonly AnyNode[]): AnyNode[] {
  const out = [...properties];
  for (const prefix of ['padding', 'margin']) {
    const own = out.filter(
      (property) =>
        (n.ObjectProperty.check(property) || n.Property.check(property)) &&
        !property.computed &&
        n.Identifier.check(property.key) &&
        property.key.name.startsWith(prefix) &&
        EDGE_KEYS[property.key.name.slice(prefix.length)] !== undefined,
    );
    const set = new Map<string, { rank: number; value: AnyNode }>();
    let meet = false;
    for (const property of own) {
      const { sides, rank } = EDGE_KEYS[property.key.name.slice(prefix.length)] as {
        sides: readonly string[];
        rank: number;
      };
      for (const side of sides) {
        const prior = set.get(side);
        if (prior) meet = true;
        if (!prior || rank >= prior.rank) set.set(side, { rank, value: property.value });
      }
    }
    if (!meet) continue;
    // A key that holds every side it names stays; one a more specific key overrides is the
    // sides it still holds, each its own key.
    for (const property of own) {
      const { sides } = EDGE_KEYS[property.key.name.slice(prefix.length)] as {
        sides: readonly string[];
      };
      const held = sides.filter((side) => set.get(side)?.value === property.value);
      if (held.length === sides.length) continue;
      const keys = held.map((side) =>
        recast.types.builders.objectProperty(
          recast.types.builders.identifier(`${prefix}${side}`),
          property.value,
        ),
      );
      out.splice(out.indexOf(property), 1, ...keys);
    }
  }
  return out;
}

/**
 * A spread in a style the caller reads: the utilities and modifiers it writes,
 * and what it is on the before side (`StyleSheet.absoluteFill` is its
 * declarations written out; a Bloom call such as `fontFamilyStyle('display')`
 * stays as written, its function bound there).
 */
export interface SpreadStyle {
  readonly classes: readonly string[];
  readonly mods: readonly Mod[];
  /** The spread's declarations, written out on the before side; unset: the spread as written. */
  readonly literal?: string;
}

/** A frame's own length keys (spec `objects.frame`). */
const FRAME_KEYS = new Set(['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight']);
/** A pinned view's physical edges, as React Native's keys (spec `objects.edges`). */
const PINNED_EDGES = new Set(['top', 'bottom', 'left', 'right']);

/**
 * Geometry computed at render as the language's points (spec `points`):
 * `width: itemSize` is `.frame({ width: itemSize })`, `top: insets.top + 8`
 * `.position({ top: insets.top + 8 })` (which joins the view's `absolute`),
 * `zIndex: count - index` `.zIndex(count - index)`. Only a value `computed`
 * says the view works out as it renders; a number written out is a token.
 */
function pointsDeclaration(key: string, value: AnyNode): Mod | undefined {
  const points = { node: value, hole: 'points' } as const;
  if (FRAME_KEYS.has(key)) return { name: 'frame', args: [{ [key]: points }] };
  if (PINNED_EDGES.has(key)) return { name: 'position', args: [{ [key]: points }] };
  if (key === 'zIndex') return { name: 'zIndex', args: [points] };
  return undefined;
}

/** A style's own declaration by its key, or undefined. */
function declared(object: AnyNode, key: string): AnyNode | undefined {
  return object.properties.find(
    (property: AnyNode) =>
      (n.ObjectProperty.check(property) || n.Property.check(property)) &&
      !property.computed &&
      n.Identifier.check(property.key) &&
      property.key.name === key,
  )?.value;
}

/**
 * The side of a square a radius is half of (`width: size, height: size,
 * borderRadius: size / 2`), which is `.corner('full')`: the box is a circle
 * either way, since a radius over half the side draws as half of it. The
 * style sets the side twice as one expression and no minimum that could grow
 * the box past it.
 */
function halfSquareSide(object: AnyNode, value: AnyNode): AnyNode | undefined {
  const [width, height] = [declared(object, 'width'), declared(object, 'height')];
  if (
    !width ||
    !height ||
    declared(object, 'minWidth') ||
    declared(object, 'minHeight') ||
    !n.BinaryExpression.check(value) ||
    value.operator !== '/' ||
    !n.NumericLiteral.check(value.right) ||
    value.right.value !== 2
  )
    return undefined;
  const side = recast.print(value.left).code;
  return recast.print(width).code === side && recast.print(height).code === side
    ? value.left
    : undefined;
}

export interface StyleReaders {
  /** Declarations the caller reads as modifiers (a theme colour as its role). */
  readonly read?: StyleRead;
  /** A spread the caller reads (`StyleSheet.absoluteFill`, `fontFamilyStyle('mono')`). */
  readonly spreadOf?: (node: AnyNode) => SpreadStyle | undefined;
  /** A value that is a number the codemod knows (Bloom's `tokens.space.sm`), or undefined. */
  readonly numberOf?: (node: AnyNode) => number | undefined;
  /** Whether a value is a number the view computes as it renders (geometry's points). */
  readonly computed?: (node: AnyNode) => boolean;
}

/**
 * An object literal of a style as utilities, and the literal itself (for the
 * parity's before side, where `styles.x` is not in scope). A spread `spreadOf`
 * reads is what it writes; any other is a style built at runtime.
 */
export function styleUtilities(
  object: AnyNode,
  { read, spreadOf, numberOf, computed }: StyleReaders = {},
): StyleResult {
  if (!n.ObjectExpression.check(object))
    return { ok: false, subject: 'style', why: 'a style that is no object literal' };
  const classes: string[] = [];
  const mods: { subject: string; mod: Mod }[] = [];
  const held: AnyNode[] = [];
  let literal = recast.print(object).code;
  // A grow, shrink and basis that are one of Tailwind's flex utilities (`flex-1`) are `.flex()`.
  const flex = flexToken(object);
  if (flex) mods.push({ subject: 'flexBasis', mod: { name: 'flex', args: [flex] } });
  for (const property of sidesResolved(object.properties)) {
    if (
      flex &&
      (n.ObjectProperty.check(property) || n.Property.check(property)) &&
      n.Identifier.check(property.key) &&
      FLEX_KEYS.includes(property.key.name)
    )
      continue;
    const spread = n.SpreadElement.check(property) ? spreadOf?.(property.argument) : undefined;
    if (spread) {
      classes.push(...spread.classes);
      for (const mod of spread.mods) mods.push({ subject: 'fontFamily', mod });
      if (spread.literal !== undefined)
        literal = literal.replace(recast.print(property).code, spread.literal);
      continue;
    }
    if (
      !(n.ObjectProperty.check(property) || n.Property.check(property)) ||
      property.computed ||
      !n.Identifier.check(property.key)
    )
      return { ok: false, subject: 'style', why: 'a style built at runtime' };
    const key = property.key.name as string;
    const known = numberOf?.(property.value);
    const value =
      known === undefined
        ? property.value
        : known < 0
          ? recast.types.builders.unaryExpression('-', recast.types.builders.numericLiteral(-known))
          : recast.types.builders.numericLiteral(known);
    const side = key === 'borderRadius' ? halfSquareSide(object, value) : undefined;
    if (side) {
      mods.push({ subject: key, mod: { name: 'corner', args: ['full'] } });
      if (computed?.(side)) held.push(side);
      continue;
    }
    const mod =
      direct(key, value) ??
      read?.(key, value) ??
      (computed?.(value) ? pointsDeclaration(key, value) : undefined);
    if (mod) {
      for (const one of Array.isArray(mod) ? mod : [mod]) mods.push({ subject: key, mod: one });
      continue;
    }
    // `inset` is its four edges, as React Native resolves it.
    if (key === 'inset') {
      const edges = ['top', 'right', 'bottom', 'left'].map((edge) => utility(edge, value));
      if (edges.every((edge) => edge !== undefined)) {
        classes.push(...(edges as string[]));
        continue;
      }
    }
    const found = utility(key, value);
    if (!found)
      return {
        ok: false,
        subject: key,
        why: `a style \`${key}\` whose value no Tailwind utility writes exactly`,
      };
    classes.push(found);
  }
  return { ok: true, classes, mods, literal, held };
}
