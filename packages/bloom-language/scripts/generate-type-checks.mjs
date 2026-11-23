#!/usr/bin/env node
/**
 * Writes `src/__tests__/node-tokens.types.generated.test.ts`: a type-level
 * check, for every node kind, that each modifier whose parameter the spec
 * names a token set takes exactly that set, so an editor completes a node's
 * own tokens and nothing else.
 *
 * Each node's view type is its first constructor's return type
 * (`ReturnType<typeof Button>`), so every kind is covered without a list.
 * For each parameter the check holds that it is not `any` or `unknown`, takes
 * no free number, and that its strings are exactly the set's tokens (the names
 * the compiler checks a written-out token against, `token-sets.mjs`). Where the
 * runtime also takes an app's own token there (`defineTokens`), the check holds
 * that the parameter takes it.
 *
 * The universal modifiers are checked once, on `ViewModifiers`, and each node
 * that takes them is held to that very declaration (it redeclares none); a
 * node's own modifiers are checked on the node.
 *
 * `--check` writes nothing and fails when the committed file differs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tokenSetsOf, withoutComment } from './token-sets.mjs';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(packageRoot, 'src/__tests__/node-tokens.types.generated.test.ts');
const spec = JSON.parse(readFileSync(join(packageRoot, 'spec/language.json'), 'utf8'));
const check = process.argv.includes('--check');

const tokenSets = tokenSetsOf(spec);
const nodes = withoutComment(spec.nodes);
const modifiers = withoutComment(spec.modifiers);
const universal = new Set(spec.universal);

/**
 * A set as its parameter type's strings, where the runtime reads more than the
 * names alone. A colour is a role or a role at an opacity (`'muted/70'`,
 * `style.ts` `role()`); a ring is a colour or `none` (it paints through
 * `ink()`, as a border does).
 */
const SET_TYPE = {
  color: 'Color',
  ring: "Color | S['ringExtra']",
};

/** The app token scale (`defineTokens`) a set's parameter also takes, where the runtime resolves one. */
const APP_TOKEN = {
  space: "AppToken<'space'>",
  padding: "AppToken<'space'>",
  length: "AppToken<'space'>",
  columnWidth: "AppToken<'space'>",
  iconSize: "AppToken<'iconSize'>",
  avatarSize: "AppToken<'avatarSize'>",
  leading: "AppToken<'leading'>",
  motion: 'MotionSpec',
  timedMotion: 'SurfaceTransition',
};
/**
 * The universal colour modifiers paint through `ink()`, which takes an app's
 * colour; a node's own colour props are painted from roles only
 * (`ControlDraw.painted`), so only these are held to take one.
 */
const UNIVERSAL_APP_COLOR = "AppToken<'color'>";

/**
 * A node whose own modifier takes less than the spec's set for that
 * modifier's name. The spec names one set per modifier name; these nodes
 * hand the value to a Bloom prop that takes fewer (the compiler, which
 * reads the spec's set, accepts the rest). Each entry is the exact type the
 * node takes, so a change to it is deliberate. `'never'` is a modifier whose
 * parameter is no token on that node (a `boolean`, a view).
 */
