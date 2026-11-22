/**
 * A `className` resolved to the modifiers of one language view, or the
 * reasons it cannot be: every utility has to land exactly, through the
 * className table, or the element stays JSX.
 *
 * A className styles one host at once; a chain stacks its modifiers in the
 * language's layer order (spec `layers`), so the modifiers are written in that
 * order and the view stays one host. Anything whose meaning depends on the
 * order Tailwind writes its rules in (two paddings of one edge, two colours)
 * is a conflict, never a guess.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Arg, LANGUAGE_PACKAGE, type Mod, type Table } from './table';

/** What draws the className: a React Native View, Pressable or a Bloom Text. */
export type HostKind = 'view' | 'pressable' | 'text';

export interface Reason {
  /** The class, as written, or the element's prop. */
  readonly subject: string;
  /** A stable code for the report's tallies. */
  readonly code: string;
  readonly why: string;
}

export interface Variant {
  /** The `when()` conditions, outermost first. */
  readonly conditions: readonly string[];
  readonly mods: readonly Mod[];
}

export interface Resolved {
  readonly axis: 'row' | 'column';
  readonly mods: readonly Mod[];
  readonly variants: readonly Variant[];
}

export type Resolution =
  | { readonly ok: true; readonly value: Resolved }
  | { readonly ok: false; readonly reasons: readonly Reason[] };

interface Spec {
  typeRamp: Record<string, [number, number, number, string] | string>;
  layers: string[][];
  environment: { traits: string[] };
  universal: string[];
  nodes: Record<string, { modifiers: string[] }>;
}
const spec = JSON.parse(readFileSync(join(LANGUAGE_PACKAGE, 'spec/language.json'), 'utf8')) as Spec;

const LAYER = new Map<string, number>();
spec.layers.forEach((names, index) => {
  for (const name of names) LAYER.set(name, index);
});
const TRAITS = new Set(spec.environment.traits);
const TEXT_ONLY = new Set(spec.nodes.text?.modifiers ?? []);
const STACK_ONLY = new Set(spec.nodes.stack?.modifiers ?? []);

/** Ramp steps with a tracking of their own, which a Tailwind text size does not write. */
const TRACKED = new Set(
  Object.entries(spec.typeRamp)
    .filter(([, v]) => Array.isArray(v) && v[2] !== 0)
    .map(([k]) => k.replace(/-(regular|medium|semibold|bold)$/, '')),
);

/**
 * Table mappings the parity corpus measured drawing otherwise on native, each
 * with what differs. They stay JSX until the language or the table changes.
 */
function measuredDifference(utility: string, mods: readonly Mod[]): string | undefined {
  const font = mods.find((m) => m.name === 'font');
  if (font && /^text-/.test(utility) && TRACKED.has(font.args[0] as string))
    return `.font('${font.args[0]}') brings the ramp’s letter spacing, which ${utility} does not write`;
  return undefined;
}

const BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl'];
/** Tailwind variants that are a `when()` condition, and the condition. */
const CONDITIONS: Record<string, string> = {
  ...Object.fromEntries(BREAKPOINTS.map((b) => [b, b])),
  dark: 'dark',
  web: 'web',
  native: 'native',
  ios: 'ios',
  android: 'android',
  hover: 'hovered',
  active: 'pressed',
  'focus-visible': 'focused',
};
/** The view's own states: NativeWind answers them on a Pressable only, so the language may too. */
const STATES = new Set(['hovered', 'pressed', 'focused']);

/**
 * Utilities on one physical side the language has no physical form for yet:
 * a corner (`rounded-l`), text alignment (`text-left`; React Native and
 * react-native-web flip it right to left differently), scroll snapping.
 */
const PHYSICAL =
  /^-?(rounded-[lr]|rounded-[tb][lr]|text-(left|right)|scroll-[mp][lr]|space-x-reverse)(-|$)/;

/** The sides an edge writes: `s`/`e` follow the reading direction, `l`/`r` are physical. */
const SIDES: Record<string, string> = {
  all: 'tbse',
  horizontal: 'se',
  vertical: 'tb',
  top: 't',
  bottom: 'b',
  leading: 's',
  trailing: 'e',
  left: 'l',
  right: 'r',
};

/** Whether two edges write one side: a physical side meets either reading-direction side right to left. */
export function edgesMeet(a: string, b: string): boolean {
  const x = SIDES[a] ?? '';
  const y = SIDES[b] ?? '';
  if ([...x].some((side) => y.includes(side))) return true;
  const logical = (sides: string) => /[se]/.test(sides);
  const physical = (sides: string) => /[lr]/.test(sides);
  return (logical(x) && physical(y)) || (physical(x) && logical(y));
}

/** Splits `md:hover:p-4` into its variants and utility; brackets keep their colons. */
export function splitVariants(token: string): { variants: string[]; utility: string } {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (c === ':' && depth === 0) {
      parts.push(token.slice(start, i));
      start = i + 1;
    }
  }
  return { variants: parts, utility: token.slice(start) };
}

