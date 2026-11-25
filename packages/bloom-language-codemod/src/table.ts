/**
 * The className table (`packages/bloom-language/codemod/classnames.generated.json`)
 * as modifier calls: each utility the table maps to a plain chain of literal
 * modifiers is read into `Mod`s; everything else keeps its status and the
 * table's words, which the resolver reports.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { parseExpression } from '@babel/parser';

type Expression = ReturnType<typeof parseExpression>;

/**
 * A number of points the view computes as it renders (`itemSize`,
 * `insets.top + 8`), carried over as written: geometry only, a frame's
 * lengths, a pinned view's edges and its stacking order (spec `points`).
 */
export interface PointsArg {
  readonly node: unknown;
  readonly hole: 'points';
}

export type Arg =
  /** `undefined` written out: an argument the modifier takes as none (a border's colour). */
  undefined | string | number | boolean | PointsArg | Readonly<Record<string, string | PointsArg>>;

export const isPoints = (arg: unknown): arg is PointsArg =>
  typeof arg === 'object' && arg !== null && (arg as { hole?: unknown }).hole === 'points';

/** Modifiers (or variants of them) as a comparable string, each points value by where it is written. */
export const modKey = (mods: unknown): string =>
  JSON.stringify(mods, (_, value) =>
    isPoints(value)
      ? `#${(value.node as { start: number }).start}:${(value.node as { end: number }).end}`
      : value,
  );

/** One modifier call, as the codemod writes it. */
export interface Mod {
  readonly name: string;
  readonly args: readonly Arg[];
}

export type Status =
  | 'mapped'
  | 'structure'
  | 'drop'
  | 'token'
  | 'appToken'
  | 'modifier'
  | 'motion'
  | 'app';

export interface Entry {
  readonly status: Status;
  /** The table's words for the utility. */
  readonly language: string;
  /** The chain, when the table maps the utility to plain literal modifiers. */
  readonly mods: readonly Mod[] | null;
  readonly scale?: string;
  readonly value?: string;
}

export interface Table {
  readonly utilities: ReadonlyMap<string, Entry>;
  /** What a bare Bloom icon element (no fill) becomes: its primary paint. */
  readonly bareIcon: readonly Mod[];
}

/**
 * The Bloom language package the codemod writes for: the one installed beside
 * it (its peer), whose spec, exports and className table it reads.
 */
export const LANGUAGE_PACKAGE = dirname(
  createRequire(__filename).resolve('@oxy.so/bloom-language/package.json'),
);

function literal(node: Expression): Arg | undefined {
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value;
    case 'ObjectExpression': {
      const out: Record<string, string> = {};
      for (const property of node.properties) {
        if (property.type !== 'ObjectProperty' || property.computed) return undefined;
        const key =
          property.key.type === 'Identifier'
            ? property.key.name
            : property.key.type === 'StringLiteral'
              ? property.key.value
              : undefined;
        if (key === undefined || property.value.type !== 'StringLiteral') return undefined;
        out[key] = property.value.value;
      }
      return out;
    }
    default:
      return undefined;
  }
}

/** `.a('x').b({ k: 'v' })` as mods, or null when it is anything but literal calls. */
export function chainOf(language: string): Mod[] | null {
  let expression: Expression;
  try {
    expression = parseExpression(`$${language}`);
  } catch {
    return null;
  }
  const mods: Mod[] = [];
  let at: Expression = expression;
  while (at.type === 'CallExpression') {
    const callee = at.callee;
    if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') return null;
    const args: Arg[] = [];
    for (const argument of at.arguments) {
      if (argument.type === 'SpreadElement' || argument.type === 'ArgumentPlaceholder') return null;
      const value = literal(argument as Expression);
      if (value === undefined) return null;
      args.push(value);
    }
    mods.unshift({ name: callee.property.name, args });
    at = callee.object as Expression;
  }
  return at.type === 'Identifier' && at.name === '$' && mods.length > 0 ? mods : null;
}

interface RawEntry {
  status: Status;
  language: string;
  scale?: string;
  value?: string;
}

export function loadTable(
  path = join(LANGUAGE_PACKAGE, 'codemod/classnames.generated.json'),
): Table {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as {
    icons: { bare: string };
    utilities: Record<string, RawEntry>;
  };
  const utilities = new Map<string, Entry>();
  for (const [name, entry] of Object.entries(raw.utilities)) {
    utilities.set(name, {
      status: entry.status,
      language: entry.language,
      mods: entry.status === 'mapped' ? chainOf(entry.language) : null,
      scale: entry.scale,
      value: entry.value,
    });
  }
  return { utilities, bareIcon: chainOf(raw.icons.bare) ?? [] };
}
