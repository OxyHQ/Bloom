/**
 * Bloom components the language draws as a node of its own, mapped prop by
 * prop as the language's parity cases pair them
 * (`packages/bloom-language/parity/*.cases.tsx`). A prop not listed keeps the
 * element JSX. A rule applies only where the language exports its node.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LANGUAGE_PACKAGE } from './table';

export interface ComponentRule {
  /** The language constructor. */
  readonly node: string;
  /** Its first argument: a `Binding` of a value prop and its setter. */
  readonly binding?: readonly [value: string, set: string];
  /** Props whose static string is a modifier's token. */
  readonly tokens?: Readonly<Record<string, string>>;
  /** Boolean props, as a modifier with no argument (or the value when given one). */
  readonly flags?: Readonly<Record<string, string>>;
  /** Props carried as they are (a string, a handler). */
  readonly values?: Readonly<Record<string, string>>;
}

/** `module#export` to its rule. */
export const COMPONENT_RULES: Readonly<Record<string, ComponentRule>> = {
  // parity/inputs.cases.tsx, Toggle (Switch).
  '@oxy.so/bloom/switch#Switch': {
    node: 'Toggle',
    binding: ['checked', 'onCheckedChange'],
    tokens: { size: 'size', tone: 'tint' },
    flags: { disabled: 'disabled' },
    values: { accessibilityLabel: 'label', testID: 'testID' },
  },
};

const exported = readFileSync(join(LANGUAGE_PACKAGE, 'src/index.ts'), 'utf8');

/** The rule for a Bloom component, when the checked-out language draws its node. */
export function ruleFor(module: string, imported: string): ComponentRule | undefined {
  const rule = COMPONENT_RULES[`${module}#${imported}`];
  return rule && new RegExp(`\\b${rule.node}\\b`).test(exported) ? rule : undefined;
}
