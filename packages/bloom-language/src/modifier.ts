import type { ViewModifiers } from './node';

/** Any view a modifier is applied to: it takes the universal modifiers. */
export type AnyView = ViewModifiers<AnyView>;

/**
 * A named recipe of modifiers (SwiftUI's `ViewModifier`), made by
 * `defineModifier` and applied with `.modifier(m, ...args)`.
 */
export class ViewModifier<A extends readonly unknown[] = []> {
  constructor(readonly apply: <V extends ViewModifiers<V>>(view: V, ...args: A) => V) {
    Object.freeze(this);
  }
}

/**
 * Collects modifiers into one named recipe, as SwiftUI's `ViewModifier` does:
 * a pure function of a view (and any arguments) that chains the language's
 * universal modifiers, so it stays inside the token system and calls no hooks.
 * Nodes are immutable data, so `.modifier(m, ...args)` is `m(view, ...args)`.
 *
 * ```ts
 * export const sectionCard = defineModifier((v) =>
 *   v.padding('md').background('card').corner('lg').cornerCurve('smooth').shadow('s'));
 * export const tag = defineModifier((v, tone: InkToken) =>
 *   v.padding('horizontal', 'xs').background(tone).corner('full'));
 * VStack(...).modifier(sectionCard)
 * Text('Beta').modifier(tag, 'primary/10')
 * ```
 */
export function defineModifier<A extends readonly unknown[] = []>(
  apply: <V extends ViewModifiers<V>>(view: V, ...args: A) => V,
): ViewModifier<A> {
  return new ViewModifier(apply);
}
