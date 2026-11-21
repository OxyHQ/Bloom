import { Platform } from 'react-native';

import { VARIANT_MODIFIERS } from './generated/spec.generated';
import type { Condition, Modifier } from './node';

/**
 * Variants (`when(condition, (v) => v…)`): the modifiers inside override the
 * values the chain set before the call, while the condition holds.
 *
 * A condition the render already knows is settled when the view is planned: a
 * platform, and `disabled` (the view's own). The rest are LIVE, answered
 * without running a view body: on the web by CSS (a media query, the scheme's
 * class on the document, the state of the view's outermost box), on native by
 * the leaf that draws each host, from the environment (the window's
 * breakpoint, the theme, the press host's state).
 */

/** A condition that changes while the view is on screen. */
export type LiveCondition = Exclude<Condition, 'disabled' | 'web' | 'native' | 'ios' | 'android'>;

/** A variant as planned: its live condition, or `null` when it holds. */
export type Planned = LiveCondition | null;

/** The order live conditions apply in: a wider breakpoint over a narrower, a state over the scheme, a press over a hover. */
export const LIVE_ORDER: readonly LiveCondition[] = [
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  'dark',
  'hovered',
  'focused',
  'pressed',
];

/** The breakpoint tiers, narrowest first: a breakpoint variant holds from its tier up. */
export const TIERS = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export type Tier = (typeof TIERS)[number];

/** The states a view's outermost box tracks. */
export const STATES: ReadonlySet<LiveCondition> = new Set(['hovered', 'focused', 'pressed']);

const VARIES: ReadonlySet<string> = new Set(VARIANT_MODIFIERS);

/** Whether a variant can change `modifier` (style only). */
export function varies(modifier: Modifier): boolean {
  return VARIES.has(modifier.kind);
}

const IS_WEB = Platform.OS === 'web';

/** A condition as the render settles it: `false` (dropped), `null` (holds) or still live. */
export function settle(condition: Condition, disabled: boolean): Planned | false {
  switch (condition) {
    case 'web':
      return IS_WEB ? null : false;
    case 'native':
      return IS_WEB ? false : null;
    case 'ios':
    case 'android':
      return Platform.OS === condition ? null : false;
    case 'disabled':
      return disabled ? null : false;
    default:
      return condition;
  }
}

const warned = new Set<string>();

/** A modifier a variant cannot change is left out, once said in development. */
export function warnNotVaried(modifier: Modifier): void {
  if (process.env.NODE_ENV === 'production' || warned.has(modifier.kind)) return;
  warned.add(modifier.kind);
  console.warn(
    `[Bloom language] .${modifier.kind}() inside when() is left out: a variant changes style only (${VARIANT_MODIFIERS.join(', ')}).`,
  );
}

/** A value a web variant cannot draw (no generated class: an app token, a transform) is left out, once said. */
export function warnNoClass(property: string): void {
  if (process.env.NODE_ENV === 'production' || warned.has(`class:${property}`)) return;
  warned.add(`class:${property}`);
  console.warn(
    `[Bloom language] a web variant of ${property} needs a Bloom rung: an app token or an inline value has no class to vary.`,
  );
}
