#!/usr/bin/env node
/**
 * Writes, from the spec, the two sides of one contract: what each node's
 * token parameters take.
 *
 * - `src/__tests__/node-tokens.types.generated.test.ts`: a type-level check,
 *   for every node kind, that each modifier whose parameter the spec names a
 *   token set takes exactly that set, so an editor completes a node's own
 *   tokens and nothing else;
 * - `../bloom-language-compiler/crates/compiler/src/token_params.generated.rs`:
 *   the same parameters as a table the compiler's tests probe, so the compiler
 *   accepts exactly the literals the runtime's types take (`cargo test`).
 *
 * Each node's view type is its first constructor's return type
 * (`ReturnType<typeof Button>`), so every kind is covered without a list.
 * A node's parameters are its own (`params`) where it takes a modifier
 * narrower than the modifier's, else the modifier's (`paramsOf`). For each
 * parameter the check holds that it is not `any` or `unknown`, takes no free
 * number, and that its strings are exactly the set's tokens (the names the
 * compiler checks a written-out token against, `token-sets.mjs`). Where the
 * runtime also takes an app's own token there (`defineTokens`), the check
 * holds that the parameter takes it. A node's own parameters are held to
 * their arity too.
 *
 * The universal modifiers are checked once, on `ViewModifiers`, and each node
 * that takes them is held to that very declaration (it redeclares none); a
 * node's own modifiers are checked on the node. A glass value's methods
 * (`regular.tint()`) are checked on `GlassValue`.
 *
 * `--check` writes nothing and fails when a committed file differs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NO_TOKEN, paramsOf, tokenSetsOf, withoutComment } from './token-sets.mjs';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(packageRoot, 'src/__tests__/node-tokens.types.generated.test.ts');
const table = join(
  packageRoot,
  '../bloom-language-compiler/crates/compiler/src/token_params.generated.rs',
);
const spec = JSON.parse(readFileSync(join(packageRoot, 'spec/language.json'), 'utf8'));
const check = process.argv.includes('--check');

const tokenSets = tokenSetsOf(spec);
const nodes = withoutComment(spec.nodes);
const modifiers = withoutComment(spec.modifiers);
const universal = new Set(spec.universal);
const glassValue = withoutComment(spec.glassValue);

/**
 * What a parameter of each set takes, where the runtime reads more than the
 * set's names: a colour is a role or a role at an opacity (`'muted/70'`,
 * `style.ts` `role()`); a ring is a colour or `none` (it paints through
 * `ink()`, as a border does). A node that paints by the role's name alone
 * takes `colorRole`.
 */
const AT_OPACITY = new Set(['color', 'ring']);
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

const lit = (names) => names.map((name) => JSON.stringify(name)).join(' | ') || 'never';

/**
 * What a parameter takes, or undefined when it is no token set (a free value):
 * the sets whose tokens it takes, tokens of its own (a node's densities), and
 * whether a colour role at an opacity is one.
 */
function accepts(node, param) {
  if (NO_TOKEN.includes(param)) return { sets: [], tokens: [], opacity: false };
  if (param === 'density') return { sets: [], tokens: node.densities ?? [], opacity: false };
  let set = param;
  if (['size', 'tint', 'style', 'shape'].includes(param)) set = node[param];
  if (param === 'blend') set = node.blend ?? 'blend';
  if (set === undefined || tokenSets[set] === undefined) return undefined;
  return { set, sets: [set], tokens: [], opacity: AT_OPACITY.has(set) };
}

/** The strings a parameter takes, as a type over `S`. */
function typeOf({ sets, tokens, opacity }) {
  const parts = [
    ...sets.map((set) => `S['${set}']`),
    ...(tokens.length > 0 ? [lit(tokens)] : []),
    ...(opacity ? ['AtOpacity'] : []),
  ];
  return parts.join(' | ') || 'never';
}

/** Where a parameter sits in each overload: \`padding(edge?, value)\` puts the optional first. */
function slot(params, index, at) {
  if (!(params.length > 1 && params[0].endsWith('?'))) return `At<${at}, '${index}'>`;
  return index === params.length - 1 ? `Last<${at}>` : `Lead<${at}>`;
}

/** The argument counts a signature takes: its required parameters, up to all of them. */
function arity(params) {
  const required = params.filter((param) => !param.endsWith('?')).length;
  return Array.from({ length: params.length - required + 1 }, (_, i) => required + i).join(' | ');
}

/** The probes of the compiler's table: one per token parameter, with the call that reaches it. */
const probes = [];

/**
 * The call that puts a literal (\`@\`) at parameter \`index\`, every other
 * argument a free value: an optional parameter is reached by passing the
 * optional ones before it, as the compiler hands arguments out.
 */
function argumentsFor(params, index) {
  const optional = params.flatMap((param, at) => (param.endsWith('?') ? [at] : []));
  const given = new Set(optional.slice(0, optional.indexOf(index) + 1));
  return params
    .flatMap((param, at) =>
      param.endsWith('?') && !given.has(at) ? [] : [at === index ? '@' : 'v'],
    )
    .join(', ');
}

