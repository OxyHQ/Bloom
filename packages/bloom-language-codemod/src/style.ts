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

/**
 * An object literal of a style as utilities, and the literal itself (for the
 * parity's before side, where `styles.x` is not in scope).
 */
export function styleUtilities(object: AnyNode, read?: StyleRead): StyleResult {
  if (!n.ObjectExpression.check(object))
    return { ok: false, subject: 'style', why: 'a style that is no object literal' };
  const classes: string[] = [];
  const mods: { subject: string; mod: Mod }[] = [];
  for (const property of object.properties) {
    if (
      !(n.ObjectProperty.check(property) || n.Property.check(property)) ||
      property.computed ||
      !n.Identifier.check(property.key)
    )
      return { ok: false, subject: 'style', why: 'a style built at runtime' };
    const key = property.key.name as string;
    const mod = direct(key, property.value) ?? read?.(key, property.value);
    if (mod) {
      for (const one of Array.isArray(mod) ? mod : [mod]) mods.push({ subject: key, mod: one });
      continue;
    }
    // `inset` is its four edges, as React Native resolves it.
    if (key === 'inset') {
      const edges = ['top', 'right', 'bottom', 'left'].map((edge) => utility(edge, property.value));
      if (edges.every((edge) => edge !== undefined)) {
        classes.push(...(edges as string[]));
        continue;
      }
    }
    const found = utility(key, property.value);
    if (!found)
      return {
        ok: false,
        subject: key,
        why: `a style \`${key}\` whose value no Tailwind utility writes exactly`,
      };
    classes.push(found);
  }
  return { ok: true, classes, mods, literal: recast.print(object).code };
}
