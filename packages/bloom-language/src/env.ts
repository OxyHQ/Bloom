import { createContext } from 'react';

import type { Modifier } from './node';
import type { TextTraits } from './style';

/**
 * The environment a view hands its descendants: the text and icon traits
 * (`foreground`, `font`, `weight`, `leading`) set above it, as SwiftUI's
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
}

export const ROOT_ENV: Env = {
  key: '',
  text: { foreground: undefined, font: undefined, weight: undefined, leading: undefined },
  derived: new Map(),
};

export const EnvContext = createContext<Env>(ROOT_ENV);
EnvContext.displayName = 'BloomEnvironment';

type EnvModifier = Extract<Modifier, { kind: 'foreground' | 'font' | 'weight' | 'leading' }>;

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
        text.font = modifier.value;
        break;
      case 'weight':
        text.weight = modifier.value;
        break;
      case 'leading':
        text.leading = modifier.value;
        break;
    }
  }
  env = {
    key: `${parent.key}${key}`,
    text: Object.freeze(text) as TextTraits,
    derived: new Map(),
  };
  parent.derived.set(key, env);
  return env;
}