const NARROWER = {
  // Painted by role name alone (`propPaint`, the theme's paint by role): no opacity, no app colour.
  'image.tint.0': "S['color']",
  'divider.tint.0': "S['color']",
  'option.tint.0': "S['color']",
  'option.foreground.0': "S['color']",
  // Bloom `Dialog`'s `contentPadding`: an inset, never outward, on every side.
  'dialog.padding.0': 'never',
  'dialog.padding.1': "S['space']",
  // Each separator its own component draws.
  'groupedSection.separator.0': "S['groupedSeparator']",
  'list.separator.0': "S['listSeparator']",
  // Resolved as a space (`resolveSpace`): no `fit`, no relative length.
  'rail.width.0': "S['space']",
  'panel.width.0': "S['space']",
  'settingsSelect.width.0': "S['space']",
  'carouselItem.width.0': "S['space']",
  'dataColumn.basis.0': "S['space']",
  // A radius in points (`resolveCorner`): `concentric` has none.
  'meter.barCorner.0': "Exclude<S['corner'], 'concentric'>",
  'gallery.mediaCorner.0': "Exclude<S['corner'], 'concentric'>",
  'mediaInsetBorder.mediaCorner.0': "Exclude<S['corner'], 'concentric'>",
  // The Bloom component's own alignments.
  'divider.align.0': "'start' | 'center' | 'end'",
  'tableColumn.align.0': "'start' | 'center' | 'end'",
  'tableCell.align.0': "'start' | 'center' | 'end'",
  'dataColumn.align.0': "'start' | 'center' | 'end'",
  'hoverCard.align.0': "'start' | 'center' | 'end'",
  'carousel.align.0': "'start' | 'center'",
  'mapControls.align.0': "'start' | 'end'",
  'tooltip.side.0': "'top' | 'bottom'",
  'tooltip.side.1': 'never',
  'hoverCard.side.0': "'top' | 'bottom'",
  'hoverCard.side.1': 'never',
  'mediaFlightHost.contentFit.0': "'contain' | 'cover'",
  'mediaSurface.contentFit.0': "'contain' | 'cover'",
  'mediaPoster.contentFit.0': "'contain' | 'cover'",
  'bottomSheet.material.0': "S['sheetMaterial']",
  'settings.presentation.0': "'floating' | 'bar'",
  // A list refreshes with the platform's own indicator: no tint.
  'virtualList.refreshable.1': 'never',
  // No token on these nodes: a view, or whether to draw a surface at all.
  'accordionTrigger.indicator.0': 'never',
  'reactionPicker.surface.0': 'never',
  'composerPill.surface.0': 'never',
  'aiChatShell.surface.0': 'never',
  'aiChatContainer.surface.0': 'never',
  'composerLoader.surface.0': 'never',
  'agentChatHistory.surface.0': 'never',
};

const lit = (names) => names.map((name) => JSON.stringify(name)).join(' | ') || 'never';

/** The expected type of a parameter, or undefined when the parameter is no token set. */
function expected(node, param) {
  if (param === 'density') return lit(node.densities ?? []);
  let set = param;
  if (['size', 'tint', 'style', 'shape'].includes(param)) set = node[param];
  if (param === 'blend') set = node.blend ?? 'blend';
  if (set === undefined || tokenSets[set] === undefined) return undefined;
  return { type: SET_TYPE[set] ?? `S['${set}']`, set };
}

/** The checks of one modifier's parameters, on view type `view`. */
function checksOf(kind, node, view, name, inUniversal) {
  const params = modifiers[name] ?? [];
  // `padding(edge?, value)`: the optional comes first, so the value is each overload's last parameter.
  const leadingOptional = params.length > 1 && params[0].endsWith('?');
  const lines = [];
  params.forEach((raw, index) => {
    const param = raw.replace(/\?$/, '');
    const key = `${kind}.${name}.${index}`;
    let want = expected(node, param);
    if (want === undefined && !(key in NARROWER)) return;
    if (typeof want === 'string') want = { type: want };
    const at = leadingOptional
      ? index === params.length - 1
        ? `Last<${view}['${name}']>`
        : `Lead<${view}['${name}']>`
      : `At<${view}['${name}'], '${index}'>`;
    const label = `${kind === '' ? '' : `${kind}.`}${name}(${param}${want?.set && want.set !== param ? `: ${want.set}` : ''})`;
    if (key in NARROWER) {
      lines.push(`  Expect<${JSON.stringify(label)}, Ok<${at}, ${NARROWER[key]}>>,`);
      return;
    }
    lines.push(`  Expect<${JSON.stringify(label)}, Ok<${at}, ${want.type}>>,`);
    const app =
      APP_TOKEN[want.set] ??
      (inUniversal && (want.set === 'color' || want.set === 'ring') ? UNIVERSAL_APP_COLOR : undefined);
    if (app !== undefined) lines.push(`  Expect<${JSON.stringify(`${label} takes ${app}`)}, Takes<${at}, ${app}>>,`);
  });
  return lines;
}

const sets = Object.entries(tokenSets)
  .map(([name, names]) => `  ${JSON.stringify(name)}: ${lit(names)};`)
  .join('\n');

const universalChecks = [];
for (const name of spec.universal) {
  universalChecks.push(...checksOf('', {}, 'Any', name, true));
}

