/**
 * A static `style` as the Tailwind utilities that write the same declarations,
 * so it lands through the className table like any class (and conflicts with
 * a class that sets the same thing, as two classes would). Only layout values
 * Tailwind writes exactly are taken: a length that is a step of the spacing
 * scale (`gap: 12` is `gap-3`, 0.25rem steps at the preset's 16px rem), `100%`,
 * and the flex keywords. Anything else is a reason.
 */
import * as recast from 'recast';

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
  overflow: { hidden: 'overflow-hidden' },
};

/**
 * A numeric key whose value is a utility of its own. (React Native's `flex: 1`
 * is no utility: Tailwind's `flex-1` is grow 1, shrink 1, basis 0%, which
 * React Native draws differently; measured on the corpus.)
 */
const NUMERIC: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  flexGrow: { 1: 'grow', 0: 'grow-0' },
  flexShrink: { 1: 'shrink', 0: 'shrink-0' },
};

export type StyleResult =
  | { readonly ok: true; readonly classes: readonly string[]; readonly literal: string }
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
export function styleUtilities(object: AnyNode): StyleResult {
  if (!n.ObjectExpression.check(object))
    return { ok: false, subject: 'style', why: 'a style that is no object literal' };
  const classes: string[] = [];
  for (const property of object.properties) {
    if (
      !(n.ObjectProperty.check(property) || n.Property.check(property)) ||
      property.computed ||
      !n.Identifier.check(property.key)
    )
      return { ok: false, subject: 'style', why: 'a style built at runtime' };
    const key = property.key.name as string;
    const found = utility(key, property.value);
    if (!found)
      return {
        ok: false,
        subject: key,
        why: `a style \`${key}\` whose value no Tailwind utility writes exactly`,
      };
    classes.push(found);
  }
  return { ok: true, classes, literal: recast.print(object).code };
}
