import { memo, useContext, type ComponentType, type ReactNode } from 'react';

import { Node, type Child, type ComposedView } from './node';
import { EnvContext } from './env';
import { renderBody } from './render';

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
 * body re-runs only when a prop changes. The theme is not an input: colours
 * are painted by the leaves that draw them, so a theme switch re-runs no
 * body. The environment (the text traits set above the view) arrives through
 * context, which changes only where an environment modifier changes it.
 *
 * **React Compiler.** Expo runs the React Compiler in `infer` mode, which
 * finds components by JSX or hook calls; a body that returns chains has
 * neither, so naming it is not enough. The language compiler marks every
 * body passed to `view()` with `"use memo"`, which opts it in. Without the
 * language compiler, write the directive yourself.
 */
export function view<P extends object = Record<string, never>>(
  body: (props: P) => Child,
): (...props: Record<string, never> extends P ? [props?: P] : [props: P]) => ComposedView {
  // A factory of components is what `view()` is: called once per view, at
  // module scope, never inside a render.
  // biome-ignore lint/correctness/noComponentHookFactories: view() defines one component per call by design
  function ViewHost(props: P): ReactNode {
    return renderBody(body(props), useContext(EnvContext));
  }
  ViewHost.displayName = body.name || 'View';
  const component = memo(ViewHost) as unknown as ComponentType<object>;
  return (...args) => new Node('view', { component, props: args[0] ?? NO_PROPS }, NO_CHILDREN);
}