/** The checks of one signature's parameters, at \`member\` (a method's type). */
function checksOf(label, node, params, member, { inUniversal, own, probe }) {
  const lines = [];
  if (own) {
    lines.push(
      `  Expect<${JSON.stringify(`${label} arity`)}, Same<Lengths<${member}>, ${arity(params)}>>,`,
    );
  }
  params.forEach((raw, index) => {
    const param = raw.replace(/\?$/, '');
    const want = accepts(node, param);
    if (want === undefined) return;
    const at = slot(params, index, member);
    const name = `${label}(${param}${want.set && want.set !== param ? `: ${want.set}` : ''})`;
    lines.push(`  Expect<${JSON.stringify(name)}, Ok<${at}, ${typeOf(want)}>>,`);
    probes.push({ label: name, ...probe(argumentsFor(params, index)), ...want });
    const app =
      APP_TOKEN[want.set] ??
      (inUniversal && (want.set === 'color' || want.set === 'ring')
        ? UNIVERSAL_APP_COLOR
        : undefined);
    if (app !== undefined)
      lines.push(`  Expect<${JSON.stringify(`${name} takes ${app}`)}, Takes<${at}, ${app}>>,`);
  });
  return lines;
}

const sets = Object.entries(tokenSets)
  .map(([name, names]) => `  ${JSON.stringify(name)}: ${lit(names)};`)
  .join('\n');

const universalChecks = [];
for (const name of spec.universal) {
  universalChecks.push(
    ...checksOf(name, {}, modifiers[name] ?? [], `Any['${name}']`, {
      inUniversal: true,
      own: false,
      probe: (args) => ({ constructor: 'HStack', call: `HStack().${name}(${args})` }),
    }),
  );
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
  for (const name of node.modifiers)
    lines.push(
      ...checksOf(`${kind}.${name}`, node, paramsOf(spec, node, name), `${view}['${name}']`, {
        inUniversal: universal.has(name),
        own: node.params?.[name] !== undefined,
        probe: (args) => ({ constructor: ctor, call: `${ctor}().${name}(${args})` }),
      }),
    );
  if (lines.length > 0) blocks.push(`type ${kind}Checks = [\n${lines.join('\n')}\n];`);
}

const glassChecks = [];
for (const [name, params] of Object.entries(glassValue)) {
  glassChecks.push(
    ...checksOf(`glass.${name}`, {}, params, `GlassValue['${name}']`, {
      inUniversal: false,
      own: true,
      probe: (args) => ({
        constructor: 'HStack',
        call: `HStack().glass(regular.${name}(${args}))`,
      }),
    }),
  );
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

import type { GlassValue } from '../glass';
import type * as Language from '../index';
import type { ViewModifiers, ViewNode } from '../node';
import type * as Router from '../router';
import type { AppToken } from '../tokens';

/** Each token set's names, as the compiler checks a written-out token. */
type S = {
${sets}
};
/** A colour role at an opacity (\`'muted/70'\`). */
type AtOpacity = \`\${S['color']}/\${S['opacity']}\`;

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
/** How many arguments each overload takes. */
type Lengths<F> = Signatures<F> extends infer T ? (T extends readonly unknown[] ? T['length'] : never) : never;
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

type GlassValueChecks = [
${glassChecks.join('\n')}
];

describe('node token types', () => {
  it('are current with the spec, as is the compiler’s table of them (the checks above are tsc’s)', () => {
    const script = join(__dirname, '../../scripts/generate-type-checks.mjs');
    expect(() => execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});
`;

const rustStr = (value) => JSON.stringify(value);
const rustList = (items) => `&[${items.map(rustStr).join(', ')}]`;
const rust = `//! GENERATED by packages/bloom-language/scripts/generate-type-checks.mjs from spec/language.json. Do not edit.
//!
//! Every token parameter the runtime's types are checked against
//! (\`node-tokens.types.generated.test.ts\`), as a call the compiler's tests
//! probe with every literal: the compiler takes exactly what the types take.

/// One parameter: the call that reaches it (\`@\` the literal, \`v\` any other
/// argument), and what it takes: the tokens of \`sets\`, \`tokens\`, and a
/// colour role at an opacity when \`opacity\`.
pub struct TokenParam {
    pub label: &'static str,
    pub constructor: &'static str,
    pub call: &'static str,
    pub sets: &'static [&'static str],
    pub tokens: &'static [&'static str],
    pub opacity: bool,
}

pub const TOKEN_PARAMS: &[TokenParam] = &[
${probes
  .map(
    (probe) =>
      `    TokenParam { label: ${rustStr(probe.label)}, constructor: ${rustStr(probe.constructor)}, call: ${rustStr(probe.call)}, sets: ${rustList(probe.sets)}, tokens: ${rustList(probe.tokens)}, opacity: ${probe.opacity} },`,
  )
  .join('\n')}
];
`;

const outputs = [
  [output, text],
  [table, rust],
];
let stale = 0;
for (const [path, content] of outputs) {
  if (check) {
    let current = '';
    try {
      current = readFileSync(path, 'utf8');
    } catch {}
    if (current !== content) {
      console.error(`stale: ${path} (run: bun run generate in packages/bloom-language)`);
      stale += 1;
    }
  } else {
    writeFileSync(path, content);
    console.log(`wrote ${path}`);
  }
}
if (stale > 0) process.exit(1);
if (check) console.log('node token type checks are current');