interface Group {
  mods: Mod[];
  /** Border widths waiting for their colour: `[width, edge?]`. */
  widths: { subject: string; args: Arg[] }[];
  colors: { subject: string; color: Arg }[];
  absolute: string | null;
  /** The text-size class's own leading, replaced by an explicit leading class. */
  impliedLeading: Mod | null;
  subjects: Map<Mod, string>;
}

const newGroup = (): Group => ({
  mods: [],
  widths: [],
  colors: [],
  absolute: null,
  impliedLeading: null,
  subjects: new Map(),
});

export interface ResolveOptions {
  /** Classes the app's own theme draws differently from Bloom's (see `overrides.ts`). */
  readonly overridden?: ReadonlySet<string>;
}

/** Resolves `className` on a host of `kind`. */
export function resolveClassName(
  className: string,
  kind: HostKind,
  table: Table,
  options: ResolveOptions = {},
): Resolution {
  const reasons: Reason[] = [];
  const fail = (subject: string, code: string, why: string) => reasons.push({ subject, code, why });
  let axis: 'row' | 'column' = 'column';
  const groups = new Map<string, Group>();
  const group = (conditions: string[]) => {
    const key = conditions.join(':');
    const found = groups.get(key) ?? newGroup();
    groups.set(key, found);
    return found;
  };

  for (const token of className.split(/\s+/).filter(Boolean)) {
    const { variants, utility: rawUtility } = splitVariants(token);
    if (rawUtility.startsWith('!') || rawUtility.endsWith('!')) {
      fail(token, 'important', 'an !important utility outranks every other rule');
      continue;
    }
    const conditions: string[] = [];
    let ok = true;
    for (const variant of variants) {
      const condition = CONDITIONS[variant];
      if (!condition) {
        fail(token, `variant:${variant}`, `the variant \`${variant}:\` is no when() condition`);
        ok = false;
        break;
      }
      if (STATES.has(condition) && kind !== 'pressable') {
        fail(
          token,
          'state-off-pressable',
          `\`${variant}:\` on a non-pressable host: NativeWind answers it on a Pressable only`,
        );
        ok = false;
        break;
      }
      conditions.push(condition);
    }
    if (!ok) continue;
    if (options.overridden?.has(token)) {
      fail(
        token,
        'app-theme',
        'the app’s stylesheet draws this utility differently from Bloom’s (an app theme override)',
      );
      continue;
    }
    const utility = rawUtility;
    if (PHYSICAL.test(utility)) {
      fail(
        token,
        'physical-edge',
        'a physical side: the language’s edges follow the reading direction',
      );
      continue;
    }
    const entry = table.utilities.get(utility);
    if (!entry) {
      fail(token, 'unknown', 'not in the className table');
      continue;
    }
    const into = group(conditions);
    switch (entry.status) {
      case 'mapped': {
        if (entry.mods) {
          const different = measuredDifference(utility, entry.mods);
          if (different) {
            fail(token, 'measured-difference', different);
            break;
          }
          for (const mod of entry.mods) {
            into.mods.push(mod);
            into.subjects.set(mod, token);
          }
          if (
            /^text-/.test(utility) &&
            entry.mods.length === 2 &&
            entry.mods[1]?.name === 'leading'
          )
            into.impliedLeading = entry.mods[1];
          break;
        }
        const role = /^\.border\(role(?:, ('[^']*'))?(?:, ('[^']*'))?\)$/.exec(entry.language);
        if (role) {
          const args: Arg[] = [];
          if (role[1]) args.push(role[1].slice(1, -1));
          if (role[2]) args.push(role[2].slice(1, -1));
          into.widths.push({ subject: token, args });
        } else if (utility === 'absolute') into.absolute = token;
        else fail(token, 'annotated', entry.language);
        break;
      }
      case 'structure':
        if (kind === 'text' || conditions.length > 0) {
          fail(token, 'structure', entry.language);
        } else if (utility === 'flex-row') axis = 'row';
        else if (utility === 'flex-col') axis = 'column';
        else if (utility !== 'flex') fail(token, 'structure', entry.language);
        break;
      case 'drop':
        // A pressable takes the pointer; anything else would lose it on the web.
        if (utility === 'cursor-pointer' && kind !== 'pressable')
          fail(token, 'cursor', 'cursor-pointer on a host that is not pressable');
        break;
      default:
        fail(token, entry.status, entry.language);
    }
  }
  if (reasons.length > 0) return { ok: false, reasons };

  const resolved: Variant[] = [];
  for (const [key, g] of groups) {
    const mods = finish(g, kind, fail);
    resolved.push({ conditions: key ? key.split(':') : [], mods });
  }
  if (reasons.length > 0) return { ok: false, reasons };
  const base = resolved.find((v) => v.conditions.length === 0)?.mods ?? [];
  const variants = resolved
    .filter((v) => v.conditions.length > 0)
    .sort((a, b) => rank(a.conditions) - rank(b.conditions));
  return { ok: true, value: { axis, mods: base, variants } };
}

