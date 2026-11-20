import type { Modifier } from './node';
import type { TextTraits } from './style';

/**
 * The environment a view hands its descendants: the text and icon traits
 * (`foreground`, `font`, `weight`, `leading`) set above it, as SwiftUI's
 * environment carries `.font` and `.foregroundStyle` down.
 *
 * Environments are interned: the same parent and the same modifiers always
 * give the same object, so a memoized `view()` below sees an unchanged `env`
 * prop on every re-render, and the style caches key on `key`.
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
