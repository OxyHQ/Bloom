/**
 * The inherited CONTROL PRESENTATION contract — the third of Bloom's visual
 * contexts, beside the theme (`theme/use-theme`) and the surface ladder
 * (`styles/surface-levels`).
 *
 * ## What it is for
 *
 * A container that owns a material has to be able to say so once, rather than
 * have every control inside it repeat the material as a prop. A page header's
 * action island owns its glass; the `ButtonGroup` inside it should not need
 * `variant="glass"` written on it, and the items inside THAT should not need it
 * either. Written as props it is three places to keep in step, and the app is
 * the one that pays when they drift.
 *
 * ## Precedence, in one rule
 *
 *     an explicit prop  >  the nearest container  >  the component's default
 *
 * {@link useInheritedControl} is that rule, and it is a function rather than a
 * convention so the three consumers cannot each interpret it slightly
 * differently. `undefined` is the only value that defers: passing
 * `material="solid"` inside a glass island paints a solid control, which is a
 * decision the caller is allowed to make.
 *
 * ## What deliberately does NOT travel through it
 *
 * Only VISUAL CONFIGURATION. A constraint — `disabled`, a modal's inertness,
 * the user's reduce-transparency preference — is not a default, and the rule
 * above is exactly wrong for one: a descendant must not be able to re-enable an
 * action its group disabled by passing a prop. Constraints keep their own
 * channels (a group's `disabled` is applied by the group when it renders its
 * items; accessibility preferences are read from the OS at the point of use).
 *
 * Nor does STATE. `checked`, `selected`, a field's value and any business datum
 * are owned by the component that holds them; a visual context that also
 * carried state would make every container a place state could leak from.
 *
 * ## Scope
 *
 * One context, two fields, both of which change rarely (a container sets them
 * once at mount). Scroll offsets, focus, form state and the overlay stack each
 * have their own context for the opposite reason — they change often, and a
 * consumer of one must not re-render for a change in another.
 */
import { createContext, useContext } from 'react';

import type { ControlSurfaceValue } from './types';

const ControlSurfaceContext = createContext<ControlSurfaceValue | null>(null);
ControlSurfaceContext.displayName = 'BloomControlSurfaceContext';

/** @internal The provider `ControlSurface` renders. */
export const ControlSurfaceProvider = ControlSurfaceContext.Provider;

/**
 * The nearest container's presentation, or `null` when there is none.
 *
 * `null` rather than a default object on purpose: a control's own default is
 * the control's to choose (`ButtonGroup` defaults to `solid`, a media overlay's
 * toolbar could default to `glass`), and a context that invented one here would
 * take that choice away by looking like an answer.
 */
export function useControlSurface(): ControlSurfaceValue | null {
  return useContext(ControlSurfaceContext);
}

/**
 * Resolve one field by the precedence rule: `explicit` → container → `fallback`.
 *
 * ```ts
 * const material = useInheritedControl('material', variant, 'solid');
 * ```
 */
export function useInheritedControl<K extends keyof ControlSurfaceValue>(
  key: K,
  explicit: ControlSurfaceValue[K] | undefined,
  fallback: ControlSurfaceValue[K],
): ControlSurfaceValue[K] {
  const inherited = useContext(ControlSurfaceContext);
  return explicit ?? inherited?.[key] ?? fallback;
}