function rank(conditions: readonly string[]): number {
  const first = conditions[0] ?? '';
  const breakpoint = BREAKPOINTS.indexOf(first);
  return breakpoint >= 0 ? breakpoint : BREAKPOINTS.length;
}

function finish(
  g: Group,
  kind: HostKind,
  fail: (subject: string, code: string, why: string) => void,
): Mod[] {
  const subject = (mod: Mod) => g.subjects.get(mod) ?? mod.name;
  let mods = g.mods;

  // A text size's own leading gives way to an explicit leading class.
  if (g.impliedLeading && mods.filter((m) => m.name === 'leading').length > 1)
    mods = mods.filter((m) => m !== g.impliedLeading);

  // Border: a width class and a colour class are one modifier.
  const colors = mods.filter((m) => m.name === 'border');
  mods = mods.filter((m) => m.name !== 'border');
  if (g.widths.length > 0 || colors.length > 0) {
    if (colors.length !== 1 || g.widths.length === 0) {
      const what =
        colors.length === 0
          ? 'a border width with no colour class (Tailwind paints currentColor)'
          : g.widths.length === 0
            ? 'a border colour with no width class (no border is drawn)'
            : 'two border colours';
      fail([...g.widths.map((w) => w.subject), ...colors.map(subject)].join(' '), 'border', what);
    } else {
      const color = colors[0] as Mod;
      for (const width of g.widths)
        mods.push({ name: 'border', args: [color.args[0] as Arg, ...width.args] });
    }
  }

  // Position: `absolute` and its edges are one modifier.
  const edges = mods.filter((m) => m.name === 'position');
  mods = mods.filter((m) => m.name !== 'position');
  if (g.absolute || edges.length > 0) {
    if (!g.absolute)
      fail(
        edges.map(subject).join(' '),
        'offset-without-absolute',
        'an inset without `absolute` offsets the view in its flow',
      );
    else if (edges.length === 0)
      fail(g.absolute, 'absolute-without-edges', '`absolute` with no inset class');
    else {
      const merged = mergeObjects(edges, 'position', subject, fail);
      if (merged) mods.push(merged);
    }
  }

  // Frames join one object.
  const frames = mods.filter((m) => m.name === 'frame');
  if (frames.length > 1) {
    const merged = mergeObjects(frames, 'frame', subject, fail);
    mods = mods.filter((m) => m.name !== 'frame');
    if (merged) mods.push(merged);
  }

  // Two paddings (or margins) of one side: the language adds paddings and keeps
  // the later margin, CSS keeps the rule Tailwind writes later. Either way, a conflict.
  for (const name of ['padding', 'margin']) {
    const seen: Mod[] = [];
    for (const mod of mods.filter((m) => m.name === name)) {
      const edge = mod.args.length === 2 ? (mod.args[0] as string) : 'all';
      const prior = seen.find((p) =>
        edgesMeet(p.args.length === 2 ? (p.args[0] as string) : 'all', edge),
      );
      if (prior)
        fail(`${subject(prior)} ${subject(mod)}`, `${name}-overlap`, `two ${name}s of one side`);
      seen.push(mod);
    }
  }

  // Any other modifier twice is decided by Tailwind's rule order.
  const seen = new Map<string, Mod>();
  for (const mod of mods) {
    if (['padding', 'margin', 'border', 'corner', 'when'].includes(mod.name)) continue;
    const prior = seen.get(mod.name);
    if (prior)
      fail(`${subject(prior)} ${subject(mod)}`, 'conflict', `two classes set .${mod.name}()`);
    seen.set(mod.name, mod);
  }

  for (const mod of mods) {
    if (kind !== 'text' && (TRAITS.has(mod.name) || TEXT_ONLY.has(mod.name)))
      fail(
        subject(mod),
        'text-on-view',
        'a text style on a View: NativeWind does not hand it to the Text inside, the language’s environment would',
      );
    if (kind === 'text' && STACK_ONLY.has(mod.name))
      fail(subject(mod), 'stack-on-text', 'a stack’s layout on a Text');
  }

  // The layer order keeps one view: padding, frame, fill, border, corner, opacity, shadow.
  const layered = mods.filter((m) => LAYER.has(m.name));
  const rest = mods.filter((m) => !LAYER.has(m.name));
  layered.sort((a, b) => (LAYER.get(a.name) as number) - (LAYER.get(b.name) as number));
  return [...layered, ...rest];
}

function mergeObjects(
  list: Mod[],
  name: string,
  subject: (mod: Mod) => string,
  fail: (subject: string, code: string, why: string) => void,
): Mod | null {
  const out: Record<string, string> = {};
  for (const mod of list) {
    const value = mod.args[0];
    if (typeof value !== 'object' || mod.args.length !== 1) {
      fail(subject(mod), name, `an unexpected .${name}() form`);
      return null;
    }
    for (const [key, v] of Object.entries(value)) {
      if (key in out) {
        fail(list.map(subject).join(' '), 'conflict', `two classes set .${name}({ ${key} })`);
        return null;
      }
      out[key] = v;
    }
  }
  return { name, args: [out] };
}
