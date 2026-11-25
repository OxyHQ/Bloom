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

import {
  type Arg,
  type Entry,
  isPoints,
  LANGUAGE_PACKAGE,
  type Mod,
  type PointsArg,
  type Table,
} from './table';

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
  variants: { modifiers: string[] };
  scales: Record<string, Record<string, number | string>>;
  typeRamp: Record<string, [number, number, number, string] | string>;
  layers: string[][];
  environment: { traits: string[] };
  universal: string[];
  nodes: Record<string, { modifiers: string[] }>;
  enums: { fontFamily: string[] };
}
const spec = JSON.parse(readFileSync(join(LANGUAGE_PACKAGE, 'spec/language.json'), 'utf8')) as Spec;

const LAYER = new Map<string, number>();
spec.layers.forEach((names, index) => {
  for (const name of names) LAYER.set(name, index);
});
const TRAITS = new Set(spec.environment.traits);
/** A frame side's Tailwind prefix, as the frame key the language names. */
const FRAME_PREFIX: Readonly<Record<string, string>> = {
  w: 'width',
  h: 'height',
  'min-w': 'minWidth',
  'min-h': 'minHeight',
  'max-w': 'maxWidth',
  'max-h': 'maxHeight',
};
/** The spec's space tokens by points, a named rung over a numeric token of the same value. */
const SPACE_BY_POINTS = new Map<number, string>();
for (const [name, points] of Object.entries(spec.scales.space ?? {}))
  if (typeof points === 'number' && (!/^\d/.test(name) || !SPACE_BY_POINTS.has(points)))
    SPACE_BY_POINTS.set(points, name);

/**
 * A frame length of Tailwind's spacing scale that no app writes as a class
 * (so the table has no row for it) but a style writes (`height: 38` is
 * `h-9.5`), whose points are a space token: the frame the table writes for
 * the steps it holds (`h-11` is `.frame({ height: '44' })`).
 */
function frameStep(utility: string): Entry | undefined {
  const match = /^(min-w|min-h|max-w|max-h|w|h)-(\d+(?:\.\d+)?)$/.exec(utility);
  const token = match ? SPACE_BY_POINTS.get(Number(match[2]) * 4) : undefined;
  if (!match || token === undefined) return undefined;
  const frame = { [FRAME_PREFIX[match[1] as string] as string]: token };
  const mods = [{ name: 'frame', args: [frame] }];
  return { status: 'mapped', language: `.frame({ ${Object.keys(frame)[0]}: '${token}' })`, mods };
}

/** The faces `.font()` takes beside a size (`mono`, `display`). */
const FONT_FAMILY = new Set(spec.enums.fontFamily);
/** The modifiers a `when()` variant can change; any other is left out of it. */
const VARIES = new Set(spec.variants.modifiers);
/** Conditions that hold, or not, as the view renders: a platform. */
const HELD = new Set(['web', 'native', 'ios', 'android']);
/** The placement modifiers (render.tsx, PLACE_KINDS): a held variant leaves them out too. */
const PLACEMENT = new Set(['accessibilityOnly']);
/**
 * Whether a variant under a condition that holds as the view renders (a
 * platform, the app's own boolean) changes `mod`: one a variant varies, or
 * anything but a box layer or a placement, which is then the chain's own
 * (render.tsx, `heldAsOwn`).
 */
export function heldVariantChanges(mod: Mod): boolean {
  return VARIES.has(mod.name) || (!LAYER.has(mod.name) && !PLACEMENT.has(mod.name));
}
/** Utilities NativeWind draws on the web only: `tabular-nums` sets a variable alone on native. */
const WEB_ONLY = new Set(['tabular-nums']);
const TEXT_ONLY = new Set(spec.nodes.text?.modifiers ?? []);
const STACK_ONLY = new Set(spec.nodes.stack?.modifiers ?? []);

/** Ramp steps with a tracking of their own, which a Tailwind text size does not write. */
const TRACKED = new Set(
  Object.entries(spec.typeRamp)
    .filter(([, v]) => Array.isArray(v) && v[2] !== 0)
    .map(([k]) => k.replace(/-(regular|medium|semibold|bold)$/, '')),
);

/**
 * Table mappings the parity corpus measured drawing otherwise, each with what
 * differs. They stay JSX until the language or the table changes.
 */
function measuredDifference(utility: string, mods: readonly Mod[]): string | undefined {
  const font = mods.find((m) => m.name === 'font');
  if (font && /^text-/.test(utility) && TRACKED.has(font.args[0] as string))
    return `.font('${font.args[0]}') brings the ramp’s letter spacing, which ${utility} does not write`;
  return undefined;
}

