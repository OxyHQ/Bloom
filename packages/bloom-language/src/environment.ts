import { useContext } from 'react';

import { type Env, EnvContext, type EnvironmentValue } from './env';
import { ENVIRONMENT_TAKERS } from './generated/spec.generated';
import type { Modifier, NodeKind } from './node';
import type { ButtonStyle, ControlSize } from './tokens';

export type { EnvironmentValue };

/** A literal type widened to its kind (`false` to `boolean`), as an app's value varies. */
type Widen<T> = T extends boolean
  ? boolean
  : T extends string
    ? string
    : T extends number
      ? number
      : T;

/**
 * A value a view sets on everything inside it (SwiftUI's `EnvironmentValues`
 * entry): its name, and what it is where nothing above sets it.
 */
export class EnvironmentKey<T extends EnvironmentValue> {
  constructor(
    readonly name: string,
    readonly defaultValue: T,
  ) {
    Object.freeze(this);
  }
}

/** The built-in values, set by `.disabled()`, `.controlSize()` and `.buttonStyle()`. */
export const environmentValues = Object.freeze({
  /** Set by `.disabled()`: every control inside takes no input. */
  disabled: new EnvironmentKey<boolean>('disabled', false),
  /** Set by `.controlSize()`: the size every control inside takes when it names none. */
  controlSize: new EnvironmentKey<ControlSize | undefined>('controlSize', undefined),
  /** Set by `.buttonStyle()`: the style every `Button` inside takes when it names none. */
  buttonStyle: new EnvironmentKey<ButtonStyle | undefined>('buttonStyle', undefined),
});

/**
 * An app's own environment value (SwiftUI's `@Entry`): a name, and the value
 * where nothing sets it. A view sets it on everything inside with
 * `.environment(key, value)`, and a `view()` body reads it with
 * `useEnvironment(key)`. The name is the value's identity, so define each
 * once, at module scope.
 *
 * ```ts
 * export const Compact = defineEnvironment('compact', false);
 * FeedRow({ post }).environment(Compact, true);
 * const compact = useEnvironment(Compact);
 * ```
 */
export function defineEnvironment<T extends EnvironmentValue>(
  name: string,
  defaultValue: T,
): EnvironmentKey<Widen<T>> {
  if (name in environmentValues)
    throw new Error(`[Bloom language] '${name}' is a built-in environment value: use .${name}().`);
  return new EnvironmentKey(name, defaultValue as Widen<T>);
}

/** The value of `key` where the calling `view()` body is drawn: one context read. */
export function useEnvironment<T extends EnvironmentValue>(key: EnvironmentKey<T>): T {
  return readEnvironment(useContext(EnvContext), key);
}

/** The value of `key` in `env`, else its default. */
export function readEnvironment<T extends EnvironmentValue>(env: Env, key: EnvironmentKey<T>): T {
  return env.values.has(key.name) ? (env.values.get(key.name) as T) : key.defaultValue;
}

const takers = new Map(
  Object.entries(ENVIRONMENT_TAKERS).map(([name, { own, kinds }]) => [
    name,
    { own, kinds: new Set<string>(kinds) },
  ]),
);

const NONE: readonly Modifier[] = Object.freeze([]);

/**
 * The modifiers a node of `kind` takes from the built-in values set above it
 * (`disabled`, `controlSize`, `buttonStyle`), as if chained first: a value the
 * node's own chain names comes later and wins. Built once per environment and
 * kind.
 */
export function inheritedModifiers(kind: NodeKind, env: Env): readonly Modifier[] {
  if (env.values.size === 0) return NONE;
  let inherited = env.inherited.get(kind);
  if (inherited !== undefined) return inherited;
  const modifiers: Modifier[] = [];
  for (const [name, value] of env.values) {
    const taker = takers.get(name);
    if (taker === undefined || value === undefined || !taker.kinds.has(kind)) continue;
    modifiers.push({ kind: taker.own, key: `${taker.own}:${String(value)}`, value } as Modifier);
  }
  inherited = modifiers.length === 0 ? NONE : Object.freeze(modifiers);
  env.inherited.set(kind, inherited);
  return inherited;
}
