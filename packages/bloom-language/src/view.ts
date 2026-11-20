import { memo, type ComponentType, type ReactNode } from 'react';
import { useThemePaint } from '@oxy.so/bloom/theme';

import { Node, type Child, type ComposedView } from './node';
import { renderBody } from './render';
import type { Env } from './env';

interface ViewHostProps {
  args: readonly unknown[];
  env: unknown;
}

const NO_CHILDREN: readonly Child[] = [];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

/** A props-object argument compares as React compares props: key by key, `Object.is` each. */
function sameArg(previous: unknown, next: unknown): boolean {
  if (Object.is(previous, next)) return true;
  if (!isPlainObject(previous) || !isPlainObject(next)) return false;
  const keys = Object.keys(next);
  if (Object.keys(previous).length !== keys.length) return false;
  for (const key of keys) {
    if (!(key in previous) || !Object.is(previous[key], next[key])) return false;
  }
  return true;
}

function sameArgs(previous: ViewHostProps, next: ViewHostProps): boolean {
  if (previous.env !== next.env || previous.args.length !== next.args.length) return false;
  for (let i = 0; i < next.args.length; i++) {
    if (!sameArg(previous.args[i], next.args[i])) return false;
  }
  return true;
}

/**
 * Makes a component from a body function.
 *
 * ```ts
 * const Badge = view((label: string) => Text(label).font('caption-1').foreground('muted'));
 * HStack(Badge('New'), ...)
 * ```
 *
 * Calling the result returns a node; the body runs later, when React renders
 * that node, as a React function component of its own. So hooks work in the
 * body, and the body re-runs only when an argument changes or the theme does.
 * Each argument compares with `Object.is`; a plain-object argument (a props
 * object) compares key by key, as React compares props. Name the body function (`function PostRow(…)`)
 * and the component carries that name, and the React Compiler compiles it as
 * the component it is.
 */
export function view<A extends unknown[]>(
  body: (...args: A) => Child,
): (...args: A) => ComposedView {
  // A factory of components is what `view()` is: called once per view, at
  // module scope, never inside a render.
  // biome-ignore lint/correctness/noComponentHookFactories: view() defines one component per call by design
  function ViewHost({ args, env }: ViewHostProps): ReactNode {
    const colors = useThemePaint();
    return renderBody(body(...(args as A)), colors, env as Env);
  }
  ViewHost.displayName = body.name || 'View';
  const component = memo(ViewHost, sameArgs) as unknown as ComponentType<ViewHostProps>;
  return (...args: A) => new Node('view', { component, args }, NO_CHILDREN);
}