/** A text's size in points from its `.font()` token, if the chain says one. */
function fontSizeOf(token: string): number | undefined {
  const size = spec.scales.fontSize?.[token];
  if (typeof size === 'number') return size;
  const step = spec.typeRamp[`${token}-regular`];
  return Array.isArray(step) ? step[0] : undefined;
}

/**
 * A leading or tracking that is a ratio of the size measures, in the language,
 * from the element's own size (Bloom's `Text` default when it sets none); the
 * class measures from the size it inherits. Where the element sets no size the
 * class stays JSX.
 */
function unsized(mods: readonly Mod[]): string | undefined {
  if (mods.some((m) => m.name === 'font' && fontSizeOf(m.args[0] as string) !== undefined))
    return undefined;
  for (const mod of mods) {
    const token = mod.args[0] as string;
    const ratio =
      mod.name === 'leading'
        ? spec.scales.leading?.[token]
        : mod.name === 'tracking'
          ? (spec.scales.tracking?.[token] ??
            (/^-?[\d.]+em$/.test(token) ? Number(token.slice(0, -2)) : undefined))
          : undefined;
    if (typeof ratio === 'number')
      return `.${mod.name}('${token}') measures from a size this element does not set`;
  }
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

/** Utilities on one physical side the language has no physical form for yet: scroll snapping, a reversed child spacing. */
const PHYSICAL = /^-?(scroll-[mp][lr]|space-x-reverse)(-|$)/;

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

/** The corners a `corner()` side rounds: `t`/`b` and `s`/`e` (reading direction) or `l`/`r` (physical). */
const CORNERS: Record<string, string[]> = {
  top: ['ts', 'te'],
  bottom: ['bs', 'be'],
  leading: ['ts', 'bs'],
  trailing: ['te', 'be'],
  'top-leading': ['ts'],
  'top-trailing': ['te'],
  'bottom-leading': ['bs'],
  'bottom-trailing': ['be'],
  left: ['tl', 'bl'],
  right: ['tr', 'br'],
  'top-left': ['tl'],
  'top-right': ['tr'],
  'bottom-left': ['bl'],
  'bottom-right': ['br'],
};

/** Whether two corner sides round one corner: a physical corner meets either reading-direction one of its row right to left. */
export function cornersMeet(a: string, b: string): boolean {
  const x = CORNERS[a] ?? [];
  const y = CORNERS[b] ?? [];
  return x.some((p) =>
    y.some(
      (q) =>
        p === q || (p[0] === q[0] && /[se]/.test(p[1] as string) !== /[se]/.test(q[1] as string)),
    ),
  );
}

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
  /**
   * Modifiers a `style` writes that no utility does (React Native's `flex: 1`
   * as `.grow()`, a theme colour as its role), by the style key: they join the
   * classes' modifiers, so a class setting the same thing is a conflict.
   */
  readonly styleMods?: readonly { readonly subject: string; readonly mod: Mod }[];
  /** The classes a `style` was read as (`gap: 12` is `gap-3`): inline, so no variant overrides them. */
  readonly styleClasses?: ReadonlySet<string>;
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

  const tokens = className.split(/\s+/).filter(Boolean);
  const sticky = stickyOf(tokens);
  if (sticky !== undefined) {
    const into = group([]);
    const mod: Mod = { name: 'sticky', args: [sticky.edge] };
    into.mods.push(mod);
    into.subjects.set(mod, sticky.tokens.join(' '));
  }
  for (const token of tokens) {
    if (sticky?.tokens.includes(token)) continue;
    if (splitVariants(token).utility === 'sticky') {
      fail(
        token,
        'sticky',
        'a sticky position held at no edge but `top-0` or `bottom-0` of the same variant (web only)',
      );
      continue;
    }
    const { variants, utility: rawUtility } = splitVariants(token);
    if (rawUtility.startsWith('!') || rawUtility.endsWith('!')) {
      fail(token, 'important', 'an !important utility outranks every other rule');
      continue;
    }
    // NativeWind draws these on the web only (on native their rule sets a variable alone).
    const conditions: string[] = WEB_ONLY.has(rawUtility) ? ['web'] : [];
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
    const entry = table.utilities.get(utility) ?? frameStep(utility);
    if (!entry) {
      fail(token, 'unknown', 'not in the className table');
      continue;
    }
    const different = measuredDifference(utility, entry.mods ?? []);
    if (different) {
      fail(token, 'measured-difference', different);
      continue;
    }
    // Under a condition that holds as the view renders, what no variant changes is the
    // chain's own, but a box layer or a placement (render.tsx, heldAsOwn).
    const held = conditions.every((c) => HELD.has(c));
    const fixed =
      conditions.length > 0
        ? entry.mods?.find(
            (m) => !VARIES.has(m.name) && (!held || LAYER.has(m.name) || PLACEMENT.has(m.name)),
          )
        : undefined;
    if (fixed) {
      fail(
        token,
        'not-varied',
        `a when() variant cannot change .${fixed.name}() (spec \`variants\`)`,
      );
      continue;
    }
    const into = group(conditions);
    switch (entry.status) {
      case 'mapped': {
        if (entry.mods) {
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
  for (const { subject, mod } of options.styleMods ?? []) {
    const into = group([]);
    into.mods.push(mod);
    into.subjects.set(mod, subject);
  }
  if (reasons.length > 0) return { ok: false, reasons };

  const resolved: Variant[] = [];
  for (const [key, g] of groups) {
    const mods = finish(g, kind, fail);
    resolved.push({ conditions: key ? key.split(':') : [], mods });
  }
  // A style is inline, so a class's variant never overrides it, where the language's would.
  const inline = new Set([
    ...(options.styleClasses ?? []),
    ...(options.styleMods ?? []).map((s) => s.subject),
  ]);
  const unconditional = groups.get('');
  for (const mod of unconditional?.mods ?? []) {
    const subject = unconditional?.subjects.get(mod) ?? '';
    if (!inline.has(subject)) continue;
    // A variant the style writes itself (a Pressable's pressed style) is inline too, and wins as the JSX's does.
    for (const [key, g] of groups)
      if (key && g.mods.some((m) => m.name === mod.name && !inline.has(g.subjects.get(m) ?? '')))
        fail(
          subject,
          'style-variant',
          `a style a variant of the className sets too (.${mod.name}()): inline, the style wins`,
        );
  }
  if (reasons.length > 0) return { ok: false, reasons };
  const base = resolved.find((v) => v.conditions.length === 0)?.mods ?? [];
  const variants = resolved
    .filter((v) => v.conditions.length > 0)
    .sort((a, b) => rank(a.conditions) - rank(b.conditions));
  return { ok: true, value: { axis, mods: base, variants } };
}

/**
 * `sticky` with `top-0` or `bottom-0`, both bare or both `web:`: the
 * language's `.sticky(edge)`, which is the web's alone (NativeWind draws no
 * sticky position natively, and a relative view's zero inset moves nothing),
 * so the `web:` its classes are written under is the modifier's own.
 */
function stickyOf(
  tokens: readonly string[],
): { readonly edge: 'top' | 'bottom'; readonly tokens: readonly string[] } | undefined {
  for (const prefix of ['', 'web:']) {
    if (!tokens.includes(`${prefix}sticky`)) continue;
    const edges = (['top', 'bottom'] as const).filter((edge) =>
      tokens.includes(`${prefix}${edge}-0`),
    );
    if (edges.length !== 1) return undefined;
    const edge = edges[0] as 'top' | 'bottom';
    return { edge, tokens: [`${prefix}sticky`, `${prefix}${edge}-0`] };
  }
  return undefined;
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

  // Two corners of one corner: which wins is Tailwind's rule order on the web and
  // React Native's own precedence on native. (A corner of all sides is `borderRadius`,
  // which a corner of some sides overrides everywhere.)
  const sided = mods.filter((m) => m.name === 'corner' && m.args.length === 2);
  sided.forEach((mod, i) => {
    const prior = sided
      .slice(0, i)
      .find((p) => cornersMeet(p.args[1] as string, mod.args[1] as string));
    if (prior)
      fail(`${subject(prior)} ${subject(mod)}`, 'corner-overlap', 'two corners of one corner');
  });

  // Any other modifier twice is decided by Tailwind's rule order. (A safe-area padding is one per side, from its style key;
  // a face, `.font('mono')`, and a size, `.font('96')`, are two things a text keeps both of.)
  const seen = new Map<string, Mod>();
  for (const mod of mods) {
    if (['padding', 'margin', 'border', 'corner', 'when', 'safeAreaPadding'].includes(mod.name))
      continue;
    const key =
      mod.name === 'font' && FONT_FAMILY.has(mod.args[0] as string) ? 'font family' : mod.name;
    const prior = seen.get(key);
    if (prior)
      fail(`${subject(prior)} ${subject(mod)}`, 'conflict', `two classes set .${mod.name}()`);
    seen.set(key, mod);
  }

  const measuredFrom = kind === 'text' ? unsized(mods) : undefined;
  if (measuredFrom)
    fail(
      mods
        .filter((m) => m.name === 'leading' || m.name === 'tracking')
        .map(subject)
        .join(' '),
      'unsized-ratio',
      measuredFrom,
    );

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
  // A key's token, or points computed at render (`{ width: itemSize }`).
  const out: Record<string, string | PointsArg> = {};
  for (const mod of list) {
    const value = mod.args[0];
    if (typeof value !== 'object' || isPoints(value) || mod.args.length !== 1) {
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
