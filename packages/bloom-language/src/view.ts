import { memo, type ComponentType, type ReactNode } from 'react';

import { Node, type Child, type ComposedView } from './node';
import { drawRead } from './render';

const NO_CHILDREN: readonly Child[] = [];
const NO_PROPS = Object.freeze({});

/**
 * Makes a component from a body function that takes one props object, as a
 * React component does.
 *
 * ```ts
 * const Badge = view(function Badge(props: { label: string }) {
 *   return Text(props.label).font('caption-1').foreground('muted');
 * });
 * HStack(Badge({ label: 'New' }), ...)
 * ```
 *
 * Calling the result returns a node; the body runs later, when React renders
 * that node, as a React function component of its own, so hooks work in the
 * body. The component is React's `memo` of its host, compared the way React
 * compares props (key by key, `Object.is` each), so it is ONE fiber, and the
 * body re-runs only when a prop changes, or what its tree reads: the body is a
 * tree of its own, which reads the theme once for every node it paints, as a
 * JSX component that reads it does, and none when nothing in it paints from
 * the theme. The environment (the text traits set above the view, the values
 * `.environment()` and `.disabled()` set, and the `.animation()` in scope)
 * arrives through one context, read when something in the tree takes from it,
 * which changes only where an environment modifier or a scope changes it.
 *
 * A body may return a function that builds its tree instead of the tree:
 * what the language compiler lowers a returned chain to, so a press handler
 * that reads a ref, or a ref given to `.ref()`, does not cost the body its
 * React Compiler memoization (a returned function is not called during the
 * body's render, as an argument of a chain's call might be).
 *
 * **React Compiler.** Expo runs the React Compiler in `infer` mode, which
 * finds components by JSX or hook calls; a body that returns chains has
 * neither, so naming it is not enough. The language compiler marks every
 * body passed to `view()` with `"use memo"`, which opts it in. Without the
 * language compiler, write the directive yourself.
 */
export function view<P extends object = Record<string, never>>(
  body: (props: P) => Child | (() => Child),
  /**
   * Whether two props are equal for this view (`memo`'s comparator): `true`
   * skips the render. Without it, `memo` compares each prop with `Object.is`.
   */
  equal?: (previous: Readonly<P>, next: Readonly<P>) => boolean,
): (...props: Record<string, never> extends P ? [props?: P] : [props: P]) => ComposedView {
  // A factory of components is what `view()` is: called once per view, at
  // module scope, never inside a render.
  // biome-ignore lint/correctness/noComponentHookFactories: view() defines one component per call by design
  function ViewHost(props: P): ReactNode {
    const built = body(props);
    return drawRead(typeof built === 'function' ? built() : built);
  }
  ViewHost.displayName = body.name || 'View';
  const component = memo(ViewHost, equal) as unknown as ComponentType<object>;
  const read = body as (props: object) => Child | (() => Child);
  return (...args) =>
    new Node('view', { component, props: args[0] ?? NO_PROPS, body: read }, NO_CHILDREN);
}
