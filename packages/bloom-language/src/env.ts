import { createContext } from 'react';

import type { Modifier } from './node';
import type { TextTraits } from './style';
import { isFontFamily } from './tokens';
import type { LiveCondition, Planned } from './variants';

/**
 * The environment a view hands its descendants: the text and icon traits
 * (`foreground`, `font`, `weight`, `leading`, `tracking`) set above it, as SwiftUI's
 * environment carries `.font` and `.foregroundStyle` down.
 *
 * Inside one render pass it travels with the renderer's context; across a
 * `view()` boundary it travels through `EnvContext`, provided only where an
 * environment modifier changed it, so views under an unchanged environment
 * add no provider.
 *
 * Environments are interned: the same parent and the same modifiers always
 * give the same object, so a provider's value and the render memo compare
 * by identity, and the style caches key on `key`.
 */
export interface Env {
  readonly key: string;
  readonly text: TextTraits;
  readonly derived: Map<string, Env>;
  /**
   * Where a `navigate()` press goes: the navigator of the router `layout()` or
   * `screen()` the view is drawn in (a deck panel's own, on the web). Absent
   * outside one.
   */
  readonly navigate: Navigate | undefined;
}

export type Navigate = (
  href: string,
  params: Readonly<Record<string, string | number>> | undefined,
) => void;

export const ROOT_ENV: Env = {
  key: '',
  text: {
    foreground: undefined,
    font: undefined,
    family: undefined,
    weight: undefined,
    leading: undefined,
    tracking: undefined,
  },
  derived: new Map(),
  navigate: undefined,
};

/** The root environment of a navigator: the same traits as the root, presses that go through `navigate`. */
export function navigatorEnv(navigate: Navigate): Env {
  return { ...ROOT_ENV, derived: new Map(), navigate };
}

export const EnvContext = createContext<Env>(ROOT_ENV);
EnvContext.displayName = 'BloomEnvironment';

type EnvModifier = Extract<
  Modifier,
  { kind: 'foreground' | 'font' | 'weight' | 'leading' | 'tracking' }
>;

function applyTrait(text: Partial<TextTraits>, modifier: EnvModifier): void {
  switch (modifier.kind) {
    case 'foreground':
      text.foreground = modifier.value;
      break;
    case 'font':
      // A family (`mono`) sets the face and keeps the size; a size keeps the face.
      if (isFontFamily(modifier.value)) text.family = modifier.value;
      else text.font = modifier.value;
      break;
    case 'weight':
      text.weight = modifier.value;
      break;
    case 'leading':
      text.leading = modifier.value;
      break;
    case 'tracking':
      text.tracking = modifier.value;
      break;
  }
}

/**
 * The environment under `modifiers`, and under `variants` (the traits a
 * `when()` changes: one that holds is a trait like any other; a live one is
 * kept beside the traits, for the text that draws them).
 */
export function deriveEnv(
  parent: Env,
  modifiers: readonly Modifier[],
  variants: readonly (readonly [Planned, Modifier])[] = [],
): Env {
  let key = '';
  for (const modifier of modifiers) key += `;${modifier.key}`;
  for (const [condition, modifier] of variants) key += `;?${condition ?? ''}${modifier.key}`;
  let env = parent.derived.get(key);
  if (env) return env;
  const text: TextTraits = { ...parent.text };
  const own: Partial<TextTraits> = {};
  for (const modifier of modifiers as readonly EnvModifier[]) applyTrait(own, modifier);
  Object.assign(text, own);
  // A trait set here is the view's own: what a variant above said of it no longer reaches in.
  const live: (readonly [LiveCondition, Partial<TextTraits>])[] = [];
  for (const [condition, changed] of parent.text.variants ?? []) {
    const kept = Object.fromEntries(Object.entries(changed).filter(([trait]) => !(trait in own)));
    if (Object.keys(kept).length > 0) live.push([condition, kept]);
  }
  for (const [condition, modifier] of variants) {
    if (condition === null) {
      applyTrait(text, modifier as EnvModifier);
      continue;
    }
    const changed: Partial<TextTraits> = {};
    applyTrait(changed, modifier as EnvModifier);
    live.push([condition, changed]);
  }
  text.variants = live.length > 0 ? live : undefined;
  env = {
    key: `${parent.key}${key}`,
    text: Object.freeze(text) as TextTraits,
    derived: new Map(),
    navigate: parent.navigate,
  };
  parent.derived.set(key, env);
  return env;
}
