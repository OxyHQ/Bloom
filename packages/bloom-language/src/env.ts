import { createContext } from 'react';

import type { Modifier } from './node';
import type { TextTraits } from './style';
import { isFontFamily } from './tokens';

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

export function deriveEnv(parent: Env, modifiers: readonly Modifier[]): Env {
  let key = '';
  for (const modifier of modifiers) key += `;${modifier.key}`;
  let env = parent.derived.get(key);
  if (env) return env;
  const text: TextTraits = { ...parent.text };
  for (const modifier of modifiers as readonly EnvModifier[]) {
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
  env = {
    key: `${parent.key}${key}`,
    text: Object.freeze(text) as TextTraits,
    derived: new Map(),
    navigate: parent.navigate,
  };
  parent.derived.set(key, env);
  return env;
}