const blocks = [];
for (const [kind, node] of Object.entries(nodes)) {
  const ctor = node.constructors[0];
  if (ctor === undefined) continue;
  const view = `View<'${ctor}'>`;
  const lines = [];
  if (node.universal !== false) {
    // A universal modifier the node lists as its own is its own declaration, checked below.
    const own = node.modifiers.filter((name) => universal.has(name));
    lines.push(
      `  Expect<'${kind}: the universal modifiers', Universal<${view}${own.length > 0 ? `, ${lit(own)}` : ''}>>,`,
    );
  }
  for (const name of node.modifiers) lines.push(...checksOf(kind, node, view, name, universal.has(name)));
  if (lines.length > 0) blocks.push(`type ${kind}Checks = [\n${lines.join('\n')}\n];`);
}

const text = `// GENERATED by packages/bloom-language/scripts/generate-type-checks.mjs from spec/language.json. Do not edit.
/* eslint-disable */
/**
 * Every node's token parameters are exactly the spec's sets: tsc fails here
 * when a node's modifier takes a token it should not (or misses one), is
 * \`any\`, \`unknown\` or a bare string or number, so an editor's completions
 * are each node's own tokens.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import type { MotionSpec, SurfaceTransition } from '@oxy.so/bloom/motion';

import type * as Language from '../index';
import type { ViewModifiers, ViewNode } from '../node';
import type * as Router from '../router';
import type { AppToken } from '../tokens';

/** Each token set's names, as the compiler checks a written-out token. */
type S = {
${sets}
};
/** A colour: a role, or a role at an opacity. */
type Color = S['color'] | \`\${S['color']}/\${S['opacity']}\`;

type Ctor<C extends string> = C extends keyof typeof Language
  ? (typeof Language)[C]
  : C extends keyof typeof Router
    ? (typeof Router)[C]
    : never;
/** A node's view: what its constructor returns. */
type View<C extends string> = Ctor<C> extends (...args: never[]) => infer V ? V : never;
type Any = ViewModifiers<unknown>;

/** A method's parameter lists, one per overload (a modifier has at most two). */
type Signatures<F> = F extends {
  (...args: infer A): unknown;
  (...args: infer B): unknown;
}
  ? A | B
  : never;
/** The parameter at \`I\` in every overload that has one. */
type At<F, I extends string> = Exclude<
  Signatures<F> extends infer T ? (T extends readonly unknown[] ? (I extends keyof T ? T[I] : never) : never) : never,
  undefined
>;
/** Each overload's last parameter. */
type Last<F> = Signatures<F> extends infer T ? (T extends readonly [...unknown[], infer L] ? L : never) : never;
/** The first parameter of each two-parameter overload. */
type Lead<F> = Signatures<F> extends infer T ? (T extends readonly [infer E, unknown] ? E : never) : never;

type IsAny<T> = 0 extends 1 & T ? true : false;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Identical<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
/** A token parameter: not \`any\` or \`unknown\`, no free number, its strings exactly \`E\`. */
type Ok<P, E> = IsAny<P> extends true
  ? false
  : unknown extends P
    ? false
    : [Extract<P, number>] extends [never]
      ? Same<Extract<P, string>, E>
      : false;
type Takes<P, A> = [A] extends [P] ? true : false;
/** A node takes the universal modifiers as \`ViewModifiers\` declares them (but those it lists as its own, checked on their own), narrowing none. */
type UniversalName = Exclude<keyof Any, keyof ViewNode>;
type Universal<V, Own extends string = never> = Identical<
  Pick<V, Exclude<UniversalName, Own> & keyof V>,
  Pick<ViewModifiers<V>, Exclude<UniversalName, Own>>
>;
/** A check: tsc names the label of one that fails. */
type Expect<_Label extends string, T extends true> = T;

type UniversalChecks = [
${universalChecks.join('\n')}
];

${blocks.join('\n\n')}

describe('node token types', () => {
  it('are current with the spec (the checks above are tsc’s)', () => {
    const script = join(__dirname, '../../scripts/generate-type-checks.mjs');
    expect(() => execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});
`;

if (check) {
  let current = '';
  try {
    current = readFileSync(output, 'utf8');
  } catch {}
  if (current !== text) {
    console.error(`stale: ${output} (run: bun run generate in packages/bloom-language)`);
    process.exit(1);
  }
  console.log('node token type checks are current');
} else {
  writeFileSync(output, text);
  console.log(`wrote ${output}`);
}
